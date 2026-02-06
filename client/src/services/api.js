//handles backend requests & jwt
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Automatically attach JWT to requests for authentication
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;

},(error) => {
    return Promise.reject(error);
}
);


// Response interceptor for error handling
/*
api.interceptors.response.use((response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
*/



export default api;