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
dotenv.config({ path: '../../.env' }); // Adjust based on relative depth
import { getUserByIdService, updateUserService, getUserByUsernameService } from '../services/userCRUDService.js';
import { createUserService } from '../services/security/userAuthService.js';
import { loginUserService } from '../services/security/userAuthService.js';
import passport from 'passport';
import { verifyTurnstileToken } from '../services/security/turnstileService.js';
import { verifyLoginOtpService } from '../services/security/userAuthService.js';
import { sendOtpService } from '../services/security/otpService.js';

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

// Helper to set JWT cookie with secure properties
function setJwtCookie(res, token) {
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict',
  });
}

export const loginUser = async (req, res, next) => {
    const { identifier, password, turnstileToken, otp } = req.body;
    try {
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
        if (otp) {
            // Step 2: Verify both password and OTP, then log in and set cookie
            let email = identifier;
            if (!identifier.includes('@')) {
                // If identifier is not an email, look up by username
                const user = await getUserByUsernameService(identifier);
                if (!user || !user.email) {
                    return handleResponse(res, 404, 'User not found');
                }
                email = user.email;
            }
            const result = await verifyLoginOtpService(email, otp, password); // Use email, not identifier
            setJwtCookie(res, result.token);
            handleResponse(res, 200, 'Login successful', { user: result.user, token: result.token });
        } else {
            // Step 1: Check credentials and send OTP
            const result = await loginUserService(identifier, password); // Only check credentials
            // Send OTP to user's email
            let email = identifier;
            if (!identifier.includes('@')) {
                // If identifier is not an email, look up by username
                const user = await getUserByUsernameService(identifier);
                if (!user || !user.email) {
                    return handleResponse(res, 404, 'User not found');
                }
                email = user.email;
            }
            const otpResult = await sendOtpService(email);
            handleResponse(res, 200, 'OTP sent', {
                step: 'otp',
                previewUrl: otpResult.previewUrl
            });
        }
    }
    catch (error) {
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
}

// Initiate Google OAuth authentication, no need to call to any services since this is handled by Passport.js built in function
export const googleAuth = (req, res, next) => {
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  };
  
// Handle Google OAuth callback, no need to call to any services since this is handled by Passport.js built in function
export const googleAuthCallback = (req, res, next) => {
    passport.authenticate('google', { session: false }, async (err, user, info) => {
        if (err) {
            const errorUrl = `${process.env.FE_URL}?error=${encodeURIComponent(err.message)}`;
            return res.redirect(errorUrl);
        }
        
        if (!user) {
            const errorUrl = `${process.env.FE_URL}?error=Authentication failed`;
            return res.redirect(errorUrl);
        }
        
        try {
            // Put the JWT token in a cookie
            setJwtCookie(res, user.token);
            
            // Redirect back to frontend with success
            const successUrl = `${process.env.FE_URL}?login=success&token=${user.token}`;
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
    let email = identifier;
    if (!identifier.includes('@')) {
      // If identifier is not an email, look up by username
      const user = await getUserByUsernameService(identifier);
      if (!user || !user.email) {
        return handleResponse(res, 404, 'User not found');
      }
      email = user.email;
    }
    // Send OTP to the user's email
    const result = await sendOtpService(email);
    handleResponse(res, 200, 'OTP sent', { previewUrl: result.previewUrl });
  } catch (error) {
    next(error);
  }
};