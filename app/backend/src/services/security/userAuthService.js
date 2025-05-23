import bcrypt from 'bcrypt';
const SALT_ROUNDS = 10; // Cost factor for bcrypt
import pool from '../../config/dbConnect.js';
import User from '../../models/userModel.js';
import dotenv from 'dotenv';
import { verifyOtpService } from './otpService.js';
import OTP from '../../models/otpModel.js';
import { createDefaultHoldingsForPortfolioService } from '../holdingCRUDService.js';
import { createPortfolioForUserService } from '../portfolioCRUDService.js';
import { validatePassword } from '../../utils/passwordUtil.js';
import { isDeviceRememberedService } from './rememberedDeviceService.js';
import { rememberDeviceService } from './rememberedDeviceService.js';
import { generateTokens, refreshTokens, invalidateRefreshToken } from '../../utils/jwtUtil.js';
dotenv.config({ path: '../../.env' }); // Adjust based on relative depth

/**
 * This function handles user login. It checks if the provided identifier (email or username) and password match a user in the database. 
 * After user logs in successfully, it returns the user object and Json Web Token (JWT) for authentication.
 * 
 * @param {*} identifier - the email or username of the user to be logged in
 * @param {*} password - the password of the user typed in the login form
 * @returns 
 */
export const loginUserService = async (identifier, password, visitorId = null, confidenceScore = 0) => {
  try {
    // Fetch the user by email or username, including their portfolio_id
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.password, u.role, p.portfolio_id 
       FROM users u 
       LEFT JOIN portfolios p ON u.id = p.user_id 
       WHERE u.email = $1 OR u.username = $1`,
      [identifier]
    );
    let user = result.rows[0];
    // Generate a fake hash
    const fakeHashedPassword = '$2b$10$abcdefghijklmnopqrstuv';  // A dummy bcrypt hash
    // Determine the hashed password to use for comparison
    const hashedPassword = user ? user.password : fakeHashedPassword; // Use the actual hashed password if user exists, otherwise use a dummy hash
    // ALWAYS perform input password hash and comparison
    const isPasswordValid = await bcrypt.compare(password, hashedPassword);     
    // If user does not exist or password is incorrect, return a user-friendly error message
    if (!user || !isPasswordValid) {
      throw new Error('The username/email or password you entered is incorrect');
    }

    // Check if device is remembered (skip 2FA)
    if (visitorId) {
      const deviceCheck = await isDeviceRememberedService(user.id, visitorId, confidenceScore);
      
      if (deviceCheck.success) {
        const tokens = generateTokens({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          portfolio_id: user.portfolio_id
        });
        const result = { user: User.getSafeUser(user), ...tokens };
        
        // Add warning if present
        if (deviceCheck.warning) {
          result.warning = deviceCheck.message;
        }
        
        return result;
      }
    }

    // If device is not remembered, return step: 'otp' to trigger 2FA
    return {
      step: 'otp',
      userId: user.id,
      message: 'Please complete 2FA verification'
    };
  } catch (error) {
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
 * Creates a new user in the database.
 * @param {Object} userData - The user object as defined in the models/userModel.js file.
 * @returns {Object} - The created user object without sensitive password data.
 */
export const createUserService = async (userData) => {
  const { username, email, password } = userData;
  try {
    // Validate password policy
    const { valid, errors } = validatePassword(password, username);
    if (!valid) {
      throw new Error(errors.join(' '));
    }
    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    // Begin transaction to ensure both user and portfolio are created together
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Database operation - always set role to 'user' for API-created accounts
      const userResult = await client.query(
        'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, created_at',
        [username, email, hashedPassword, 'user']
      );
      const userId = userResult.rows[0].id;
      // Create a default portfolio for the new user and get its ID
      const portfolioId = await createPortfolioForUserService(userId, client);
      // Now create default holdings with the actual portfolio ID
      await createDefaultHoldingsForPortfolioService(portfolioId, client);
      await client.query('COMMIT');
      return User.getSafeUser(userResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    // More detailed error logging
    console.error('Full error details:', error);
    throw new Error(`Error creating user: ${error.message}`);
  }
};

/**
 * This function finds an existing user by Google ID or creates a new one if it doesn't exist.
 * It also links an existing user account with the same email to the Google account.
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
        'SELECT id, username, email, role, google_id, created_at, portfolio_id FROM users LEFT JOIN portfolios ON users.id = portfolios.user_id WHERE google_id = $1',
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
          // Create a portfolio for the new user with initial balance
          const portfolioId = await createPortfolioForUserService(user.id, client);
          // Create default holdings for the new portfolio
          await createDefaultHoldingsForPortfolioService(portfolioId, client);
          // Attach portfolio_id for token
          user.portfolio_id = portfolioId;
        }
      }
      // Commit transaction
      await client.query('COMMIT');
      // Generate JWT token and safe user
      const tokens = generateTokens({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        portfolio_id: user.portfolio_id
      });
      return { user: User.getSafeUser(user), ...tokens };
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
 *
 * Reset the user's password after verifying the OTP.
 * @param {string} email - The user's email address.
 * @param {string} otp - The OTP submitted by the user.
 * @param {string} newPassword - The new password to set.
 * @returns {Object} - A success message.
 */
export const resetPasswordService = async (email, otp, newPassword) => {
  const normalizedEmail = email.trim().toLowerCase();
  try {
    // Fetch username for this email
    const userResult = await pool.query('SELECT username FROM users WHERE email = $1', [normalizedEmail]);
    const user = userResult.rows[0];
    if (!user) {
      throw new Error('User not found');
    }
    // Validate the new password using the same policy as registration
    const { valid, errors } = validatePassword(newPassword, user.username);
    if (!valid) {
      throw new Error(errors.join(' '));
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

export const verifyLoginOtpService = async (identifier, otp, password, visitorId = null, rememberDevice = false, fingerprintConfidence = 0) => {
  // First, check password
  const loginResult = await loginUserService(identifier, password, visitorId, fingerprintConfidence); 
  // If login result has accessToken, it means device was remembered and 2FA was skipped
  if (loginResult.accessToken) {
    return loginResult;
  }
  // Always resolve identifier to email
  let email = identifier;
  if (!identifier.includes('@')) {
    // Look up by username
    const userResult = await pool.query('SELECT email FROM users WHERE username = $1', [identifier]);
    const user = userResult.rows[0];
    if (!user || !user.email) {
      throw new Error('User not found');
    }
    email = user.email;
  }
  // Then, check OTP
  const isValidOtp = await verifyOtpService(email, otp);
  if (!isValidOtp) {
    throw new Error('Invalid OTP');
  }
  try {
    // Fetch the user by email
    const userResult = await pool.query(
      'SELECT id, username, email, role FROM users WHERE email = $1',
      [email]
    );
    const user = userResult.rows[0];
    if (!user) {
      throw new Error('User not found');
    }
    // If rememberDevice is true and visitorId is provided, remember this device
    let deviceWarning = null;
    if (rememberDevice && visitorId) {
      const rememberResult = await rememberDeviceService(user.id, visitorId, fingerprintConfidence);
      if (rememberResult.warning) {
        deviceWarning = rememberResult.message;
      }
    }
    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
    // Delete the OTP after successful verification
    await OTP.deleteByEmail(email);
    const result = { user: User.getSafeUser(user), accessToken, refreshToken };
    if (deviceWarning) {
      result.warning = deviceWarning;
    }
    return result;
  } catch (error) {
    console.error('Error in verifyLoginOtpService:', error.message);
    throw error;
  }
};

export const logoutUserService = async (userId) => {
  if (userId) {
    // Invalidate the refresh token for this user
    invalidateRefreshToken(userId);
  }
  return { message: 'Logged out successfully' };
};

/**
 * Refresh access token using a valid refresh token.
 * @param {string} refreshToken
 * @returns {{ accessToken: string }}
 */
export const refreshAccessTokenService = async (refreshToken) => {
  try {
    // This will throw if invalid/expired
    const { accessToken } = refreshTokens(refreshToken);
    return { accessToken };
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};