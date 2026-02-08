import { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const TaskLog = () => {
  const { user } = useContext(AuthContext);
  const [myProjects, setMyProjects] = useState([]);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectNumber, setProjectNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loggedProjectIds, setLoggedProjectIds] = useState([]); // Track logged projects for selected date

  const [taskOptions, setTaskOptions] = useState({
    stages: [],
    tasks: [],
    statuses: [],
    transportModes: []
  });

  const [formData, setFormData] = useState({
    projectName: '',
    workDate: '',
    stage: '',
    task: '',
    status: '',
    description: '',
    manHours: '',
    leavesOffice: false,
    transportMode: '',
    travelHours: '',
    mileage: '',
    destination: ''
  });

  // FETCH PROJECTS - Only show assigned projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects');
        const projects = Array.isArray(res.data) ? res.data : [];
        
        // Filter to only show projects assigned to current employee
        const userId = user?.id || user?._id;
        if (userId) {
          const assigned = projects.filter(p => {
            const empAssigned = p.employeeAssigned;
            if (!empAssigned) return false;

        // Handle array of assigned engineers
        if (Array.isArray(empAssigned)) {
          return empAssigned.some(assignedId => {
            if (typeof assignedId === 'object') {
              return assignedId._id === userId;
            }
            return assignedId === userId;
          });
        }
        // Handle single assignment
        if (typeof empAssigned === 'object') {
          return empAssigned._id === userId;
        }
        return empAssigned === userId;
        });
        setMyProjects(assigned);
      }
      } catch (err) {
        console.error('Failed to load projects', err);
      }
    };
    fetchProjects();
  }, [user]);

  // FETCH LOGGED PROJECTS FOR SELECTED DATE
  useEffect(() => {
    // Clear project selection when date changes (tasks are date-specific)
    // This ensures user selects a project for the correct date
    if (formData.projectName && formData.workDate) {
      const fetchLoggedProjects = async () => {
        try {
          const res = await api.get(`/tasks/logged-projects?date=${formData.workDate}`);
          setLoggedProjectIds(res.data);
          
          // Clear selected project if it was already logged for this date
          if (res.data.includes(formData.projectName)) {
            setFormData(prev => ({ ...prev, projectName: '' }));
            setProjectNumber('');
          }
        } catch (err) {
          console.error('Failed to fetch logged projects', err);
        }
      };
      
      fetchLoggedProjects();
    } else if (!formData.workDate) {
      setLoggedProjectIds([]);
    }
  }, [formData.workDate, formData.projectName]);

  // FETCH TASK ENUM OPTIONS
  useEffect(() => {
    const fetchTaskOptions = async () => {
      try {
        const res = await api.get('/meta/task-options');
        setTaskOptions(res.data);
      } catch (err) {
        console.error('Failed to load task options', err);
      }
    };
    fetchTaskOptions();
  }, []);

  // Filter projects for dropdown (exclude already logged projects)
  const filteredProjects = myProjects.filter(p =>
    `${p.projectNumber} ${p.projectName}`.toLowerCase().includes(projectSearch.toLowerCase()) &&
    !loggedProjectIds.includes(p._id)
  );

  // Check if all projects are already logged for the selected date
  const allProjectsLogged = myProjects.length > 0 && 
    myProjects.every(p => loggedProjectIds.includes(p._id));

  // Get available projects count
  const availableProjectsCount = myProjects.filter(p => !loggedProjectIds.includes(p._id)).length;

  // Auto-select project when search yields exactly one result
  useEffect(() => {
    if (filteredProjects.length === 1 && projectSearch.trim()) {
      const project = filteredProjects[0];
      setFormData(prev => ({ ...prev, projectName: project._id }));
      setProjectNumber(project.projectNumber);
      setProjectSearch('');
    }
  }, [projectSearch, filteredProjects]);

  // Auto-populate project number when project name is selected
  const handleProjectNameChange = (e) => {
    const projectId = e.target.value;
    setFormData(prev => ({ ...prev, projectName: projectId }));
    
    const selectedProject = myProjects.find(p => p._id === projectId);
    if (selectedProject) {
      setProjectNumber(selectedProject.projectNumber);
    } else {
      setProjectNumber('');
    }
  };

  const handleChange = (field, value) => {
    if (field === 'workDate') {
      // Clear project selection when date changes
      setFormData(prev => ({ ...prev, projectName: '', workDate: value }));
      setProjectNumber('');
      return;
    }
    
    if (field === 'leavesOffice' && value === false) {
      setFormData(prev => ({
        ...prev,
        leavesOffice: false,
        transportMode: '',
        travelHours: '',
        mileage: '',
        destination: ''
      }));
      return;
    }
    // Clear mileage/destination when transport mode changes
    if (field === 'transportMode') {
      setFormData(prev => ({
        ...prev,
        transportMode: value,
        mileage: value === 'Road' ? prev.mileage : '',
        destination: value === 'Flight' ? prev.destination : ''
      }));
      return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post('/tasks', formData);
      alert('Task logged successfully');
      setFormData({
        projectName: '',
        workDate: '',
        stage: '',
        task: '',
        status: '',
        description: '',
        manHours: '',
        leavesOffice: false,
        transportMode: '',
        travelHours: '',
        mileage: '',
        destination: ''
      });
      setProjectNumber('');
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
        Only projects assigned to you are shown below.
        {myProjects.length === 0 && (
          <span className="warning-text">
            {' '}You haven't been assigned any projects yet.
          </span>
        )}
        {allProjectsLogged && (
          <span className="warning-text">
            {' '}You have already logged all your assigned projects for this date.
          </span>
        )}
      </p>

      {availableProjectsCount > 0 && (
        <p className="info-text" style={{ fontSize: '0.9em', color: '#666' }}>
          {availableProjectsCount} project{availableProjectsCount !== 1 ? 's' : ''} available for logging today
        </p>
      )}

      <form onSubmit={handleSubmit} className="task-form" style={{ opacity: allProjectsLogged ? 0.6 : 1 }}>
        {/* Project Search */}
        <label>Search Project (Number or Name)</label>
        <input
          type="text"
          placeholder="Type to search your assigned projects..."
          value={projectSearch}
          onChange={(e) => setProjectSearch(e.target.value)}
          disabled={myProjects.length === 0 || allProjectsLogged}
        />

        {/* Project Number (read-only hint) */}
        <label>Project Number</label>
        <input
          type="text"
          placeholder={projectNumber || "Select a project below..."}
          value={projectNumber}
          readOnly
          disabled
        />

        {/* Project Dropdown - Only shows assigned projects */}
        <label>Project Name *</label>
        <select
          required
          value={formData.projectName}
          onChange={handleProjectNameChange}
          disabled={myProjects.length === 0 || allProjectsLogged}
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
            You have no assigned projects.
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
          disabled={allProjectsLogged}
        >
          <option value="">Select Stage...</option>
          {taskOptions.stages.map(stage => (
            <option key={stage} value={stage}>{stage}</option>
          ))}
        </select>

        {/* Task Type */}
        <label>Task *</label>
        <select
          required
          value={formData.task}
          onChange={(e) => handleChange('task', e.target.value)}
          disabled={allProjectsLogged}
        >
          <option value="">Select Task...</option>
          {taskOptions.tasks.map(task => (
            <option key={task} value={task}>{task}</option>
          ))}
        </select>

        {/* Description */}
        <label>Description</label>
        <textarea
          placeholder="Optional"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          disabled={allProjectsLogged}
        />

        {/* Man Hours */}
        <label>Total Man Hours *</label>
        <input
          type="number"
          step="0.25"
          required
          value={formData.manHours}
          onChange={(e) => handleChange('manHours', e.target.value)}
          disabled={allProjectsLogged}
        />

        {/* Leaves Office */}
        <label>
          <input
            type="checkbox"
            checked={formData.leavesOffice}
            onChange={(e) => handleChange('leavesOffice', e.target.checked)}
            disabled={allProjectsLogged}
          />
          Work involved leaving the office
        </label>

        {/* Conditional Travel Fields */}
        {formData.leavesOffice && (
          <>
            <label>Means of Transport *</label>
            <select
              required
              value={formData.transportMode}
              onChange={(e) => handleChange('transportMode', e.target.value)}
            >
              <option value="">Select...</option>
              {taskOptions.transportModes.map(mode => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>

            <label>Travel Hours *</label>
            <input
              type="number"
              step="0.25"
              required
              value={formData.travelHours}
              onChange={(e) => handleChange('travelHours', e.target.value)}
            />

            {/* Conditional Mileage/Destination Fields */}
            {formData.transportMode === 'Road' && (
              <>
                <label>Mileage (km) *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.mileage}
                  onChange={(e) => handleChange('mileage', e.target.value)}
                  placeholder="Enter distance in kilometers"
                />
              </>
            )}

            {formData.transportMode === 'Flight' && (
              <>
                <label>Destination *</label>
                <input
                  type="text"
                  required
                  value={formData.destination}
                  onChange={(e) => handleChange('destination', e.target.value)}
                  placeholder="Enter flight destination"
                />
              </>
            )}
          </>
        )}

        {/* Status */}
        <label>Project Status *</label>
        <select
          required
          value={formData.status}
          onChange={(e) => handleChange('status', e.target.value)}
          disabled={allProjectsLogged}
        >
          <option value="">Select Project Status...</option>
          {taskOptions.statuses.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>

        <button type="submit" disabled={submitting || myProjects.length === 0 || allProjectsLogged}>
          {submitting ? 'Saving...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};

export default TaskLog;
