const Project = require('../models/Project');

// POST /api/projects
const createProject = async (req, res) => {
    try {
        // Handle both single project and bulk creation
        const projectsData = Array.isArray(req.body) ? req.body : [req.body];
        
        const results = [];
        for (const data of projectsData) {
            const { 
                projectNumber, 
                projectName,
                projectType,
                region,
                county,
                architect, 
                allocatedTime,
                electrical,
                mechanical,
                projectLead,
                stage,
                status 
            } = data;
            
            if (!projectNumber || !projectName) {
                return res.status(400).json({message: "Missing required fields"});
            }
            
            // Type conversion for numeric fields
            const allocatedTimeNum = allocatedTime ? Number(allocatedTime) : 0;
            
            const newProject = await Project.create({ 
                projectNumber, 
                projectName, 
                projectType,
                region: region || '',
                county: county || '',
                architect, 
                allocatedTime: allocatedTimeNum,
                electrical: electrical || null,
                mechanical: mechanical || null,
                projectLead: projectLead || null,
                stage: stage || '',
                status: status || 'Active'
            });
            results.push(newProject);
        }
        
        res.status(201).json({ 
            message: results.length === 1 ? "Project created" : "Projects created", 
            projects: results 
        });

    } catch (err) {
        console.log('=== MONGODB ERROR ===');
        console.log('Error name:', err.name);
        console.log('Error code:', err.code);
        console.log('Error message:', err.message);
        console.log('Full error:', err);
        
        if (err.name === 'ValidationError') {
            const validationErrors = Object.keys(err.errors).map(key => ({
                field: key,
                message: err.errors[key].message
            }));
            return res.status(400).json({ 
                message: 'Validation error creating project',
                errors: validationErrors
            });
        }
        if (err.code === 11000) {
            return res.status(400).json({ 
                message: 'Error: Project number already exists. Please use a different project number.'
            });
        }
        
        res.status(400).json({ 
            message: 'Error creating project: ' + err.message,
            error: err.message
        });
    }
};

// GET /api/projects
const getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find()
            .populate('electrical', 'name email')
            .populate('mechanical', 'name email')
            .populate('projectLead', 'name email')
            .sort('projectNumber');
        res.status(200).json(projects || []);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/projects/:id
const getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('electrical', 'name email')
            .populate('mechanical', 'name email')
            .populate('projectLead', 'name email');
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.status(200).json(project);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/projects/:id
const updateProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Update all fields from request body
        const allowedFields = [
            'projectNumber', 'projectName', 'projectType', 'region', 'county',
            'architect', 'allocatedTime', 'electrical', 'mechanical',
            'projectLead', 'stage', 'status'
        ];
        
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                project[field] = req.body[field];
            }
        });
        
        const updatedProject = await project.save();
        res.status(200).json(updatedProject);

    } catch (error) {
        res.status(400).json({ message: 'Failed to update project', error: error.message });
    }
};

// PUT /api/projects/:id/my-project - Employee updates their assigned project (stage/status only)
const updateMyProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user is assigned to this project
        const userId = req.user?._id || req.user?.id;
        const isAssigned = Array.isArray(project.employeeAssigned) 
            ? project.employeeAssigned.some(id => id?.toString() === userId?.toString())
            : project.employeeAssigned?.toString() === userId?.toString() || 
              project.employeeAssigned === userId;
        
        if (!isAssigned && req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'You are not assigned to this project' });
        }

        // Only allow updating stage and status
        const { stage, status } = req.body;
        
        if (stage !== undefined) {
            project.stage = stage;
        }
        if (status !== undefined) {
            project.status = status;
        }
        
        const updatedProject = await project.save();
        res.status(200).json(updatedProject);

    } catch (error) {
        res.status(400).json({ message: 'Failed to update project', error: error.message });
    }
};

// DELETE /api/projects/:id
const deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        await project.deleteOne();
        res.status(200).json({ message: 'Project removed' });
        
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete project', error: error.message });
    }
};


module.exports = {
    createProject,
    getAllProjects,
    getProjectById,
    updateProject,
    updateMyProject,
    deleteProject
};
