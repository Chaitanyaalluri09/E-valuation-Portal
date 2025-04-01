import axios from 'axios';

// Create a base URL without the proxy for direct API calls
const API_URL = 'https://e-valuation-portal-backend.onrender.com';

// Create the axios instance with the CORS proxy
const axiosInstance = axios.create({
  baseURL: 'https://corsproxy.io/?' + API_URL
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Fix URL encoding issues with the proxy
    if (config.url && config.url.includes('?')) {
      // For URLs with query parameters, ensure they're properly encoded for the proxy
      const [path, query] = config.url.split('?');
      config.url = path + '?' + encodeURIComponent('?' + query);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;