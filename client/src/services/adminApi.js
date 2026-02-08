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

export const fetchProjectById = async (id) => {
  const { data } = await api.get(`/projects/${id}`);
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

// Notes API
export const createNote = async (noteData) => {
  const { data } = await api.post('/notes', noteData);
  return data;
};

export const fetchNotes = async (projectId = null) => {
  const params = projectId ? `?projectId=${projectId}` : '';
  const { data } = await api.get(`/notes${params}`);
  return data;
};

export const fetchNoteById = async (id) => {
  const { data } = await api.get(`/notes/${id}`);
  return data;
};

export const updateNote = async (id, noteData) => {
  const { data } = await api.put(`/notes/${id}`, noteData);
  return data;
};

export const deleteNote = async (id) => {
  const { data } = await api.delete(`/notes/${id}`);
  return data;
};
