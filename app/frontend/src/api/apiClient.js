/**
 * API client setup using axios and SSE utilities
 * This file configures the base axios instance and SSE utilities used throughout the app.
 */
import axios from 'axios';
import React from 'react';

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

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        // Try to decode the JWT to get expiration time
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
          '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(''));
        const payload = JSON.parse(jsonPayload);
        
        console.log('API Client: Using access token:', {
          tokenType: 'Access Token',
          tokenExists: true,
          tokenLength: token.length,
          expiresAt: new Date(payload.exp * 1000).toISOString(),
          timeUntilExpiry: Math.round((payload.exp * 1000 - Date.now()) / 1000) + ' seconds',
          timestamp: new Date().toISOString(),
          userId: payload.id,
          username: payload.username,
          role: payload.role
        });
      } catch (e) {
        console.log('API Client: Using access token (unable to decode):', {
          tokenType: 'Access Token',
          tokenExists: true,
          tokenLength: token.length,
          timestamp: new Date().toISOString()
        });
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is due to token expiration (401 status)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      console.log('API Client: Access token expired, attempting refresh:', {
        timestamp: new Date().toISOString(),
        error: error.response?.data?.message,
        originalUrl: originalRequest.url
      });

      try {
        // Call the refresh function from AuthContext
        if (window.AuthRefresh) {
          const result = await window.AuthRefresh();
          if (result?.accessToken) {
            try {
              // Try to decode the new token
              const base64Url = result.accessToken.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
              ).join(''));
              const payload = JSON.parse(jsonPayload);
              
              console.log('API Client: Token refresh successful:', {
                tokenType: 'New Access Token',
                timestamp: new Date().toISOString(),
                expiresAt: new Date(payload.exp * 1000).toISOString(),
                timeUntilExpiry: Math.round((payload.exp * 1000 - Date.now()) / 1000) + ' seconds',
                userId: payload.id,
                username: payload.username,
                role: payload.role
              });
            } catch (e) {
              console.log('API Client: Token refresh successful (unable to decode):', {
                tokenType: 'New Access Token',
                timestamp: new Date().toISOString(),
                tokenLength: result.accessToken.length
              });
            }
            
            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${result.accessToken}`;
            return apiClient(originalRequest);
          }
        }
        
        // If refresh fails, log out
        console.log('API Client: Token refresh failed, logging out:', {
          timestamp: new Date().toISOString(),
          reason: 'No new access token received'
        });
        if (window.AuthLogout) {
          await window.AuthLogout();
        }
      } catch (refreshError) {
        console.error('API Client: Error during token refresh:', {
          timestamp: new Date().toISOString(),
          error: refreshError.message,
          type: 'Refresh Token Error'
        });
        if (window.AuthLogout) {
          await window.AuthLogout();
        }
      }
    }
    return Promise.reject(error);
  }
);

// --- Automatic token refresh logic ---
let refreshInProgress = false;
let refreshQueue = [];

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    // If 401 error and not already retried
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // Use React context to get refresh function
      try {
        if (!refreshInProgress) {
          refreshInProgress = true;
          // Use a promise to allow queueing
          const refreshPromise = new Promise(async (resolve, reject) => {
            try {
              // Use window.AuthRefresh if available (set in AuthProvider)
              if (window.AuthRefresh) {
                const refreshed = await window.AuthRefresh();
                resolve(refreshed);
              } else {
                reject('No refresh function available');
              }
            } catch (err) {
              reject(err);
            }
          });
          // Wait for refresh to complete
          const refreshed = await refreshPromise;
          refreshInProgress = false;
          // Retry all queued requests
          refreshQueue.forEach(cb => cb(refreshed));
          refreshQueue = [];
          if (refreshed && refreshed.accessToken) {
            // Update Authorization header and retry original request
            originalRequest.headers['Authorization'] = `Bearer ${refreshed.accessToken}`;
            return apiClient(originalRequest);
          }
        } else {
          // If refresh is already in progress, queue the request
          return new Promise((resolve, reject) => {
            refreshQueue.push(async (refreshed) => {
              if (refreshed && refreshed.accessToken) {
                originalRequest.headers['Authorization'] = `Bearer ${refreshed.accessToken}`;
                resolve(apiClient(originalRequest));
              } else {
                reject(error);
              }
            });
          });
        }
      } catch (refreshError) {
        refreshInProgress = false;
        refreshQueue = [];
        // Optionally, log out the user here
        if (window.AuthLogout) window.AuthLogout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// --- End automatic token refresh logic ---

export default apiClient;