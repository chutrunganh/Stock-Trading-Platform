import bcrypt from 'bcrypt';
const SALT_ROUNDS = 10; // Cost factor for bcrypt
import pool from '../config/dbConnect.js';
import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import {sendOtpService,verifyOtpService } from './otpService.js';
import OTP from '../models/otpModel.js';
dotenv.config({ path: '../../.env' }); // Adjust based on relative depth
//track login attempts to prevent brute force attacks
const MAX_LOGIN_ATTEMPTS = 10; // Maximum allowed login attempts
const loginAttempts = {};
/**
 * This function handles user login. It checks if the provided identifier (email or username) and password match a user in the database. 
 * After user logs in successfully, it returns the user object and Json Web Token (JWT) for authentication.
 * 
 * @param {*} identifier - the email or username of the user to be logged in
 * @param {*} password - the password of the user typed in the login form
 * @returns 
 */
export const loginUserService = async (identifier, password) => {
  try {
    console.log('Starting loginUserService...');
    const now = Date.now();
    // Fetch the user by email or username
    console.log('Fetching user from database...');
    const result = await pool.query(
      'SELECT id, username, email, password, role FROM users WHERE email = $1 OR username = $1',
      [identifier]
    );

    let user = result.rows[0];
    console.log('User fetched:', user);

    // Generate a fake hash
    const fakeHashedPassword = '$2b$10$abcdefghijklmnopqrstuv';  // A dummy bcrypt hash
    
    // Determine the hashed password to use for comparison
    const hashedPassword = user ? user.password : fakeHashedPassword; // Use the actual hashed password if user exists, otherwise use a dummy hash

    // ALWAYS perform input password hash and comparison
    const isPasswordValid = await bcrypt.compare(password, hashedPassword); 
    // Initialize or update login attempts
    if (!loginAttempts[identifier]) {
      loginAttempts[identifier] = { wrong_password_attempts: 0, last_attempt_time: Date.now };
    }

    const { wrong_password_attempts, last_attempt_time } = loginAttempts[identifier];

    // Handle invalid credentials
    if (!user || !isPasswordValid) {
      // Increment wrong password attempts
      console.log('Invalid credentials. Updating login attempts...');
      loginAttempts[identifier].wrong_password_attempts += 1;
      loginAttempts[identifier].last_attempt_time = now;

      // Check for 5th wrong attempt (cooldown)
      if (wrong_password_attempts + 1 >= 5 && now - last_attempt_time < 60000) {
        throw new Error('Too many failed attempts. Please try again in 1 minute.');
      }

      // Check for 10th wrong attempt (block and send OTP)
      if (wrong_password_attempts + 1 >= 10) {

        throw new Error('Too many failed attempts. Redirect to Forgot Password.');
      }

      // For all other invalid attempts
      throw new Error('Invalid credentials');
    }
    
    // Reset login attempts on successful login
    if (loginAttempts[identifier]) {
      delete loginAttempts[identifier];
    }
    await sendOtpService(user.email);

    return { message: 'OTP sent to your email. Please verify to log in.' };
  } catch (error) {
    console.error('Error in loginUserService:', error.message);
    throw error;
  }
};

/**
 * More info, How does bcrypt.compare work under the hood?
 * 
 * 1. It extracts the salt and cost factor from string of the hashed password.
 * 2. It hashes the user input password with the extracted salt and cost factor.
 * 3. It compares the newly hashed password with the stored hashed password. This comparison uses a
 * constant-time algorithm instead of naive === comparison to prevent timing attacks (This timming attack is mention about gesting the password one character at a time aspect, not 
 * for the timing attack in bruce force login name we mentione earlier).
 * 
 * Why using === comparison is not a good idea?
 * 
 * String comparision is JavaScript with === termiates as soon as it finds a mismatch. This means if two strings are not the same length or have 
 * an early mismatch, === stops immediately. An attacker can measure response time and gradually guess the correct password one character at a time.
 * 
 */



