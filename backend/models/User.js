const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['Requester', 'Admin'], default: 'Requester' },
    program: { type: String, default: 'N/A' },
    yearLevel: { type: String, default: 'N/A' }
});

module.exports = mongoose.model('User', userSchema);