import apiClient from './apiClient';

// Function to register a new user
export const registerUser = async (userData) => {
  try {
    const response = await apiClient.post('/register', userData);
    return response.data;
  } catch (error) {
    console.error('Error during registration:', error);
    return next(error);
  }
};

// Function to log in a user
export const loginUser = async ({ identifier, password, turnstileToken, otp, visitorId, rememberDevice, fingerprintConfidence }) => {
  try {
    // In development mode, we don't need to send turnstileToken
    const payload = {
      identifier,
      password,
      ...(import.meta.env.MODE === 'production' ? { turnstileToken } : {}),
      ...(otp ? { otp } : {}),
      visitorId,
      rememberDevice,
      fingerprintConfidence
    };

    console.log('Login request payload:', payload);
    const response = await apiClient.post('/login', payload);
    console.log('Login response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error during login:', error);
    return next(error);
  }
};

// Function to request password reset
export const requestPasswordReset = async (email) => {
  try {
    const response = await apiClient.post('/forgot-password', { email });
    return response.data;
  } catch (error) {
    console.error('Error during password reset request:', error);
    return next(error);
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
    return next(error);
  }
};

// Function to request OTP for login (2FA)
export const sendLoginOtp = async (identifier) => {
  try {
    const response = await apiClient.post('/send-login-otp', { identifier });
    return response.data;
  } catch (error) {
    console.error('Error sending login OTP:', error);
    return next(error);
  }
};

// Function to verify OTP for login (2FA)
export const verifyLoginOtp = async ({ identifier, otp }) => {
  try {
    const response = await apiClient.post('/login/verify-otp', { identifier, otp });
    return response.data;
  } catch (error) {
    console.error('Error verifying login OTP:', error);
    return next(error);
  }
};

// Function to reset password (forgot password flow)
export const resetPassword = async ({ email, otp, newPassword }) => {
  try {
    const response = await apiClient.post('/reset-password', { email, otp, newPassword });
    return response.data;
  } catch (error) {
    console.error('Error during password reset:', error);
    return next(error);
  }
};

// Function to log out a user
export const logoutUser = async () => {
  try {
    const response = await apiClient.post('/logout');
    return response.data;
  } catch (error) {
    console.error('Error during logout:', error);
    return next(error);
  }
};

// Function to refresh tokens
export const refreshToken = async () => {
  try {
    console.log('Attempting to refresh token');
    const response = await apiClient.post('/refresh-token');
    console.log('Token refresh response:', response.data);
    
    // Return the response in the expected format
    return {
      status: response.status,
      data: {
        accessToken: response.data.data?.accessToken,
        refreshToken: response.data.data?.refreshToken
      }
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    return next(error);
  }
};