const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
    createTask,
    getMyTasks,
    getMyLogs,
    getLoggedProjectsByDate,
    getTasksByProject,
    getTaskById,
    updateTask,
    deleteTask,
    getMyHoursByProject
} = require('../controllers/projectTaskController');

// Employee routes
router.post('/tasks', protect, createTask);
router.get('/tasks/my', protect, getMyTasks);
router.get('/tasks/my-logs', protect, getMyLogs);
router.get('/tasks/logged-projects', protect, getLoggedProjectsByDate);
router.get('/tasks/my-hours-by-project', protect, getMyHoursByProject);

// Admin/Manager routes
router.get('/tasks/project/:projectId', protect, restrictTo("admin"), getTasksByProject);
router.get('/tasks/:id', protect, restrictTo("admin"), getTaskById);
router.put('/tasks/:id', protect, restrictTo("admin"), updateTask);
router.delete('/tasks/:id', protect, restrictTo("admin"), deleteTask);



module.exports = router;
