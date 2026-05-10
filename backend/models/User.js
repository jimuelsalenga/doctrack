const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['Requester', 'Admin'], default: 'Requester' },
    program: { type: String, default: 'N/A' },
    yearLevel: { type: String, default: 'N/A' }
});

// ✅ MUST USE 'function' keyword, NOT an arrow function () => {}
userSchema.pre('save', async function () {
    // If the password hasn't been changed, just exit the function
    if (!this.isModified('password')) return;

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        // No need to call next() here; finishing the function resolves the hook
    } catch (err) {
        // Instead of next(err), just throw the error
        throw err;
    }
});

module.exports = mongoose.model('User', userSchema);