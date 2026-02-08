const Project = require('../models/Project');

// POST /api/projects
const createProject = async (req, res) => {
    console.log('=== CREATE PROJECT DEBUG ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Content-Type:', req.get('Content-Type'));
    
    try {
        // Handle both single project and bulk creation
        const projectsData = Array.isArray(req.body) ? req.body : [req.body];
        
        const results = [];
        for (const data of projectsData) {
            const { 
                projectNumber, 
                projectName,
                field,
                projectType,
                location, 
                architect, 
                mainContractor,
                engEstimate,
                finalAccount,
                employeeAssigned,
                stage,
                status 
            } = data;
            
            console.log('Processing project:', projectNumber);
            console.log('  - projectNumber:', projectNumber, typeof projectNumber);
            console.log('  - projectName:', projectName, typeof projectName);
            console.log('  - location:', location, typeof location);
            console.log('  - architect:', architect, typeof architect);
            console.log('  - engEstimate:', engEstimate, typeof engEstimate);
            console.log('  - finalAccount:', finalAccount, typeof finalAccount);
            console.log('  - employeeAssigned:', employeeAssigned, typeof employeeAssigned);
            
            if (!projectNumber || !projectName) {
                console.log('VALIDATION FAILED: Missing required fields');
                return res.status(400).json({message: "Missing required fields"});
            }
            
            // Type conversion for numeric fields
            const engEstimateNum = engEstimate ? Number(engEstimate) : 0;
            const finalAccountNum = finalAccount ? Number(finalAccount) : 0;
            
            console.log('  - engEstimate (converted):', engEstimateNum, typeof engEstimateNum);
            console.log('  - finalAccount (converted):', finalAccountNum, typeof finalAccountNum);
            
            const newProject = await Project.create({ 
                projectNumber, 
                projectName, 
                field,
                projectType,
                architect, 
                location,
                mainContractor: mainContractor || '',
                engEstimate: engEstimateNum,
                finalAccount: finalAccountNum,
                employeeAssigned: employeeAssigned || null,
                stage: stage || '',
                status: status || 'In Progress'
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
            console.log('Validation errors:', err.errors);
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
            console.log('DUPLICATE KEY ERROR - projectNumber already exists');
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
            .populate('employeeAssigned', 'name email')
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
            .populate('employeeAssigned', 'name email');
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
            'projectNumber', 'projectName', 'field', 'projectType', 'architect', 'location',
            'mainContractor', 'engEstimate', 'finalAccount',
            'employeeAssigned', 'stage', 'status'
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
        const isAssigned = project.employeeAssigned?.toString() === userId?.toString() || 
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
