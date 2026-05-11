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

// ✅ FIXED: This hook hashes the password automatically before saving to MongoDB
userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model('User', userSchema);