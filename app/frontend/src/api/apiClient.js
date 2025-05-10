/**
 * API client setup using axios and SSE utilities
 * This file configures the base axios instance and SSE utilities used throughout the app.
 */
import axios from 'axios';

// Get the base URL for all API calls
const getBaseUrl = () => {
  const isDevEnvironment = import.meta.env.DEV;
  return isDevEnvironment ? '/api' : `${window.location.origin}/api`;
};

// Helper function to create SSE connections
export const createSSEConnection = (path) => {
  return new EventSource(`${getBaseUrl()}${path}`);
};

// Create base axios instance with common configuration
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/authentication
});

// Request interceptor - adds auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token to headers if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle common responses
apiClient.interceptors.response.use(
  (response) => {
    // You can modify the response data here
    return response;
  },
  (error) => {
    // Log the full error for debugging
    console.log("API Error:", error.response ? error.response.data : error.message);
    
    // Handle errors consistently
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error:', error.response.data);
      const errorMessage = error.response.data?.message || error.response.data?.error || 'An error occurred';
      error.message = errorMessage; // Override error message with server message
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network Error:', error.request);
      error.message = 'Network error. Please check your connection.';
    } else {
      // Something happened in setting up the request
      console.error('Request Error:', error.message);
      error.message = 'Failed to send request.';
    }
    return Promise.reject(error);
  }
);

export default apiClient;