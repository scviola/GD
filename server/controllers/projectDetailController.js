const ProjectDetail = require('../models/ProjectDetail');
const Project = require('../models/Project');

// Get all project details
const getAllProjectDetails = async (req, res) => {
    try {
        const projectDetails = await ProjectDetail.find()
            .populate('project', 'name projectCode status');
        res.json(projectDetails);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get project details by project ID
const getProjectDetailsByProjectId = async (req, res) => {
    try {
        const projectDetail = await ProjectDetail.findOne({ project: req.params.projectId })
            .populate('project', 'name projectCode status');
        if (!projectDetail) {
            return res.status(404).json({ message: 'Project details not found' });
        }
        res.json(projectDetail);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create or update project details
const upsertProjectDetails = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { trades } = req.body;

        // Check if project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if ProjectDetail already exists for this project
        let projectDetail = await ProjectDetail.findOne({ project: projectId });

        if (projectDetail) {
            // Update existing
            projectDetail.trades = trades;
            projectDetail = await projectDetail.save();
        } else {
            // Create new
            projectDetail = await ProjectDetail.create({
                project: projectId,
                trades
            });
        }

        await projectDetail.populate('project', 'name projectCode status');
        res.status(201).json(projectDetail);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update specific trade in project details
const updateTrade = async (req, res) => {
    try {
        const { projectId, tradeName } = req.params;
        const { tenderSum, subcontractor } = req.body;

        const projectDetail = await ProjectDetail.findOne({ project: projectId });
        if (!projectDetail) {
            return res.status(404).json({ message: 'Project details not found' });
        }

        const tradeIndex = projectDetail.trades.findIndex(
            t => t.trade.toLowerCase() === tradeName.toLowerCase()
        );

        if (tradeIndex === -1) {
            return res.status(404).json({ message: 'Trade not found' });
        }

        projectDetail.trades[tradeIndex].tenderSum = tenderSum;
        projectDetail.trades[tradeIndex].subcontractor = subcontractor;

        await projectDetail.save();
        await projectDetail.populate('project', 'name projectCode status');
        res.json(projectDetail);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete project details
const deleteProjectDetails = async (req, res) => {
    try {
        const projectDetail = await ProjectDetail.findOneAndDelete({ project: req.params.projectId });
        if (!projectDetail) {
            return res.status(404).json({ message: 'Project details not found' });
        }
        res.json({ message: 'Project details deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllProjectDetails,
    getProjectDetailsByProjectId,
    upsertProjectDetails,
    updateTrade,
    deleteProjectDetails
};
