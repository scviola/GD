const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
    getAllProjectDetails,
    getProjectDetailsByProjectId,
    upsertProjectDetails,
    updateTrade,
    deleteProjectDetails
} = require('../controllers/projectDetailController');


// Get all project details
router.get('/', protect, getAllProjectDetails);

// Get project details by project ID
router.get('/project/:projectId', protect, getProjectDetailsByProjectId);

// Create or update project details
router.post('/project/:projectId', protect, restrictTo("admin"), upsertProjectDetails);

// Update specific trade
router.patch('/project/:projectId/trade/:tradeName', protect, restrictTo("admin"), updateTrade);

// Delete project details
router.delete('/project/:projectId', protect, restrictTo("admin"), deleteProjectDetails);


module.exports = router;
