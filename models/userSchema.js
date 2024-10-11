const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const generateOTS = () => {
    return crypto.randomInt(100000, 999999).toString()
}

const UserSchema = new mongoose.Schema(
    {
        nickname: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        ots: { type: String },
        otsExpiresAt: { type: Date },
        friends: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
            requestSender: { type: Boolean, default: false }
        }],
        active: { type: Boolean, default: false },
        lastActive: { type: Date, default: Date.now },
        lastActivity: { chat: { type: String, default: '' }, name: { type: String, default: '' } }
    },
    {
        timestamps: { type: Date, default: Date.now() }
    }
)

// Hash the password before saving the user model
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
})

// Compare entered password with the hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

// Store OTS and expiry
UserSchema.methods.setOTS = async function () {
    this.ots = generateOTS();
    this.otsExpiresAt = Date.now() + 2 * 60 * 1000; // OTS valid for 2 minutes
}

module.exports = mongoose.model('User', UserSchema)