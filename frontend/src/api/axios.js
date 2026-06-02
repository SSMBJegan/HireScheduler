import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'https://hirescheduler-backend.onrender.com'),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to append authentication token automatically to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hirescheduler_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
