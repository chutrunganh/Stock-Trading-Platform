import { sendOtpService } from './otpService.js';
import pool from '../config/dbConnect.js';

/**
 * Forgot Password Service
 * Handles sending OTP for password reset
 * @param {string} email - The email address of the user
 */
export const forgotPasswordService = async (email) => {
  try {
    if (!email) {
      throw new Error('Email is required');
    }

    // Check if the user exists in the database
    const result = await pool.query('SELECT id, email FROM users WHERE email = $1', [email]); // Use pool instead of db
    if (result.rows.length === 0) {
      throw new Error('No user found with this email address');
    }

    // Send OTP to the user's email
    await sendOtpService(email);

    return { message: 'OTP sent successfully to your email.' };
  } catch (error) {
    console.error('Error in forgotPasswordService:', error.message);
    throw new Error(error.message || 'Failed to send OTP');
  }
};