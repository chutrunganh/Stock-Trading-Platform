/**
 * AuthContext provides authentication state and methods throughout the app
 */
import React, { createContext, useState, useEffect, useContext } from 'react';
import { loginUser, registerUser, getUserProfile } from '../api/user';
import apiClient from '../api/apiClient';

// Create the Auth Context
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authState, setAuthState] = useState({ initialized: false });
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

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId'); // Remove user ID
    setUser(null);
  };  // Login function
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      let userData;
      let authToken;
      
      // If credentials contains both user and token (from Google login)
      if (credentials.user && credentials.token) {
        console.log('AuthContext: Processing Google login with user data:', credentials.user);
        userData = credentials.user;
        authToken = credentials.token;
      } else {
        // Regular identifier/password login
        console.log('AuthContext: Performing regular login with identifier:', credentials.identifier);
        const response = await loginUser({
          identifier: credentials.identifier,
          password: credentials.password,
          turnstileToken: credentials.turnstileToken
        });
        
        console.log('AuthContext: Login response received:', response);
        
        // Validate response for regular login
        if (!response || !response.data || !response.data.user || !response.data.token) {
          console.error('AuthContext: Invalid login response:', response);
          throw new Error('Invalid login response from server.');
        }
        
        userData = response.data.user;
        authToken = response.data.token;
      }
      
      // Store auth data and update state
      localStorage.setItem('authToken', authToken);
      console.log('Storing user ID in localStorage:', userData.id);
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
  };  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        error,
        isAuthenticated: !!user, // Add this to indicate if user is logged in
        authInitialized: authState.initialized,
        login,
        logout,
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
