//user management after authentication
const User = require('../models/User');
const mongoose = require('mongoose');

// GET /users - get all users - admin only
const getUsers = async (req, res) => {
    try {
        if (req.user.role !== "admin")
            return res.status(403).json({message: "Access denied"});

        const users = await User.find().select("-password"); //dont include users' passwords
        
        res.status(200).json(users || []);
        
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

// GET /users/:id- get user profile - admin
const getUser = async (req, res) => {
    try {
        if (req.user.role !== "admin")
            return res.status(403).json({message: "Access denied"});

        //avoid server error if user ID is wrong
        if (!mongoose.Types.ObjectId.isValid(req.params.id))
            return res.status(400).json({message: "Invalid user ID"});

        const user = await User.findById(req.params.id).select("-password");

        if (!user)
            return res.status(404).json({message: "User not found"});

        res.status(200).json(user);

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

// PUT /users/:id - update user profile - admin only
const updateUser = async (req, res) => {
    try {
        if (req.user.role !== "admin")
            return res.status(403).json({message: "Access denied"});

        //avoid server error if user ID is wrong
        if (!mongoose.Types.ObjectId.isValid(req.params.id))
            return res.status(400).json({message: "Invalid user ID"});

        const allowedFields = ["name", "email", "role"];
        const updates = {};

        allowedFields.forEach(field => {
            if (req.body[field])
                updates[field] = req.body[field];
        });

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updates,
            {new: true, runValidators: true}
        ).select("-password");

        if (!updatedUser)
            return res.status(404).json({message: "User not found"});

        res.status(200).json({message: "User updated successfully", user: updatedUser});

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

// DELETE /users/:id - delete a user - admin only
const deleteUser = async (req, res) => {
    try {
        if (req.user.role !== "admin")
            return res.status(403).json({message: "Permission denied"});

        //avoid server error if user ID is wrong
        if (!mongoose.Types.ObjectId.isValid(req.params.id))
            return res.status(400).json({message: "Invalid user ID"});

        //prevent admin from deleting themselves
        if (req.user.id === req.params.id)
            return res.status(400).json({message: "Admins cannot be deleted"});

        const deletedUser = await User.findByIdAndDelete(req.params.id);

        if (!deletedUser)
            return res.status(404).json({message: "User not found"});

        res.status(200).json({message: "User deleted successfully", deletedUser});

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};



// GET /users/me - logged-in user view own profile
const getMe = async (req, res) => {
    try {
        const me = await User.findById(req.user.id).select("-password");

        if (!me)
            return res.status(404).json({message: "User not found"});
        
        res.status(200).json({me});

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

// PUT /users/me - logged-in user update own profile
const updateMe = async (req, res) => {
    try {
        const allowedFields = ["name", "email"];
        const updates = {};

        allowedFields.forEach(field => {
            if (req.body[field])
                updates[field] = req.body[field];
        });

        // Block sensitive fields
        if (req.body.role || req.body.password)
            return res.status(400).json({message: "Invalid request"});

        const updatedProfile = await User.findByIdAndUpdate(
            req.user.id,
            updates,
            {new: true, runValidators: true}
        ).select("-password");

        res.status(200).json({message: "Profile updated successfully", updatedProfile});

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};


module.exports = { getUsers, getUser, updateUser, deleteUser, getMe, updateMe };