const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { getTaskOptions } = require('../controllers/metaController');

// Endpoint to fetch all task-related enums
router.get('/meta/task-options', protect, getTaskOptions);

module.exports = router;
