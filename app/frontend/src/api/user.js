import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// Function to register a new user
export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/register`, userData);
    return response.data;
  } catch (error) {
    console.error('Error during registration:', error);
    throw error;
  }
};

// Function to log in a user
export const loginUser = async ({ identifier, password }) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/login`, {
      identifier,  // This can be either email or username
      password
    }, {
      withCredentials: true, // To include cookies in the request
    });
    console.log('Login response:', response.data); // Debug log to verify response structure
    return response.data;
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
};

// Function to request password reset
export const requestPasswordReset = async (email) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/forgot-password`, { email });
    return response.data;
  } catch (error) {
    console.error('Error during password reset request:', error);
    throw error;
  }
};

// Function to get user profile
export const getUserProfile = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/profile`, {
      withCredentials: true,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};