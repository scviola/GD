const mongoose = require('mongoose');
const Task = require('../models/ProjectTask');
const User = require('../models/User');

/**
 * @desc    Get master schedule for admin dashboard
 * @route   GET /api/admin/master-schedule
 * @access  Private/Admin
 */
const getMasterSchedule = async (req, res) => {
    try {
        const { engineerId, projectId, stage, task, status, startDate, endDate } = req.query;

        // Build dynamic filters
        const filters = {};
        if (engineerId) filters.employee = new mongoose.Types.ObjectId(engineerId);
        if (projectId) filters.projectName = new mongoose.Types.ObjectId(projectId);
        if (stage) filters.stage = stage;
        if (status) filters.status = status;
        if (task) filters.task = task;
        if (startDate || endDate) {
            filters.workDate = {};
            if (startDate) filters.workDate.$gte = new Date(startDate);
            if (endDate) filters.workDate.$lte = new Date(endDate);
        }

        const logs = await Task.aggregate([
            { $match: filters },
            {
                $lookup: {
                    from: 'users',
                    localField: 'employee',
                    foreignField: '_id',
                    as: 'engineer'
                }
            },
            {
                $lookup: {
                    from: 'projects',
                    localField: 'projectName',
                    foreignField: '_id',
                    as: 'project'
                }
            },
            { $unwind: { path: '$engineer', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$project', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    engineerName: '$engineer.name',
                    workDate: 1,
                    day: { $dayOfWeek: '$workDate' },
                    projectNumber: '$project.projectNumber',
                    projectName: '$project.projectName',
                    architect: '$project.architect',
                    stage: 1,
                    task: 1,
                    description: 1,
                    manHours: 1,
                    travelHours: 1,
                    totalManHours: { $add: ['$manHours', '$travelHours'] },
                    status: 1,
                    leavesOffice: 1,
                    transportMode: 1,
                    mileage: 1,
                    destination: 1
                }
            },
            { $sort: { workDate: -1 } }
        ]);

        res.status(200).json(logs);

    } catch (err) {
        console.error('Master schedule error:', err);
        res.status(500).json({ message: err.message });
    }
};

/**
 * @desc    Get admin analytics
 * @route   GET /api/admin/analytics
 * @access  Private/Admin
 */
