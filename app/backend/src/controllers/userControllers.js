/**
 * @file userController.js
 * @description This file contains the controller functions for frontend to interact with the user CRUD service and user authentication service, which incluides:
 * - Register a new user
 * - Get all users
 * - Get a user by ID
 * - Update a user by ID
 * - Delete a user by ID
 * - Login a user (via email/password or Google SSO), also set the JWT token in a cookie to return to the client
 */
import dotenv from 'dotenv';
dotenv.config({ path: '../../../../.env' }); // Adjust based on relative depth
import { getUserByIdService, updateUserService, getUserByUsernameService } from '../services/userCRUDService.js';
import { createUserService } from '../services/security/userAuthService.js';
import { loginUserService } from '../services/security/userAuthService.js';
import passport from 'passport';
import { verifyTurnstileToken } from '../services/security/turnstileService.js';
import { verifyLoginOtpService } from '../services/security/userAuthService.js';
import { sendOtpService } from '../services/security/otpService.js';
import { resetPasswordService } from '../services/security/userAuthService.js';
import { logoutUserService, refreshAccessTokenService } from '../services/security/userAuthService.js';
import { setAuthCookies } from '../utils/setCookieUtil.js';

// Standardized response format
const handleResponse = (res, status, message, data = null) => {
  return res.status(status).json({
    status,
    message,
    data,
  });
}

// Add 'next' parameter to all controller functions to pass to error handler middleware
export const registerUser = async (req, res, next) => {
    const { username, email, password } = req.body;
    console.log(req.body);
    try {
        const newUser = await createUserService({ username, email, password }); // Call to service function in userCRUDService.js
        handleResponse(res, 201, 'User created successfully', newUser);
    }
    catch (error) {
        next(error); // Pass error to the error handler middleware
    }
}

export const getAllUsers = async (req, res, next) => {
    try {
        const users = await getAllUsersService();
        handleResponse(res, 200, 'List of users', users);
    }
    catch (error) {
        next(error); // Pass error to the error handler middleware
    }
}

export const getUserById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const user = await getUserByIdService(id);  // Call to service function in userCRUDService.js
        if (!user) {
            return handleResponse(res, 404, 'User not found');
        }
        handleResponse(res, 200, 'User found', user);
    }
    catch (error) {
        next(error); // Pass error to the error handler middleware
    }
}

export const updateUser = async (req, res, next) => {
    const { id } = req.params;
    const { username, email, password } = req.body;
    try {
        const updatedUser = await updateUserService(id, { username, email, password });  // Call to service function in userCRUDService.js
        if (!updatedUser) {
            return handleResponse(res, 404, 'User not found');
        }
        handleResponse(res, 200, 'User updated successfully', updatedUser);
    }
    catch (error) {
        next(error); // Pass error to the error handler middleware
    }
}

export const deleteUser = async (req, res, next) => {
    const { id } = req.params;
    try {
        const deletedUser = await deleteUserService(id);  // Call to service function in userCRUDService.js
        if (!deletedUser) {
            return handleResponse(res, 404, 'User not found');
        }
        handleResponse(res, 200, 'User deleted successfully', deletedUser);
    }
    catch (error) {
        next(error); // Pass error to the error handler middleware
    }
}

// Helper to resolve email from identifier (email or username)
async function resolveEmailFromIdentifier(identifier) {
  if (!identifier.includes('@')) {
    const user = await getUserByUsernameService(identifier);
    if (!user || !user.email) {
      return next(new Error('User not found'));
    }
    return user.email;
  }
  return identifier;
}

export const loginUser = async (req, res, _next) => {
    const { identifier, password, turnstileToken, otp, visitorId, rememberDevice, fingerprintConfidence } = req.body;
    try {
        // Skip Turnstile verification in development
        if (process.env.NODE_ENV === 'production') {
            // Verify Turnstile token before authenticating
            const remoteip = req.ip || req.connection?.remoteAddress;
            const turnstileResult = await verifyTurnstileToken(turnstileToken, remoteip);
            if (!turnstileResult.success) {
                return res.status(400).json({
                    status: 400,
                    message: 'Captcha verification failed. Please try again.',
                    error: turnstileResult["error-codes"] || turnstileResult.error || 'Unknown error',
                });
            }
        }

        if (otp) {
            // Step 2: Verify both password and OTP, then log in and set cookie
            let email;
            try {
              email = await resolveEmailFromIdentifier(identifier);
            } catch (err) {
              return handleResponse(res, 404, err.message);
            }
            const result = await verifyLoginOtpService(email, otp, password, visitorId, rememberDevice, fingerprintConfidence);
            
            // Log token information for debugging
            console.log('OTP verification successful - Tokens generated:', { 
              accessTokenExists: !!result.accessToken,
              refreshTokenExists: !!result.refreshToken,
              accessTokenLength: result.accessToken?.length,
              refreshTokenLength: result.refreshToken?.length
            });
            
            setAuthCookies(res, result.accessToken, result.refreshToken);
            return handleResponse(res, 200, 'Login successful', { 
                user: result.user, 
                token: result.accessToken // Consistent naming: this is the accessToken
            });
        } else {
            // Step 1: Check credentials and send OTP
            const result = await loginUserService(identifier, password, visitorId, fingerprintConfidence);
            
            // If result has accessToken, it means device was remembered and 2FA was skipped
            if (result.accessToken) {
                console.log('Device remembered - Skipping 2FA - Tokens generated:', { 
                  accessTokenExists: !!result.accessToken,
                  refreshTokenExists: !!result.refreshToken,
                  accessTokenLength: result.accessToken?.length,
                  refreshTokenLength: result.refreshToken?.length
                });
                
                setAuthCookies(res, result.accessToken, result.refreshToken);
                
                // If there's a warning about low confidence, include it in the response
                if (result.warning) {
                    return handleResponse(res, 200, 'Login successful', {
                        user: result.user,
                        token: result.accessToken, // Consistent naming: this is the accessToken
                        warning: result.warning
                    });
                }
                
                return handleResponse(res, 200, 'Login successful', {
                    user: result.user,
                    token: result.accessToken // Consistent naming: this is the accessToken
                });
            }

            // Send OTP to user's email
            let email;
            try {
              email = await resolveEmailFromIdentifier(identifier);
            } catch (err) {
              return handleResponse(res, 404, err.message);
            }
            const otpResult = await sendOtpService(email);
            handleResponse(res, 200, 'OTP sent', {
                step: 'otp',
                previewUrl: otpResult.previewUrl
            });
        }
    } catch (error) {
        // Graceful error handling for incorrect credentials
        if (error.message === 'The username/email or password you entered is incorrect') {
            return res.status(401).json({
                status: 401,
                message: 'Incorrect username/email or password. Please try again.'
            });
        }
        // Other errors
        return res.status(500).json({
            status: 500,
            message: 'Server error. Please try again later.'
        });
    }
};

