import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const UpdateProject = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [project, setProject] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    
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

    // Fetch project and employees
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projectRes, employeesRes] = await Promise.all([
                    api.get(`/projects/${id}`),
                    api.get('/users')
                ]);
                
                setProject(projectRes.data);
                setEmployees(employeesRes.data);
                
                // Initialize form with project data
                setFormData({
                    projectNumber: projectRes.data.projectNumber || '',
                    projectName: projectRes.data.projectName || '',
                    location: projectRes.data.location || '',
                    architect: projectRes.data.architect || '',
                    contractor: projectRes.data.contractor || '',
                    projectCostEstimate: projectRes.data.projectCostEstimate || '',
                    actualProjectCost: projectRes.data.actualProjectCost || '',
                    employeeAssigned: projectRes.data.employeeAssigned?._id || projectRes.data.employeeAssigned || '',
                    stage: projectRes.data.stage || '',
                    status: projectRes.data.status || 'In Progress'
                });
            } catch (err) {
                console.error("Error fetching data", err);
                setError(err.response?.data?.message || "Failed to load project");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            await api.put(`/projects/${id}`, formData);
            alert("Project updated successfully!");
            navigate('/project-manager');
        } catch (err) {
            setError(err.response?.data?.message || "Error updating project. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-container">
                <div className="loading">Loading project details...</div>
            </div>
        );
    }

    if (error && !formData.projectNumber) {
        return (
            <div className="admin-container">
                <div className="error-message">{error}</div>
                <Link to="/project-manager" className="btn-back-link">← Back to Projects</Link>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <header className="page-header">
                <Link to="/project-manager" className="btn-back-link">← Back to Projects</Link>
                <h2>Update Project</h2>
                <p>Edit project details below.</p>
            </header>

            {error && <div className="error-banner">{error}</div>}

            <section className="form-section">
                <form onSubmit={handleSubmit} className="project-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Project Number *</label>
                            <input 
                                type="text" 
                                name="projectNumber"
                                value={formData.projectNumber}
                                onChange={handleChange}
                                required
                                placeholder="e.g., PRJ-001"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Project Name *</label>
                            <input 
                                type="text" 
                                name="projectName"
                                value={formData.projectName}
                                onChange={handleChange}
                                required
                                placeholder="Enter project name"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Location</label>
                            <input 
                                type="text" 
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="Enter location"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Architect *</label>
                            <input 
                                type="text" 
                                name="architect"
                                value={formData.architect}
                                onChange={handleChange}
                                required
                                placeholder="Enter architect name"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Contractor</label>
                            <input 
                                type="text" 
                                name="contractor"
                                value={formData.contractor}
                                onChange={handleChange}
                                placeholder="Enter contractor name"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Project Cost Estimate (Ksh)</label>
                            <input 
                                type="number" 
                                name="projectCostEstimate"
                                value={formData.projectCostEstimate}
                                onChange={handleChange}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Actual Project Cost (Ksh)</label>
                            <input 
                                type="number" 
                                name="actualProjectCost"
                                value={formData.actualProjectCost}
                                onChange={handleChange}
                                placeholder="0.00"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Assign Engineer</label>
                            <select 
                                name="employeeAssigned"
                                value={formData.employeeAssigned}
                                onChange={handleChange}
                            >
                                <option value="">Select Engineer</option>
                                {employees.map(emp => (
                                    <option key={emp._id} value={emp._id}>
                                        {emp.name} ({emp.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Stage</label>
                            <select 
                                name="stage"
                                value={formData.stage}
                                onChange={handleChange}
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
                        </div>
                        
                        <div className="form-group">
                            <label>Status</label>
                            <select 
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="Active">Active</option>
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="On Hold">On Hold</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group readonly">
                            <label>Created</label>
                            <input 
                                type="text"
                                value={project?.createdAt ? new Date(project.createdAt).toLocaleDateString() : '-'}
                                readOnly
                                disabled
                            />
                        </div>
                        
                        <div className="form-group readonly">
                            <label>Last Updated</label>
                            <input 
                                type="text"
                                value={project?.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : '-'}
                                readOnly
                                disabled
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <Link to="/project-manager" className="btn-secondary">
                            Cancel
                        </Link>
                    </div>
                </form>
            </section>
        </div>
    );
};

export default UpdateProject;
