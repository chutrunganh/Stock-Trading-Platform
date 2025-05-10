/**
 * @file userRoutes.js
 * @description This file defines the routes for user-related operations in the application like CRUD, login, and registration.
 */

import express from 'express';
import { registerUser, getAllUsers, getUserById, updateUser, deleteUser, loginUser, googleAuth, googleAuthCallback } from '../controllers/userControllers.js';
import { validateUser, validateUserUpdate, validateLogin } from '../middlewares/userValidationMiddleware.js';
import authorizeRole from '../middlewares/roleBasedAccessControlMiddleware.js';
import authMiddleware from '../middlewares/authenticationMiddleware.js';


const router = express.Router();

// Routes realted to user operations arranged in privileged order

// 1. Public routes (no authentication required)
router.get("/", (req, res) => {}); // Placeholder for homepage route

// Traditional login and registration routes
router.post("/register", validateUser, registerUser); // Register a new user
// Debug middleware to log request body
const logRequestBody = (req, res, next) => {
  console.log('Login request body:', req.body);
  next();
};

router.post("/login", logRequestBody, validateLogin, loginUser);  // User login

// Google OAuth routes
// when user click on "Login with Google" button in frontend, they will be forward to  uor backend endpoint /apiapi/auth/google
// Our backend then redirect user to Google authentication page
// After user successfully authenticate with Google, they will be redirected back to our backend endpoint /apiapi/auth/google/callback
// Our backend then handle the authentication and create a new user in our database if they don't exist yet
// Then your backend will send the user information and redirect user back to the frontend
router.get("/auth/google", googleAuth); // Google SSO authentication initiate
router.get("/auth/google/callback", googleAuthCallback);  // Google SSO authentication callback


// 2.Protected routes (authentication required)
router.get("/profile", authMiddleware, (req, res) => {
  // Return the authenticated user's information with all needed fields
  res.status(200).json({
    status: 200,
    message: 'Authentication successful',
    data: {
      user: {
        ...req.user,
        google_id: req.user.google_id || null,
        created_at: req.user.created_at || new Date().toISOString()
      }
    }
  });
}); // User profile route to test authentication


router.post("/logout", authMiddleware, (req, res) => {}); // Placeholder for user logout route


// 3. Protected routes (authentication required) + Authorization (admin role required)
router.get("/admin/dashboard", authMiddleware, authorizeRole('admin'), (req, res) => {}); // Placeholder for admin dashboard route

export default router;