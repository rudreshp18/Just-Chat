const mongoose = require('mongoose')

const groupSchema = new mongoose.Schema({
    zoneName: { type: String, required: true, unique: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
})

module.exports = mongoose.model('Group', groupSchema)