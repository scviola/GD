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
            enum: ['Personal Hse', 'Hostel', 'Hotel', 'Office Block', 'Residential Apartment', 'Industrial', 'FitOut', 'Renovation', 'School', 'Research'],
            default: ''
        },
        location: {
            type: String,
        },
        architect: {
            type: String,
        },

        mainContractor: {
            type: String,
            default: ''
        },
        engEstimate: {
            type: Number,
            default: 0
        },
        finalAccount: {
            type: Number,
            default: 0
        },
        employeeAssigned: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        stage: {
            type: String,
            default: ''
        },
        status: {
            type: String,
            enum: ['Active', 'Pending', 'In Progress', 'Completed', 'On Hold'],
            default: 'In Progress'
        }
    },
    { timestamps: true }
);


module.exports = mongoose.model("Project", projectSchema);
