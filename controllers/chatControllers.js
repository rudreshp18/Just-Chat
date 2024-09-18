const express = require('express')
const jwt = require('jsonwebtoken');
const User = require('../models/userSchema')
const Message = require('../models/messageSchema')
const Group = require('../models/groupSchema')
const jwtSecret = process.env.JWT_SECRET

exports.addFriend = async function (req, res) {
    const { nickname } = req.body

    try {
        const user = await User.findOne({ nickname })
        // console.log(user)
        if (!user) res.status(404).json({
            msg: "User Not Found"
        })

        let token = req.headers.authorization.split(' ')[1];

        const decoded = jwt.verify(token, jwtSecret);
        // console.log(sUser)
        const sUser = await User.findById(decoded.id);
        // console.log(sUser)
        const alreadyFriends = sUser.friends.some(friend => friend.user.toString() === user._id.toString());
        if (alreadyFriends) {
            return res.status(400).json({ msg: "Friend request already sent or already friends" });
        }

        sUser.friends.push({
            user: user._id,
            status: 'pending',
            requestSender: true
        })

        user.friends.push({
            user: sUser._id,
            status: 'pending',
            requestSender: false
        })

        await sUser.save();
        await user.save();

        res.status(201).json({ msg: "Sent Friend Request" });

    } catch (error) {
        res.status(401).json({ msg: "Adding Failed", error: error });
    }
}

exports.acceptFriend = async function (req, res) {
    const { nickname } = req.body

    try {
        const user = await User.findOne({ nickname })

        if (!user) res.status(404).json({
            msg: "User Not Found"
        })

        let token = req.headers.authorization.split(' ')[1];

        const decoded = jwt.verify(token, jwtSecret);

        const aUser = await User.findById(decoded.id);

        aUser.friends.forEach(friend => {
            if (friend.user.toString() === user._id.toString()) {
                friend.status = 'accepted'
            }
        })

        // Loop improvisation

        // const friendToUpdate = aUser.friends.find(friend => friend.user.toString() === user._id.toString());
        // if (friendToUpdate) {
        //     friendToUpdate.status = 'accepted'
        // }

        user.friends.forEach(friend => {
            if (friend.user.toString() === aUser._id.toString()) {
                friend.status = 'accepted'
            }
        })

        await aUser.save()
        await user.save()

        res.status(200).json({ msg: "Zoned in" });

    } catch (error) {
        res.status(500).json({ msg: "Failed to Zone", error: error });
    }
}

exports.retrieveConvo = async function (req, res) {
    const { nickname } = req.body

    try {
        const otherUser = await User.findOne({ nickname })

        if (!otherUser) {
            return res.status(404).json({
                msg: "Other user not found"
            })
        }

        let token = req.headers.authorization.split(' ')[1];

        const decoded = jwt.verify(token, jwtSecret);

        const currentUser = await User.findById(decoded.id);

        if (!currentUser) {
            return res.status(404).json({
                msg: "Current user not found"
            });
        }

        const conversations = await Message.find({
            $or: [
                { sender: currentUser._id, receiver: otherUser._id },
                { sender: otherUser._id, receiver: currentUser._id }
            ]
        }).sort({ timestamp: 1 }); // Ascending order sort

        res.status(200).json({
            msg: "Conversations retrieved successfully",
            conversations: conversations
        });
    }
    catch (error) {
        res.status(500).json({ msg: "Failed to retrieve conversations", error: error });
    }
}

exports.createZone = async function (req, res) {
    const { zoneName, members } = req.body

    try {

        let token = req.headers.authorization.split(' ')[1];

        const decoded = jwt.verify(token, jwtSecret);

        const user = await User.findById(decoded.id);
        const allUsers = await User.find();
        if (!user) {
            return res.status(404).json({
                msg: "User not found"
            });
        }

        const getMemberIds = () => {
            let arr = []
            members.forEach(eac => {
                const found = allUsers.find(ea => ea.nickname === eac)
                if (found) arr.push(found._id)
            })
            return arr
        }
        
        const newZone = new Group({
            zoneName,
            members: [...getMemberIds(), user._id],
            admin: user._id,
        })

        await newZone.save()

        res.status(201).json({
            msg: "Zone Created successfully"
        });
    }
    catch (error) {
        res.status(500).json({ msg: "Failed to create zone", error: error });
    }
}

exports.retrieveZoneConvo = async function (req, res) {
    const { id } = req.params

    try {
        const zone = await Group.findOne({ zoneName: id })

        if (!zone) {
            return res.status(404).json({
                msg: "Zone not found"
            })
        }

        const conversations = await Message.find({
            zone: zone._id
        }).sort({ timestamp: 1 }); // Ascending order sort

        res.status(200).json({
            msg: "Zone Conversations retrieved successfully",
            conversations: conversations
        });
    }
    catch (error) {
        res.status(500).json({ msg: "Failed to retrieve zone conversations", error: error });
    }
}