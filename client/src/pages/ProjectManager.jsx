import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/useAuth';

const ProjectManager = () => {
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    
    const [formData, setFormData] = useState({
        projectNumber: '',
        projectName: '',
        projectType: '',
        region: '',
        county: '',
        architect: '',
        allocatedTime: '',
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

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (err) {
            console.error("Error fetching users", err);
        }
    };

    useEffect(() => {
        fetchProjects();
        fetchUsers();
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
                projectType: '',
                region: '',
                county: '',
                architect: '',
                allocatedTime: '',
                electrical: '',
                mechanical: '',
                projectLead: '',
                stage: '',
                status: 'Active'
            });
            fetchProjects();
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

    const clearStatusFilter = () => {
        setStatusFilter('');
    };

    // Filter projects based on status
    const filteredProjects = statusFilter && statusFilter !== 'all'
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
            {statusFilter === 'all' && (
                <div className="filter-banner">
                    <span>Showing projects: <strong>All Projects</strong></span>
                    <button onClick={clearStatusFilter} className="btn-clear-filter">Clear Filter</button>
                </div>
            )}
            {statusFilter && statusFilter !== 'all' && (
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
                        value={formData.projectType}
                        onChange={(e) => setFormData({...formData, projectType: e.target.value})}
                    >
                        <option value="">Project Type</option>
                        {PROJECT_TYPE_OPTIONS.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>


                    <select 
                        value={formData.region}
                        onChange={(e) => setFormData({...formData, region: e.target.value, county: ''})}
                    >
                        <option value="">Region</option>
                        {REGION_OPTIONS.map(region => (
                            <option key={region} value={region}>{region}</option>
                        ))}
                    </select>
                    <select 
                        value={formData.county}
                        onChange={(e) => setFormData({...formData, county: e.target.value})}
                        disabled={!formData.region}
                    >
                        <option value="">County</option>
                        {formData.region && COUNTIES_BY_REGION[formData.region]?.map(county => (
                            <option key={county} value={county}>{county}</option>
                        ))}
                    </select>

                    <input 
                        placeholder="Architect" 
                        value={formData.architect}
                        onChange={(e) => setFormData({...formData, architect: e.target.value})}
                    />
                    {isAdmin && (
                        <input 
                            type="number"
                            placeholder="Allocated Time (Hours)" 
                            value={formData.allocatedTime}
                            onChange={(e) => setFormData({...formData, allocatedTime: e.target.value})}
                        />
                    )}
                    <select 
                        value={formData.electrical}
                        onChange={(e) => setFormData({...formData, electrical: e.target.value})}
                    >
                        <option value="">Assign Electrical</option>
                        {users.filter(user => user.engineerType === 'Electrical').map(user => (
                            <option key={user._id} value={user._id}>{user.name}</option>
                        ))}
                    </select>
                    <select 
                        value={formData.mechanical}
                        onChange={(e) => setFormData({...formData, mechanical: e.target.value})}
                    >
                        <option value="">Assign Mechanical</option>
                        {users.filter(user => user.engineerType === 'Mechanical').map(user => (
                            <option key={user._id} value={user._id}>{user.name}</option>
                        ))}
                    </select>
                    <select 
                        value={formData.projectLead}
                        onChange={(e) => setFormData({...formData, projectLead: e.target.value})}
                    >
                        <option value="">Select Project Lead</option>
                        {users.map(user => (
                            <option key={user._id} value={user._id}>{user.name}</option>
                        ))}
                    </select>

                    <select 
                        value={formData.stage}
                        onChange={(e) => setFormData({...formData, stage: e.target.value})}
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
                    <select 
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                        <option value="">Select Status</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                        <option value="Stalled">Stalled</option>
                    </select>
                    <button type="submit" className="btn-success">Add Project</button>
                </form>
            </section>



            <hr />

            {/* Existing Projects Table */}
            <section className="table-section">
                <h3>
                    Project Directory 
                    {statusFilter && <span className="filter-indicator"> ({filteredProjects.length} {statusFilter})</span>}
                </h3>
                {loading ? <p>Loading projects...</p> : (
                    <div className="table-responsive">
                        <table className="spreadsheet-table">
                            <thead>
                                <tr>
                                    <th>Project #</th>
                                    <th>Project Name</th>
                                    <th>Project Type</th>
                                    <th>Region</th>
                                    <th>County</th>
                                    <th>Architect</th>
                                    <th>Allocated Time</th>
                                    <th>Electrical</th>
                                    <th>Mechanical</th>
                                    <th>Project Lead</th>
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
                                        <td>{project.projectType || '-'}</td>
                                        <td>{project.region || '-'}</td>
                                        <td>{project.county || '-'}</td>
                                        <td>{project.architect || '-'}</td>
                                        <td>{isAdmin ? (project.allocatedTime ? `${project.allocatedTime} hrs` : '-') : '-'}</td>
                                        <td>{project.electrical?.name || '-'}</td>
                                        <td>{project.mechanical?.name || '-'}</td>
                                        <td>{project.projectLead?.name || '-'}</td>
                                        <td>{project.stage || '-'}</td>
                                        <td>
                                            <select 
                                                className="status-select"
                                                value={project.status}
                                                onChange={(e) => handleStatusChange(project._id, e.target.value)}
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Completed">Completed</option>
                                                <option value="Stalled">Stalled</option>
                                            </select>
                                        </td>
                                        <td className="actions-cell">
                                            <div className="actions-buttons">
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
