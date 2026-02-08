import api from './api';

const PROJECT_DETAILS_URL = '/project-details';

// Get all project details
export const getAllProjectDetails = () => api.get(PROJECT_DETAILS_URL);

// Get project details by project ID
export const getProjectDetailsByProjectId = (projectId) => 
    api.get(`${PROJECT_DETAILS_URL}/project/${projectId}`);

// Create or update project details
export const upsertProjectDetails = (projectId, data) => 
    api.post(`${PROJECT_DETAILS_URL}/project/${projectId}`, data);

// Update specific trade
export const updateTrade = (projectId, tradeName, data) => 
    api.patch(`${PROJECT_DETAILS_URL}/project/${projectId}/trade/${tradeName}`, data);

// Delete project details
export const deleteProjectDetails = (projectId) => 
    api.delete(`${PROJECT_DETAILS_URL}/project/${projectId}`);

export default {
    getAllProjectDetails,
    getProjectDetailsByProjectId,
    upsertProjectDetails,
    updateTrade,
    deleteProjectDetails
};
