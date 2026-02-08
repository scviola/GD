const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
    createNote,
    getNotes,
    getNoteById,
    updateNote,
    deleteNote
} = require('../controllers/noteController');

// Note Routes

// Create a new note
router.post('/', protect, createNote);

// Get all notes (filtered by user's projects)
router.get('/', protect, getNotes);

// Get single note by ID
router.get('/:id', protect, getNoteById);

// Update a note
router.put('/:id', protect, updateNote);

// Delete a note (admin only)
router.delete('/:id', protect, restrictTo("admin"), deleteNote);

module.exports = router;
