const express = require('express');
const router = express.Router();

const { verifyEmail, changePassword, login, register, resetPassword } = require('../controllers/authController');

// Login flow
router.post('/auth/verify-email', verifyEmail);        // Step 1: Validate email and check if first login
router.post('/auth/change-password', changePassword); // Step 2 (First Login): Set user's password
router.post('/auth/login', login);                     // Step 2 (Subsequent Login): Direct login

// Admin registration (creates user with admin-set password)
router.post('/auth/register', register);

// Password reset
router.put('/auth/reset-password', resetPassword);

module.exports = router;
