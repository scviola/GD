const mongoose = require('mongoose');
const Task = require('../models/ProjectTask');

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


module.exports = { getMasterSchedule, getAnalytics };
