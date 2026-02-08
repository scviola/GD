import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const ProjectManager = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const [newlyCreatedProject, setNewlyCreatedProject] = useState(null);
    
    const [formData, setFormData] = useState({
        projectNumber: '',
        projectName: '',
        field: '',
        projectType: '',
        location: '',
        architect: '',
        mainContractor: '',
        engEstimate: '',
        finalAccount: '',
        employeeAssigned: '',
        stage: '',
        status: 'In Progress'
    });

    const FIELD_OPTIONS = [
        'Electrical',
        'Mechanical'
    ];

    const PROJECT_TYPE_OPTIONS = [
        'Personal Hse',
        'Hostel',
        'Hotel',
        'Office Block',
        'Residential Apartment',
        'Industrial',
        'FitOut',
        'Renovation',
        'School',
        'Research'
    ];

    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            setProjects(res.data);
        } catch (err) {
            console.error("Error fetching projects", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/users');
            setEmployees(res.data);
        } catch (err) {
            console.error("Error fetching employees", err);
        }
    };

    useEffect(() => {
        fetchProjects();
        fetchEmployees();
    }, []);

    useEffect(() => {
        setStatusFilter(searchParams.get('status') || '');
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/projects', formData);
            const newProject = response.data;
            setFormData({
                projectNumber: '',
                projectName: '',
                field: '',
                projectType: '',
                location: '',
                architect: '',
                mainContractor: '',
                engEstimate: '',
                finalAccount: '',
                employeeAssigned: '',
                stage: '',
                status: 'In Progress'
            });
            fetchProjects();
            setNewlyCreatedProject(newProject);
        } catch (err) {
            alert(err.response?.data?.message || "Error creating project");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this project?")) return;
        try {
            await api.delete(`/projects/${id}`);
            fetchProjects();
            alert("Project deleted successfully!");
        } catch (err) {
            alert(err.response?.data?.message || "Error deleting project.");
        }
    };

    const handleStatusChange = async (projectId, newStatus) => {
        try {
            await api.put(`/projects/${projectId}`, { status: newStatus });
            fetchProjects();
        } catch (err) {
            console.error("Error updating status", err);
            alert(err.response?.data?.message || "Error updating status.");
        }
    };

    const getEmployeeName = (emp) => {
        if (!emp) return '-';
        if (typeof emp === 'object') return emp.name;
        const found = employees.find(e => e._id === emp);
        return found ? found.name : '-';
    };

    const formatCurrency = (value) => {
        if (!value) return '-';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'KSH' }).format(value);
    };

    const clearStatusFilter = () => {
        setStatusFilter('');
    };

    // Filter projects based on status
    const filteredProjects = statusFilter 
        ? projects.filter(p => {
            if (statusFilter === 'overdue') {
                // Overdue: not completed and past end date
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const endDate = p.endDate ? new Date(p.endDate) : null;
                return p.status !== 'Completed' && endDate && endDate < today;
            }
            return p.status === statusFilter;
        })
        : projects;

    return (
        <div className="admin-container">
            <header className="page-header">
                <h2>Manage Projects</h2>
                <p>Add new projects or update existing ones.</p>
            </header>

            {/* Active Filter Banner */}
            {statusFilter && (
                <div className="filter-banner">
                    <span>Showing projects: <strong>{statusFilter === 'overdue' ? 'Overdue Projects' : statusFilter}</strong></span>
                    <button onClick={clearStatusFilter} className="btn-clear-filter">Show All</button>
                </div>
            )}

            {/* Add New Project Form */}
            <section className="form-section">
                <h3>Add New Project</h3>
                <form onSubmit={handleSubmit} className="horizontal-form">
                    <input 
                        placeholder="Project Number (e.g. 0001A)" 
                        required 
                        value={formData.projectNumber}
                        onChange={(e) => setFormData({...formData, projectNumber: e.target.value})}
                    />
                    <input 
                        placeholder="Project Name" 
                        required 
                        value={formData.projectName}
                        onChange={(e) => setFormData({...formData, projectName: e.target.value})}
                    />
                    <select 
                        value={formData.field}
                        onChange={(e) => setFormData({...formData, field: e.target.value})}
                    >
                        <option value="">Field</option>
                        {FIELD_OPTIONS.map(field => (
                            <option key={field} value={field}>{field}</option>
                        ))}
                    </select>
                    <select 
                        value={formData.projectType}
                        onChange={(e) => setFormData({...formData, projectType: e.target.value})}
                    >
                        <option value="">Project Type</option>
                        {PROJECT_TYPE_OPTIONS.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>


                    <input 
                        placeholder="Location" 
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                    <input 
                        placeholder="Architect" 
                        required 
                        value={formData.architect}
                        onChange={(e) => setFormData({...formData, architect: e.target.value})}
                    />
                    <input 
                        placeholder="Main Contractor" 
                        value={formData.mainContractor}
                        onChange={(e) => setFormData({...formData, mainContractor: e.target.value})}
                    />
                    <input 
                        type="number"
                        placeholder="ENG Estimate (Ksh)" 
                        value={formData.engEstimate}
                        onChange={(e) => setFormData({...formData, engEstimate: e.target.value})}
                    />
                    <input 
                        type="number"
                        placeholder="Final Account (Ksh)" 
                        value={formData.finalAccount}
                        onChange={(e) => setFormData({...formData, finalAccount: e.target.value})}
                    />
                    <select 
                        value={formData.employeeAssigned}
                        onChange={(e) => setFormData({...formData, employeeAssigned: e.target.value})}
                    >
                        <option value="">Assign Engineer</option>
                        {employees.map(emp => (
                            <option key={emp._id} value={emp._id}>{emp.name}</option>
                        ))}
                    </select>
                    <select 
                        value={formData.stage}
                        onChange={(e) => setFormData({...formData, stage: e.target.value})}
                    >
                        <option value="">Select Stage</option>
                        <option value="Tendering">Tendering</option>
                        <option value="Procurement">Procurement</option>
                        <option value="Pre-Design">Pre-Design</option>
                        <option value="Design">Design</option>
                        <option value="Construction & Monitoring">Construction & Monitoring</option>
                        <option value="Commissioning">Commissioning</option>
                        <option value="Handover">Handover</option>
                    </select>
                    <button type="submit" className="btn-success">Add Project</button>
                </form>
            </section>

            {/* Success Message with Add Details Button */}
            {newlyCreatedProject && (
                <div className="success-banner">
                    <div className="success-content">
                        <span className="success-icon">✓</span>
                        <div className="success-text">
                            <strong>Project "{newlyCreatedProject.projectName}" created successfully!</strong>
                            <p>Would you like to add project details now?</p>
                        </div>
                        <div className="success-actions">
                            <button 
                                className="btn-action btn-details"
                                onClick={() => navigate(`/project-details/${newlyCreatedProject._id}`)}
                            >
                                Add Details
                            </button>
                            <button 
                                className="btn-action btn-secondary"
                                onClick={() => setNewlyCreatedProject(null)}
                            >
                                Later
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <hr />

            {/* Existing Projects Table */}
            <section className="table-section">
                <h3>
                    Active Project Directory 
                    {statusFilter && <span className="filter-indicator"> ({filteredProjects.length} {statusFilter})</span>}
                </h3>
                {loading ? <p>Loading projects...</p> : (
                    <div className="table-responsive">
                        <table className="spreadsheet-table">
                            <thead>
                                <tr>
                                    <th>Project #</th>
                                    <th>Project Name</th>
                                    <th>Field</th>
                                    <th>Project Type</th>
                                    <th>Location</th>
                                    <th>Architect</th>
                                    <th>Main Contractor</th>
                                    <th>ENG Estimate</th>
                                    <th>Final Account</th>
                                    <th>Engineer</th>
                                    <th>Stage</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProjects.map(project => (
                                    <tr key={project._id}>
                                        <td><strong><Link to={`/project-details/${project._id}`} className="project-link">{project.projectNumber}</Link></strong></td>
                                        <td><Link to={`/project-details/${project._id}`} className="project-link">{project.projectName}</Link></td>
                                        <td>{project.field || '-'}</td>
                                        <td>{project.projectType || '-'}</td>
                                        <td>{project.location || '-'}</td>
                                        <td>{project.architect}</td>
                                        <td>{project.mainContractor || '-'}</td>
                                        <td>{formatCurrency(project.engEstimate)}</td>
                                        <td>{formatCurrency(project.finalAccount)}</td>
                                        <td>{getEmployeeName(project.employeeAssigned)}</td>
                                        <td>{project.stage || '-'}</td>
                                        <td>
                                            <select 
                                                className="status-select"
                                                value={project.status}
                                                onChange={(e) => handleStatusChange(project._id, e.target.value)}
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Pending">Pending</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Completed">Completed</option>
                                                <option value="On Hold">On Hold</option>
                                            </select>
                                        </td>
                                        <td className="actions-cell">
                                            <div className="actions-buttons">
                                                <Link to={`/project-details/${project._id}`} className="btn-action btn-details">
                                                    Details
                                                </Link>
                                                <Link to={`/update-project/${project._id}`} className="btn-action btn-edit">
                                                    Edit
                                                </Link>
                                                <button className="btn-action btn-delete" onClick={() => handleDelete(project._id)}>
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredProjects.length === 0 && (
                                    <tr>
                                        <td colSpan="13" className="no-results">
                                            No projects found with status "{statusFilter}"
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
};

export default ProjectManager;
