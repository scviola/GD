const mongoose = require('mongoose');
const ProjectTask = require('../models/ProjectTask');

/**
 * @desc    Create a new project task (employee daily log)
 * @route   POST /api/tasks
 * @access  Private (Employee)
 */
const createTask = async (req, res) => {
    try {
        const {
            projectName,
            workDate,
            stage,
            task,
            projectHours,
            leavesOffice,
            travelHours
        } = req.body;

        // Check if employee has already logged a task for this project on this date
        const existingTask = await ProjectTask.findOne({
            projectName,
            employee: req.user.id,
            workDate: new Date(workDate)
        });

        // Calculate total man hours
        const travel = leavesOffice ? Number(travelHours) || 0 : 0;
        const totalManHours = Number(projectHours) + travel;

        if (existingTask) {
            // Update existing task instead of creating new one
            existingTask.stage = stage;
            existingTask.task = task;
            existingTask.projectHours = projectHours;
            existingTask.leavesOffice = leavesOffice;
            existingTask.travelHours = leavesOffice ? travelHours : 0;
            existingTask.totalManHours = totalManHours;
            
            const updatedTask = await existingTask.save();
            return res.status(200).json(updatedTask);
        }

        // Create new task
        const newTask = await ProjectTask.create({
            projectName,
            employee: req.user.id,
            workDate,
            stage,
            task,
            projectHours,
            leavesOffice,
            travelHours: leavesOffice ? travelHours : 0,
            totalManHours
        });

        res.status(201).json(newTask);
    } catch (error) {
        if (error.code === 11000) {
            // Handle duplicate key error by finding and updating
            try {
                const {
                    projectName,
                    workDate,
                    stage,
                    task,
                    projectHours,
                    leavesOffice,
                    travelHours
                } = req.body;
                
                const travel = leavesOffice ? Number(travelHours) || 0 : 0;
                const totalManHours = Number(projectHours) + travel;
                
                const existingTask = await ProjectTask.findOne({
                    projectName,
                    employee: req.user.id,
                    workDate: new Date(workDate)
                });
                
                if (existingTask) {
                    existingTask.stage = stage;
                    existingTask.task = task;
                    existingTask.projectHours = projectHours;
                    existingTask.leavesOffice = leavesOffice;
                    existingTask.travelHours = leavesOffice ? travelHours : 0;
                    existingTask.totalManHours = totalManHours;
                    
                    const updatedTask = await existingTask.save();
                    return res.status(200).json(updatedTask);
                }
            } catch (updateError) {
                return res.status(400).json({
                    message: 'Failed to update existing task',
                    error: updateError.message
                });
            }
        }
        res.status(400).json({
            message: 'Failed to create task',
            error: error.message
        });
    }
};

/**
 * @desc    Get logged-in employee tasks
 * @route   GET /api/tasks/my
 * @access  Private (Employee)
 */
const getMyTasks = async (req, res) => {
    try {
        const tasks = await ProjectTask.find({ employee: req.user.id })
            .populate('projectName', 'projectNumber projectName')
            .sort({ workDate: -1 });

        res.json(tasks);
    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch tasks',
            error: error.message
        });
    }
};

/**
 * @desc    Get logged-in employee tasks since a start date
 * @route   GET /api/tasks/my-logs
 * @access  Private (Employee)
 */
const getMyLogs = async (req, res) => {
    try {
        const startDate = req.query.start ? new Date(req.query.start) : new Date(0);

        const tasks = await ProjectTask.find({
            employee: req.user.id,
            workDate: { $gte: startDate }
        })
        .populate('projectName', 'projectNumber projectName')
        .sort({ workDate: -1 });

        res.json(tasks);
    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch logs',
            error: error.message
        });
    }
};

/**
 * @desc    Get logged-in employee logged project IDs for a specific date
 * @route   GET /api/tasks/logged-projects
 * @access  Private (Employee)
 */
const getLoggedProjectsByDate = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ message: 'Date is required' });
        }

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const tasks = await ProjectTask.find({
            employee: req.user.id,
            workDate: { $gte: startOfDay, $lte: endOfDay }
        }).select('projectName');

        const loggedProjectIds = tasks.map(task => task.projectName.toString());
        res.json(loggedProjectIds);
    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch logged projects',
            error: error.message
        });
    }
};

