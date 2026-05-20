const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['Requester', 'Admin'], default: 'Requester' },
    program: { type: String, default: 'N/A' },
    yearLevel: { type: String, default: 'N/A' }
}, { 
    timestamps: true,
    collection: 'Users' 
});

// FIXED: Removed next() — Mongoose 7+ async hooks resolve by promise, not next()
userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    // No next() needed — if this throws, Mongoose catches it automatically
});

module.exports = mongoose.model('User', userSchema);