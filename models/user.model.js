const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Joi = require('joi');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        match: [/\S+@\S+\.\S+/, 'Invalid email address'],
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    mobileNumber: {
        type: String,
        required: true,
        unique:true,
        match: [/^\d{10}$/, 'Invalid mobile number'],
    },
    designation: {
        type: String,
        trim: true,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    name: {
        type: String,
        required: true,
        trim: true,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Pre-save hook to hash the password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }

});

UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Joi Validation Schema
const joiUserSchema = Joi.object({
    // username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    mobileNumber: Joi.string().pattern(/^\d{10}$/).required().messages({
        'string.pattern.base': 'Mobile number must be a 10-digit number',
    }),
    designation: Joi.string().min(2).max(50).required(),
    name: Joi.string().min(2).max(50).required(),
    role: Joi.string().valid('user', 'admin').default('user'),
});

UserSchema.statics.validateUser = function (userData) {
    return joiUserSchema.validate(userData, { abortEarly: false });
};

module.exports = mongoose.model('User', UserSchema);
