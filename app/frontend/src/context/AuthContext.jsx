/**
 * AuthContext provides authentication state and methods throughout the app
 */
import React, { createContext, useState, useEffect, useContext } from 'react';
import { loginUser, registerUser, getUserProfile, logoutUser as logoutUserApi, refreshToken as refreshTokenApi } from '../api/user';
import apiClient from '../api/apiClient';

// Create the Auth Context
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authState, setAuthState] = useState({ initialized: false });

  // Add window unload listener
  useEffect(() => {
    const handleUnload = () => {
      // Clear auth state when window closes
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      setUser(null);
    };

    window.addEventListener('unload', handleUnload);
    
    return () => {
      window.removeEventListener('unload', handleUnload);
    };
  }, []);

  // Check for stored auth token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      console.log('AuthContext: Checking authentication with token:', token ? 'Token exists' : 'No token');
      
      if (token) {
        try {
          // Verify token by fetching user profile
          console.log('AuthContext: Verifying token by fetching user profile...');
          const response = await getUserProfile();
          
          console.log('AuthContext: User profile response:', response);
          
          if (response && response.data && response.data.user) {
            console.log('AuthContext: User authenticated successfully:', response.data.user);
            setUser(response.data.user);
          } else {
            console.warn('AuthContext: Invalid user profile response:', response);
            localStorage.removeItem('authToken');
            setUser(null);
          }
        } catch (err) {
          console.error('AuthContext: Token verification failed:', err);
          localStorage.removeItem('authToken');
          setUser(null);
        }      } else {
        console.log('AuthContext: No auth token found');
      }
      
      setLoading(false);
      setAuthState({ initialized: true });
    };
    
    checkAuth();
  }, []);

  const logout = async () => {
    try {
      await logoutUserApi();
    } catch (err) {
      console.error('Logout API error:', err);
    }
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    setUser(null);
  };

  // Login function
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      let userData;
      let accessToken;
      
      // Only allow login if credentials contains both user and token (from Google login or OTP verification)
      if (credentials.user && credentials.token) {
        console.log('AuthContext: Processing login with user data:', credentials.user);
        userData = credentials.user;
        accessToken = credentials.token; // This is actually the accessToken
      } else {
        // Defensive: If called with only identifier/password, do NOT authenticate
        console.error('AuthContext: Invalid login attempt: missing user or token. This should only be called after OTP verification.');
        throw new Error('Login must be completed after OTP verification.');
      }
      
      // Store auth data and update state
      console.log('AuthContext: Storing accessToken in localStorage');
      localStorage.setItem('authToken', accessToken);
      console.log('AuthContext: Storing user ID in localStorage:', userData.id);
      localStorage.setItem('userId', userData.id); // Store user ID
      
      // Update user state immediately 
      console.log('AuthContext: Setting user data immediately after login:', userData);
      setUser(userData);
      
      // Force an immediate state update by dispatching an event
      window.dispatchEvent(new CustomEvent('auth-state-changed', { 
        detail: { user: userData, isAuthenticated: true }
      }));
      
      return userData;
    } catch (err) {
      setError(err.message || 'Login failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  };  // OTP verification removed

  // Register function
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await registerUser(userData);
      if (!response || !response.data) {
        throw new Error('Invalid registration response from server.');
      }
      
      // Check for specific error cases in the response
      if (response.status === 500) {
        if (response.error?.includes('users_username_key')) {
          throw new Error('Username already exists. Please choose a different username.');
        }
        if (response.error?.includes('users_email_key')) {
          throw new Error('Email already exists. Please use a different email address.');
        }
      }
      
      return response.data;
    } catch (err) {
      // Handle axios error response
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError(err.message || 'Registration failed.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Refresh token function
  const refresh = async () => {
    try {
      console.log('AuthContext: Attempting to refresh token');
      const response = await refreshTokenApi();
      
      if (response && response.data && response.data.accessToken) {
        console.log('AuthContext: Token refresh successful, storing new accessToken');
        localStorage.setItem('authToken', response.data.accessToken);
        // Optionally update user state if needed (e.g., decode token or refetch profile)
        return response.data;
      }
      
      console.warn('AuthContext: Token refresh response missing accessToken');
      return null;
    } catch (err) {
      console.error('AuthContext: Token refresh failed:', err);
      await logout();
      return null;
    }
  };

  // Make refresh and logout globally accessible for apiClient interceptor
  useEffect(() => {
    window.AuthRefresh = refresh;
    window.AuthLogout = logout;
    return () => {
      window.AuthRefresh = null;
      window.AuthLogout = null;
    };
  }, [refresh, logout]);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        error,
        isAuthenticated: !!user, // Add this to indicate if user is logged in
        authInitialized: authState.initialized,
        login,
        logout,
        refresh,
        register
      }}
    >
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