/**
 * This function finds an existing user by Google ID or creates a new one if it doesn't exist.
 * It also links an existing user account with the same email to the Google account.
 * 
 * @param {Object} userData - Data received from Google OAuth containing google_id, email, username
 * @returns {Object} - The user object and JWT token
 */
export const findOrCreateGoogleUserService = async (userData) => {
  const { google_id, email, username } = userData;
  
  try {
    // Begin transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // First check if user exists with this Google ID
      let result = await client.query(
        'SELECT id, username, email, role, google_id, created_at FROM users WHERE google_id = $1',
        [google_id]
      );
      
      let user = result.rows[0];
      
      // If no user found with Google ID, check if user exists with the same email
      if (!user) {
        result = await client.query(
          'SELECT id, username, email, role, google_id, created_at FROM users WHERE email = $1',
          [email]
        );
        
        user = result.rows[0];
        
        // If user exists with same email but no Google ID, link the accounts
        if (user) {
          result = await client.query(
            'UPDATE users SET google_id = $1 WHERE id = $2 RETURNING id, username, email, role, google_id, created_at',
            [google_id, user.id]
          );
          
          user = result.rows[0];
        } 
        // If no user exists at all, create a new one
        else {
          result = await client.query(
            'INSERT INTO users (username, email, google_id, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, google_id, created_at',
            [username, email, google_id, 'user']
          );
          
          user = result.rows[0];
        }
      }
      
      // Commit transaction
      await client.query('COMMIT');
      
      // Generate JWT token
      const userForToken = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      };
      
      const token = jwt.sign(
        userForToken,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );
      
      return {
        user: User.getSafeUser(user),
        token
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    throw new Error(`Error during Google authentication: ${error.message}`);
  }
};

/** 
 * For user register function, just use the userCreateService function in userCRUDService.js
 */
/**
 * Reset the user's password after verifying the OTP.
 * @param {string} email - The user's email address.
 * @param {string} otp - The OTP submitted by the user.
 * @param {string} newPassword - The new password to set.
 * @returns {Object} - A success message.
 */
export const resetPasswordService = async (email, otp, newPassword) => {
  const normalizedEmail = email.trim().toLowerCase();

  // Password regex for validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,72}$/;

  try {
    // Validate the new password against the regex
    if (!passwordRegex.test(newPassword)) {
      throw new Error(
        'Password must include uppercase, lowercase, numbers, symbols, and be 8-72 characters long.'
      );
    }

    // Verify OTP first
    await verifyOtpService(email, otp);

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in the database
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2',
      [hashedPassword, normalizedEmail]
    );

    if (result.rowCount === 0) {
      throw new Error('Failed to update password');
    }

    // Delete the OTP after successful password reset
    await OTP.deleteByEmail(normalizedEmail);

    return { message: 'Password reset successfully' };
  } catch (error) {
    console.error('Error in resetPasswordService:', error.message);
    throw new Error(error.message || 'Failed to reset password');
  }
};
export const verifyLoginOtpService = async (email, otp) => {
  const isValidOtp = await verifyOtpService(email, otp); // Verify OTP
  if (!isValidOtp) {
    throw new Error('Invalid OTP');
  }
  try {
    // Verify the OTP  const isValidOtp = await verifyOtpService(email, otp); // Verify OTP
  if (!isValidOtp) {
    throw new Error('Invalid OTP');
  }

    // Fetch the user by email
    const userResult = await pool.query(
      'SELECT id, username, email, role FROM users WHERE email = $1',
      [email]
    );

    const user = userResult.rows[0];
    if (!user) {
      throw new Error('User not found');
    }

    // Generate JWT token
    const userForToken = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(userForToken, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    });

    // Delete the OTP after successful verification
    await OTP.deleteByEmail(email);

    return { user: User.getSafeUser(user), token };
  } catch (error) {
    console.error('Error in verifyLoginOtpService:', error.message);
    throw error;
  }
};