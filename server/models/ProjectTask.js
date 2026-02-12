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
                'Tendering',
                'Construction & Supervision',
                'Snugging, Testing & Commissioning',
                "Handover",
                'Other(specify)'
                ],
                required: true
        },
        taskCategory: {
            type: String,
            enum: [
                'Concept',
                'Design',
                'Tender Documentation',
                'Construction',
                'Snugging',
                'Testing & Commissioning',
                'Handover'
            ],
            required: true
        },
        specificTask: {
            type: String,
            required: true
        },
        projectHours: {
            type: Number,
            required: true
        },
        leavesOffice: {
            type: Boolean,
            default: false
        },
        transportMode: {
            type: String,
            enum: ['Road', 'Flight', 'Other']
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
        },
        totalManHours: {
            type: Number
        }
    },
    { timestamps: true }
);

// Create compound unique index to prevent duplicate entries for same project + employee + date
projectTaskSchema.index({ projectName: 1, employee: 1, workDate: 1 }, { unique: true });

module.exports = mongoose.model('ProjectTask', projectTaskSchema);