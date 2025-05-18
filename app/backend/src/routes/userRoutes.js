/**
 * @file userRoutes.js
 * @description This file defines the routes for user-related operations in the application like CRUD, login, and registration.
 */

import express from 'express';
import { registerUser, getAllUsers, getUserById, updateUser, deleteUser, loginUser, googleAuth, googleAuthCallback, sendLoginOtpController, forgotPasswordController, resetPasswordController, logoutUser, refreshToken } from '../controllers/userControllers.js';
import { validateUser, validateUserUpdate, validateLogin } from '../middlewares/userValidationMiddleware.js';
import { requireAdminRole } from '../middlewares/roleBasedAccessControlMiddleware.js';
import authMiddleware, { refreshTokenMiddleware } from '../middlewares/authenticationMiddleware.js';

const router = express.Router();

// Public routes (no authentication required)
router.post("/register", validateUser, registerUser);
router.post("/login", validateLogin, loginUser);
router.post("/send-login-otp", sendLoginOtpController);
router.post("/forgot-password", forgotPasswordController);
router.post("/reset-password", resetPasswordController);
router.get("/auth/google", googleAuth);
router.get("/auth/google/callback", googleAuthCallback);

// Protected routes (authentication required)
router.post("/logout", authMiddleware, logoutUser);
router.post("/refresh-token", refreshTokenMiddleware, refreshToken);
router.get("/profile", authMiddleware, (req, res) => {
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
});

// Admin-only routes
router.get("/users", authMiddleware, requireAdminRole, getAllUsers);
router.get("/users/:id", authMiddleware, requireAdminRole, getUserById);
router.put("/users/:id", authMiddleware, requireAdminRole, validateUserUpdate, updateUser);
router.delete("/users/:id", authMiddleware, requireAdminRole, deleteUser);

export default router;