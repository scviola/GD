const mongoose = require('mongoose');

const userSchema = new mongoose.Schema (
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
            select: false
        },
        userPassword: {
            type: String,
            minlength: 6,
            select: false,
            default: undefined
        },
        role: {
            type: String,
            enum: ["admin", "staff"],
            default: "staff"
        },
        engineerType: {
            type: String,
            enum: ["Electrical", "Mechanical"],
            required: true
        },
        isRegistered: {
            type: Boolean,
            default: false
        },
        otp: {
            type: String,
            default: undefined
        },
        otpExpires: {
            type: Date,
            default: undefined
        },
        otpAttempts: {
            type: Number,
            default: 0
        }
    }, {timestamps: true}
);


module.exports = mongoose.model("User", userSchema);