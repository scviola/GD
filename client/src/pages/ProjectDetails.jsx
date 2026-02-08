import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import projectDetailApi from '../services/projectDetailApi';
import { fetchProjects, fetchProjectById } from '../services/adminApi';

const TRADES = [
    'Mechanical',
    'Electrical',
    'ICT',
    'Generator',
    'Borehole',
    'Lift',
    'Solar PV',
    'Pool'
];

const ProjectDetails = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [projectInfo, setProjectInfo] = useState(null);
    const [projectDetails, setProjectDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const fetchAllProjects = useCallback(async () => {
        try {
            const data = await fetchProjects();
            setProjects(data);
        } catch {
            setError('Failed to fetch projects');
        }
    }, []);

    const fetchProjectInfo = useCallback(async (id) => {
        try {
            const data = await fetchProjectById(id);
            setProjectInfo(data);
        } catch {
            // If fetch fails, try to find in local list
            const found = projects.find(p => p._id === id);
            if (found) {
                setProjectInfo(found);
            }
        }
    }, [projects]);

    const fetchProjectDetails = useCallback(async (id) => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await projectDetailApi.getProjectDetailsByProjectId(id);
            setProjectDetails(response.data);
            setError(null);
        } catch {
            // Project details not found, initialize with empty trades
            setProjectDetails({
                project: id,
                trades: TRADES.map(trade => ({
                    trade,
                    tenderSum: 0,
                    subcontractor: ''
                }))
            });
            setError(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // If no projectId in URL, fetch projects list for selector
        if (!projectId) {
            fetchAllProjects();
        }
    }, [projectId, fetchAllProjects]);

    useEffect(() => {
        if (projectId) {
            setSelectedProject(projectId);
            fetchProjectInfo(projectId);
            fetchProjectDetails(projectId);
        }
    }, [projectId, fetchProjectInfo, fetchProjectDetails]);

    const handleProjectChange = (e) => {
        const id = e.target.value;
        setSelectedProject(id);
        if (id) {
            navigate(`/project-details/${id}`);
        } else {
            setProjectInfo(null);
            setProjectDetails(null);
        }
    };

    const handleTradeChange = (index, field, value) => {
        const updatedTrades = [...projectDetails.trades];
        updatedTrades[index] = {
            ...updatedTrades[index],
            [field]: field === 'tenderSum' ? Number(value) : value
        };
        setProjectDetails({ ...projectDetails, trades: updatedTrades });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedProject) return;

        setSaving(true);
        try {
            const response = await projectDetailApi.upsertProjectDetails(selectedProject, {
                trades: projectDetails.trades
            });
            setProjectDetails(response.data);
            setSuccess('Project details saved successfully');
            setError(null);
            setTimeout(() => setSuccess(null), 3000);
        } catch {
            setError('Failed to save project details');
        } finally {
            setSaving(false);
        }
    };

    const calculateTotal = () => {
        if (!projectDetails?.trades) return 0;
        return projectDetails.trades.reduce((sum, trade) => sum + (Number(trade.tenderSum) || 0), 0);
    };

    const totalTenderSum = calculateTotal();

    // Get project info for display - check projectInfo state first, then fall back to projects list
    const displayProjectInfo = projectInfo || projects.find(p => p._id === selectedProject);

    return (
        <div className="project-details-container">
            <header className="page-header">
                <h2>Project Details</h2>
                {displayProjectInfo ? (
                    <p className="project-name">{displayProjectInfo.projectCode || displayProjectInfo.projectNumber} - {displayProjectInfo.name}</p>
                ) : selectedProject ? (
                    <p className="project-name">Loading project...</p>
                ) : null}
            </header>

            {/* Project Selector - Only shown when no projectId in URL */}
            {!projectId && (
                <div className="form-section">
                    <label>Select Project</label>
                    <select
                        value={selectedProject}
                        onChange={handleProjectChange}
                        className="form-select"
                    >
                        <option value="">-- Select a Project --</option>
                        {projects.map(project => (
                            <option key={project._id} value={project._id}>
                                {project.projectCode} - {project.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {error && (
                <div className="alert alert-error">
                    {error}
                </div>
            )}

            {success && (
                <div className="alert alert-success">
                    {success}
                </div>
            )}

            {loading ? (
                <div className="loading">Loading...</div>
            ) : projectDetails ? (
                <form onSubmit={handleSubmit} className="project-details-form">
                    <div className="table-responsive">
                        <table className="spreadsheet-table">
                            <thead>
                                <tr>
                                    <th>Trade</th>
                                    <th>Tender Sum (Ksh)</th>
                                    <th>Subcontractor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projectDetails.trades.map((trade, index) => (
                                    <tr key={trade.trade}>
                                        <td className="trade-name">{trade.trade}</td>
                                        <td className="tender-sum-col">
                                            <input
                                                type="number"
                                                value={trade.tenderSum ?? ''}
                                                onChange={(e) => handleTradeChange(index, 'tenderSum', e.target.value)}
                                                className="form-input"
                                                placeholder=""
                                                min="0"
                                                step="0.01"
                                            />
                                        </td>
                                        <td className="subcontractor-col">
                                            <input
                                                type="text"
                                                value={trade.subcontractor || ''}
                                                onChange={(e) => handleTradeChange(index, 'subcontractor', e.target.value)}
                                                className="form-input"
                                                placeholder="Subcontractor name"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="total-row">
                                    <td><strong>Total</strong></td>
                                    <td><strong>Ksh {totalTenderSum.toLocaleString()}</strong></td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="form-actions">
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn btn-primary"
                        >
                            {saving ? 'Saving...' : 'Save Project Details'}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="no-data">
                    Select a project to view and edit details
                </div>
            )}
        </div>
    );
};

export default ProjectDetails;

