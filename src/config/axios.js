import axios from 'axios';
import config from './env.js';

// Create axios instance with default configuration
const axiosInstance = axios.create({
  timeout: 15000, // 15 seconds timeout (matching full-project)
  headers: {
    'User-Agent': 'Mutual-Fund-Portfolio-Tracker/1.0',
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Request interceptor for logging
axiosInstance.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('Request Error:', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and logging
axiosInstance.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
    const status = error.response?.status || 'Network Error';
    
    console.error(`API Error [${status}]: ${errorMsg}`);
    
    // Enhanced error object
    const enhancedError = new Error(errorMsg);
    enhancedError.status = error.response?.status;
    enhancedError.originalError = error;
    enhancedError.url = error.config?.url;
    
    return Promise.reject(enhancedError);
  }
);

// Mutual Fund API specific methods (following full-project structure)
export const mfApi = {
  // Get all funds list
  getAllFunds: () => axiosInstance.get(config.mfApiBaseUrl || 'https://api.mfapi.in/mf'),
  
  // Get fund details with latest NAV
  getFundLatest: (schemeCode) => axiosInstance.get(`${config.mfApiBaseUrl || 'https://api.mfapi.in/mf'}/${schemeCode}/latest`),
  
  // Get fund NAV history
  getFundHistory: (schemeCode) => axiosInstance.get(`${config.mfApiBaseUrl || 'https://api.mfapi.in/mf'}/${schemeCode}`),
  
  // Generic GET request for external APIs
  get: (url, options = {}) => axiosInstance.get(url, options),
  
  // Generic POST request for external APIs
  post: (url, data, options = {}) => axiosInstance.post(url, data, options)
};

export default axiosInstance;
