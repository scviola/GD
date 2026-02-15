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
    body('region')
        .optional()
        .isIn(['Coast', 'Western', 'Eastern', 'North Eastern', 'Rift Valley', 'Central', 'Nyanza', 'Nairobi'])
        .withMessage('Invalid region'),
    body('county')
        .trim()
        .optional()
        .isLength({ max: 100 }).withMessage('County must be less than 100 characters'),
    body('architect')
        .trim()
        .optional()
        .isLength({ max: 200 }).withMessage('Architect name must be less than 200 characters'),
    body('allocatedTime')
        .optional({ nullable: true, checkFalsy: true })
        .custom((value) => {
            if (value === '' || value === null || value === undefined) return true;
            return !isNaN(value) && !isNaN(parseFloat(value));
        }).withMessage('Allocated time must be a number'),
    body('electrical')
        .optional({ nullable: true, checkFalsy: true })
        .custom((value) => {
            if (value === '' || value === null || value === undefined) return true;
            const mongoose = require('mongoose');
            return mongoose.Types.ObjectId.isValid(value);
        }).withMessage('Invalid electrical engineer ID'),
    body('mechanical')
        .optional({ nullable: true, checkFalsy: true })
        .custom((value) => {
            if (value === '' || value === null || value === undefined) return true;
            const mongoose = require('mongoose');
            return mongoose.Types.ObjectId.isValid(value);
        }).withMessage('Invalid mechanical engineer ID'),
    body('projectLead')
        .optional({ nullable: true, checkFalsy: true })
        .custom((value) => {
            if (value === '' || value === null || value === undefined) return true;
            const mongoose = require('mongoose');
            return mongoose.Types.ObjectId.isValid(value);
        }).withMessage('Invalid project lead ID'),
    body('stage')
        .optional()
        .isIn([
            'Pre-design',
            'Design',
            'Tendering',
            'Construction & Supervision',
            'Snagging, Testing & Commissioning',
            'Handover',
            'Other(specify)'
        ]).withMessage('Invalid stage'),
    body('status')
        .optional()
        .isIn(['Active', 'Completed', 'Stalled']).withMessage('Invalid status'),
];

// Validation rules for project update
const updateProjectValidation = [
    param('id')
        .notEmpty().withMessage('Project ID is required')
        .custom((value) => {
            const mongoose = require('mongoose');
            return mongoose.Types.ObjectId.isValid(value);
        }).withMessage('Invalid project ID'),
    body('projectNumber')
        .trim()
        .optional()
        .notEmpty().withMessage('Project number cannot be empty')
        .isLength({ min: 2, max: 50 }).withMessage('Project number must be 2-50 characters'),
    body('projectName')
        .trim()
        .optional()
        .notEmpty().withMessage('Project name cannot be empty')
        .isLength({ max: 200 }).withMessage('Project name must be less than 200 characters'),
    body('projectType')
        .optional()
        .isIn([
            'Personal Hse', 'Hostel', 'Hotel', 'Office Block', 'Residential Apartment',
            'Industrial', 'FitOut', 'Renovation', 'School', 'Research'
        ]).withMessage('Invalid project type'),
    body('region')
        .optional()
        .isIn(['Coast', 'Western', 'Eastern', 'North Eastern', 'Rift Valley', 'Central', 'Nyanza', 'Nairobi'])
        .withMessage('Invalid region'),
    body('county')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('County must be less than 100 characters'),
    body('architect')
        .optional()
        .trim()
        .isLength({ max: 200 }).withMessage('Architect name must be less than 200 characters'),
    body('allocatedTime')
        .optional({ nullable: true, checkFalsy: true })
        .custom((value) => {
            if (value === '' || value === null || value === undefined) return true;
            return !isNaN(value) && !isNaN(parseFloat(value));
        }).withMessage('Allocated time must be a number'),
    body('electrical')
        .optional({ nullable: true, checkFalsy: true })
        .custom((value) => {
            if (value === '' || value === null || value === undefined) return true;
            const mongoose = require('mongoose');
            return mongoose.Types.ObjectId.isValid(value);
        }).withMessage('Invalid electrical engineer ID'),
    body('mechanical')
        .optional({ nullable: true, checkFalsy: true })
        .custom((value) => {
            if (value === '' || value === null || value === undefined) return true;
            const mongoose = require('mongoose');
            return mongoose.Types.ObjectId.isValid(value);
        }).withMessage('Invalid mechanical engineer ID'),
    body('projectLead')
        .optional({ nullable: true, checkFalsy: true })
        .custom((value) => {
            if (value === '' || value === null || value === undefined) return true;
            const mongoose = require('mongoose');
            return mongoose.Types.ObjectId.isValid(value);
        }).withMessage('Invalid project lead ID'),
    body('stage')
        .optional()
        .isIn([
            'Pre-design',
            'Design',
            'Tendering',
            'Construction & Supervision',
            'Snagging, Testing & Commissioning',
            'Handover',
            'Other(specify)'
        ]).withMessage('Invalid stage'),
    body('status')
        .optional()
        .isIn(['Active', 'Completed', 'Stalled']).withMessage('Invalid status'),
];

// Middleware to handle validation errors
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            message: 'Validation failed',
            errors: errors.array() 
        });
    }
    next();
};

module.exports = {
    createProjectValidation,
    updateProjectValidation,
    validate
};
