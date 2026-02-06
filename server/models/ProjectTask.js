const mongoose = require('mongoose');

const projectTaskSchema = new mongoose.Schema(
    {
        projectName: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true
        },
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        workDate: {
            type: Date,
            required: true
        },
        stage: {
            type: String,
            enum: [
                'Pre-design',
                'Design',
                'Construction & Monitoring',
                'Procurement',
                'Commissioning',
                'General'
                ],
                required: true
        },
        task: {
            type: String,
            enum: [
                'Design',
                'Inspection',
                'Site Meeting',
                'Valuation',
                'Testing',
                'Commissioning',
                'Documentation',
                'Coordination Meeting'
            ],
            required: true
        },
        status: {
            type: String,
            enum: ['Active', 'Pending', 'In Progress', 'Completed', 'On Hold'],
            required: true
        },
        description: {
            type: String
        },
        manHours: {
            type: Number,
            required: true
        },
        leavesOffice: {
            type: Boolean,
            default: false
        },
        transportMode: {
            type: String,
            enum: ['Road', 'Flight']
        },
        mileage: {
            type: Number,
            default: 0
        },
        destination: {
            type: String
        },
        travelHours: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

// Create compound unique index to prevent duplicate entries for same project + employee + date
projectTaskSchema.index({ projectName: 1, employee: 1, workDate: 1 }, { unique: true });

module.exports = mongoose.model('ProjectTask', projectTaskSchema);