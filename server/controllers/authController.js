const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;

// POST /auth/register 
const register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password)
            return res.status(400).json({message: "Missing  required fields"});
        
        const existingUser = await User.findOne({ email });
        if (existingUser) 
            return res.status(400).json({message: "User already exists"})

        // Hash password if not already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
        let hashedPassword = password;
        if (!password.startsWith('$2')) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        const newUser = await User.create({ name, email, password: hashedPassword, role });
        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        next(error);
    }
};


// POST /auth/login 
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({message: "Email and password required"});
        
        const user = await User.findOne({email}).select("+password");
        
        if (!user)
            return res.status(401).json({message: "Incorrect email or password"});

        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch)
            return res.status(401).json({message: "Incorrect email or password"});

        const token = jwt.sign({id: user._id, role: user.role}, jwtSecret, {expiresIn: "7d"});
        res.status(200).json({
            message: "Success!",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        next(error);
    }
};

// PUT /auth/reset-password
const resetPassword = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({message: "Email and new password required"});

        const user = await User.findOne({email});
        if (!user)
            return res.status(404).json({message: "User not found"});

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({message: "Password reset successfully"});
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, resetPassword };