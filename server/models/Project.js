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
        architect: {
            type: String,
            required: true
        },
        location: {
            type: String,
            required: true
        },
        contractor: {
            type: String,
            default: ''
        },
        projectCostEstimate: {
            type: Number,
            default: 0
        },
        actualProjectCost: {
            type: Number,
            default: 0
        },
        employeeAssigned: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
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
