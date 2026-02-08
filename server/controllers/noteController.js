const mongoose = require('mongoose');
const Note = require('../models/Note');
const Project = require('../models/Project');

/**
 * @desc    Create a new note
 * @route   POST /api/notes
 * @access  Private (Employee/Admin)
 */
const createNote = async (req, res) => {
    try {
        const { project, opportunity, status, conclusion } = req.body;

        // Validate required fields
        if (!project) {
            return res.status(400).json({ message: 'Project is required' });
        }

        // Create note
        const note = await Note.create({
            engineer: req.user._id,
            project,
            opportunity,
            status: status || 'Open',
            conclusion
        });

        // Populate for response
        await note.populate([
            { path: 'engineer', select: 'name email' },
            { path: 'project', select: 'projectNumber projectName' }
        ]);

        res.status(201).json(note);
    } catch (err) {
        console.error('Create note error:', err);
        res.status(500).json({ message: err.message });
    }
};

/**
 * @desc    Get all notes (admin) or notes for projects user belongs to (employee)
 * @route   GET /api/notes
 * @access  Private (Employee/Admin)
 */
const getNotes = async (req, res) => {
    try {
        const { projectId } = req.query;
        const userId = req.user._id;
        const isAdmin = req.user.role === 'Admin';

        let query = {};

        // If employee (not admin), only show notes for projects they belong to
        if (!isAdmin) {
            // Find projects where user is assigned
            const userProjects = await Project.find({
                $or: [
                    { employeeAssigned: userId },
                    { employeeAssigned: new mongoose.Types.ObjectId(userId) }
                ]
            }).select('_id');

            const projectIds = userProjects.map(p => p._id);

            // Also include notes where user is the engineer who created the note
            const myNotes = await Note.find({ engineer: userId }).select('project').distinct('project');

            // Combine project IDs
            const accessibleProjectIds = [...new Set([...projectIds, ...myNotes])];

            if (accessibleProjectIds.length === 0) {
                return res.status(200).json([]);
            }

            query.project = { $in: accessibleProjectIds };
        }

        // If specific project filter provided, add to query
        if (projectId) {
            query.project = projectId;
        }

        // Get notes with populated fields
        const notes = await Note.find(query)
            .populate('engineer', 'name email')
            .populate('project', 'projectNumber projectName')
            .sort({ createdAt: -1 });

        res.status(200).json(notes);
    } catch (err) {
        console.error('Get notes error:', err);
        res.status(500).json({ message: err.message });
    }
};

/**
 * @desc    Get single note by ID
 * @route   GET /api/notes/:id
 * @access  Private (Employee/Admin)
 */
const getNoteById = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id)
            .populate('engineer', 'name email')
            .populate('project', 'projectNumber projectName');

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        // Check if user has access (admin or owns the note or belongs to the project)
        const isAdmin = req.user.role === 'Admin';
        const isNoteOwner = note.engineer._id.toString() === req.user._id.toString();

        if (!isAdmin && !isNoteOwner) {
            // Check if user belongs to the project
            const project = await Project.findById(note.project._id);
            const hasAccess = project.employeeAssigned &&
                project.employeeAssigned.toString() === req.user._id.toString();

            if (!hasAccess) {
                return res.status(403).json({ message: 'Access denied' });
            }
        }

        res.status(200).json(note);
    } catch (err) {
        console.error('Get note by ID error:', err);
        res.status(500).json({ message: err.message });
    }
};

/**
 * @desc    Update a note
 * @route   PUT /api/notes/:id
 * @access  Private (Employee/Admin)
 */
const updateNote = async (req, res) => {
    try {
        const { opportunity, status, conclusion } = req.body;

        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        // Check permissions
        const isAdmin = req.user.role === 'Admin';
        const isNoteOwner = note.engineer.toString() === req.user._id.toString();

        // Only admins or note owner can edit
        if (!isAdmin && !isNoteOwner) {
            return res.status(403).json({ message: 'Access denied. You can only edit your own notes.' });
        }

        // Update fields
        if (opportunity !== undefined) note.opportunity = opportunity;
        if (status !== undefined) note.status = status;
        if (conclusion !== undefined) note.conclusion = conclusion;

        await note.save();

        // Populate for response
        await note.populate([
            { path: 'engineer', select: 'name email' },
            { path: 'project', select: 'projectNumber projectName' }
        ]);

        res.status(200).json(note);
    } catch (err) {
        console.error('Update note error:', err);
        res.status(500).json({ message: err.message });
    }
};

/**
 * @desc    Delete a note
 * @route   DELETE /api/notes/:id
 * @access  Private (Admin only)
 */
const deleteNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        // Only admins can delete notes
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied. Only admins can delete notes.' });
        }

        await Note.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: 'Note deleted successfully' });
    } catch (err) {
        console.error('Delete note error:', err);
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    createNote,
    getNotes,
    getNoteById,
    updateNote,
    deleteNote
};
