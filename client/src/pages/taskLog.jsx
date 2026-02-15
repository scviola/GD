import { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const TaskLog = () => {
  const { user } = useContext(AuthContext);
  const [myProjects, setMyProjects] = useState([]);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectNumber, setProjectNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    projectName: '',
    workDate: '',
    stage: '',
    specificTask: '',
    projectHours: '',
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
            // Check if user is assigned as electrical, mechanical, or project lead
            const isElectrical = p.electrical?._id === userId || p.electrical === userId;
            const isMechanical = p.mechanical?._id === userId || p.mechanical === userId;
            const isProjectLead = p.projectLead?._id === userId || p.projectLead === userId;
            return isElectrical || isMechanical || isProjectLead;
          });
          setMyProjects(assigned);
        }
      } catch (err) {
        console.error('Failed to load projects', err);
      }
    };
    fetchProjects();
  }, [user]);


  // Filter projects for dropdown (show all assigned projects)
  const filteredProjects = myProjects.filter(p =>
    `${p.projectNumber} ${p.projectName}`.toLowerCase().includes(projectSearch.toLowerCase())
  );

  // Auto-populate project name when project number is typed
  useEffect(() => {
    if (projectSearch.trim()) {
      // Check if projectSearch matches a project number exactly
      const exactMatch = myProjects.find(p => 
        p.projectNumber.toLowerCase() === projectSearch.toLowerCase().trim()
      );
      if (exactMatch) {
        setFormData(prev => ({ ...prev, projectName: exactMatch._id }));
        setProjectNumber(exactMatch.projectNumber);
        return;
      }
    }
  }, [projectSearch, myProjects]);

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
        specificTask: '',
        projectHours: '',
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
      </p>

      <form onSubmit={handleSubmit} className="task-form">
        {/* Project Number (read-only) */}
        <label>Project Number</label>
        <input
          type="text"
          placeholder="Select a project to auto-populate..."
          value={projectNumber}
          readOnly
          style={{ backgroundColor: '#f5f5f5' }}
        />

        {/* Project Dropdown - Only shows assigned projects */}
        <label>Project Name *</label>
        <select
          required
          value={formData.projectName}
          onChange={handleProjectNameChange}
          disabled={myProjects.length === 0}
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

        {/* Specific Task */}
        <label>Task *</label>
        <input
          type="text"
          required
          placeholder="Enter specific task..."
          value={formData.specificTask}
          onChange={(e) => handleChange('specificTask', e.target.value)}
        />

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
            <label>Means of Transport *</label>
            <select
              required
              value={formData.transportMode}
              onChange={(e) => handleChange('transportMode', e.target.value)}
            >
              <option value="">Select...</option>
              <option value="Road">Road</option>
              <option value="Flight">Flight</option>
              <option value="Other">Other</option>
            </select>

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

        <button type="submit" disabled={submitting || myProjects.length === 0}>
          {submitting ? 'Saving...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};

export default TaskLog;
