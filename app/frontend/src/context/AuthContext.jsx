/**
 * AuthContext provides authentication state and methods throughout the app
 */
import React, { createContext, useState, useEffect, useContext } from 'react';
import { loginUser, registerUser } from '../api/user';

// Create the Auth Context
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Check for stored auth token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          // Verify token by fetching user profile
          const response = await fetch('http://localhost:3000/api/profile', {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
          });
          const data = await response.json();
          
          if (data.status === 200 && data.data && data.data.user) {
            setUser(data.data.user);
          } else {
            // If verification fails, clear the auth state
            localStorage.removeItem('authToken');
            setUser(null);
          }
        } catch (err) {
          console.error('Token verification failed:', err);
          localStorage.removeItem('authToken');
          setUser(null);
        }
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  const logout = () => {
    localStorage.removeItem('authToken');
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
        userData = credentials.user;
        authToken = credentials.token;
      } else {
        // Regular identifier/password login
        const response = await loginUser({
          identifier: credentials.identifier,
          password: credentials.password
        });
        if (!response.data.user || !response.data.token) {
          throw new Error('Invalid login response from server.');
        }
        userData = response.data.user;
        authToken = response.data.token;
      }
      
      // Store auth data and update state
      localStorage.setItem('authToken', authToken);
      setUser(userData);
      
      // Verify the stored token immediately
      const verifyResponse = await fetch('http://localhost:3000/api/profile', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        credentials: 'include'
      });
      const verifyData = await verifyResponse.json();
        if (verifyData.status !== 200 || !verifyData.data?.user) {
        throw new Error('Failed to verify login state');
      }
      
      return userData;
    } catch (err) {
      setError(err.message || 'Login failed.');
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
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };  const handleGoogleCallback = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('login') && urlParams.get('login') === 'success') {
        const token = urlParams.get('token');
        if (!token) {
          throw new Error('No token received from Google login');
        }

        // Store token first
        localStorage.setItem('authToken', token);

        // Get user profile with the token
        const profileResponse = await fetch('http://localhost:3000/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });
        
        const profileData = await profileResponse.json();
        if (profileData.status === 200 && profileData.data?.user) {
          setUser(profileData.data.user);
          return { user: profileData.data.user, token };
        } else {
          throw new Error('Failed to get user profile');
        }
      }
      return null;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Context value
  const contextValue = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    handleGoogleCallback
  };

  return (
    <AuthContext.Provider value={contextValue}>
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
