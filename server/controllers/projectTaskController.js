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
            status,
            description,
            manHours,
            leavesOffice,
            transportMode,
            travelHours
        } = req.body;

        // Check if employee has already logged a task for this project on this date
        const existingTask = await ProjectTask.findOne({
            projectName,
            employee: req.user.id,
            workDate: new Date(workDate)
        });

        if (existingTask) {
            return res.status(400).json({
                message: 'You have already logged a task for this project on this date. Please edit the existing entry instead.'
            });
        }

        const newTask = await ProjectTask.create({
            projectName,
            employee: req.user.id,
            workDate,
            stage,
            task,
            status,
            description,
            manHours,
            leavesOffice,
            transportMode: leavesOffice ? transportMode : undefined,
            travelHours: leavesOffice ? travelHours : 0
        });

        res.status(201).json(newTask);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                message: 'You have already logged a task for this project on this date. Please edit the existing entry instead.'
            });
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

module.exports = {
    createTask,
    getMyTasks,
    getMyLogs,
    getLoggedProjectsByDate,
    getTasksByProject,
    getTaskById,
    updateTask,
    deleteTask
};
