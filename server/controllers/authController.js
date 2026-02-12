const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;

// POST /auth/verify-email - Step 1: Verify email exists in DB and check if first login
const verifyEmail = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        // 1. Domain validation - Only allow @gdea.com
        const emailLower = email.toLowerCase().trim();
        if (!emailLower.endsWith('@gammadelta.co.ke')) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // 2. Check if user exists in DB (pre-registered by admin)
        // Need to select userPassword explicitly since it has select: false
        const user = await User.findOne({ email: emailLower }).select("+userPassword");
        if (!user) {
            return res.status(404).json({ message: "You are not authorized. Please contact admin." });
        }

        // 3. Check if user has set their password (first login vs subsequent)
        const isFirstLogin = !user.userPassword;

        res.status(200).json({ 
            message: "Email verified successfully",
            email: emailLower,
            isFirstLogin
        });

    } catch (error) {
        next(error);
    }
};

// POST /auth/change-password - First time login: validate given password, set user's password
const changePassword = async (req, res, next) => {
    try {
        const { email, givenPassword, newPassword } = req.body;

        if (!email || !givenPassword || !newPassword) {
            return res.status(400).json({ message: "Email, given password, and new password are required" });
        }

        const emailLower = email.toLowerCase().trim();

        // 1. Find user
        const user = await User.findOne({ email: emailLower }).select("+password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // 2. Verify given password matches admin-set password
        const isGivenPasswordValid = await bcrypt.compare(givenPassword, user.password);
        if (!isGivenPasswordValid) {
            return res.status(401).json({ message: "Given password is incorrect" });
        }

        // 3. Hash and set user's chosen password in userPassword field
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.userPassword = hashedNewPassword;
        user.isRegistered = true; // Mark as registered after first login
        await user.save();
        
        // 4. Generate JWT token
        const token = jwt.sign({id: user._id, role: user.role}, jwtSecret, {expiresIn: "7d"});

        res.status(200).json({ 
            message: "Password set successfully!",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                engineerType: user.engineerType
            }
        });

    } catch (error) {
        next(error);
    }
};

// POST /auth/login - Direct login for users who already have their password set
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({message: "Email and password required"});
        
        const user = await User.findOne({email: email.toLowerCase()}).select("+password +userPassword");
        
        if (!user)
            return res.status(401).json({message: "Incorrect email or password"});

        // Check user's chosen password first, then fall back to admin-set password
        let isMatch = false;
        if (user.userPassword) {
            isMatch = await bcrypt.compare(password, user.userPassword);
        } else {
            isMatch = await bcrypt.compare(password, user.password);
        }
        
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
                role: user.role,
                engineerType: user.engineerType
            }
        });

    } catch (error) {
        next(error);
    }
};

// POST /auth/register - Admin use only (creates user with admin-set password)
const register = async (req, res, next) => {
    try {
        const { name, email, password, role, engineerType } = req.body;
        if (!name || !email || !password || !engineerType)
            return res.status(400).json({message: "Missing required fields"});
        
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) 
            return res.status(400).json({message: "User already exists"})

        // Hash password (this is the admin-set password)
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({ 
            name: name, 
            email: email.toLowerCase(), 
            password: hashedPassword, 
            role,
            engineerType,
            isRegistered: false 
        });
        
        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                engineerType: newUser.engineerType
            }
        });

    } catch (error) {
        next(error);
    }
};

// PUT /auth/reset-password - Reset user's chosen password
const resetPassword = async (req, res, next) => {
    try {
        const { email, currentPassword, newPassword } = req.body;
        if (!email || !currentPassword || !newPassword)
            return res.status(400).json({message: "Email, current password, and new password required"});

        const user = await User.findOne({email: email.toLowerCase()}).select("+password +userPassword");
        if (!user)
            return res.status(404).json({message: "User not found"});

        // Verify current password
        let isCurrentValid = false;
        if (user.userPassword) {
            isCurrentValid = await bcrypt.compare(currentPassword, user.userPassword);
        } else {
            isCurrentValid = await bcrypt.compare(currentPassword, user.password);
        }

        if (!isCurrentValid)
            return res.status(401).json({message: "Current password is incorrect"});

        // Hash and set new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.userPassword = hashedNewPassword;
        await user.save();

        res.json({message: "Password reset successfully"});
    } catch (error) {
        next(error);
    }
};

module.exports = { verifyEmail, changePassword, login, register, resetPassword };
