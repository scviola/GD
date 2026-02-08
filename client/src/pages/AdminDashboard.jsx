import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import {
  fetchProjects,
  fetchEmployees
} from '../services/adminApi';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const STAGE_OPTIONS = [
  'Tendering',
  'Procurement',
  'Pre-Design',
  'Design',
  'Construction & Monitoring',
  'Commissioning',
  'Handover'
];

const STATUS_OPTIONS = [
  'Active',
  'Pending',
  'In Progress',
  'Completed',
  'On Hold'
];

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [masterSchedule, setMasterSchedule] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({
    projectId: '',
    engineerId: '',
    stage: '',
    task: '',
    status: searchParams.get('status') || '',
    startDate: '',
    endDate: ''
  });

  // Hourly rate for cost calculation
  const HOURLY_RATE = 150;

  // Load meta data
  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [proj, emp] = await Promise.all([
          fetchProjects(),
          fetchEmployees()
        ]);
        setProjects(proj);
        setEmployees(emp);
      } catch (err) {
        console.error('Failed to load meta data', err);
      }
    };
    loadMeta();
  }, []);

  // Load master schedule and analytics when filters change
  useEffect(() => {
    const loadData = async () => {
      try {
        // Build params for master schedule
        const scheduleParams = new URLSearchParams();
        if (filters.projectId) scheduleParams.append('projectId', filters.projectId);
        if (filters.engineerId) scheduleParams.append('engineerId', filters.engineerId);
        if (filters.stage) scheduleParams.append('taskStage', filters.stage);
        if (filters.task) scheduleParams.append('taskType', filters.task);
        if (filters.status) scheduleParams.append('status', filters.status);
        if (filters.startDate) scheduleParams.append('startDate', filters.startDate);
        if (filters.endDate) scheduleParams.append('endDate', filters.endDate);

        const scheduleRes = await api.get(`/admin/master-schedule?${scheduleParams.toString()}`);
        setMasterSchedule(scheduleRes.data);

        // Analytics
        const analyticsParams = new URLSearchParams();
        if (filters.engineerId) analyticsParams.append('engineerId', filters.engineerId);
        if (filters.projectId) analyticsParams.append('projectId', filters.projectId);
        if (filters.status) analyticsParams.append('status', filters.status);
        if (filters.startDate) analyticsParams.append('startDate', filters.startDate);
        if (filters.endDate) analyticsParams.append('endDate', filters.endDate);

        const analyticsRes = await api.get(`/admin/analytics?${analyticsParams.toString()}`);
        setAnalytics(analyticsRes.data);
      } catch (err) {
        console.error('Failed to load data', err);
      }
    };
    loadData();
  }, [filters]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      projectId: '',
      engineerId: '',
      stage: '',
      task: '',
      status: '',
      startDate: '',
      endDate: ''
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get filtered projects based on current filters
  const getFilteredProjects = () => {
    return projects.filter(p => {
      if (filters.stage && p.stage !== filters.stage) return false;
      if (filters.status && p.status !== filters.status) return false;
      
      // Date filtering
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        startDate.setHours(0, 0, 0, 0);
        if (p.createdAt) {
          const createdDate = new Date(p.createdAt);
          if (createdDate < startDate) return false;
        }
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (p.createdAt) {
          const createdDate = new Date(p.createdAt);
          if (createdDate > endDate) return false;
        }
      }
      
      return true;
    });
  };

  // Calculate filtered summaries
  const getProjectSummaries = () => {
    // Apply project-level filters to the summary calculations
    const filteredProjects = getFilteredProjects();

    const totalProjects = filteredProjects.length;
    const completedProjects = filteredProjects.filter(p => p.status === 'Completed').length;
    const activeProjects = filteredProjects.filter(p => p.status === 'Active' || p.status === 'In Progress').length;
    
    // Pending tasks: tasks from masterSchedule that are not completed
    const pendingTasks = masterSchedule.filter(t => t.status !== 'Completed').length;

    // Projects by stage (from filtered projects)
    const projectsByStage = filteredProjects.reduce((acc, p) => {
      const stage = p.stage || 'Not Set';
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {});

    // Projects by status (from filtered projects)
    const projectsByStatus = filteredProjects.reduce((acc, p) => {
      const status = p.status || 'Not Set';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return {
      totalProjects,
      completedProjects,
      activeProjects,
      pendingTasks,
      totalEmployees: employees.length,
      projectsByStage,
      projectsByStatus
    };
  };

  const summaries = getProjectSummaries();

  // Projects created over time (line chart)
  const getProjectsOverTime = () => {
    const filteredProjects = getFilteredProjects();
    const monthlyData = {};
    filteredProjects.forEach(project => {
      if (project.createdAt) {
        const date = new Date(project.createdAt);
        const monthIndex = date.getMonth();
        monthlyData[monthIndex] = (monthlyData[monthIndex] || 0) + 1;
      }
    });
    
    // Generate all 12 months (Jan - Dec)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return monthNames.map((monthName, index) => ({
      month: monthName,
      projects: monthlyData[index] || 0
    }));
  };

  // Tasks completion trend (stacked bar: pending vs completed per week)
  const getTasksCompletionTrend = () => {
    const weeklyData = {};
    masterSchedule.forEach(task => {
      // Get the week start date (Sunday)
      const workDate = new Date(task.workDate);
      const weekStart = new Date(workDate);
      weekStart.setDate(workDate.getDate() - workDate.getDay());
      const weekLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      if (!weeklyData[weekLabel]) {
        weeklyData[weekLabel] = { week: weekLabel, pending: 0, completed: 0 };
      }
      if (task.status === 'Completed') {
        weeklyData[weekLabel].completed += 1;
      } else {
        weeklyData[weekLabel].pending += 1;
      }
    });
    
    // Sort by week
    return Object.values(weeklyData).sort((a, b) => {
      const dateA = new Date(a.week);
      const dateB = new Date(b.week);
      return dateA - dateB;
    });
  };

  // Employee workload distribution
  const getEmployeeWorkload = () => {
    const workloadData = {};
    masterSchedule.forEach(task => {
      const employeeName = task.employeeName || 'Unassigned';
      if (!workloadData[employeeName]) {
        workloadData[employeeName] = { name: employeeName, tasks: 0, projects: 0, hours: 0 };
      }
      workloadData[employeeName].tasks += 1;
      workloadData[employeeName].hours += task.totalManHours || 0;
      
      // Track unique projects per employee
      if (task.projectId && !workloadData[employeeName].projectIds) {
        workloadData[employeeName].projectIds = new Set();
      }
      if (task.projectId) {
        workloadData[employeeName].projectIds.add(task.projectId);
      }
    });
    
    return Object.values(workloadData).map(item => ({
      name: item.name,
      tasks: item.tasks,
      projects: item.projectIds ? item.projectIds.size : 0,
      hours: item.hours
    }));
  };

  const projectsOverTime = getProjectsOverTime();
  const tasksCompletionTrend = getTasksCompletionTrend();
  const employeeWorkload = getEmployeeWorkload();

  // Transport trend over time (Road vs Flight)
  const getTransportTrendOverTime = () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Apply date filtering to master schedule tasks
    let filteredTasks = masterSchedule;
    
    // Filter by date range if selected
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      filteredTasks = filteredTasks.filter(task => {
        if (!task.workDate) return false;
        const taskDate = new Date(task.workDate);
        return taskDate >= startDate;
      });
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      filteredTasks = filteredTasks.filter(task => {
        if (!task.workDate) return false;
        const taskDate = new Date(task.workDate);
        return taskDate <= endDate;
      });
    }
    
    // If backend provides pre-aggregated data, use it
    if (analytics.transportTrendByMonth && analytics.transportTrendByMonth.length > 0) {
      // Create a map of existing data by month index
      const transportMap = {};
      analytics.transportTrendByMonth.forEach(item => {
        // Try to extract month index from month name
        const monthIndex = monthNames.findIndex(m => item.month && item.month.startsWith(m));
        if (monthIndex >= 0) {
          transportMap[monthIndex] = { Road: item.Road || 0, Flight: item.Flight || 0 };
        }
      });
      
      // Generate all 12 months
      return monthNames.map((monthName, index) => ({
        month: monthName,
        Road: transportMap[index]?.Road || 0,
        Flight: transportMap[index]?.Flight || 0
      }));
    }
    
    // Calculate transport trend from filtered tasks
    const transportData = {};
    filteredTasks.forEach(task => {
      if (task.transport && task.workDate) {
        const date = new Date(task.workDate);
        const monthIndex = date.getMonth();
        const transportType = task.transport;
        
        if (!transportData[monthIndex]) {
          transportData[monthIndex] = { Road: 0, Flight: 0 };
        }
        
        if (transportType === 'Road' || transportType === 'road') {
          transportData[monthIndex].Road += 1;
        } else if (transportType === 'Flight' || transportType === 'flight') {
          transportData[monthIndex].Flight += 1;
        }
      }
    });
    
    // Generate all 12 months
    return monthNames.map((monthName, index) => ({
      month: monthName,
      Road: transportData[index]?.Road || 0,
      Flight: transportData[index]?.Flight || 0
    }));
  };

  // Employee workload table data
  const getEmployeeWorkloadTable = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Group tasks by employee
    const employeeData = {};

    masterSchedule.forEach(task => {
      const employeeName = task.engineerName || task.employeeName || 'Unassigned';
      if (!employeeData[employeeName]) {
        employeeData[employeeName] = {
          name: employeeName,
          activeProjects: new Set(),
          openTasks: 0,
          overdueTasks: 0
        };
      }

      // Track active projects
      if (task.projectNumber) {
        employeeData[employeeName].activeProjects.add(task.projectNumber);
      }

      // Count open tasks (not completed)
      if (task.status !== 'Completed') {
        employeeData[employeeName].openTasks += 1;

        // Check if task is overdue (past end date or not completed)
        if (task.workDate) {
          const taskDate = new Date(task.workDate);
          if (taskDate < today) {
            employeeData[employeeName].overdueTasks += 1;
          }
        }
      }
    });

    return Object.values(employeeData).map(item => {
      const totalTasks = item.openTasks;
      let workloadIndicator = '🟢 Low';
      if (totalTasks >= 6 && totalTasks <= 10) {
        workloadIndicator = '🟡 Medium';
      } else if (totalTasks > 10) {
        workloadIndicator = '🔴 High';
      }

      return {
        ...item,
        activeProjects: item.activeProjects.size,
        openTasks: item.openTasks,
        overdueTasks: item.overdueTasks,
        workloadIndicator
      };
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  // Helper function to get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

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

      {/* KPI Summary Cards */}
      <div className="stats-row">
        <Link to="/project-manager" className="stat-tile link-tile">
          <div className="stat-icon blue">📊</div>
          <div className="stat-data">
            <span className="stat-number">{summaries.totalProjects}</span>
            <span className="stat-text">Total Projects</span>
          </div>
        </Link>
        <Link to="/project-manager?status=Active" className="stat-tile link-tile">
          <div className="stat-icon orange">🔄</div>
          <div className="stat-data">
            <span className="stat-number">{summaries.activeProjects}</span>
            <span className="stat-text">Active Projects</span>
          </div>
        </Link>
        <Link to="/project-manager?status=Completed" className="stat-tile link-tile">
          <div className="stat-icon green">✅</div>
          <div className="stat-data">
            <span className="stat-number">{summaries.completedProjects}</span>
            <span className="stat-text">Completed</span>
          </div>
        </Link>
      </div>

      {/* Filters */}
      <div className="filters">
        <select
          value={filters.projectId}
          onChange={e => handleFilterChange('projectId', e.target.value)}
        >
          <option value="">All Projects</option>
          {projects.map(p => (
            <option key={p._id} value={p._id}>
              {p.projectNumber} — {p.projectName}
            </option>
          ))}
        </select>

        <select
          value={filters.engineerId}
          onChange={e => handleFilterChange('engineerId', e.target.value)}
        >
          <option value="">All Staff</option>
          {employees.map(emp => (
            <option key={emp._id} value={emp._id}>
              {emp.name}
            </option>
          ))}
        </select>

        <select
          value={filters.stage}
          onChange={e => handleFilterChange('stage', e.target.value)}
        >
          <option value="">All Stages</option>
          {STAGE_OPTIONS.map(stage => (
            <option key={stage} value={stage}>{stage}</option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={e => handleFilterChange('status', e.target.value)}
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>

        <input
          type="date"
          value={filters.startDate}
          onChange={e => handleFilterChange('startDate', e.target.value)}
          placeholder="Start Date"
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={e => handleFilterChange('endDate', e.target.value)}
          placeholder="End Date"
        />

        {hasActiveFilters && (
          <button className="btn-clear" onClick={clearFilters}>
            Clear Filters
          </button>
        )}
      </div>

      {/* Analytics Section */}
      <div className="analytics-grid">
        {/* Projects Created Over Time */}
        <div className="chart-card">
          <h4>Projects Recorded Over Time</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={projectsOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" label={{ value: '2026', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Projects', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Line type="monotone" dataKey="projects" stroke="#3b82f6" strokeWidth={2} name="Projects" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Projects by Stage */}
        <div className="chart-card">
          <h4>Projects by Stage</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={Object.entries(summaries.projectsByStage).map(([name, value]) => ({ name, value }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name"                 
                tick={{ angle: -8, textAnchor: 'end', fontSize: 12 }}
                interval={0}
                axisLine={{ offset: 20 }}
              />
              <YAxis label={{ value: 'Projects', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" name="Projects" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Project Status Distribution */}
        <div className="chart-card">
          <h4>Project Status Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={Object.entries(summaries.projectsByStatus).map(([name, value]) => ({ name, value }))}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={40}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {Object.entries(summaries.projectsByStatus).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tasks Completion Trend (Stacked Bar) */}
        {tasksCompletionTrend.length > 0 && (
          <div className="chart-card">
            <h4>Tasks Completion Trend (Weekly)</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tasksCompletionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" label={{ value: 'Week Starting', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Tasks', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconSpacing={15} />
                <Bar dataKey="completed" stackId="a" fill="#10b981" name="Completed" />
                <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Employee Workload Distribution */}
        {employeeWorkload.length > 0 && (
          <div className="chart-card">
            <h4>Workload Distribution</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={employeeWorkload} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" label={{ value: 'Count/Hours', position: 'insideBottom', offset: -5 }} />
                <YAxis type="category" dataKey="name" width={100} label={{ value: 'Employee', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="tasks" fill="#3b82f6" name="Assigned Tasks" />
                <Bar dataKey="projects" fill="#f59e0b" name="Assigned Projects" />
                <Bar dataKey="hours" fill="#10b981" name="Total Hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Transport Usage Over Time */}
        <div className="chart-card">
          <h4>Transport Usage Over Time</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getTransportTrendOverTime()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" label={{ value: '2026', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Trips', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconSpacing={15} />
                <Line type="monotone" dataKey="Road" stroke="#3b82f6" strokeWidth={2} name="Road" />            
                <Line type="monotone" dataKey="Flight" stroke="#f59e0b" strokeWidth={2} name="Flight" />         
            </LineChart>        
          </ResponsiveContainer>
        </div>
      </div>

      {/* Employee Workload Table */}
      <div className="analytics-card">
        <h3>Workload Overview</h3>
        <div className="table-responsive">
        <table className="spreadsheet-table">
          <thead>
            <tr>
              <th>Engineer</th>
              <th>Active Projects</th>
              <th>Open Tasks</th>
              <th>Workload Indicator</th>
            </tr>
          </thead>
          <tbody>
            {getEmployeeWorkloadTable().map((emp, index) => (
              <tr key={index}>
                <td><strong>{emp.name}</strong></td>
                <td>{emp.activeProjects}</td>
                <td>{emp.openTasks}</td>
                <td>{emp.workloadIndicator}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        </div>

      {/* Master Schedule Table */}
      <div className="analytics-card">
        <h3>Master Schedule</h3>
        <div className="table-responsive">
      <table className="spreadsheet-table">
        <thead>
          <tr>
            <th>Engineer</th>
            <th>Project #</th>
            <th>Project Name</th>
            <th>Architect</th>
            <th>Task Stage</th>
            <th>Task Type</th>
            <th>Description</th>
            <th>Project Hours</th>
            <th>Travel Hours</th>
            <th>Total Hours</th>
            <th>Status</th>
            <th>Transport</th>
            <th>Mileage/Dest</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {masterSchedule.map(task => (
            <tr key={task._id}>
              <td>{task.engineerName}</td>
              <td>{task.projectNumber}</td>
              <td>{task.projectName}</td>
              <td>{task.architect}</td>
              <td>{task.stage}</td>
              <td>{task.task}</td>
              <td>{task.description}</td>
              <td>{task.manHours}</td>
              <td>{task.travelHours}</td>
              <td>{task.totalManHours}</td>
              <td>{task.status}</td>
              <td>
                {task.leavesOffice ? (
                  <span className={`badge ${task.transportMode?.toLowerCase()}`}>
                    {task.transportMode}
                  </span>
                ) : '-'}
              </td>
              <td>
                {task.transportMode === 'Road' && task.mileage ? `${task.mileage} km` :
                 task.transportMode === 'Flight' && task.destination ? task.destination :
                 '-'}
              </td>
              <td>{new Date(task.workDate).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      </div>
      </div>
    );
  }

export default AdminDashboard;
