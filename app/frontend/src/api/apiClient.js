/**
 * API client setup using axios and SSE utilities
 * Authentication is handled via HTTP-only cookies (access and refresh tokens)
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

// Single refresh token state to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

// Process queued requests with new token
const processQueue = (error) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Helper function to decode JWT and get expiration time
// const getTokenInfo = (cookie) => {
//   try {
//     if (!cookie) return null;
//     const token = cookie.split('=')[1];
//     const base64Url = token.split('.')[1];
//     const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
//     const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
//       '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
//     ).join(''));
//     const payload = JSON.parse(jsonPayload);
//     const expiresIn = payload.exp * 1000 - Date.now();
//     return {
//       type: payload.type,
//       expiresIn: Math.round(expiresIn / 1000),
//       exp: new Date(payload.exp * 1000).toISOString()
//     };
//   } catch (err) {
//     return null;
//   }
// };

// Define public endpoints that don't need authentication
const PUBLIC_ENDPOINTS = [
  '/trading-session/status',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/refresh-token',  // Add refresh-token to public endpoints
  '/profile',        // Add profile to public endpoints for initial check
  '/auth/google',
  '/orders/orderBook',  // Order book should be publicly viewable
  '/orders/orderBook/stream',  // Order book stream should also be public
  '/stockPrice/',  // Stock prices should be publicly viewable
  '/stocks/'  // Stock information should be publicly viewable
];

// Request interceptor for logging token info
apiClient.interceptors.request.use(
  (config) => {
    console.log(`\n[Token Debug] 🚀 Request to: ${config.method.toUpperCase()} ${config.url}`);
    
    // Skip auth for public endpoints
    if (PUBLIC_ENDPOINTS.some(endpoint => config.url.includes(endpoint))) {
      console.log('[Token Debug] 📢 Public endpoint - skipping authentication');
      return config;
    }
    
    // Special handling for refresh token endpoint
    if (config.url.includes('refresh-token')) {
      console.log('[Token Debug] 🔄 Using refresh token for token refresh request');
      return config;
    }
    
    // For all other endpoints, we use the access token
    if (window.AuthContext?.isAuthenticated) {
      console.log('[Token Debug] 🔑 Using access token for request');
    }
    
    return config;
  },
  (error) => {
    console.log('[Token Debug] ❌ Request failed:', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor for handling token refresh
apiClient.interceptors.response.use(
  (response) => {
    if (!response.config.url.includes('refresh-token')) {
      console.log(`[Token Debug] ✅ Response from: ${response.config.method.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    console.log(`[Token Debug] ❌ Error from: ${originalRequest.method.toUpperCase()} ${originalRequest.url} - Status: ${error.response?.status}`);

    // If error is not 401 or request has already been retried, reject
    if (!error.response || error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    console.log('[Token Debug] 🔄 Access token expired, attempting refresh with refresh token');
    originalRequest._retry = true;

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        if (window.AuthRefresh) {
          console.log('[Token Debug] 🔄 Calling refresh token endpoint...');
          const refreshResult = await window.AuthRefresh();
          
          if (refreshResult?.status === 200 && refreshResult?.data?.accessToken) {
            console.log('[Token Debug] ✅ Received new access token');
            // Small delay to ensure cookies are set
            await new Promise(resolve => setTimeout(resolve, 100));
            console.log('[Token Debug] 🔄 Retrying original request with new access token');
            processQueue(null);
            return apiClient(originalRequest);
          } else {
            console.log('[Token Debug] ❌ Token refresh failed - invalid response');
            return null;
          }
        } else {
          console.log('[Token Debug] ❌ No refresh function available');
          return null;
        }
      } catch (refreshError) {
        console.log('[Token Debug] ❌ Token refresh failed, logging out...', refreshError.message);
        processQueue(refreshError);
        if (window.AuthLogout) {
          await window.AuthLogout();
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    console.log('[Token Debug] ⏳ Refresh in progress, queueing request');
    return new Promise((resolve, reject) => {
      failedQueue.push({
        resolve: () => resolve(apiClient(originalRequest)),
        reject: (err) => reject(err)
      });
    });
  }
);

export default apiClient;