const getAnalytics = async (req, res) => {
    try {
        const { engineerId, projectId, stage, task, status, startDate, endDate } = req.query;

        // Build dynamic filters
        const filters = {};
        if (engineerId) filters.employee = new mongoose.Types.ObjectId(engineerId);
        if (projectId) filters.projectName = new mongoose.Types.ObjectId(projectId);
        if (stage) filters.stage = stage;
        if (status) filters.status = status;
        if (task) filters.task = task;
        if (startDate || endDate) {
            filters.workDate = {};
            if (startDate) filters.workDate.$gte = new Date(startDate);
            if (endDate) filters.workDate.$lte = new Date(endDate);
        }

        const stats = await Task.aggregate([
            { $match: filters },
            {
                $facet: {
                    // Total hours summary for the selected filters
                    totalHours: [
                        {
                            $group: {
                                _id: null,
                                totalProjectHours: { $sum: '$projectHours' },
                                totalTravelHours: { $sum: '$travelHours' },
                                totalManHours: { $sum: '$totalManHours' }
                            }
                        },
                        { $project: { _id: 0 } }
                    ],
                    hoursByProject: [
                        {
                            $group: {
                                _id: '$projectName',
                                totalProjectHours: { $sum: '$manHours' },
                                totalTravelHours: { $sum: '$travelHours' },
                                totalManHours: { $sum: { $add: ['$manHours', '$travelHours'] } }
                            }
                        },
                        { $lookup: { from: 'projects', localField: '_id', foreignField: '_id', as: 'project' } },
                        { $unwind: { path: '$project', preserveNullAndEmptyArrays: true } },
                        {
                            $project: {
                                projectNumber: { $ifNull: ['$project.projectNumber', 'Unknown'] },
                                projectName: { $ifNull: ['$project.projectName', 'Unknown'] },
                                totalProjectHours: 1,
                                totalTravelHours: 1,
                                totalManHours: 1
                            }
                        }
                    ],
                    utilizationByEngineer: [
                        {
                            $group: {
                                _id: '$employee',
                                totalManHours: { $sum: { $add: ['$manHours', '$travelHours'] } }
                            }
                        },
                        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'employee' } },
                        { $unwind: { path: '$employee', preserveNullAndEmptyArrays: true } },
                        {
                            $project: {
                                name: { $ifNull: ['$employee.name', 'Unknown'] },
                                email: { $ifNull: ['$employee.email', ''] },
                                totalManHours: 1
                            }
                        }
                    ],
                    projectStatusDist: [
                        { $lookup: { from: 'projects', localField: 'projectName', foreignField: '_id', as: 'project' } },
                        { $unwind: { path: '$project', preserveNullAndEmptyArrays: true } },
                        { $group: { _id: { $ifNull: ['$project.status', 'Unknown'] }, count: { $sum: 1 } } }
                    ],
                    // Hours by Project Stage
                    hoursByStage: [
                        {
                            $group: {
                                _id: '$stage',
                                totalProjectHours: { $sum: '$projectHours' },
                                totalTravelHours: { $sum: '$travelHours' },
                                totalManHours: { $sum: '$totalManHours' }
                            }
                        },
                        { $sort: { totalManHours: -1 } }
                    ],
                    // Hours by Project Type
                    hoursByProjectType: [
                        {
                            $lookup: {
                                from: 'projects',
                                localField: 'projectName',
                                foreignField: '_id',
                                as: 'project'
                            }
                        },
                        { $unwind: { path: '$project', preserveNullAndEmptyArrays: true } },
                        {
                            $group: {
                                _id: { $ifNull: ['$project.projectType', 'Unknown'] },
                                totalProjectHours: { $sum: '$projectHours' },
                                totalTravelHours: { $sum: '$travelHours' },
                                totalManHours: { $sum: '$totalManHours' }
                            }
                        },
                        { $sort: { totalManHours: -1 } }
                    ],
                    // Task progress by employee
                    employeeTaskProgress: [
                        {
                            $group: {
                                _id: '$employee',
                                totalTasks: { $sum: 1 },
                                completedTasks: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
                                pendingTasks: { $sum: { $cond: [{ $ne: ['$status', 'Completed'] }, 1, 0] } },
                                totalProjectHours: { $sum: '$manHours' },
                                totalTravelHours: { $sum: '$travelHours' },
                                totalManHours: { $sum: { $add: ['$manHours', '$travelHours'] } },
                                totalMileage: { $sum: '$mileage' }
                            }
                        },
                        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'employee' } },
                        { $unwind: { path: '$employee', preserveNullAndEmptyArrays: true } },
                        {
                            $project: {
                                name: { $ifNull: ['$employee.name', 'Unknown'] },
                                totalTasks: 1,
                                completedTasks: 1,
                                pendingTasks: 1,
                                totalManHours: 1,
                                totalMileage: 1,
                                progressPercentage: {
                                    $multiply: [
                                        { $divide: ['$completedTasks', { $cond: [{ $eq: ['$totalTasks', 0] }, 1, '$totalTasks'] }] },
                                        100
                                    ]
                                }
                            }
                        },
                        { $sort: { totalTasks: -1 } }
                    ],
                    // Employee Project Progress (grouped by employee and project)
                    employeeProjectProgress: [
                        {
                            $group: {
                                _id: {
                                    employee: '$employee',
                                    project: '$projectName'
                                },
                                totalManHours: { $sum: '$totalManHours' },
                                totalMileage: { $sum: '$mileage' },
                                travelHours: { $sum: '$travelHours' },
                                projectHours: { $sum: '$projectHours' }
                            }
                        },
                        { $lookup: { from: 'users', localField: '_id.employee', foreignField: '_id', as: 'employee' } },
                        { $unwind: { path: '$employee', preserveNullAndEmptyArrays: true } },
                        { $lookup: { from: 'projects', localField: '_id.project', foreignField: '_id', as: 'project' } },
                        { $unwind: { path: '$project', preserveNullAndEmptyArrays: true } },
                        {
                            $project: {
                                engineer: { $ifNull: ['$employee.name', 'Unknown'] },
                                projectNumber: { $ifNull: ['$project.projectNumber', 'Unknown'] },
                                projectName: { $ifNull: ['$project.projectName', 'Unknown'] },
                                projectType: { $ifNull: ['$project.projectType', 'Unknown'] },
                                stage: { $ifNull: ['$project.stage', 'Not Set'] },
                                status: { $ifNull: ['$project.status', 'Unknown'] },
                                allocatedTime: { $ifNull: ['$project.allocatedTime', 0] },
                                totalManHours: 1,
                                totalMileage: 1,
                                travelHours: 1,
                                projectHours: 1
                            }
                        },
                        { $sort: { engineer: 1, projectName: 1 } }
                    ],
                    // Transportation Analytics
                    transportByProject: [
                        { $match: { leavesOffice: true } },
                        {
                            $group: {
                                _id: '$projectName',
                                totalMileage: { $sum: '$mileage' },
                                totalTravelHours: { $sum: '$travelHours' },
                                roadTrips: { $sum: { $cond: [{ $eq: ['$transportMode', 'Road'] }, 1, 0] } },
                                flightTrips: { $sum: { $cond: [{ $eq: ['$transportMode', 'Flight'] }, 1, 0] } },
                                tasks: { $sum: 1 }
                            }
                        },
                        { $lookup: { from: 'projects', localField: '_id', foreignField: '_id', as: 'project' } },
                        { $unwind: { path: '$project', preserveNullAndEmptyArrays: true } },
                        {
                            $project: {
                                projectNumber: { $ifNull: ['$project.projectNumber', 'Unknown'] },
                                projectName: { $ifNull: ['$project.projectName', 'Unknown'] },
                                totalMileage: 1,
                                totalTravelHours: 1,
                                roadTrips: 1,
                                flightTrips: 1,
                                tasks: 1
                            }
                        }
                    ],
                    mileageByEmployee: [
                        { $match: { leavesOffice: true, transportMode: 'Road' } },
                        {
                            $group: {
                                _id: '$employee',
                                totalMileage: { $sum: '$mileage' },
                                totalTravelHours: { $sum: '$travelHours' },
                                trips: { $sum: 1 }
                            }
                        },
                        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'employee' } },
                        { $unwind: { path: '$employee', preserveNullAndEmptyArrays: true } },
                        {
                            $project: {
                                name: { $ifNull: ['$employee.name', 'Unknown'] },
                                totalMileage: 1,
                                totalTravelHours: 1,
                                trips: 1
                            }
                        }
                    ],
                    flightDestinations: [
                        { $match: { leavesOffice: true, transportMode: 'Flight' } },
                        {
                            $group: {
                                _id: '$destination',
                                tripCount: { $sum: 1 },
                                totalTravelHours: { $sum: '$travelHours' }
                            }
                        },
                        { $sort: { tripCount: -1 } }
                    ],
                    transportModeDist: [
                        { $match: { leavesOffice: true } },
                        { $group: { _id: '$transportMode', count: { $sum: 1 }, totalMileage: { $sum: '$mileage' }, totalTravelHours: { $sum: '$travelHours' } } }
                    ],
                    // Transport trend over time (for line chart)
                    transportTrendByMonth: [
                        { $match: { leavesOffice: true } },
                        {
                            $group: {
                                _id: {
                                    year: { $year: '$workDate' },
                                    month: { $month: '$workDate' },
                                    monthName: { $dateToString: { format: '%b %Y', date: '$workDate' } },
                                    transportMode: '$transportMode'
                                },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { '_id.year': 1, '_id.month': 1 } },
                        {
                            $group: {
                                _id: { year: '$_id.year', month: '$_id.month' },
                                month: { $first: '$_id.monthName' },
                                Road: { $sum: { $cond: [{ $eq: ['$_id.transportMode', 'Road'] }, '$count', 0] } },
                                Flight: { $sum: { $cond: [{ $eq: ['$_id.transportMode', 'Flight'] }, '$count', 0] } }
                            }
                        },
                        { $sort: { _id: 1 } },
                        { $project: { _id: 0, month: 1, Road: 1, Flight: 1 } }
                    ]
                }
            }
        ]);

        res.status(200).json(stats[0]);
    } catch (err) {
        console.error('Analytics error:', err);
        res.status(500).json({ message: err.message });
    }
};


