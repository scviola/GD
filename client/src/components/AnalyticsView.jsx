import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../services/api';

const AnalyticsView = () => {
    const [stats, setStats] = useState(null);
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    useEffect(() => {
        api.get('/admin/analytics').then(res => setStats(res.data));
    }, []);

    if (!stats) return <p>Loading Analytics...</p>;

    return (
        <div className="analytics-grid">
            <div className="chart-card">
                <h4>Man-Hours per Project</h4>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.hoursByProject}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="projectName" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="totalProjectHours" stackId="a" fill="#8884d8" name="Project Hours" />
                        <Bar dataKey="totalTravelHours" stackId="a" fill="#82ca9d" name="Travel Hours" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="chart-card">
                <h4>Engineer Utilization</h4>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.utilizationByEngineer}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="totalManHours" fill="#8884d8" name="Total Hours" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="chart-card">
                <h4>Project Status Distribution</h4>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={stats.projectStatusDist} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={80} label>
                        {stats.projectStatusDist.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default AnalyticsView;
