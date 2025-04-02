import axios from 'axios';

const baseURL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000'
  : 'https://e-valuation-portal-backend.onrender.com';

const axiosInstance = axios.create({
  baseURL
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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