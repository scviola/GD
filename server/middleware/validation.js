const { body, param, validationResult } = require('express-validator');

// Validation rules for project creation
const createProjectValidation = [
    body('projectNumber')
        .trim()
        .notEmpty().withMessage('Project number is required')
        .isLength({ min: 2, max: 50 }).withMessage('Project number must be 2-50 characters'),
    body('projectName')
        .trim()
        .notEmpty().withMessage('Project name is required')
        .isLength({ max: 200 }).withMessage('Project name must be less than 200 characters'),
    body('projectType')
        .optional()
        .isIn([
            'Personal Hse', 'Hostel', 'Hotel', 'Office Block', 'Residential Apartment',
            'Industrial', 'FitOut', 'Renovation', 'School', 'Research'
        ]).withMessage('Invalid project type'),
    body('location')
        .trim()
        .optional()
        .isLength({ max: 300 }).withMessage('Location must be less than 300 characters'),
    body('architect')
        .trim()
        .optional()
        .isLength({ max: 200 }).withMessage('Architect name must be less than 200 characters'),
    body('mainContractor')
        .trim()
        .optional()
        .isLength({ max: 200 }).withMessage('Main contractor must be less than 200 characters'),
    body('engEstimate')
        .optional({ nullable: true, checkFalsy: true })
        .custom((value) => {
            if (value === '' || value === null || value === undefined) return true;
            return !isNaN(value) && !isNaN(parseFloat(value));
        }).withMessage('Engineering estimate must be a number'),
    body('finalAccount')
        .optional({ nullable: true, checkFalsy: true })
        .custom((value) => {
            if (value === '' || value === null || value === undefined) return true;
            return !isNaN(value) && !isNaN(parseFloat(value));
        }).withMessage('Final account must be a number'),
    body('employeeAssigned')
        .optional({ nullable: true, checkFalsy: true })
        .custom((value) => {
            if (value === '' || value === null || value === undefined) return true;
            const mongoose = require('mongoose');
            // Handle both single ID and array of IDs
            if (Array.isArray(value)) {
                return value.every(id => mongoose.Types.ObjectId.isValid(id));
            }
            return mongoose.Types.ObjectId.isValid(value);
        }).withMessage('Invalid employee ID'),
    body('stage')
        .optional()
        .isIn([
            'Tendering', 'Procurement', 'Pre-Design', 'Design',
            'Construction & Monitoring', 'Commissioning', 'Handover'
        ]).withMessage('Invalid stage'),
    body('status')
        .optional()
        .isIn(['Active', 'Pending', 'In Progress', 'Completed', 'On Hold'])
        .withMessage('Invalid status')
];

// Validation rules for project update
const updateProjectValidation = [
    param('id')
        .isMongoId().withMessage('Invalid project ID'),
    body('projectNumber')
        .optional()
        .trim()
        .notEmpty().withMessage('Project number cannot be empty')
        .isLength({ min: 2, max: 50 }).withMessage('Project number must be 2-50 characters'),
    body('projectName')
        .optional()
        .trim()
        .notEmpty().withMessage('Project name cannot be empty')
        .isLength({ max: 200 }).withMessage('Project name must be less than 200 characters'),
    body('projectType')
        .optional()
        .isIn([
            'Personal Hse', 'Hostel', 'Hotel', 'Office Block', 'Residential Apartment',
            'Industrial', 'FitOut', 'Renovation', 'School', 'Research'
        ]).withMessage('Invalid project type'),
    body('location')
        .optional()
        .trim()
        .isLength({ max: 300 }).withMessage('Location must be less than 300 characters'),
    body('architect')
        .optional()
        .trim()
        .isLength({ max: 200 }).withMessage('Architect name must be less than 200 characters'),
    body('mainContractor')
        .optional()
        .trim()
        .isLength({ max: 200 }).withMessage('Main contractor must be less than 200 characters'),
    body('engEstimate')
        .optional({ nullable: true, checkFalsy: true })
        .custom((value) => {
            if (value === '' || value === null || value === undefined) return true;
            return !isNaN(value) && !isNaN(parseFloat(value));
        }).withMessage('Engineering estimate must be a number'),
    body('finalAccount')
        .optional({ nullable: true, checkFalsy: true })
        .custom((value) => {
            if (value === '' || value === null || value === undefined) return true;
            return !isNaN(value) && !isNaN(parseFloat(value));
        }).withMessage('Final account must be a number'),
    body('employeeAssigned')
        .optional({ nullable: true, checkFalsy: true })
        .custom((value) => {
            if (value === '' || value === null || value === undefined) return true;
            const mongoose = require('mongoose');
            // Handle both single ID and array of IDs
            if (Array.isArray(value)) {
                return value.every(id => mongoose.Types.ObjectId.isValid(id));
            }
            return mongoose.Types.ObjectId.isValid(value);
        }).withMessage('Invalid employee ID'),
    body('stage')
        .optional()
        .isIn([
            'Tendering', 'Procurement', 'Pre-Design', 'Design',
            'Construction & Monitoring', 'Commissioning', 'Handover'
        ]).withMessage('Invalid stage'),
    body('status')
        .optional()
        .isIn(['Active', 'Pending', 'In Progress', 'Completed', 'On Hold'])
        .withMessage('Invalid status')
];

// Middleware to check validation results
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

module.exports = {
    createProjectValidation,
    updateProjectValidation,
    validate
};
