import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';

const ProjectManager = () => {
    const [projects, setProjects] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    
    const [formData, setFormData] = useState({
        projectNumber: '',
        projectName: '',
        location: '',
        architect: '',
        contractor: '',
        projectCostEstimate: '',
        actualProjectCost: '',
        employeeAssigned: '',
        stage: '',
        status: 'In Progress'
    });

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
            await api.post('/projects', formData);
            setFormData({
                projectNumber: '',
                projectName: '',
                location: '',
                architect: '',
                contractor: '',
                projectCostEstimate: '',
                actualProjectCost: '',
                employeeAssigned: '',
                stage: '',
                status: 'In Progress'
            });
            fetchProjects();
            alert("Project added successfully!");
        } catch (err) {
            alert(err.response?.data?.message || "Error creating project. Ensure Project Number is unique.");
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
                <p>Register new projects or update existing ones.</p>
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
                <h3>Create New Project</h3>
                <form onSubmit={handleSubmit} className="horizontal-form">
                    <input 
                        placeholder="Project Number (e.g. PRJ-001)" 
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
                        placeholder="Contractor" 
                        value={formData.contractor}
                        onChange={(e) => setFormData({...formData, contractor: e.target.value})}
                    />
                    <input 
                        type="number"
                        placeholder="Project Cost Estimate (Ksh)" 
                        value={formData.projectCostEstimate}
                        onChange={(e) => setFormData({...formData, projectCostEstimate: e.target.value})}
                    />
                    <input 
                        type="number"
                        placeholder="Actual Project Cost (Ksh)" 
                        value={formData.actualProjectCost}
                        onChange={(e) => setFormData({...formData, actualProjectCost: e.target.value})}
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
                                    <th>Location</th>
                                    <th>Architect</th>
                                    <th>Contractor</th>
                                    <th>Cost Estimate</th>
                                    <th>Actual Cost</th>
                                    <th>Engineer</th>
                                    <th>Stage</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProjects.map(project => (
                                    <tr key={project._id}>
                                        <td><strong>{project.projectNumber}</strong></td>
                                        <td>{project.projectName}</td>
                                        <td>{project.location || '-'}</td>
                                        <td>{project.architect}</td>
                                        <td>{project.contractor || '-'}</td>
                                        <td>{formatCurrency(project.projectCostEstimate)}</td>
                                        <td>{formatCurrency(project.actualProjectCost)}</td>
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
                                        <td>
                                            <Link to={`/update-project/${project._id}`} className="btn-edit">
                                                Edit
                                            </Link>
                                            <button className="btn-delete" onClick={() => handleDelete(project._id)}>
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredProjects.length === 0 && (
                                    <tr>
                                        <td colSpan="11" className="no-results">
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
