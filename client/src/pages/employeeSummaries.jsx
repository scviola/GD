import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Clock, Calendar, FileText, LogOut, Edit2, X, Check, Filter, RotateCcw, SquareArrowOutUpRight } from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import api from '../services/api';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ArcElement, Tooltip, Legend);

const EmployeeSummaries = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const [summary, setSummary] = useState({
        todayHours: 0,
        weeklyHours: 0,
        totalLogsToday: 0,
        totalLogsAll: 0
    });
    const [weeklyTrend, setWeeklyTrend] = useState([]);
    const [statusBreakdown, setStatusBreakdown] = useState({});
    const [employeeProjects, setEmployeeProjects] = useState([]);
    const [allEmployeeProjects, setAllEmployeeProjects] = useState([]); // Store unfiltered projects
    const [editingProject, setEditingProject] = useState(null);
    const [editForm, setEditForm] = useState({ stage: '', status: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [statusFilter, setStatusFilter] = useState(null); // Active status filter

    useEffect(() => {
        const fetchDashboardStats = async () => {
            if (!user) return;
            try {
                const today = new Date();
                // Get Monday of current week
                const dayOfWeek = today.getDay();
                const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                const weekAgo = new Date(today);
                weekAgo.setDate(today.getDate() + mondayOffset);
                const res = await api.get(`/tasks/my-logs?start=${weekAgo.toISOString().split('T')[0]}`);
                const logs = res.data;

                // Weekly trend - start from Monday
                const dailyTotals = [];
                const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                for (let i = 0; i < 7; i++) {
                    const day = new Date(weekAgo);
                    day.setDate(weekAgo.getDate() + i);
                    const dayStr = day.toISOString().split('T')[0];
                    const totalHours = logs
                        .filter(log => log.workDate.split('T')[0] === dayStr)
                        .reduce((sum, log) => sum + (log.manHours || 0), 0);
                    dailyTotals.push({ date: dayStr, hours: totalHours, dayName: dayNames[i] });
                }

                // Today and weekly totals
                const todayStr = today.toISOString().split('T')[0];
                const todayLogs = logs.filter(log => log.workDate.split('T')[0] === todayStr);
                const todayHours = todayLogs.reduce((sum, log) => sum + (log.manHours || 0), 0);
                const weeklyHours = dailyTotals.reduce((sum, d) => sum + d.hours, 0);

                setWeeklyTrend(dailyTotals);
                setSummary({
                    todayHours,
                    weeklyHours,
                    totalLogsToday: todayLogs.length,
                    totalLogsAll: logs.length
                });
            } catch (err) {
                console.error('Dashboard stats error', err);
            }
        };

        fetchDashboardStats();

        // Fetch employee's assigned projects
        const fetchEmployeeProjects = async () => {
            try {
                const res = await api.get('/projects');
                const projects = Array.isArray(res.data) ? res.data : [];
                const userId = user?.id || user?._id;
                
                if (userId) {
                    const assigned = projects.filter(p => {
                        const empAssigned = p.employeeAssigned;
                        if (!empAssigned) return false;
                        if (typeof empAssigned === 'object') {
                            return empAssigned._id === userId;
                        }
                        return empAssigned === userId;
                    });
                    setAllEmployeeProjects(assigned);
                    setEmployeeProjects(assigned);
                    // Set status breakdown from employee projects
                    setStatusBreakdown(calculateStatusBreakdown(assigned));
                }
            } catch (err) {
                console.error('Failed to load projects', err);
            }
        };
        fetchEmployeeProjects();

        // Refetch when window gains focus
        const handleFocus = () => {
            fetchDashboardStats();
        };
        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, [user]);

    // Charts data
    const chartData = {
        labels: weeklyTrend.map(d => d.dayName),
        datasets: [{
            label: 'Hours',
            data: weeklyTrend.map(d => d.hours),
            backgroundColor: 'rgba(54, 162, 235, 0.6)'
        }]
    };

    const chartOptions = {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true },
            x: {
                ticks: { locale: 'en-US' }
            }
        }
    };

    const statusColors = {
        'Pending': '#FFA500',
        'In Progress': '#36A2EB',
        'Completed': '#4CAF50',
        'On Hold': '#FF6384',
        'Active': '#27ae60',
        'Not Set': '#888888'
    };

    const statusData = {
        labels: Object.keys(statusBreakdown),
        datasets: [{
            data: Object.values(statusBreakdown),
            backgroundColor: Object.keys(statusBreakdown).map(s => statusColors[s] || '#888')
        }]
    };

    // Chart options with click handler for filtering
    const statusOptions = {
        responsive: true,
        plugins: { 
            legend: { position: 'bottom' },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `${context.label}: ${context.raw} projects`;
                    }
                }
            }
        },
        onClick: (event, elements) => {
            if (elements.length > 0) {
                const index = elements[0].index;
                const status = Object.keys(statusBreakdown)[index];
                handleStatusFilter(status);
            }
        }
    };

    // Handle status filter from chart click
    const handleStatusFilter = (status) => {
        if (statusFilter === status) {
            // Toggle off if same status clicked
            setStatusFilter(null);
            setEmployeeProjects(allEmployeeProjects);
        } else {
            setStatusFilter(status);
            const filtered = allEmployeeProjects.filter(p => (p.status || 'Not Set') === status);
            setEmployeeProjects(filtered);
        }
    };

    // Clear status filter
    const clearStatusFilter = () => {
        setStatusFilter(null);
        setEmployeeProjects(allEmployeeProjects);
    };

    // Helper function to convert decimal hours to hours and minutes
    const formatHours = (decimalHours) => {
        const hours = Math.floor(decimalHours);
        const minutes = Math.round((decimalHours - hours) * 60);
        return `${hours}h ${minutes}m`;
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

    // Calculate status breakdown from employee projects
    const calculateStatusBreakdown = (projects) => {
        const counts = projects.reduce((acc, project) => {
            const status = project.status || 'Not Set';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        return counts;
    };

    // Save project updates
    const handleSaveProject = async () => {
        if (!editingProject) return;
        setIsSaving(true);
        try {
            await api.put(`/projects/${editingProject._id}/my-project`, editForm);
            // Update local state
            const updatedProjects = allEmployeeProjects.map(p => 
                p._id === editingProject._id ? { ...p, ...editForm } : p
            );
            setAllEmployeeProjects(updatedProjects);
            
            // Apply current filter if active
            if (statusFilter) {
                const filtered = updatedProjects.filter(p => (p.status || 'Not Set') === statusFilter);
                setEmployeeProjects(filtered);
            } else {
                setEmployeeProjects(updatedProjects);
            }
            
            // Update status breakdown chart
            setStatusBreakdown(calculateStatusBreakdown(updatedProjects));
            closeEditModal();
        } catch (err) {
            console.error('Failed to update project', err);
            alert('Failed to update project');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Helper function to get time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    if (!user) {
        return (
            <div className="auth-wrapper">
                <div className="auth-card-large">
                    <h2>Access Denied</h2>
                    <p>Please login to view your summaries.</p>
                    <Link to="/login" className="btn-primary">Login</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="home-container">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-info">
                    <h1>{getGreeting()}, {user?.name?.split(' ')[0]}</h1>
                    <p className="header-date">{todayDate}</p>
                </div>
                <div className="header-right">
                    <button onClick={handleLogout} className="btn-logout-header">
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </header>

            {/* Stats */}
            <section className="stats-row">
                <div className="stat-tile">
                    <div className="stat-icon blue"><Clock size={24} /></div>
                    <div className="stat-data">
                        <span className="stat-number">{formatHours(summary.todayHours)}</span>
                        <span className="stat-text">Hours Today</span>
                    </div>
                </div>
                <div className="stat-tile">
                    <div className="stat-icon green"><Calendar size={24} /></div>
                    <div className="stat-data">
                        <span className="stat-number">{formatHours(summary.weeklyHours)}</span>
                        <span className="stat-text">Hours this Week</span>
                    </div>
                </div>
                <div className="stat-tile">
                    <div className="stat-icon purple"><FileText size={24} /></div>
                    <div className="stat-data">
                        <span className="stat-number">{user?.role === 'admin' ? 'Admin' : 'Staff'}</span>
                        <span className="stat-text">Access Level</span>
                    </div>
                </div>
            </section>

            {/* Reporting form */}
            <section className="actions-section">
                <div className="actions-row">
                    <Link to="/task-log" className="action-tile">
                        <div className="action-icon-main"><FileText size={28} /></div>
                        <div className="action-info">
                            <h3>Log Project Tasks <SquareArrowOutUpRight size={25} style={{ marginLeft: '70px',  position: 'absolute'}} /></h3>
                            <p>Submit your daily work report</p>
                        </div>
                    </Link>
                </div>
            </section>


            {/* Employee's Projects Table */}
            {employeeProjects.length > 0 && (
                <section className="analytics-card">
                    <div className="table-header">
                        <h2>My Projects {statusFilter && <span className="filter-badge">Filtered by: {statusFilter}</span>}</h2>
                        <span className="project-count">{employeeProjects.length} project{employeeProjects.length !== 1 ? 's' : ''}</span>
                    </div>
                    <table className="spreadsheet-table">
                        <thead>
                            <tr>
                                <th>Project Number</th>
                                <th>Project Name</th>
                                <th>Location</th>
                                <th>Architect</th>
                                <th>Contractor</th>
                                <th>Stage</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employeeProjects.map((project) => (
                                <tr key={project._id}>
                                    <td><strong>{project.projectNumber}</strong></td>
                                    <td>{project.projectName}</td>
                                    <td>{project.location || '-'}</td>
                                    <td>{project.architect || '-'}</td>
                                    <td>{project.contractor || '-'}</td>
                                    <td>{project.stage || '-'}</td>
                                    <td>
                                        <span className={`badge ${project.status?.toLowerCase().replace(/\s+/g, '-') || 'not-set'}`}>
                                            {project.status || 'Not Set'}
                                        </span>
                                    </td>
                                    <td>
                                        <button 
                                            onClick={() => openEditModal(project)}
                                            className="btn-update"
                                        >
                                            <Edit2 size={14} /> Update
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}

            {employeeProjects.length === 0 && allEmployeeProjects.length > 0 && (
                <section className="analytics-card">
                    <div className="no-results">
                        <Filter size={48} />
                        <h3>No projects found</h3>
                        <p>No projects match the current filter.</p>
                        <button onClick={clearStatusFilter} className="btn-primary">
                            <RotateCcw size={16} /> Show All Projects
                        </button>
                    </div>
                </section>
            )}

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


            {/* Charts */}
            <section className="analytics-charts">
                <div className="chart-container">
                    <h2>Weekly Work Hours</h2>
                    <Bar data={chartData} options={chartOptions} />
                </div>
                <div className="chart-container chart-container-small">
                    <div className="chart-header">
                        <h2>Project Status Breakdown</h2>
                        {statusFilter && (
                            <button onClick={clearStatusFilter} className="btn-clear-filter" title="Clear filter">
                                <RotateCcw size={14} /> Show All
                            </button>
                        )}
                    </div>
                    <Doughnut data={statusData} options={statusOptions} />
                    {statusFilter && (
                        <p className="chart-filtered">Showing: <strong>{statusFilter}</strong></p>
                    )}
                </div>
            </section>
        </div>
    );
};

export default EmployeeSummaries;
