const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { getMasterSchedule, getAnalytics, getProjectStageDist, getProjectStats, getWeeklySubmissionReport, getAvailableWeeks } = require('../controllers/adminController');


// Admin Dashboard Routes

// Get master schedule with optional filters: engineerId, projectId, taskStage, status, startDate, endDate
router.get('/admin/master-schedule', protect, restrictTo('admin'), getMasterSchedule);

// Get aggregated analytics for projects and engineers
router.get('/admin/analytics', protect, restrictTo('admin'), getAnalytics);

// Get project stage distribution (for pie chart)
router.get('/admin/project-stage-dist', protect, restrictTo('admin'), getProjectStageDist);

// Get project statistics for KPI cards
router.get('/admin/project-stats', protect, restrictTo('admin'), getProjectStats);

// Get weekly submission report (Monday to Sunday of specified week)
router.get('/admin/weekly-submission-report', protect, restrictTo('admin'), getWeeklySubmissionReport);

// Get available weeks with task data
router.get('/admin/weekly-submission-report/weeks', protect, restrictTo('admin'), getAvailableWeeks);

module.exports = router;
