const express = require('express');
const router = express.Router();

const { register, login, resetPassword } = require('../controllers/authController');

// AUTH
router.post('/auth/register', register);
router.post('/auth/login', login);
router.put('/auth/reset-password', resetPassword);


module.exports = router;