/**
 * @desc    Get tasks for a specific project
 * @route   GET /api/tasks/project/:projectId
 * @access  Private (Admin/Manager)
 */
const getTasksByProject = async (req, res) => {
    try {
        const tasks = await ProjectTask.find({ projectName: req.params.projectId })
            .populate('employee', 'name email')
            .populate('projectName', 'projectNumber projectName')
            .sort({ workDate: -1 });

        res.json(tasks);
    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch project tasks',
            error: error.message
        });
    }
};

/**
 * @desc    Get single task
 * @route   GET /api/tasks/:id
 * @access  Private
 */
const getTaskById = async (req, res) => {
    try {
        const task = await ProjectTask.findById(req.params.id)
            .populate('employee', 'name email')
            .populate('projectName', 'projectNumber projectName');

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json(task);
    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch task',
            error: error.message
        });
    }
};

/**
 * @desc    Update a task
 * @route   PUT /api/tasks/:id
 * @access  Private (Owner or Admin)
 */
const updateTask = async (req, res) => {
    try {
        const task = await ProjectTask.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (task.employee.toString() !== req.user.id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        Object.assign(task, req.body);
        const updatedTask = await task.save();

        res.json(updatedTask);
    } catch (error) {
        res.status(400).json({
            message: 'Failed to update task',
            error: error.message
        });
    }
};

/**
 * @desc    Delete task
 * @route   DELETE /api/tasks/:id
 * @access  Private (Admin)
 */
const deleteTask = async (req, res) => {
    try {
        const task = await ProjectTask.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        await task.deleteOne();
        res.json({ message: 'Task removed' });
    } catch (error) {
        res.status(500).json({
            message: 'Failed to delete task',
            error: error.message
        });
    }
};

/**
 * @desc    Get logged-in employee hours by project
 * @route   GET /api/tasks/my-hours-by-project
 * @access  Private (Employee)
 */
const getMyHoursByProject = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Build filters - use logged-in employee from auth middleware
        const userId = req.user.id;
        const filters = { employee: userId };
        
        // Handle date filtering
        if (startDate || endDate) {
            filters.workDate = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                filters.workDate.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filters.workDate.$lte = end;
            }
        }
        
        // Use simple find and group in JavaScript
        const tasks = await ProjectTask.find(filters).populate('projectName', 'projectNumber projectName');
        
        // Group by project
        const hoursByProjectMap = {};
        
        tasks.forEach(task => {
            const projectId = task.projectName?._id?.toString() || task.projectName?.toString();
            
            if (!hoursByProjectMap[projectId]) {
                hoursByProjectMap[projectId] = {
                    projectId: projectId,
                    projectNumber: task.projectName?.projectNumber || 'Unknown',
                    projectName: task.projectName?.projectName || 'Unknown',
                    totalProjectHours: 0,
                    totalTravelHours: 0,
                    totalManHours: 0,
                    stages: new Set()
                };
            }
            
            hoursByProjectMap[projectId].totalProjectHours += Number(task.projectHours) || 0;
            hoursByProjectMap[projectId].totalTravelHours += Number(task.travelHours) || 0;
            hoursByProjectMap[projectId].totalManHours += Number(task.totalManHours) || 0;
            hoursByProjectMap[projectId].stages.add(task.stage);
        });
        
        // Convert to array and sort
        const hoursByProject = Object.values(hoursByProjectMap)
            .map(item => ({
                ...item,
                stages: Array.from(item.stages)
            }))
            .sort((a, b) => b.totalManHours - a.totalManHours);
        
        res.json(hoursByProject);
    } catch (error) {
        console.error('getMyHoursByProject error:', error);
        res.status(500).json({
            message: 'Failed to fetch hours by project',
            error: error.message
        });
    }
};

module.exports = {
    createTask,
    getMyTasks,
    getMyLogs,
    getLoggedProjectsByDate,
    getTasksByProject,
    getTaskById,
    updateTask,
    deleteTask,
    getMyHoursByProject
};
