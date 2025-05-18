/** 
 * The userCRUDService.js file contains the service functions that handle the business logic, in this case 
 * is SQL queries, for the user-related operations. it interract with the database through ORM userModel.js
 * 
 * When writing SQL queries, it's important to use $1, $2, etc. as placeholders for parameters to prevent SQL injection attacks.
*/
import bcrypt from 'bcrypt';
import pool from '../config/dbConnect.js';
import User from '../models/userModel.js';
import dotenv from 'dotenv';
import {SALT_ROUNDS } from '../config/constants.js';
dotenv.config({ path: '../../.env' }); // Adjust based on relative depth


/**
 * The create user service function have been moved to the userAuthService.js file since it contain some login related to security.
 */


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



