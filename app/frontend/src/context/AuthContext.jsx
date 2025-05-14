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
      // If 401 or any error, user is not authenticated
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
      return;
    }

    try {
      await logoutUserApi();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Login function
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      // Ensure we have user data (from OTP verification or social login)
      if (!credentials?.user) {
        throw new Error('Invalid login credentials');
      }

      setUser(credentials.user);
      setIsAuthenticated(true);
      
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

  // Refresh token function
  const refresh = async () => {
    try {
      const response = await refreshTokenApi();
      
      // Check if we got a successful response with tokens
      if (response?.status === 200 && response?.data?.accessToken) {
        console.log('[Auth Debug] Token refresh successful');
        // Update authenticated state
        setIsAuthenticated(true);
        
        // Get user profile after successful refresh
        try {
          const userResponse = await getUserProfile();
          if (userResponse?.data?.user) {
            setUser(userResponse.data.user);
          }
        } catch (err) {
          console.log('[Auth Debug] Failed to get user profile after refresh:', err.message);
        }
        
        return response;
      }

      console.log('[Auth Debug] Token refresh failed - no valid response');
      // If refresh failed, clear state
      setUser(null);
      setIsAuthenticated(false);
      return null;
    } catch (err) {
      console.log('[Auth Debug] Token refresh failed with error:', err.message);
      // If refresh fails, log out
      await logout();
      return null;
    }
  };

  // Make refresh, logout, and auth state globally accessible for apiClient interceptor
  React.useEffect(() => {
    window.AuthRefresh = refresh;
    window.AuthLogout = logout;
    window.AuthContext = {
      isAuthenticated,
      setIsAuthenticated
    };
    
    // Check authentication status on mount
    checkAuth();
    
    return () => {
      window.AuthRefresh = null;
      window.AuthLogout = null;
      window.AuthContext = null;
    };
  }, [isAuthenticated]); // Add isAuthenticated to dependency array

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
