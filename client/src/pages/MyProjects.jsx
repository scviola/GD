import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Filter, RotateCcw, FileText, X, Check } from 'lucide-react';
import api from '../services/api';

const MyProjects = () => {
    const { user } = useContext(AuthContext);
    const [employeeProjects, setEmployeeProjects] = useState([]);
    const [allEmployeeProjects, setAllEmployeeProjects] = useState([]);
    const [editingProject, setEditingProject] = useState(null);
    const [editForm, setEditForm] = useState({ stage: '', status: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [statusFilter, setStatusFilter] = useState(null);

    // Fetch employee's assigned projects
    useEffect(() => {
        const fetchEmployeeProjects = async () => {
            try {
                const res = await api.get('/projects');
                const projects = Array.isArray(res.data) ? res.data : [];
                const userId = user?.id || user?._id;
                
                if (userId) {
                    const assigned = projects.filter(p => {
                        // Check if user is assigned as electrical, mechanical, or project lead
                        const isElectrical = p.electrical?._id === userId || p.electrical === userId;
                        const isMechanical = p.mechanical?._id === userId || p.mechanical === userId;
                        const isProjectLead = p.projectLead?._id === userId || p.projectLead === userId;
                        return isElectrical || isMechanical || isProjectLead;
                    });
                    setAllEmployeeProjects(assigned);
                    setEmployeeProjects(assigned);
                }
            } catch (err) {
                console.error('Failed to load projects', err);
            }
        };
        fetchEmployeeProjects();
    }, [user]);

    // Helper function to get engineer name from ID
    const getEngineerNames = (engineerId) => {
        if (!engineerId) return '-';
        if (typeof engineerId === 'object') return engineerId.name || '-';
        return '-';
    };

    // Helper function to get project lead name
    const getProjectLeadName = (leadId) => {
        if (!leadId) return '-';
        if (typeof leadId === 'object') return leadId.name || '-';
        return '-';
    };

    // Clear status filter
    const clearStatusFilter = () => {
        setStatusFilter(null);
        setEmployeeProjects(allEmployeeProjects);
    };

    // Open edit modal
    const openEditModal = (project) => {
        setEditingProject(project);
        setEditForm({ stage: project.stage || '', status: project.status || '' });
    };

    // Close edit modal
    const closeEditModal = () => {
        setEditingProject(null);
        setEditForm({ stage: '', status: '' });
    };

    // Handle form input change
    const handleFormChange = (field, value) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    // Save project updates
    const handleSaveProject = async () => {
        if (!editingProject) return;
        setIsSaving(true);
        try {
            await api.put(`/projects/${editingProject._id}/my-project`, editForm);
            const updatedProjects = allEmployeeProjects.map(p => 
                p._id === editingProject._id ? { ...p, ...editForm } : p
            );
            setAllEmployeeProjects(updatedProjects);
            
            if (statusFilter) {
                const filtered = updatedProjects.filter(p => (p.status || 'Not Set') === statusFilter);
                setEmployeeProjects(filtered);
            } else {
                setEmployeeProjects(updatedProjects);
            }
            
            closeEditModal();
        } catch (err) {
            console.error('Failed to update project', err);
            alert('Failed to update project');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="home-container">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-info">
                    <h1>My Projects</h1>
                    <p className="header-date">{employeeProjects.length} project{employeeProjects.length !== 1 ? 's' : ''} assigned</p>
                </div>
            </header>

            {/* Status Filter */}
            <section className="filters-section">
                <div className="filters-row">
                    <h3>Filter by Status</h3>
                    <select
                        value={statusFilter || ''}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (value) {
                                setStatusFilter(value);
                                setEmployeeProjects(allEmployeeProjects.filter(p => (p.status || 'Not Set') === value));
                            } else {
                                clearStatusFilter();
                            }
                        }}
                        className="filter-select"
                    >
                        <option value="">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                        <option value="Stalled">Stalled</option>
                    </select>
                    {statusFilter && (
                        <button onClick={clearStatusFilter} className="btn-clear-filter">
                            <RotateCcw size={14} /> Clear Filter
                        </button>
                    )}
                </div>
            </section>

            {/* Employee's Projects Table */}
            <section className="analytics-card">
                <div className="table-header">
                    <h2>Assigned Projects {statusFilter && <span className="filter-badge">Filtered: {statusFilter}</span>}</h2>
                    <span className="project-count">{employeeProjects.length} project{employeeProjects.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="table-responsive">
                    <table className="spreadsheet-table">
                        <thead>
                            <tr>
                                <th>Project #</th>
                                <th>Project Name</th>
                                <th>Project Type</th>
                                <th>Region</th>
                                <th>Architect</th>
                                <th>Electrical</th>
                                <th>Mechanical</th>
                                <th>Project Lead</th>
                                <th>Stage</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employeeProjects.length > 0 ? (
                                employeeProjects.map((project) => (
                                    <tr key={project._id}>
                                        <td><strong><Link to={`/project-details/${project._id}`} className="project-link">{project.projectNumber}</Link></strong></td>
                                        <td><Link to={`/project-details/${project._id}`} className="project-link">{project.projectName}</Link></td>
                                        <td>{project.projectType || '-'}</td>
                                        <td>{project.region || '-'}</td>
                                        <td>{project.architect || '-'}</td>
                                        <td>{getEngineerNames(project.electrical)}</td>
                                        <td>{getEngineerNames(project.mechanical)}</td>
                                        <td>{getProjectLeadName(project.projectLead)}</td>
                                        <td>{project.stage || '-'}</td>
                                        <td>
                                            <span className={`badge ${project.status?.toLowerCase().replace(/\s+/g, '-') || 'not-set'}`}>
                                                {project.status || 'Not Set'}
                                            </span>
                                        </td>
                                        <td className="actions-cell">
                                            <div className="actions-buttons">
                                                <Link to={`/project-details/${project._id}`} className="btn-action btn-details">
                                                    Details
                                                </Link>
                                                <button 
                                                    onClick={() => openEditModal(project)}
                                                    className="btn-action btn-edit"
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={11} className="no-results">
                                        {allEmployeeProjects.length > 0 ? (
                                            <div className="no-results-content">
                                                <Filter size={32} />
                                                <p>No projects match the current filter</p>
                                                <button onClick={clearStatusFilter} className="btn-primary">
                                                    <RotateCcw size={14} /> Show All Projects
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="no-results-content">
                                                <FileText size={32} />
                                                <p>No assigned projects</p>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Edit Modal */}
            {editingProject && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Update Project</h3>
                            <button onClick={closeEditModal} className="btn-close">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Project: {editingProject.projectName}</label>
                            </div>
                            <div className="form-group">
                                <label htmlFor="edit-stage">Stage</label>
                                <select 
                                    id="edit-stage"
                                    value={editForm.stage}
                                    onChange={(e) => handleFormChange('stage', e.target.value)}
                                    className="form-select"
                                >
                                    <option value="">Select Stage...</option>
                                    <option value="Tendering">Tendering</option>
                                    <option value="Procurement">Procurement</option>
                                    <option value="Pre-Design">Pre-Design</option>
                                    <option value="Design">Design</option>
                                    <option value="Construction & Monitoring">Construction & Monitoring</option>
                                    <option value="Commissioning">Commissioning</option>
                                    <option value="Handover">Handover</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="edit-status">Status</label>
                                <select 
                                    id="edit-status"
                                    value={editForm.status}
                                    onChange={(e) => handleFormChange('status', e.target.value)}
                                    className="form-select"
                                >
                                    <option value="">Select Status...</option>
                                    <option value="Active">Active</option>
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                    <option value="On Hold">On Hold</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button onClick={closeEditModal} className="btn-cancel">
                                Cancel
                            </button>
                            <button onClick={handleSaveProject} className="btn-save" disabled={isSaving}>
                                {isSaving ? 'Saving...' : <><Check size={14} /> Save Changes</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyProjects;
