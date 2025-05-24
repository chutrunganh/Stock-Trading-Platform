/**
 * AuthContext provides authentication state and methods throughout the app
 * Authentication is handled via HTTP-only cookies (access token and refresh token)
 */
import React, { createContext, useState, useContext } from 'react';
import {registerUser, getUserProfile, logoutUser as logoutUserApi, refreshToken as refreshTokenApi } from '../api/user';

// Create the Auth Context
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status by calling backend
  const checkAuth = async () => {
    try {
      console.log('[Auth Debug] Checking authentication status...');
      const response = await getUserProfile();
      if (response?.data?.user) {
        console.log('[Auth Debug] User authenticated:', response.data.user.username || response.data.user.email);
        setUser(response.data.user);
        setIsAuthenticated(true);
        return true;
      } else {
        console.log('[Auth Debug] Authentication check failed: Invalid response format');
        // Clear any invalid tokens that might be stored
        localStorage.removeItem('userId');
        localStorage.removeItem('authToken');
      }
    } catch (err) {
      console.error('[Auth Debug] Authentication check failed:', err.message);
      // Clear tokens on auth failure
      localStorage.removeItem('userId');
      localStorage.removeItem('authToken');
      setUser(null);
      setIsAuthenticated(false);
    }
    return false;
  };

  // Logout function - only calls API if user is authenticated
  const logout = async () => {
    if (!isAuthenticated) {
      setUser(null);
      setIsAuthenticated(false);
      // Clear all auth-related storage
      localStorage.removeItem('userId');
      localStorage.removeItem('shouldCheckAuth');
      localStorage.removeItem('authToken');
      return;
    }

    try {
      await logoutUserApi();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      // Remove userId from localStorage
      localStorage.removeItem('userId');
    }
  };

  // Handle browser/tab close
  const handleBeforeUnload = async (event) => {
    if (isAuthenticated) {
      event.preventDefault();
      event.returnValue = ''; // Required for Chrome
      console.log('[Auth Debug] Browser closing - logging out user');
      await logout();
    }
  };

  // Login function
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!credentials?.user) {
        setError('Invalid login credentials');
        setLoading(false);
        return;
      }

      setUser(credentials.user);
      setIsAuthenticated(true);
      
      // Store userId and auth check flag in localStorage
      if (credentials.user.id) {
        localStorage.setItem('userId', credentials.user.id);
        localStorage.setItem('shouldCheckAuth', 'true');
      }
      
      // Notify any listeners of auth state change
      window.dispatchEvent(new CustomEvent('auth-state-changed', { 
        detail: { user: credentials.user, isAuthenticated: true }
      }));

      return credentials.user;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await registerUser(userData);
      if (!response?.data) {
        setError('Invalid registration response');
        setLoading(false);
        return;
      }
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Registration failed';
      setError(errorMessage);
      return next(new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  // Refresh token function - simplified since we only need to handle access token refresh
  const refresh = async () => {
    try {
      const response = await refreshTokenApi();
      
      if (response?.status === 200) {
        // Update authenticated state and user profile
        setIsAuthenticated(true);
        const userResponse = await getUserProfile();
        if (userResponse?.data?.user) {
          setUser(userResponse.data.user);
        }
        return response;
      }

      // If refresh failed, clear state
      setUser(null);
      setIsAuthenticated(false);
      return null;
    } catch (err) {
      console.log('[Auth Debug] Token refresh failed:', err.message);
      await logout();
      return null;
    }
  };

  // Set up global auth handlers and cleanup
  React.useEffect(() => {
    // Initialize auth handlers but don't check auth automatically
    window.AuthRefresh = refresh;
    window.AuthLogout = logout;
    window.AuthContext = { 
      isAuthenticated, 
      setIsAuthenticated,
      checkAuth // Expose checkAuth so it can be called explicitly when needed
    };
    
    // Add browser close event listener only if authenticated
    if (isAuthenticated) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }
    
    // Skip automatic auth check on initial load
    const shouldCheckAuth = localStorage.getItem('shouldCheckAuth') === 'true';
    if (shouldCheckAuth) {
      checkAuth().then(() => {
        localStorage.removeItem('shouldCheckAuth');
      });
    }

    return () => {
      window.AuthRefresh = null;
      window.AuthLogout = null;
      window.AuthContext = null;
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isAuthenticated]);

  const value = {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    refresh,
    register,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return next(new Error('useAuth must be used within an AuthProvider'));
  }
  return context;
};

export default AuthContext;
