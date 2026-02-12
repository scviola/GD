import React, { useEffect, useState, useContext, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#6366f1', '#14b8a6'];

// Generate quarter options dynamically
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

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [employees, setEmployees] = useState([]);
  const [analytics, setAnalytics] = useState({
    hoursByStage: [],
    hoursByProjectType: [],
    employeeTaskProgress: [],
    employeeProjectProgress: [],
    mileageByEmployee: []
  });
  const [projectStageData, setProjectStageData] = useState([]);
  const [projectTypeData, setProjectTypeData] = useState([]);
  const [projectStats, setProjectStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    stalledProjects: 0
  });
  

  const [filters, setFilters] = useState({
    engineerId: '',
    dateRange: 'month',
    month: new Date().toISOString().slice(0, 7),
    quarter: CURRENT_QUARTER,
    year: new Date().getFullYear().toString()
  });

  // Generate date range options
  const getDateRange = useCallback(() => {
    let startDate = '';
    let endDate = '';
    
    if (filters.dateRange === 'month') {
      const [year, month] = filters.month.split('-');
      startDate = `${year}-${month}-01`;
      endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
    } else if (filters.dateRange === 'quarter') {
      const [q, qYear] = filters.quarter.split('-');
      const qNum = parseInt(q.replace('Q', ''));
      const qStartMonth = (qNum - 1) * 3 + 1;
      startDate = `${qYear}-${qStartMonth.toString().padStart(2, '0')}-01`;
      endDate = new Date(parseInt(qYear), qStartMonth + 2, 0).toISOString().split('T')[0];
    } else if (filters.dateRange === 'year') {
      startDate = `${filters.year}-01-01`;
      endDate = `${filters.year}-12-31`;
    }
    // For 'all' dateRange, leave startDate and endDate empty
    
    return { startDate, endDate };
  }, [filters]);

  // Fetch employees for dropdown
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await api.get('/users');
        setEmployees(res.data || []);
      } catch (err) {
        console.error('Failed to load employees', err);
      }
    };
    fetchEmployees();
  }, []);

  // Fetch project stage distribution for pie chart
  useEffect(() => {
    const fetchProjectStageDist = async () => {
      try {
        const { startDate, endDate } = getDateRange();
        const params = new URLSearchParams();
        
        if (filters.engineerId) {
          params.append('engineerId', filters.engineerId);
        }
        if (startDate) {
          params.append('startDate', startDate);
          params.append('endDate', endDate);
        }

        const res = await api.get(`/admin/project-stage-dist?${params.toString()}`);
        setProjectStageData(res.data.data || []);
      } catch (err) {
        console.error('Failed to load project stage distribution', err);
      }
    };
    fetchProjectStageDist();
  }, [filters, getDateRange]);

  // Fetch project type distribution for pie chart
  useEffect(() => {
    const fetchProjectTypeDist = async () => {
      try {
        const res = await api.get('/projects');
        const projects = res.data || [];
        
        // Group by projectType
        const typeCounts = projects.reduce((acc, project) => {
          const type = project.projectType || 'Not Set';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});
        
        const total = projects.length;
        const typeData = Object.entries(typeCounts).map(([type, count]) => ({
          type,
          count,
          percentage: total > 0 ? ((count / total) * 100).toFixed(1) : 0
        }));
        
        setProjectTypeData(typeData);
      } catch (err) {
        console.error('Failed to load project type distribution', err);
      }
    };
    fetchProjectTypeDist();
  }, []);

  // Fetch project statistics
  useEffect(() => {
    const fetchProjectStats = async () => {
      try {
        const res = await api.get('/admin/project-stats');
        setProjectStats(res.data);
      } catch (err) {
        console.error('Failed to load project stats', err);
      }
    };
    fetchProjectStats();
  }, []);

  // Fetch analytics data
  useEffect(() => {
    let isMounted = true;
    
    const fetchAnalytics = async () => {
      try {
        const { startDate, endDate } = getDateRange();
        const params = new URLSearchParams();
        
        if (filters.engineerId) {
          params.append('engineerId', filters.engineerId);
        }
        if (startDate) {
          params.append('startDate', startDate);
          params.append('endDate', endDate);
        }

        const res = await api.get(`/admin/analytics?${params.toString()}`);
        if (isMounted) {
          setAnalytics(res.data || {});
        }
      } catch (err) {
        console.error('Failed to load analytics', err);
      }
    };
    
    fetchAnalytics();
    
    // Auto-refresh every 30 seconds
    const intervalId = setInterval(fetchAnalytics, 30000);
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [filters, getDateRange]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatHours = (hours) => {
    return hours ? hours.toFixed(1) : '0.0';
  };

  const formatPercentage = (value) => {
    return value ? `${parseFloat(value).toFixed(1)}%` : '0.0%';
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Prepare pie chart data
  const pieData = projectStageData.map((item, index) => ({
    name: item.stage,
    value: item.count,
    percentage: item.percentage,
    color: COLORS[index % COLORS.length]
  }));

  // Prepare project type pie chart data
  const pieDataType = projectTypeData.map((item, index) => ({
    name: item.type,
    value: item.count,
    percentage: item.percentage,
    color: COLORS[index % COLORS.length]
  }));

  // Calculate aggregated hours from totalHours aggregation
  const getAggregatedHours = () => {
    const totalHours = analytics.totalHours?.[0] || {};
    const totalProjectHours = totalHours.totalProjectHours || 0;
    const totalTravelHours = totalHours.totalTravelHours || 0;
    const totalManHours = totalHours.totalManHours || 0;
    
    return {
      travelHours: totalTravelHours,
      projectHours: totalProjectHours,
      totalManHours: totalManHours,
      percentTravelHours: totalManHours > 0 ? ((totalTravelHours / totalManHours) * 100) : 0,
      percentProjectHours: totalManHours > 0 ? ((totalProjectHours / totalManHours) * 100) : 0
    };
  };

  const hoursData = getAggregatedHours();

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
        </div>
        <div className="header-right">
          <span className="user-greeting">{getGreeting()}, {user?.name?.split(' ')[0]}</span>
          <button onClick={handleLogout} className="btn-logout-header">Logout</button>
        </div>
      </header>

      <h2>Admin Dashboard</h2>

      {/* Quick Action Links */}
      <div className="quick-links">
        <Link to="/task-log" className="quick-link-btn">
          Access Task Form
        </Link>
      </div>

      {/* Project KPI Cards */}
      <div className="project-kpi-grid">
        <Link to="/project-manager?status=all" className="kpi-card kpi-clickable">
          <h4>Listed Projects</h4>
          <span className="kpi-value primary">{projectStats.totalProjects}</span>
        </Link>
        <Link to="/project-manager?status=Active" className="kpi-card kpi-clickable">
          <h4>Active Projects</h4>
          <span className="kpi-value green">{projectStats.activeProjects}</span>
        </Link>
        <Link to="/project-manager?status=Completed" className="kpi-card kpi-clickable">
          <h4>Completed Projects</h4>
          <span className="kpi-value purple">{projectStats.completedProjects}</span>
        </Link>
        <Link to="/project-manager?status=Stalled" className="kpi-card kpi-clickable">
          <h4>Stalled Projects</h4>
          <span className="kpi-value red">{projectStats.stalledProjects}</span>
        </Link>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-row">
          {/* Engineer/User Filter */}
          <select
            value={filters.engineerId}
            onChange={e => handleFilterChange('engineerId', e.target.value)}
            className="filter-select"
          >
            <option value="">All Engineers</option>
            {employees.map(emp => (
              <option key={emp._id} value={emp._id}>
                {emp.name}
              </option>
            ))}
          </select>

           {/* Engineer/User Filter */}
          <select
            value={filters.dateRange}
            onChange={e => handleFilterChange('dateRange', e.target.value)}
            className="filter-select"
          >
            <option value="all">All time</option>
            <option value="month">Month</option>
            <option value="quarter">Quarter</option>
            <option value="year">Year</option>
          </select>

          {/* Dynamic Date Input */}
          {filters.dateRange === 'month' && (
            <input
              type="month"
              value={filters.month}
              onChange={e => handleFilterChange('month', e.target.value)}
              className="filter-input"
            />
          )}
          
          {filters.dateRange === 'quarter' && (
            <select
              value={filters.quarter}
              onChange={e => handleFilterChange('quarter', e.target.value)}
              className="filter-select"
            >
              {QUARTER_OPTIONS.map(opt => (
                <option key={opt.label} value={opt.label}>{opt.label}</option>
              ))}
            </select>
          )}
          
          {filters.dateRange === 'year' && (
            <select
              value={filters.year}
              onChange={e => handleFilterChange('year', e.target.value)}
              className="filter-select"
            >
              {[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2].map(year => (
                <option key={year} value={year.toString()}>{year}</option>
              ))}
            </select>
          )}
        </div>
      </div>
      
      {/* Employee Hours Summary Cards */}
      <div className="stats-grid" key={`hours-${filters.engineerId}-${filters.dateRange}`}>
        <div className="stat-card">
          <h4>Travel Hours</h4>
          <span className="stat-value blue">{formatHours(hoursData.travelHours)}</span>
        </div>
        <div className="stat-card">
          <h4>Project Hours</h4>
          <span className="stat-value green">{formatHours(hoursData.projectHours)}</span>
        </div>
        <div className="stat-card">
          <h4>Total Man Hours</h4>
          <span className="stat-value purple">{formatHours(hoursData.totalManHours)}</span>
        </div>
        <div className="stat-card">
          <h4>% Travel Hours</h4>
          <span className="stat-value amber">{formatPercentage(hoursData.percentTravelHours)}</span>
        </div>
        <div className="stat-card">
          <h4>% Project Hours</h4>
          <span className="stat-value red">{formatPercentage(hoursData.percentProjectHours)}</span>
        </div>
      </div>

      {/* Pie Charts Row - Project Stage & Project Type Distribution */}
      <div className="charts-row">
        {/* Pie Chart - Project Stage Distribution */}
        <div className="pie-chart-wrapper">
          <h3>Project Stage Distribution (%)</h3>
          <div className="pie-chart-container">
            {projectStageData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name, props) => [`${value} projects (${props.payload.percentage}%)`, name]} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Custom Legend */}
                <div className="pie-chart-legend">
                  {pieData.map((item, index) => (
                    <div key={index} className="legend-item">
                      <span className="legend-color" style={{ backgroundColor: item.color }}></span>
                      <span className="legend-label">{item.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="no-data-message">No project data available</p>
            )}
          </div>
        </div>

        {/* Pie Chart - Project Type Distribution */}
        <div className="pie-chart-wrapper">
          <h3>Project Type Distribution (%)</h3>
          <div className="pie-chart-container">
            {projectTypeData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieDataType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieDataType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name, props) => [`${value} projects (${props.payload.percentage}%)`, name]} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Custom Legend */}
                <div className="pie-chart-legend">
                  {pieDataType.map((item, index) => (
                    <div key={index} className="legend-item">
                      <span className="legend-color" style={{ backgroundColor: item.color }}></span>
                      <span className="legend-label">{item.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="no-data-message">No project type data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Table 1: Hours by Project Stage */}
      <div className="table-section">
        <h3>Hours by Project Stage</h3>
        <div className="table-responsive">
          <table className="spreadsheet-table">
            <thead>
              <tr>
                <th>Project Stage</th>
                <th>Travel Hours</th>
                <th>Project Hours</th>
                <th>Total Man Hours</th>
              </tr>
            </thead>
            <tbody>
              {analytics.hoursByStage && analytics.hoursByStage.length > 0 ? (
                analytics.hoursByStage.map((item, index) => (
                  <tr key={index}>
                    <td>{item._id || 'Not Set'}</td>
                    <td>{formatHours(item.totalTravelHours)}</td>
                    <td>{formatHours(item.totalProjectHours)}</td>
                    <td><strong>{formatHours(item.totalManHours)}</strong></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-results">No data available for selected filters</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 2: Hours by Project Type */}
      <div className="table-section">
        <h3>Hours by Project Type</h3>
        <div className="table-responsive">
          <table className="spreadsheet-table">
            <thead>
              <tr>
                <th>Project Type</th>
                <th>Travel Hours</th>
                <th>Project Hours</th>
                <th>Total Man Hours</th>
              </tr>
            </thead>
            <tbody>
              {analytics.hoursByProjectType && analytics.hoursByProjectType.length > 0 ? (
                analytics.hoursByProjectType.map((item, index) => (
                  <tr key={index}>
                    <td>{item._id || 'Unknown'}</td>
                    <td>{formatHours(item.totalTravelHours)}</td>
                    <td>{formatHours(item.totalProjectHours)}</td>
                    <td><strong>{formatHours(item.totalManHours)}</strong></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-results">No data available for selected filters</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 3: Employee Project Progress */}
      <div className="table-section">
        <h3>Staff Project Progress</h3>
        <div className="table-responsive">
          <table className="spreadsheet-table">
            <thead>
              <tr>
                <th>Engineer</th>
                <th>Project Number</th>
                <th>Project Name</th>
                <th>Project Type</th>
                <th>Stage</th>
                <th>Status</th>
                <th>Total Man Hours</th>
                <th>Total Mileage (km)</th>
              </tr>
            </thead>
            <tbody>
              {analytics.employeeProjectProgress && analytics.employeeProjectProgress.length > 0 ? (
                analytics.employeeProjectProgress.map((item, index) => (
                  <tr key={index}>
                    <td>{item.engineer}</td>
                    <td>{item.projectNumber}</td>
                    <td>{item.projectName}</td>
                    <td>{item.projectType}</td>
                    <td>{item.stage}</td>
                    <td>{item.status}</td>
                    <td>{formatHours(item.totalManHours)}</td>
                    <td>{item.totalMileage ? `${Number(item.totalMileage).toFixed(1)} km` : '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="no-results">No project progress data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
