import apiClient from './apiClient';

// Function to register a new user
export const registerUser = async (userData) => {
  try {
    const response = await apiClient.post('/register', userData);
    return response.data;
  } catch (error) {
    console.error('Error during registration:', error);
    throw error;
  }
};

// Function to log in a user
export const loginUser = async ({ identifier, password, turnstileToken }) => {
  try {
    console.log('Login request payload:', { identifier, password, turnstileToken });
    const response = await apiClient.post('/login', {
      identifier,  // This can be either email or username
      password,
      turnstileToken
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
    const response = await apiClient.post('/forgot-password', { email });
    return response.data;
  } catch (error) {
    console.error('Error during password reset request:', error);
    throw error;
  }
};

// Function to get user profile
export const getUserProfile = async () => {
  try {
    console.log('Fetching user profile...');
    const response = await apiClient.get('/profile');
    console.log('User profile response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};