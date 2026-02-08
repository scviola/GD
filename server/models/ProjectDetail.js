const mongoose = require('mongoose');

const TRADE_OPTIONS = [
    'Mechanical',
    'Electrical',
    'ICT',
    'Generator',
    'Borehole',
    'Lift',
    'Solar PV',
    'Pool'
];

const projectDetailSchema = new mongoose.Schema(
    {
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
            unique: true
        },
        trades: {
            type: [{
                trade: {
                    type: String,
                    enum: TRADE_OPTIONS
                },
                tenderSum: {
                    type: Number,
                    default: 0
                },
                subcontractor: {
                    type: String,
                    default: ''
                }
            }],
            default: TRADE_OPTIONS.map(trade => ({
                trade,
                tenderSum: 0,
                subcontractor: ''
            }))
        }
    },
    { timestamps: true }
);

projectDetailSchema.statics.TRADE_OPTIONS = TRADE_OPTIONS;

module.exports = mongoose.model("ProjectDetail", projectDetailSchema);
