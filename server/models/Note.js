const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
    {
        engineer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true
        },
        opportunity: {
            type: String,
            default: ''
        },
        status: {
            type: String,
            enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
            default: 'Open'
        },
        conclusion: {
            type: String,
            default: ''
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Note", noteSchema);
