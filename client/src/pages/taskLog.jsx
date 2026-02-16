import { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const TaskLog = () => {
  const { user } = useContext(AuthContext);
  const [myProjects, setMyProjects] = useState([]);
  const [projectSearch, setProjectSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    projectName: '',
    workDate: '',
    stage: '',
    task: '',
    projectHours: '',
    leavesOffice: false,
    travelHours: ''
  });

  // FETCH ALL PROJECTS
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects');
        const projects = Array.isArray(res.data) ? res.data : [];
        setMyProjects(projects);
      } catch (err) {
        console.error('Failed to load projects', err);
      }
    };
    fetchProjects();
  }, [user]);


  // Filter and sort projects for dropdown (alphabetically)
  const filteredProjects = myProjects
    .filter(p =>
      `${p.projectNumber} ${p.projectName}`.toLowerCase().includes(projectSearch.toLowerCase())
    )
    .sort((a, b) => a.projectName.localeCompare(b.projectName));

  // Auto-populate project name when project number is typed
  useEffect(() => {
    if (projectSearch.trim()) {
      // Check if projectSearch matches a project number exactly
      const exactMatch = myProjects.find(p => 
        p.projectNumber.toLowerCase() === projectSearch.toLowerCase().trim()
      );
      if (exactMatch) {
        setFormData(prev => ({ ...prev, projectName: exactMatch._id }));
        return;
      }
    }
  }, [projectSearch, myProjects]);

  // Auto-select project when search yields exactly one result
  useEffect(() => {
    if (filteredProjects.length === 1 && projectSearch.trim()) {
      const project = filteredProjects[0];
      setFormData(prev => ({ ...prev, projectName: project._id }));
      setProjectSearch('');
    }
  }, [projectSearch, filteredProjects]);

  // Auto-populate project search when project name is selected
  const handleProjectNameChange = (e) => {
    const projectId = e.target.value;
    setFormData(prev => ({ ...prev, projectName: projectId }));
    
    const selectedProject = myProjects.find(p => p._id === projectId);
    if (selectedProject) {
      setProjectSearch(selectedProject.projectNumber);
    } else {
      setProjectSearch('');
    }
  };

  const handleChange = (field, value) => {
    if (field === 'leavesOffice' && value === false) {
      setFormData(prev => ({
        ...prev,
        leavesOffice: false,
        travelHours: ''
      }));
      return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await api.post('/tasks', formData);
      if (res.status === 200 || res.status === 201) {
        const message = res.status === 200 
          ? 'Task updated successfully'
          : 'Task logged successfully';
        alert(message);
      }
      setFormData({
        projectName: '',
        workDate: '',
        stage: '',
        task: '',
        projectHours: '',
        leavesOffice: false,
        travelHours: ''
      });
      setProjectSearch('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="portal-container" 
    >
      <h3>Daily Project Task Reporting</h3>
      <p className="info-text">
        Select a project by entering the project number or selecting from the dropdown.
      </p>

      <form onSubmit={handleSubmit} className="task-form">
        {/* Project Number - Editable/Searchable */}
        <label>Project Number</label>
        <input
          type="text"
          placeholder="Enter project number to search..."
          value={projectSearch}
          onChange={(e) => setProjectSearch(e.target.value)}
        />

        {/* Project Dropdown - Shows all projects */}
        <label>Project Name *</label>
        <select
          required
          value={formData.projectName}
          onChange={handleProjectNameChange}
        >
          <option value="">Select Project...</option>
          {filteredProjects.map(project => (
            <option key={project._id} value={project._id}>
              {project.projectNumber} — {project.projectName}
            </option>
          ))}
        </select>

        {myProjects.length === 0 && (
          <p className="no-projects-message">
            No projects available.
          </p>
        )}

        {/* Work Date */}
        <label>Work Date *</label>
        <input
          type="date"
          required
          value={formData.workDate}
          onChange={(e) => handleChange('workDate', e.target.value)}
          max={new Date().toISOString().split('T')[0]} // Prevent future dates
        />

        {/* Task Stage */}
        <label>Project Stage *</label>
        <select
          required
          value={formData.stage}
          onChange={(e) => handleChange('stage', e.target.value)}
        >
          <option value="">Select Stage...</option>
          <option value="Pre-design">Pre-design</option>
          <option value="Design">Design</option>
          <option value="Tendering">Tendering</option>
          <option value="Construction & Supervision">Construction & Supervision</option>
          <option value="Snagging, Testing & Commissioning">Snagging, Testing & Commissioning</option>
          <option value="Handover">Handover</option>
          <option value="Other(specify)">Other(specify)</option>
        </select>

        {/* Tasks */}
        <label>Task *</label>
        <select
          required
          value={formData.task}
          onChange={(e) => handleChange('task', e.target.value)}
        >
          <option value="">Select Task...</option>
          <option value="Emails & Office work">Emails & Office work</option>
          <option value="Design/BOD">Design/BOD</option>
          <option value="Meeting(online/site)">Meeting(online/site)</option>
          <option value="Documentation(BOQs, reports)">Documentation(BOQs, reports)</option>
          <option value="Inspection">Inspection</option>
          <option value="Snagging, Testing & Commissioning">Snagging, Testing & Commissioning</option>
        </select>

        {/* Project Hours */}
        <label>Project Hours *</label>
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Enter hours (e.g., 0.5 for 30 min, 1 for 1 hour)"
          required
          value={formData.projectHours}
          onChange={(e) => handleChange('projectHours', e.target.value)}
        />

        {/* Leaves Office */}
        <label>
          <input
            type="checkbox"
            checked={formData.leavesOffice}
            onChange={(e) => handleChange('leavesOffice', e.target.checked)}
          />
          Work involved leaving the office
        </label>

        {/* Conditional Travel Fields */}
        {formData.leavesOffice && (
          <>
            <label>Travel Hours *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Enter hours (e.g., 0.5 for 30 min, 1 for 1 hour)"
              required
              value={formData.travelHours}
              onChange={(e) => handleChange('travelHours', e.target.value)}
            />
          </>
        )}

        {/* Total Man Hours (calculated) */}
        <label>Total Man Hours</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={Number(formData.projectHours || 0) + Number(formData.travelHours || 0)}
          readOnly
          style={{ backgroundColor: '#f5f5f5' }}
        />

        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};

export default TaskLog;
