/** 
 * The userCRUDService.js file contains the service functions that handle the business logic, in this case 
 * is SQL queries, for the user-related operations. it interract with the database through ORM userModel.js
 * 
 * When writing SQL queries, it's important to use $1, $2, etc. as placeholders for parameters to prevent SQL injection attacks.
*/
import bcrypt from 'bcrypt';
import pool from '../config/dbConnect.js';
import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { createDefaultHoldingsForPortfolioService } from './holdingCRUDService.js';
import { createPortfolioForUserService } from './portfolioCRUDService.js';
import {SALT_ROUNDS } from '../config/constants.js';
dotenv.config({ path: '../../.env' }); // Adjust based on relative depth


/**
 * Creates a new user in the database.
 * @param {Object} userData - The user object as defined in the models/userModel.js file.
 * @returns {Object} - The created user object without sensitive password data.
 * 
 * This function is responsible for handling the logic of creating a new user. It hashes the user's password
 * using bcrypt before storing it in the database to ensure security. The role is always set to 'user' for 
 * accounts created via the API, and admin accounts can only be created through direct database queries.
 *
 * To store the password securely, we use bcrypt to hash the password before storing it in the database. How does bcrypt work?
 * 
 * 1. It auto generates a random salt, concatenates it with the password, and then hashes the result. This will prevent attackers from 
 * using precomputed hash tables (rainbow tables) to crack the password.
 * 
 * 2. bycrpyt use slow hashing algorithm, which makes it computationally expensive to brute-force the password. The cost factor (SALT_ROUNDS) determines how many 
 * iterations of the hashing algorithm are performed. A higher cost factor means more iterations, making it harder to crack the password. In the code, we
 * use 10 rounds which tells bcrypt to perform 2^10 iterations of the hashing algorithm. The larger the number of rounds, the more secure the hash is, but it also requires
 * more hardware resources to compute. As OWASP recommends, a cost factor should be at least 10.
 * 
 * So in theory, when user register, the process would be: hash(password_user_input + salt), we store this result in the database. When the user 
 * tries to log in, take in the password they entered, hash it again with the SAME salt, and compare the result to the stored hash. This means we need to store 
 * both the hashed password and the salt in the database corresponding to user account. However, in practicular, we do not need to create another field in the database or write any code to store the salt, brypt 
 * automaticaly handles that under the hood. For more detail, bycrypt auto includes the salt in the output string itself, so when you hash a password, the output will include both the salt and the 
 * hash. The output string is something like this:
 * 
 * $2a$10$abcdefghijklmnopqrstuu3guuo/XeYbYBk7Zenk4Yf9XuYoeZ4JWD
 * 
 * With:
 * - $2a$: The bcrypt version identifier.
 * - $10$: The cost factor (SALT_ROUNDS).
 * - abcdefghijklmnopqrstuu: The salt used for hashing (22 characters).
 * - 3guuo/XeYbYBk7Zenk4Yf9XuYoeZ4JWD: The actual hashed password.
 */
export const createUserService = async (userData) => {
  const { username, email, password } = userData;
  
  try {
    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    // Begin transaction to ensure both user and portfolio are created together
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Debug log to see what data is being received
      console.log('Creating user with data:', { username, email, password: '***' });
    
      // Database operation - always set role to 'user' for API-created accounts
      // Admin accounts can only be created by direct database queries
      const userResult = await client.query(
        'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, created_at',
        [username, email, hashedPassword, 'user'] // Always set role to 'user', ignore any role value provided in request
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
      let isNewUser = false;
      
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
          isNewUser = true;
          
          // Create a portfolio for the new user with initial balance
          const portfolioId = await createPortfolioForUserService(user.id, client);
          
          // Create default holdings for the new portfolio
          await createDefaultHoldingsForPortfolioService(portfolioId, client);
        }
      }
      
      // Commit transaction
      await client.query('COMMIT');
      
      // Generate JWT token
      const userForToken = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        portfolio_id: user.portfolio_id
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
 *  * This function retrieves a user by their ID from the database. It returns the user object without sensitive data like password.
 * If the user is not found, it throws an error.
 * 
 * @param {*} id - the id of the user to be retrieved
 * 
 */
export const getUserByIdService = async (id) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
      [id]
    );
    
    if (!result.rows[0]) {
      throw new Error('User not found');
    }
    
    return User.getSafeUser(result.rows[0]);
  } catch (error) {
    throw error;
  }
};


/**
 * This function updates a user's information in the database. It allows updating username, email, 
 * password, and role (can not update to 'admin' role through API).
 * 
 * @param {*} id - the id of the user to be updated
 * @param {*} userData - the user object containing the updated data
 * @returns - the updated user object without sensitive data
 * 
 */
export const updateUserService = async (id, userData) => {
  const { username, email, password, role } = userData;
  
  try {
    // First check if user exists
    const user = await pool.query('SELECT id, role FROM users WHERE id = $1', [id]);
    if (!user.rows[0]) {
      throw new Error('User not found');
    }
    
    // Build the query dynamically based on what fields were provided
    let queryText = 'UPDATE users SET ';
    const queryParams = [];
    const updates = [];
    
    if (username !== undefined) {
      queryParams.push(username);
      updates.push(`username = $${queryParams.length}`);
    }
    
    if (email !== undefined) {
      queryParams.push(email);
      updates.push(`email = $${queryParams.length}`);
    }
    
    if (password !== undefined) {
      // Hash the password before updating
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      queryParams.push(hashedPassword);
      updates.push(`password = $${queryParams.length}`);
    }
    
    // Prevent changing role to 'admin' through the API
    // Only allow updating role if it's not being set to 'admin'
    if (role !== undefined && role !== 'admin') {
      queryParams.push(role);
      updates.push(`role = $${queryParams.length}`);
    }
    
    // If no updates, return the existing user
    if (updates.length === 0) {
      const result = await pool.query(
        'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
        [id]
      );
      return User.getSafeUser(result.rows[0]);
    }
    
    queryText += updates.join(', ');
    queryParams.push(id);
    queryText += ` WHERE id = $${queryParams.length} RETURNING id, username, email, role, created_at`;
    
    const result = await pool.query(queryText, queryParams);
    return User.getSafeUser(result.rows[0]);
  } catch (error) {
    throw error;
  }
};

/**
 * Get a user by email.
 * @param {string} email
 * @returns {Object|null} user object or null
 */
export const getUserByEmailService = async (email) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.role, u.created_at, u.updated_at, u.google_id, p.portfolio_id
       FROM users u
       LEFT JOIN portfolios p ON u.id = p.user_id
       WHERE u.email = $1`,
      [email]
    );
    return result.rows[0] || null;
  } catch (error) {
    throw error;
  }
};

export const getUserByUsernameService = async (username) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, role, created_at FROM users WHERE username = $1`,
      [username]
    );
    return result.rows[0] || null;
  } catch (error) {
    throw error;
  }
};



