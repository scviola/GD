import api from './api'; // existing axios instance

export const fetchMasterSchedule = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const { data } = await api.get(`/admin/master-schedule?${params}`);
  return data;
};

export const fetchAnalytics = async () => {
  const { data } = await api.get('/admin/analytics');
  return data;
};

export const fetchProjects = async () => {
  const { data } = await api.get('/projects'); // projects endpoint
  return data;
};

export const fetchEmployees = async () => {
  const { data } = await api.get('/users'); 
  return data;
};

export const fetchTaskMeta = async () => {
  const { data } = await api.get('/meta/task-options'); // optional: backend endpoint returning enums
  return data; 
};
