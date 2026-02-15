import React, { useContext, useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Clock, Calendar, FileText, LogOut, SquareArrowOutUpRight, FolderOpen } from 'lucide-react';
import { Bar, Pie } from 'react-chartjs-2';
import api from '../services/api';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ArcElement, Tooltip, Legend);

// Quarter options
const getQuarterOptions = () => {
    const quarters = [];
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 2; y <= currentYear; y++) {
        for (let q = 1; q <= 4; q++) {
            const qDate = new Date(y, (q - 1) * 3 + 1, 1);
            if (qDate <= new Date()) {
                quarters.push({ label: `Q${q}-${y}`, year: y, quarter: q });
            }
        }
    }
    return quarters;
};

const QUARTER_OPTIONS = getQuarterOptions();
const CURRENT_QUARTER = `Q${Math.ceil((new Date().getMonth() + 1) / 3)}-${new Date().getFullYear()}`;

// Helper function to format day label with date and month (moved outside component to avoid useEffect dependency)
const formatDayLabel = (date) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = dayNames[date.getDay()];
    const day = date.getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${dayName} ${day} ${month} ${year}`;
};

// Helper function to process chart data based on date range (moved outside component to avoid useEffect dependency)
const processChartData = (logs, startDate, endDate) => {
    const dailyTotals = [];
    let totalHours = 0;
    
    // If no date range specified, show last 7 days
    if (!startDate || !endDate) {
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const day = new Date(today);
            day.setDate(today.getDate() - i);
            const dayStr = day.toISOString().split('T')[0];
            const totalHoursForDay = logs
                .filter(log => log.workDate && log.workDate.split('T')[0] === dayStr)
                .reduce((sum, log) => sum + (log.totalManHours || 0), 0);
            dailyTotals.push({
                date: dayStr,
                hours: totalHoursForDay,
                dayLabel: formatDayLabel(day)
            });
            totalHours += totalHoursForDay;
        }
    } else {
        // Generate all dates in the range
        const start = new Date(startDate);
        const end = new Date(endDate);
        const current = new Date(start);
        
        while (current <= end) {
            const dayStr = current.toISOString().split('T')[0];
            const totalHoursForDay = logs
                .filter(log => log.workDate && log.workDate.split('T')[0] === dayStr)
                .reduce((sum, log) => sum + (log.totalManHours || 0), 0);
            dailyTotals.push({
                date: dayStr,
                hours: totalHoursForDay,
                dayLabel: formatDayLabel(current)
            });
            totalHours += totalHoursForDay;
            current.setDate(current.getDate() + 1);
        }
    }
    
    return { dailyTotals, totalHours };
};

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
    const [stageBreakdown, setStageBreakdown] = useState({});
    const [hoursByStage, setHoursByStage] = useState([]);
    
    // Date filters state (like admin dashboard)
    const [dateFilters, setDateFilters] = useState({
        dateRange: 'month',
        month: new Date().toISOString().slice(0, 7),
        quarter: CURRENT_QUARTER,
        year: new Date().getFullYear().toString()
    });

    // Generate date range based on filters
    const getDateRange = useCallback(() => {
        let startDate = '';
        let endDate = '';
        
        if (dateFilters.dateRange === 'month') {
            const [year, month] = dateFilters.month.split('-');
            startDate = `${year}-${month}-01`;
            endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
        } else if (dateFilters.dateRange === 'quarter') {
            const [q, qYear] = dateFilters.quarter.split('-');
            const qNum = parseInt(q.replace('Q', ''));
            const qStartMonth = (qNum - 1) * 3 + 1;
            startDate = `${qYear}-${qStartMonth.toString().padStart(2, '0')}-01`;
            endDate = new Date(parseInt(qYear), qStartMonth + 2, 0).toISOString().split('T')[0];
        } else if (dateFilters.dateRange === 'year') {
            startDate = `${dateFilters.year}-01-01`;
            endDate = `${dateFilters.year}-12-31`;
        }
        
        return { startDate, endDate };
    }, [dateFilters]);


    // Fetch hours by stage data based on date filters (from task logs)
    useEffect(() => {
        const fetchHoursByStage = async () => {
            try {
                const { startDate, endDate } = getDateRange();
                
                // Fetch task logs for the logged-in employee with date filters
                const userId = user?.id || user?._id;
                if (!userId) return;
                
                // Build date query
                let queryParams = '';
                if (startDate) queryParams += `?startDate=${startDate}`;
                if (endDate) {
                    queryParams += queryParams ? '&' : '?';
                    queryParams += `endDate=${endDate}`;
                }
                
                // Fetch chart data (hours trend) using date filters
                const chartRes = await api.get(`/tasks/my-logs${queryParams}`);
                const chartLogs = chartRes.data || [];
                
                // Process chart data for the trend
                const { dailyTotals, totalHours } = processChartData(chartLogs, startDate, endDate);
                
                // Calculate today's hours
                const todayStr = new Date().toISOString().split('T')[0];
                const todayLogs = chartLogs.filter(log => log.workDate && log.workDate.split('T')[0] === todayStr);
                const todayHours = todayLogs.reduce((sum, log) => sum + (log.totalManHours || 0), 0);
                
                setWeeklyTrend(dailyTotals);
                setSummary(prev => ({
                    ...prev,
                    todayHours,
                    weeklyHours: totalHours,
                    totalLogsToday: todayLogs.length,
                    totalLogsAll: chartLogs.length
                }));
                
                // Fetch hours by project for table
                const res = await api.get(`/tasks/my-hours-by-project${queryParams}`);
                const data = res.data || [];
                
                // Calculate hours breakdown by stage from task logs
                const hoursByStageMap = {};
                
                data.forEach(item => {
                    const stages = item.stages || [];
                    // Get unique stages for this project
                    const uniqueStages = [...new Set(stages)];
                    
                    uniqueStages.forEach(stage => {
                        if (!hoursByStageMap[stage]) {
                            hoursByStageMap[stage] = {
                                totalTravelHours: 0,
                                totalProjectHours: 0,
                                totalManHours: 0
                            };
                        }
                        // Calculate hours for this stage (approximate based on total)
                        const stageHours = item.totalManHours / uniqueStages.length;
                        hoursByStageMap[stage].totalProjectHours += stageHours;
                        hoursByStageMap[stage].totalTravelHours += item.totalTravelHours / uniqueStages.length;
                        hoursByStageMap[stage].totalManHours += stageHours;
                    });
                });
                
                // Set stage breakdown for pie chart (hours by stage)
                setStageBreakdown(hoursByStageMap);
                
                // Set hours by project for table
                setHoursByStage(data);
            } catch (err) {
                console.error('Failed to load hours by stage', err);
            }
        };
        fetchHoursByStage();
    }, [dateFilters, getDateRange, user]);

    // Charts data
    const chartData = {
        labels: weeklyTrend.map(d => d.dayLabel),
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

    const stageColors = {
        'Pre-design': '#f59e0b',
        'Design': '#ef4444',
        'Tendering': '#3b82f6',
        'Construction & Supervision': '#8b5cf6',
        'Snagging, Testing & Commissioning': '#ec4899',
        'Handover': '#06b6d4',
        'Other(specify)': '#10b981',
        'Not Set': '#888888'
    };

    const stageData = {
        labels: Object.keys(stageBreakdown),
        datasets: [{
            data: Object.keys(stageBreakdown).map(stage => stageBreakdown[stage].totalManHours || 0),
            backgroundColor: Object.keys(stageBreakdown).map(s => stageColors[s] || '#888')
        }]
    };

    const stageOptions = {
        responsive: true,
        plugins: { 
            legend: { position: 'bottom' },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const stage = context.label;
                        const hours = stageBreakdown[stage]?.totalManHours || 0;
                        const projectHours = stageBreakdown[stage]?.totalProjectHours || 0;
                        return `${stage}: ${hours.toFixed(1)} total hours (${projectHours.toFixed(1)} project hours)`;
                    }
                }
            }
        }
    };

    // Handle date filter change
    const handleDateFilterChange = (field, value) => {
        setDateFilters(prev => ({ ...prev, [field]: value }));
    };

    // Helper function to convert decimal hours to hours and minutes
    const formatHours = (decimalHours) => {
        const hours = Math.floor(decimalHours);
        const minutes = Math.round((decimalHours - hours) * 60);
        return `${hours}h ${minutes}m`;
    };

    // Helper function to format hours as decimal
    const formatDecimalHours = (hours) => {
        return hours ? hours.toFixed(1) : '0.0';
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
                    {user?.role !== 'admin' && (
                        <button onClick={handleLogout} className="btn-logout-header">
                            <LogOut size={18} /> Logout
                        </button>
                    )}
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
                <div className="actions-row" style={{ display: 'flex', gap: '16px', flexDirection: 'row', flexWrap: 'nowrap', maxWidth: '100%' }}>
                    <Link to="/task-log" className="action-tile" style={{ flex: '1 1 auto', minWidth: '250px' }}>
                        <div className="action-icon-main"><FileText size={28} /></div>
                        <div className="action-info">
                            <h3>Log Project Tasks <SquareArrowOutUpRight size={25} style={{ marginLeft: '48px',  position: 'absolute'}} /></h3>
                            <p>Submit your daily work report</p>
                        </div>
                    </Link>
                    <Link to="/my-projects" className="action-tile" style={{ flex: '1 1 auto', minWidth: '250px' }}>
                        <div className="action-icon-main"><FolderOpen size={28} /></div>
                        <div className="action-info">
                            <h3>My Projects <SquareArrowOutUpRight size={25} style={{ marginLeft: '100px',  position: 'absolute'}} /></h3>
                            <p>View and manage your assigned projects</p>
                        </div>
                    </Link>
                </div>
            </section>

            {/* Date Filters Section */}
            <section className="filters-section">
                <div className="filters-row">
                    <h3>Date Filter</h3>
                    <select
                        value={dateFilters.dateRange}
                        onChange={e => handleDateFilterChange('dateRange', e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All time</option>
                        <option value="month">Month</option>
                        <option value="quarter">Quarter</option>
                        <option value="year">Year</option>
                    </select>

                    {dateFilters.dateRange === 'month' && (
                        <input
                            type="month"
                            value={dateFilters.month}
                            onChange={e => handleDateFilterChange('month', e.target.value)}
                            className="filter-input"
                        />
                    )}
                    
                    {dateFilters.dateRange === 'quarter' && (
                        <select
                            value={dateFilters.quarter}
                            onChange={e => handleDateFilterChange('quarter', e.target.value)}
                            className="filter-select"
                        >
                            {QUARTER_OPTIONS.map(opt => (
                                <option key={opt.label} value={opt.label}>{opt.label}</option>
                            ))}
                        </select>
                    )}
                    
                    {dateFilters.dateRange === 'year' && (
                        <select
                            value={dateFilters.year}
                            onChange={e => handleDateFilterChange('year', e.target.value)}
                            className="filter-select"
                        >
                            {[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2].map(year => (
                                <option key={year} value={year.toString()}>{year}</option>
                            ))}
                        </select>
                    )}
                </div>
            </section>

            {/* Charts */}
            <section className="analytics-charts">
                <div className="chart-container">
                    <h2>Weekly Work Hours</h2>
                    <Bar data={chartData} options={chartOptions} />
                </div>
                <div className="chart-container chart-container-small">
                    <h2>Project Stage Breakdown</h2>
                    {Object.keys(stageBreakdown).length > 0 ? (
                        <Pie data={stageData} options={stageOptions} />
                    ) : (
                        <p className="no-data-message">No stage data available for selected period</p>
                    )}
                </div>
            </section>

            {/* Hours by Project Table */}
            <section className="analytics-card">
                <h3>Hours by Project</h3>
                <div className="table-responsive">
                    <table className="spreadsheet-table">
                        <thead>
                            <tr>
                                <th>Project #</th>
                                <th>Project Name</th>
                                <th>Travel Hours</th>
                                <th>Project Hours</th>
                                <th>Total Man Hours</th>
                            </tr>
                        </thead>
                        <tbody>
                            {hoursByStage && hoursByStage.length > 0 ? (
                                hoursByStage.map((item, index) => (
                                    <tr key={index}>
                                        <td><Link to={`/project-details/${item.projectId}`} className="project-link">{item.projectNumber}</Link></td>
                                        <td><Link to={`/project-details/${item.projectId}`} className="project-link">{item.projectName}</Link></td>
                                        <td>{formatDecimalHours(item.totalTravelHours)}</td>
                                        <td>{formatDecimalHours(item.totalProjectHours)}</td>
                                        <td><strong>{formatDecimalHours(item.totalManHours)}</strong></td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="no-results">No data available for selected filters</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default EmployeeSummaries;
