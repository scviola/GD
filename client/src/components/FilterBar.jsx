//dropdowns
import React from 'react';

const FilterBar = ({ filters, setFilters }) => {
    const handleChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    return (
        <div className="filter-bar">
            <select name="stage" onChange={handleChange} value={filters.stage}>
                <option value="">All Stages</option>
                <option value="Pre-design">Pre-design</option>
                <option value="Design">Design</option>
                <option value="Construction & Monitoring">Construction & Monitoring</option>
                <option value="Procurement">Procurement</option>
                <option value="Commissioning">Commissioning</option>
                <option value="General">General</option>
            </select>

            <select name="task" onChange={handleChange} value={filters.task}>
                <option value="">All Task Types</option>
                <option value="Design">Design</option>
                <option value="Inspection">Inspection</option>
                <option value="Site Meeting">Site Meeting</option>
                <option value="Valuation">Valuation</option>
                <option value="Testing">Testing</option>
                <option value="Commissioning">Commissioning</option>
                <option value="Documentation">Documentation</option>
                <option value="Coordination Meeting">Coordination Meeting</option>
            </select>

            <select name="status" onChange={handleChange} value={filters.status}>
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
            </select>

            <input 
                type="date" 
                name="startDate" 
                placeholder="Start Date" 
                onChange={handleChange} 
            />
            
            <input 
                type="date" 
                name="endDate" 
                placeholder="End Date" 
                onChange={handleChange} 
            />

            <button onClick={() => setFilters({ engineerId: '', projectId: '', stage: '', task: '', status: '', startDate: '', endDate: '' })}>
                Clear Filters
            </button>
        </div>
    );
};


export default FilterBar;
