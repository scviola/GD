const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
    {
        projectNumber: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        projectName: {
            type: String,
            required: true
        },
        projectType: {
            type: String,
            enum: [
                'Personal Hse',
                'Hostel', 
                'Hotel', 
                'Office Block', 
                'Residential Apartment', 
                'Industrial', 
                'FitOut', 
                'Renovation', 
                'Education', 
                'Hospital',
                'Commercial',
                'Research',
                'Other',
                'N/A'
            ],
            default: ''
        },
        customProjectType: {
            type: String,
            default: ''
        },
        region: {
            type: String,
            enum: [
                'Coast', 
                'Western', 
                'Eastern', 
                'North Eastern', 
                'Rift Valley', 
                'Central', 
                'Nyanza', 
                'Nairobi',
                'N/A'
            ],
        },
        county: {
            type: String,
            default: ''
        },
        architect: {
            type: String,
        },
        allocatedTime: {
            type: Number,
            default: 0
        },
        electrical: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        mechanical: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        projectLead: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        stage: {
            type: String,
            enum: [
                'Pre-design',
                'Design',
                'Tendering',
                'Construction & Supervision',
                'Snagging, Testing & Commissioning',
                "Handover",
                'Other'
                ]
        },
        customStage: {
            type: String,
            default: ''
        },
        status: {
            type: String,
            enum: ['Active', 'Completed', 'Stalled'],
            default: 'Active'
        }
    },
    { timestamps: true }
);


module.exports = mongoose.model("Project", projectSchema);
