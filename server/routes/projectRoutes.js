const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { createProjectValidation, updateProjectValidation, validate } = require('../middleware/validation');
const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  updateMyProject,
  deleteProject
} = require('../controllers/projectController');


// PROJECT ROUTES 

// CREATE a project - Admin only
router.post('/projects', protect, restrictTo('admin'), createProjectValidation, validate, createProject);

// GET all projects - Admin & Employees
router.get('/projects', protect, getAllProjects);

// GET single project by ID - Admin & Employees
router.get('/projects/:id', protect, getProjectById);

// UPDATE a project - Admin only
router.put('/projects/:id', protect, restrictTo('admin'), updateProjectValidation, validate, updateProject);

// UPDATE my assigned project (stage/status only) - Admin & Assigned Employee
router.put('/projects/:id/my-project', protect, updateMyProject);

// DELETE a project - Admin only
router.delete('/projects/:id', protect, restrictTo('admin'), deleteProject);


module.exports = router;