/**
 * @desc    Get project stage distribution for pie chart
 * @route   GET /api/admin/project-stage-dist
 * @access  Private/Admin
 */
const getProjectStageDist = async (req, res) => {
    try {
        const Project = require('../models/Project');
        const Task = require('../models/ProjectTask');
        const { engineerId, startDate, endDate } = req.query;
        
        // Build filter for projects
        const projectFilters = {};
        
        // If engineerId is provided, filter projects where the engineer is assigned
        if (engineerId) {
            const engineerObjectId = new mongoose.Types.ObjectId(engineerId);
            projectFilters.$or = [
                { projectLead: engineerObjectId },
                { electrical: engineerObjectId },
                { mechanical: engineerObjectId }
            ];
        }
        
        let projectIds = [];
        
        if (startDate || endDate) {
            // Get projects that have tasks within the date range
            const taskFilters = {};
            if (startDate || endDate) {
                taskFilters.workDate = {};
                if (startDate) taskFilters.workDate.$gte = new Date(startDate);
                if (endDate) taskFilters.workDate.$lte = new Date(endDate);
            }
            
            const tasks = await Task.find(taskFilters).select('projectName');
            projectIds = [...new Set(tasks.map(t => t.projectName))];
            
            if (projectIds.length === 0) {
                // No tasks in date range, return empty data
                return res.status(200).json({ data: [], total: 0 });
            }
        }
        
        // Build aggregation pipeline
        const pipeline = [];
        
        // Add project filter if engineerId is provided
        if (Object.keys(projectFilters).length > 0) {
            pipeline.push({ $match: projectFilters });
        }
        
        // Filter by project IDs if date range is applied
        if (projectIds.length > 0) {
            pipeline.push({ $match: { _id: { $in: projectIds } } });
        }
        
        // Group by stage and count
        pipeline.push(
            {
                $group: {
                    _id: { $ifNull: ['$stage', 'Not Set'] },
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        );

        const stageDist = await Project.aggregate(pipeline);

        // Calculate percentages
        const total = stageDist.reduce((sum, item) => sum + item.count, 0);
        const stageData = stageDist.map(item => ({
            stage: item._id,
            count: item.count,
            percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) : 0
        }));

        res.status(200).json({ data: stageData, total });
    } catch (err) {
        console.error('Project stage distribution error:', err);
        res.status(500).json({ message: err.message });
    }
};

/**
 * @desc    Get project statistics for KPI cards
 * @route   GET /api/admin/project-stats
 * @access  Private/Admin
 */
const getProjectStats = async (req, res) => {
    try {
        const Project = require('../models/Project');
        const Task = require('../models/ProjectTask');
        const { engineerId, startDate, endDate } = req.query;
        
        // If filtering by engineer or date, we need to count projects based on tasks
        if (engineerId || startDate || endDate) {
            // Build task filters
            const taskFilters = {};
            
            // If engineerId provided, filter by employee on tasks
            if (engineerId) {
                taskFilters.employee = new mongoose.Types.ObjectId(engineerId);
            }
            
            // If date range provided, filter tasks by date
            if (startDate || endDate) {
                taskFilters.workDate = {};
                if (startDate) taskFilters.workDate.$gte = new Date(startDate);
                if (endDate) taskFilters.workDate.$lte = new Date(endDate);
            }
            
            // Get distinct project IDs from tasks matching filters
            const tasks = await Task.find(taskFilters).select('projectName').distinct('projectName');
            
            const totalProjects = tasks.length;
            
            // Get status counts for these projects
            const projectStatusCounts = await Project.aggregate([
                { $match: { _id: { $in: tasks } } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]);
            
            const statusMap = {};
            projectStatusCounts.forEach(item => {
                statusMap[item._id] = item.count;
            });
            
            return res.status(200).json({
                totalProjects,
                activeProjects: statusMap['Active'] || 0,
                completedProjects: statusMap['Completed'] || 0,
                stalledProjects: statusMap['Stalled'] || 0
            });
        }
        
        // Default: return all project counts (no filters)
        const totalProjects = await Project.countDocuments();
        const activeProjects = await Project.countDocuments({ status: 'Active' });
        const completedProjects = await Project.countDocuments({ status: 'Completed' });
        const stalledProjects = await Project.countDocuments({ status: 'Stalled' });
        
        res.status(200).json({
            totalProjects,
            activeProjects,
            completedProjects,
            stalledProjects
        });
    } catch (err) {
        console.error('Project stats error:', err);
        res.status(500).json({ message: err.message });
    }
};

/**
 * @desc    Get weekly submission report (Monday to Sunday of specified week)
 * @route   GET /api/admin/weekly-submission-report
 * @access  Private/Admin
 */
const getWeeklySubmissionReport = async (req, res) => {
    try {
        const { weekStart, weekEnd } = req.query;
        
        let startDate, endDate;
        
        if (weekStart && weekEnd) {
            // Use provided dates
            startDate = new Date(weekStart);
            endDate = new Date(weekEnd);
        } else {
            // Calculate last week's date range (Monday to Sunday)
            const now = new Date();
            const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
            
            // Get to last Sunday (end of last week)
            endDate = new Date(now);
            endDate.setDate(now.getDate() - currentDay);
            endDate.setHours(23, 59, 59, 999);
            
            // Get to last Monday (start of last week)
            startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 6);
            startDate.setHours(0, 0, 0, 0);
        }
        
        // Get all users (including admins who may also be employees)
        const staffUsers = await User.find().select('_id name email').lean();
        
        // Get all tasks submitted during the week
        const tasksInWeek = await Task.find({
            workDate: { $gte: startDate, $lte: endDate }
        }).select('employee').lean();
        
        // Build a map of user ID to submission count
        const submissionCountByUser = {};
        tasksInWeek.forEach(task => {
            const empId = task.employee.toString();
            submissionCountByUser[empId] = (submissionCountByUser[empId] || 0) + 1;
        });
        
        // Separate users into submitted and not submitted
        const submittedUsers = [];
        const notSubmittedUsers = [];
        
        // Build list of all employees with task counts
        const allEmployeesWithTaskCounts = [];
        
        staffUsers.forEach(user => {
            const userId = user._id.toString();
            const taskCount = submissionCountByUser[userId] || 0;
            
            allEmployeesWithTaskCounts.push({
                _id: user._id,
                name: user.name,
                email: user.email,
                taskCount
            });
            
            if (taskCount > 0) {
                submittedUsers.push({
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    taskCount
                });
            } else {
                notSubmittedUsers.push({
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    taskCount: 0
                });
            }
        });
        
        // Sort by name
        submittedUsers.sort((a, b) => a.name.localeCompare(b.name));
        notSubmittedUsers.sort((a, b) => a.name.localeCompare(b.name));
        // Sort all employees by task count (descending) then by name
        allEmployeesWithTaskCounts.sort((a, b) => {
            if (b.taskCount !== a.taskCount) {
                return b.taskCount - a.taskCount;
            }
            return a.name.localeCompare(b.name);
        });
        
        // Format date range for response
        const formatDate = (date) => date.toISOString().split('T')[0];
        
        res.status(200).json({
            weekStart: formatDate(startDate),
            weekEnd: formatDate(endDate),
            summary: {
                totalStaff: staffUsers.length,
                submitted: submittedUsers.length,
                notSubmitted: notSubmittedUsers.length,
                submissionRate: staffUsers.length > 0 
                    ? ((submittedUsers.length / staffUsers.length) * 100).toFixed(1) 
                    : 0
            },
            submittedUsers,
            notSubmittedUsers,
            allEmployeesWithTaskCounts
        });
        
    } catch (err) {
        console.error('Weekly submission report error:', err);
        res.status(500).json({ message: err.message });
    }
};

/**
 * @desc    Get available weeks with task data
 * @route   GET /api/admin/weekly-submission-report/weeks
 * @access  Private/Admin
 */
const getAvailableWeeks = async (req, res) => {
    try {
        // Get distinct work dates from tasks
        const taskDates = await Task.find().select('workDate').lean();
        
        // Group dates by week (Monday to Sunday)
        const weeksMap = new Map();
        
        taskDates.forEach(task => {
            const date = new Date(task.workDate);
            // Get Monday of the week
            const day = date.getDay();
            const diff = date.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(date);
            monday.setDate(diff);
            monday.setHours(0, 0, 0, 0);
            
            // Get Sunday of the week
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            sunday.setHours(23, 59, 59, 999);
            
            const weekKey = `${monday.toISOString().split('T')[0]}_${sunday.toISOString().split('T')[0]}`;
            
            if (!weeksMap.has(weekKey)) {
                weeksMap.set(weekKey, {
                    weekStart: monday.toISOString().split('T')[0],
                    weekEnd: sunday.toISOString().split('T')[0],
                    label: `${monday.toISOString().split('T')[0]} to ${sunday.toISOString().split('T')[0]}`
                });
            }
        });
        
        // Convert to array and sort by date (most recent first)
        const weeks = Array.from(weeksMap.values()).sort((a, b) => 
            new Date(b.weekStart) - new Date(a.weekStart)
        );
        
        res.status(200).json(weeks);
    } catch (err) {
        console.error('Available weeks error:', err);
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getMasterSchedule, getAnalytics, getProjectStageDist, getProjectStats, getWeeklySubmissionReport, getAvailableWeeks };
