import bcrypt from 'bcrypt';
const SALT_ROUNDS = 10; // Cost factor for bcrypt
import pool from '../config/dbConnect.js';
import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' }); // Adjust based on relative depth

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

    // If user does not exist or password is incorrect, return the same error message
    if (!user || !isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // If user authenticated successfully, generate JWT token
    const userForToken = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      portfolio_id: user.portfolio_id
    };

    // Create JWT token with user info and secret key from environment variables
    const token = jwt.sign(
      userForToken,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Return user info and token
    return {
      user: User.getSafeUser(user),
      token
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
 * For user register function, just use the userCreateService, findOrCreateGoogleUserService function in userCRUDService.js
 */


