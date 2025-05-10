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
import { createUserService, getUserByIdService, updateUserService} from '../services/userCRUDService.js';
import { loginUserService } from '../services/userAuthService.js';
import passport from 'passport';
import { verifyTurnstileToken } from '../services/security/turnstileService.js';

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

export const loginUser = async (req, res, next) => {
    const { identifier, password, turnstileToken } = req.body;
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
        // Proceed with login if captcha is valid
        const result = await loginUserService(identifier, password); // Call to service function in userAuthService.js
        // Return JWT token directly
        handleResponse(res, 200, 'Login successful', {
            user: result.user,
            token: result.token
        });
    }
    catch (error) {
        next(error); // Pass error to the error handler middleware
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
            res.cookie('jwt', user.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
                sameSite: 'strict'
            });
            
            // Redirect back to frontend with success
            const successUrl = `${process.env.FE_URL}?login=success&token=${user.token}`;
            res.redirect(successUrl);
        } catch (error) {
            const errorUrl = `${process.env.FE_URL}?error=${encodeURIComponent(error.message)}`;
            res.redirect(errorUrl);
        }
    })(req, res, next);
};