import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const UpdateProject = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [project, setProject] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    
    const [formData, setFormData] = useState({
        projectNumber: '',
        projectName: '',
        projectType: '',
        region: '',
        county: '',
        architect: '',
        mepContractSum: '',
        electrical: '',
        mechanical: '',
        projectLead: '',
        stage: '',
        status: 'Active'
    });

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

    const REGION_OPTIONS = [
        'Coast',
        'Western',
        'Eastern',
        'North Eastern',
        'Rift Valley',
        'Central',
        'Nyanza',
        'Nairobi'
    ];

    const COUNTIES_BY_REGION = {
        'Coast': ['Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita Taveta'],
        'Western': ['Kakamega', 'Vihiga', 'Bungoma', 'Busia'],
        'Eastern': ['Machakos', 'Kitui', 'Makueni', 'Meru', 'Embu', 'Tharaka Nithi', 'Isiolo'],
        'North Eastern': ['Garissa', 'Wajir', 'Mandera'],
        'Rift Valley': ['Nakuru', 'Uasin Gishu', 'Narok', 'Kajiado', 'Baringo', 'Laikipia', 'Kericho', 'Bomet', 'Nandi', 'Elgeyo Marakwet', 'West Pokot', 'Samburu', 'Trans Nzoia', 'Turkana'],
        'Central': ['Kiambu', 'Murang\'a', 'Nyeri', 'Kirinyaga', 'Nyandarua'],
        'Nyanza': ['Kisumu', 'Siaya', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira'],
        'Nairobi': ['Nairobi']
    };

    // Fetch project and users
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projectRes, usersRes] = await Promise.all([
                    api.get(`/projects/${id}`),
                    api.get('/users')
                ]);
                
                const projectData = projectRes.data;
                setProject(projectData);
                setUsers(usersRes.data);
                
                // Initialize form with project data
                setFormData({
                    projectNumber: projectData.projectNumber || '',
                    projectName: projectData.projectName || '',
                    projectType: projectData.projectType || '',
                    region: projectData.region || '',
                    county: projectData.county || '',
                    architect: projectData.architect || '',
                    mepContractSum: projectData.mepContractSum || '',
                    electrical: projectData.electrical?._id || projectData.electrical || '',
                    mechanical: projectData.mechanical?._id || projectData.mechanical || '',
                    projectLead: projectData.projectLead?._id || projectData.projectLead || '',
                    stage: projectData.stage || '',
                    status: projectData.status || 'Active'
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
        const { name, value } = e.target;
        
        // Reset county when region changes
        if (name === 'region') {
            setFormData({
                ...formData,
                [name]: value,
                county: ''
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
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
                        
                        <div className="form-group">
                            <label>Project Type</label>
                            <select 
                                name="projectType"
                                value={formData.projectType}
                                onChange={handleChange}
                            >
                                <option value="">Select Project Type</option>
                                {PROJECT_TYPE_OPTIONS.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Region</label>
                            <select 
                                name="region"
                                value={formData.region}
                                onChange={handleChange}
                            >
                                <option value="">Select Region</option>
                                {REGION_OPTIONS.map(region => (
                                    <option key={region} value={region}>{region}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label>County</label>
                            <select 
                                name="county"
                                value={formData.county}
                                onChange={handleChange}
                                disabled={!formData.region}
                            >
                                <option value="">Select County</option>
                                {formData.region && COUNTIES_BY_REGION[formData.region]?.map(county => (
                                    <option key={county} value={county}>{county}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label>Architect</label>
                            <input 
                                type="text" 
                                name="architect"
                                value={formData.architect}
                                onChange={handleChange}
                                placeholder="Enter architect name"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>MEP Contract Sum (Ksh)</label>
                            <input 
                                type="number" 
                                name="mepContractSum"
                                value={formData.mepContractSum}
                                onChange={handleChange}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Electrical Engineer</label>
                            <select 
                                name="electrical"
                                value={formData.electrical}
                                onChange={handleChange}
                            >
                                <option value="">Assign Electrical</option>
                                {users.filter(user => user.engineerType === 'Electrical').map(user => (
                                    <option key={user._id} value={user._id}>{user.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label>Mechanical Engineer</label>
                            <select 
                                name="mechanical"
                                value={formData.mechanical}
                                onChange={handleChange}
                            >
                                <option value="">Assign Mechanical</option>
                                {users.filter(user => user.engineerType === 'Mechanical').map(user => (
                                    <option key={user._id} value={user._id}>{user.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label>Project Lead</label>
                            <select 
                                name="projectLead"
                                value={formData.projectLead}
                                onChange={handleChange}
                            >
                                <option value="">Select Project Lead</option>
                                {users.map(user => (
                                    <option key={user._id} value={user._id}>{user.name}</option>
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
                                <option value="Pre-Design">Pre-Design</option>
                                <option value="Design">Design</option>
                                <option value="Tendering">Tendering</option>
                                <option value="Construction & Supervision">Construction & Supervision</option>
                                <option value="Snagging, Testing & Commissioning">Snagging, Testing & Commissioning</option>
                                <option value="Handover">Handover</option>
                                <option value="Other(specify)">Other(specify)</option>
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
                                <option value="Completed">Completed</option>
                                <option value="Stalled">Stalled</option>
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
