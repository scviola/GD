import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Link } from 'react-router-dom';
import api from '../services/api';

const SUBMISSION_COLORS = ['#10b981', '#ef4444']; // Green for submitted, Red for not submitted

const WeeklySubmissionReport = () => {
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch available weeks on mount
  useEffect(() => {
    const fetchAvailableWeeks = async () => {
      try {
        const res = await api.get('/admin/weekly-submission-report/weeks');
        setAvailableWeeks(res.data);
        // Select the most recent week by default
        if (res.data.length > 0) {
          setSelectedWeek(res.data[0].weekStart);
        }
      } catch (err) {
        console.error('Failed to load available weeks', err);
      }
    };
    fetchAvailableWeeks();
  }, []);

  // Fetch weekly submission report when selected week changes
  useEffect(() => {
    if (!selectedWeek) return;

    const fetchWeeklyReport = async () => {
      try {
        setLoading(true);
        const selectedWeekData = availableWeeks.find(w => w.weekStart === selectedWeek);
        if (selectedWeekData) {
          const res = await api.get(`/admin/weekly-submission-report?weekStart=${selectedWeekData.weekStart}&weekEnd=${selectedWeekData.weekEnd}`);
          setWeeklyReport(res.data);
        }
      } catch (err) {
        console.error('Failed to load weekly submission report', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWeeklyReport();
  }, [selectedWeek, availableWeeks]);

  const handleWeekChange = (e) => {
    setSelectedWeek(e.target.value);
  };

  // Format date as "8 Feb 2026"
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="admin-container">
      <h2>Weekly Submission Report</h2>
      
      {/* Week Selector */}
      <div className="filters-section">
        <div className="filters-row">
          <label>Select Week:</label>
          <select
            value={selectedWeek}
            onChange={handleWeekChange}
            className="filter-select"
          >
            {availableWeeks.map((week) => (
              <option key={week.weekStart} value={week.weekStart}>
                {formatDate(week.weekStart)} to {formatDate(week.weekEnd)}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {loading ? (
        <p className="loading-message">Loading weekly report...</p>
      ) : weeklyReport ? (
        <>
          {/* Summary KPI Cards */}
          <div className="weekly-kpi-grid">
            <div className="kpi-card">
              <h4>Week Range</h4>
              <span className="kpi-value primary">{formatDate(weeklyReport.weekStart)} to {formatDate(weeklyReport.weekEnd)}</span>
            </div>
            <div className="kpi-card">
              <h4>Total Staff</h4>
              <span className="kpi-value primary">{weeklyReport.summary.totalStaff}</span>
            </div>
            <div className="kpi-card">
              <h4>Submitted</h4>
              <span className="kpi-value green">{weeklyReport.summary.submitted}</span>
            </div>
            <div className="kpi-card">
              <h4>Not Submitted</h4>
              <span className="kpi-value red">{weeklyReport.summary.notSubmitted}</span>
            </div>
            <div className="kpi-card">
              <h4>Submission Rate</h4>
              <span className="kpi-value purple">{weeklyReport.summary.submissionRate}%</span>
            </div>
          </div>

          {/* Doughnut Chart */}
          <div className="chart-section">
            <h4>Submission Overview</h4>
            <div className="doughnut-chart-container">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Submitted', value: weeklyReport.summary.submitted },
                      { name: 'Not Submitted', value: weeklyReport.summary.notSubmitted }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell key="cell-submitted" fill={SUBMISSION_COLORS[0]} />
                    <Cell key="cell-not-submitted" fill={SUBMISSION_COLORS[1]} />
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Employee Task Count Breakdown */}
          <div className="table-section">
            <h3>Projects Log (All Staff)</h3>
            <div className="table-responsive">
              <table className="spreadsheet-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Projects Logged</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyReport.allEmployeesWithTaskCounts && weeklyReport.allEmployeesWithTaskCounts.length > 0 ? (
                    weeklyReport.allEmployeesWithTaskCounts.map((employee) => (
                      <tr key={employee._id}>
                        <td>{employee.name}</td>
                        <td>{employee.email}</td>
                        <td><strong>{employee.taskCount}</strong></td>
                        <td>
                          {employee.taskCount > 0 ? (
                            <span className="status-badge success">Submitted</span>
                          ) : (
                            <span className="status-badge warning">Not Submitted</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="no-results">No employee data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <p className="no-data-message">No weekly report data available</p>
      )}
    </div>
  );
};

export default WeeklySubmissionReport;
