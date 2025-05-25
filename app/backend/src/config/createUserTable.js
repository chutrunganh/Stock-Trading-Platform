/**
 * @file createUserTable.js
 * @description This file contains the function to create the user table in the database.
 * Each user will have:
 * - A unique username
 * - A unique email address
 * - Password for authentication
 * - Google ID for SSO authentication. Note that in case the user registers with Google email that already used 
 * when registering with username and password, then they will be merged into one account.
 * - Role: user or admin. Creata account from frontend can only be user role. There is no way to creata admin account except run query directly in database.
 * - Created at: timestamp of when the account was created.
 * - Updated at: timestamp of when the account was last updated.
 * - CHECK constraint to ensure that at least one of the authentication methods (password or Google ID) is provided.
 */

import pool from './dbConnect.js';
import log from '../utils/loggerUtil.js';

// // Create seed admin user function
// const createSeedAdminUser = async () => {
//   const adminUser = {
//     username: 'admin',
//     email: 'admin@stocksim.test',
//     password: 'admin123', // This is just for testing
//     role: 'admin'
//   };

//   try {
//     // Check if admin already exists
//     const existingAdmin = await pool.query(
//       'SELECT * FROM users WHERE username = $1 OR email = $2',
//       [adminUser.username, adminUser.email]
//     );

//     if (existingAdmin.rows.length > 0) {
//       console.log('Admin user already exists');
//       return;
//     }

//     // Hash the password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(adminUser.password, salt);

//     // Insert admin user
//     const result = await pool.query(
//       'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
//       [adminUser.username, adminUser.email, hashedPassword, adminUser.role]
//     );

//     console.log('Seed admin user created successfully');
//     console.log('Admin credentials - username: admin, password: admin123');
//   } catch (error) {
//     console.error('Error creating seed admin user:', error);
//   }
// };

const createUserTable = async () => {
  const queryText = ` 
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE TABLE IF NOT EXISTS "users" (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      username VARCHAR(100) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255),
      google_id VARCHAR(255) UNIQUE,
      role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')), -- Add role column with ENUM-like constraint
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CHECK (password IS NOT NULL OR google_id IS NOT NULL) -- Ensure at least one authentication method
    )`;

    /**
     * The google_id column is used for Google SSO authentication.
     */

    /**
     * Why I use CHECK constraint instead of ENUM?
     * 1. Flexibility: CHECK constraints allow for more complex conditions and can be modified easily withoutneeding to 
     * alter the database schema.
     * 2. Simplier to implemet, maintain and also more portable across different databases systems.
     */

  try {
    // In production, you shouldn't drop tables on each startup
    // This is just for development convenience
    if (process.env.NODE_ENV === 'development') {
      await pool.query('DROP TABLE IF EXISTS "users" CASCADE');
    }
    
    await pool.query(queryText);
    
    // Create seed admin user after table is created
    //await createSeedAdminUser();
    
  } 
  catch (error) {
    log.error('Error creating user table:', error);
    throw new Error(error.message);
  }
};

export default createUserTable;