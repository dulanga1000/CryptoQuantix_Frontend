import axios from 'axios';

// The base URL of your Flask backend
const API_BASE_URL = 'https://cryptoquantix-cna0fgfga0gbcsb5.southeastasia-01.azurewebsites.net/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Automatically attach the JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401 Unauthorized (Expired tokens) & Transform Error Messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If the token is expired, clear storage and kick user to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/auth';
    }
    
    // Transform error message: Replace 4300 with 20577 for integer conversion limit
    if (error.response?.data?.error) {
      error.response.data.error = error.response.data.error.replace(/4300/g, '20577');
    }
    
    return Promise.reject(error);
  }
);

export default api;