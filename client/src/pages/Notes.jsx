import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { fetchNotes, createNote, updateNote, deleteNote, fetchProjects } from '../services/adminApi';

const NOTES_STATUS_OPTIONS = ['Open', 'In Progress', 'Resolved', 'Closed'];

const Notes = () => {
  const { user } = useContext(AuthContext);
  const [notes, setNotes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [formData, setFormData] = useState({
    project: '',
    opportunity: '',
    status: 'Open',
    conclusion: ''
  });

  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [notesData, projectsData] = await Promise.all([
        fetchNotes(),
        fetchProjects()
      ]);
      setNotes(notesData);
      setProjects(projectsData);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedNote) {
        await updateNote(selectedNote._id, formData);
      } else {
        await createNote(formData);
      }
      setFormData({ project: '', opportunity: '', status: 'Open', conclusion: '' });
      setShowForm(false);
      setSelectedNote(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving note');
    }
  };

  const handleEdit = (note) => {
    setSelectedNote(note);
    setFormData({
      project: note.project?._id || '',
      opportunity: note.opportunity || '',
      status: note.status || 'Open',
      conclusion: note.conclusion || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await deleteNote(id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting note');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedNote(null);
    setFormData({ project: '', opportunity: '', status: 'Open', conclusion: '' });
  };

  // Filter notes
  const filteredNotes = notes.filter(note => {
    if (projectFilter && note.project?._id !== projectFilter) return false;
    if (statusFilter && note.status !== statusFilter) return false;
    return true;
  });

  const getProjectName = (projectId) => {
    const project = projects.find(p => p._id === projectId);
    return project ? `${project.projectNumber} - ${project.projectName}` : 'Unknown';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="notes-page">
        <div className="loading">Loading notes...</div>
      </div>
    );
  }

  return (
    <div className="notes-page">
      <header className="dashboard-header">
        <div className="header-right">
          <span className="user-greeting">Welcome, {user?.name?.split(' ')[0]}</span>
        </div>
      </header>

      <h2>Project Meeting Notes</h2>

      {/* Filters */}
      <div className="notes-filters">
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
        >
          <option value="">All Projects</option>
          {projects.map(project => (
            <option key={project._id} value={project._id}>
              {project.projectNumber} - {project.projectName}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          {NOTES_STATUS_OPTIONS.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="notes-actions">
        <button
          className="btn-primary"
          onClick={() => { setShowForm(true); setSelectedNote(null); setFormData({ project: '', opportunity: '', status: 'Open', conclusion: '' }); }}
        >
          + Add New Note
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{selectedNote ? 'Edit Note' : 'Create New Note'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Project *</label>
                <select
                  value={formData.project}
                  onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                  required
                >
                  <option value="">Select Project</option>
                  {projects.map(project => (
                    <option key={project._id} value={project._id}>
                      {project.projectNumber} - {project.projectName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Opportunity / Discussion Point</label>
                <textarea
                  value={formData.opportunity}
                  onChange={(e) => setFormData({ ...formData, opportunity: e.target.value })}
                  placeholder="Enter discussion points, opportunities, or notes..."
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  {NOTES_STATUS_OPTIONS.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Conclusion / Action Item</label>
                <textarea
                  value={formData.conclusion}
                  onChange={(e) => setFormData({ ...formData, conclusion: e.target.value })}
                  placeholder="Enter conclusions or action items..."
                  rows={4}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {selectedNote ? 'Update Note' : 'Create Note'}
                </button>
                <button type="button" className="btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="notes-list">
        {filteredNotes.length === 0 ? (
          <div className="empty-state">
            <p>No notes found.</p>
          </div>
        ) : (
          filteredNotes.map(note => (
            <div key={note._id} className={`note-card status-${note.status.toLowerCase().replace(' ', '-')}`}>
              <div className="note-header">
                <div className="note-project">
                  <strong>{getProjectName(note.project?._id)}</strong>
                </div>
                <div className="note-meta">
                  <span className={`note-status ${note.status.toLowerCase().replace(' ', '-')}`}>
                    {note.status}
                  </span>
                  <span className="note-date">{formatDate(note.createdAt)}</span>
                </div>
              </div>

              <div className="note-content">
                {note.opportunity && (
                  <div className="note-section">
                    <strong>Discussion Points:</strong>
                    <p>{note.opportunity}</p>
                  </div>
                )}

                {note.conclusion && (
                  <div className="note-section">
                    <strong>Conclusion / Action Items:</strong>
                    <p>{note.conclusion}</p>
                  </div>
                )}
              </div>

              <div className="note-footer">
                <span className="note-author">By: {note.engineer?.name || 'Unknown'}</span>
                <div className="note-actions">
                  {(isAdmin || note.engineer?._id === user?._id) && (
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(note)}
                    >
                      Edit
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(note._id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CSS Styles */}
      <style>{`
        .notes-page {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .notes-page h2 {
          margin-bottom: 20px;
        }

        .back-link {
          color: #3b82f6;
          text-decoration: none;
        }

        .back-link:hover {
          text-decoration: underline;
        }

        .notes-filters {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
        }

        .notes-filters select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .notes-actions {
          margin-bottom: 20px;
        }

        .notes-list {
          display: grid;
          gap: 20px;
        }

        .note-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .note-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e5e7eb;
        }

        .note-project strong {
          font-size: 16px;
          color: #1f2937;
        }

        .note-meta {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .note-status {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }

        .note-status.open {
          background: #fef3c7;
          color: #92400e;
        }

        .note-status.in-progress {
          background: #dbeafe;
          color: #1e40af;
        }

        .note-status.resolved {
          background: #d1fae5;
          color: #065f46;
        }

        .note-status.closed {
          background: #f3f4f6;
          color: #374151;
        }

        .note-date {
          font-size: 12px;
          color: #6b7280;
        }

        .note-content {
          margin-bottom: 15px;
        }

        .note-section {
          margin-bottom: 12px;
        }

        .note-section strong {
          display: block;
          font-size: 13px;
          color: #4b5563;
          margin-bottom: 4px;
        }

        .note-section p {
          margin: 0;
          color: #1f2937;
          white-space: pre-wrap;
        }

        .note-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 10px;
          border-top: 1px solid #e5e7eb;
        }

        .note-author {
          font-size: 12px;
          color: #6b7280;
        }

        .note-actions {
          display: flex;
          gap: 10px;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-secondary:hover {
          background: #4b5563;
        }

        .btn-edit {
          background: #f59e0b;
          color: white;
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .btn-edit:hover {
          background: #d97706;
        }

        .btn-delete {
          background: #ef4444;
          color: white;
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .btn-delete:hover {
          background: #dc2626;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          padding: 30px;
          border-radius: 8px;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-content h3 {
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #374151;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-group textarea {
          resize: vertical;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: #6b7280;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default Notes;
