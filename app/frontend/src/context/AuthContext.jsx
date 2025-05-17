/**
 * AuthContext provides authentication state and methods throughout the app
 * Authentication is handled via HTTP-only cookies (access token and refresh token)
 */
import React, { createContext, useState, useContext } from 'react';
import { loginUser, registerUser, getUserProfile, logoutUser as logoutUserApi, refreshToken as refreshTokenApi } from '../api/user';

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
      const response = await getUserProfile();
      if (response?.data?.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return true;
      }
    } catch (err) {
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
      // Remove userId from localStorage
      localStorage.removeItem('userId');
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
        throw new Error('Invalid login credentials');
      }

      setUser(credentials.user);
      setIsAuthenticated(true);
      
      // Store userId in localStorage for order match notifications
      if (credentials.user.id) {
        localStorage.setItem('userId', credentials.user.id);
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
        throw new Error('Invalid registration response');
      }
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
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
    window.AuthRefresh = refresh;
    window.AuthLogout = logout;
    window.AuthContext = { isAuthenticated, setIsAuthenticated };
    
    // Add browser close event listener
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Check authentication status on mount
    checkAuth();
    
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
