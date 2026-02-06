const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { getMasterSchedule, getAnalytics } = require('../controllers/adminController');


// Admin Dashboard Routes

// Get master schedule with optional filters: engineerId, projectId, taskStage, status, startDate, endDate
router.get('/admin/master-schedule', protect, restrictTo('admin'), getMasterSchedule);

// Get aggregated analytics for projects and engineers
router.get('/admin/analytics', protect, restrictTo('admin'), getAnalytics);

module.exports = router;
