const express = require('express')
const mongoose = require('mongoose')
const userModel = require('../models/userSchema')

exports.getAllUsers = async (req, res) => {
    try {
        const users = await userModel.find().select('email nickname active lastActive lastActivity friends ots _id');

        if (users.length === 0) {
            return res.status(200).json({
                msg: "No Users"
            });
        }

        res.status(200).json({
            msg: "Success",
            data: users
        });
    } catch (error) {
        res.status(500).json({
            msg: "Error retrieving users",
            error: error.message
        });
    }
};