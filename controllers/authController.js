const mongoose = require('mongoose')
const User = require('../models/userSchema')
const jwt = require('jsonwebtoken')
const jwtSecret = process.env.JWT_SECRET
const crypto = require('crypto')
const nodemailer = require('nodemailer')
const senderMail = process.env.SENDER_MAIL
const appPass = process.env.APP_PASS

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, jwtSecret, {
        expiresIn: '1h',
    });
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: senderMail,
        pass: appPass
    }
});

// Function to send OTS via email
const sendOTS = async (email, ots) => {
    const mailOptions = {
        from: senderMail,
        to: email,
        subject: 'Just Chat Account Verification',
        // text: `Please verify your using below link http://localhost:3000/auth/account/verify?email=${email}&ots=${ots}`
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #4CAF50; text-align: center;">Welcome to Our Platform!</h2>
                
                <blockquote style="font-size: 16px; font-style: italic; text-align: center; color: #555;">
                    "ಮಾತು ಹಾಗೂ ಸಂವಾದವೇ ಮಾನವರ ಶ್ರೇಷ್ಠ ಆಸೆ. ಚರ್ಚೆಯ ಮೂಲಕ ಮನಸ್ಸುಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳುವುದು ಮತ್ತು ಸಂಬಂಧಗಳನ್ನು ಗಟ್ಟಿ ಮಾಡುವುದು ಸಾಧ್ಯ" - ಕನ್ನಡ ಸಾಹಿತ್ಯ
                </blockquote>

                <p>Dear User,</p>
                <p>ನಮ್ಮೊಂದಿಗೆ ನೋಂದಣಿ ಮಾಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಖಾತೆಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಲು, ದಯವಿಟ್ಟು ಕೆಳಗಿನ ಗುಂಡಿಯನ್ನು ಕ್ಲಿಕ್ ಮಾಡಿ ಮತ್ತು ನಿಮ್ಮ ಮಿಂಚೋಲೆ ವಿಳಾಸವನ್ನು ಪರಿಶೀಲಿಸಿ:</p>

                <div style="text-align: center; margin: 20px 0;">
                    <a href="http://localhost:3000/auth/account/verify?email=${email}&ots=${ots}" 
                       style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 16px;">
                        Verify My Account
                    </a>
                </div>
                <p>ಗುಂಡಿ ಕೆಲಸ ಮಾಡದಿದ್ದರೆ, ಈ ಲಿಂಕ್ ಅನ್ನು ನಕಲಿಸಿ ಮತ್ತು ನಿಮ್ಮ ಅಂತರ್ಜಾಲವನ್ನು ಶೋಧಿಸುವ ತಂತ್ರಾಂಶದಲ್ಲಿ ಅಂಟಿಸಿ:</p>
                <p style="word-wrap: break-word;">http://localhost:3000/auth/account/verify?email=${email}&ots=${ots}</p>
                <hr style="border: none; height: 1px; background-color: #e0e0e0;" />
                <p style="color: #888888; text-align: center; font-size: 12px;">ಈ ಮಿಂಚೋಲೆ ಅನ್ನು ನೀವು ನಿರೀಕ್ಷಿಸದಿದ್ದರೆ, ದಯವಿಟ್ಟು ಇದನ್ನು ನಿರ್ಲಕ್ಷಿಸಿ.</p>
                <p style="color: #888888; text-align: center; font-size: 12px;">&copy; 2024 CuriousCoders. All rights reserved.</p>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
};

exports.otsVerify = async (req, res) => {
    const { id } = req.params
    const { ots } = req.body

    try {
        const user = await User.findOne({ email: id })

        if (!user) {
            return res.status(404).send('User not found')
        }

        // Check if OTS matches and is still valid
        if (user.ots === ots && user.otsExpiresAt > Date.now()) {
            user.ots = 'Acc_Ver';  // Clear OTS
            // user.otsExpiresAt = undefined;  // Clear OTS expiry
            await user.save();

            res.status(200).send('Account verified successfully')
        } else {
            res.status(400).send('Invalid or expired OTS')
        }
    } catch (error) {
        res.status(500).send('Server error')
    }
}

exports.registerNewUser = async (req, res) => {
    const { nickname, email, password } = req.body

    try {
        const newUser = new User({ nickname, email, password })
        console.log(newUser)
        newUser.setOTS()
        console.log(newUser.ots)
        await newUser.save()

        await sendOTS(email, newUser.ots)
        res.status(201).json({ msg: "Verification Mail Sent Successfully" })
    }
    catch (error) {
        res.status(400).json({ msg: "Registration failed", error: error })
    }

}

exports.loginUser = async (req, res) => {
    const { nickname, password } = req.body

    try {
        const user = await User.findOne({ nickname });
        if (!user) return res.status(404).json({ msg: "User Not Found" })
        if (user && (await user.matchPassword(password))) {
            const token = generateToken(user._id);
            res.status(200).json({
                token: {
                    access: token
                }
            });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    }
    catch (error) {
        res.status(500).json({ msg: "ERROR!", error: error })
    }
}

exports.verifyUser = async (req, res) => {

    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, jwtSecret);

            // Get user from token
            const user = await User.findById(decoded.id).select('_id nickname email friends');
            if (!user) res.status(401).json({
                error: 'Not authorized, token failed'
            })
            res.status(201).json({ success: 'Verified', user: user })

        } catch (error) {
            res.status(401).json({ error: 'Not authorized, token failed' })
        }
    }

    if (!token) {
        res.status(401).json({ error: 'Not authorized, no token' })
    }
}