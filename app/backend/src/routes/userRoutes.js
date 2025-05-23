/**
 * @file userRoutes.js
 * @description This file defines the routes for user-related operations in the application like CRUD, login, and registration.
 */

import express from 'express';
import { registerUser, loginUser, googleAuth, googleAuthCallback, sendLoginOtpController, forgotPasswordController, resetPasswordController, logoutUser, refreshToken } from '../controllers/userControllers.js';
import { validateUser, validateLogin } from '../middlewares/userValidationMiddleware.js';
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

export default router;