// Initiate Google OAuth authentication, no need to call to any services since this is handled by Passport.js built in function
export const googleAuth = (req, res, next) => {
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  };
  
// Handle Google OAuth callback, no need to call to any services since this is handled by Passport.js built in function
export const googleAuthCallback = (req, res, next) => {
    passport.authenticate('google', { session: false }, async (err, user, _info) => {
        if (err) {
            const errorUrl = `${process.env.FE_URL}?error=${encodeURIComponent(err.message)}`;
            return res.redirect(errorUrl);
        }
        
        if (!user) {
            const errorUrl = `${process.env.FE_URL}?error=Authentication failed`;
            return res.redirect(errorUrl);
        }
        
        try {
            // Log token information for debugging
            console.log('Google auth successful - Tokens generated:', { 
              accessTokenExists: !!user.accessToken,
              refreshTokenExists: !!user.refreshToken,
              accessTokenLength: user.accessToken?.length,
              refreshTokenLength: user.refreshToken?.length
            });
            
            // Put the access token in a cookie
            setAuthCookies(res, user.accessToken, user.refreshToken);
            
            // Redirect back to frontend with success - use accessToken for consistency
            const successUrl = `${process.env.FE_URL}?login=success&token=${user.accessToken}`;
            res.redirect(successUrl);
        } catch (error) {
            const errorUrl = `${process.env.FE_URL}?error=${encodeURIComponent(error.message)}`;
            res.redirect(errorUrl);
        }
    })(req, res, next);
};

// Send OTP for login (2FA)
export const sendLoginOtpController = async (req, res, next) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return handleResponse(res, 400, 'Identifier (email or username) is required');
    }
    // Find user by email or username
    let email;
    try {
      email = await resolveEmailFromIdentifier(identifier);
    } catch (err) {
      return handleResponse(res, 404, err.message);
    }
    // Send OTP to the user's email
    const result = await sendOtpService(email);
    handleResponse(res, 200, 'OTP sent', { previewUrl: result.previewUrl });
  } catch (error) {
    next(error);
  }
};

// Send OTP for forgot password
export const forgotPasswordController = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return handleResponse(res, 400, 'Email is required');
    }
    const result = await sendOtpService(email);
    handleResponse(res, 200, 'OTP sent for password reset', { previewUrl: result.previewUrl });
  } catch (error) {
    next(error);
  }
};

// Reset password after OTP verification
export const resetPasswordController = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return handleResponse(res, 400, 'Email, OTP, and new password are required');
    }
    const result = await resetPasswordService(email, otp, newPassword);
    handleResponse(res, 200, result.message);
  } catch (error) {
    next(error);
  }
};

// Logout controller
export const logoutUser = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    await logoutUserService(userId); // The logout service should invalidate/delete the refresh token from the database/memory

    // Send request to client to delete the cookies on the client side
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    handleResponse(res, 200, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

// Refresh token controller
export const refreshToken = async (req, res, _next) => {
  try {
    // The refresh token has already been verified by the middleware
    const refreshToken = req.refreshToken;
    
    console.log('Generating new access token with verified refresh token');
    
    const { accessToken } = await refreshAccessTokenService(refreshToken);
    
    if (!accessToken) {
      return next(new Error('Failed to generate new access token'));
    }
    
    console.log('Token refresh successful:', {
      newAccessTokenExists: !!accessToken,
      newAccessTokenLength: accessToken?.length
    });
    
    // Set the new access token cookie with proper configuration
    setAuthCookies(res, accessToken, null); // Only set the new access token, keep existing refresh token
    
    handleResponse(res, 200, 'Token refreshed successfully', { accessToken });
  } catch (error) {
    console.error('Token refresh failed:', error.message);
    handleResponse(res, 401, error.message || 'Invalid or expired refresh token');
  }
};