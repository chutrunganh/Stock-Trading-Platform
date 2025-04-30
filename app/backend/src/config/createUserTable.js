import pool from './dbConnect.js';
import bcrypt from 'bcrypt';
import log from '../utils/loggerUtil.js';

const SALT_ROUNDS = 10;

const createUserTable = async () => {
  const queryText = ` 
    CREATE TABLE IF NOT EXISTS "users" (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) NOT NULL,
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
    //log.info('User table verified/created successfully');
    
    // Seed some test data if in development mode
    if (process.env.NODE_ENV === 'development') {
      await seedTestData();
    }
  } 
  catch (error) {
    log.error('Error creating user table:', error);
    throw new Error(error.message);
  }
};

// Optional seeding function for development, we create two test accounts: one regular user and one admin user
// to the database every time the server starts in development mode.
const seedTestData = async () => {
  try {
    // Hash the passwords
    const userPassword = await bcrypt.hash('password123', SALT_ROUNDS);
    const adminPassword = await bcrypt.hash('admin123', SALT_ROUNDS);
    
    const seedQuery = `
      INSERT INTO users (username, email, password, role)
      VALUES 
        ('TestUser', 'test@example.com', $1, 'user'),
        ('AdminUser', 'admin@example.com', $2, 'admin')
      ON CONFLICT (email) DO NOTHING;
    `;
    
    await pool.query(seedQuery, [userPassword, adminPassword]);
    // console.log('Test data seeded successfully');
    // console.log('Test accounts created:');
    // console.log('- Regular user: email=test@example.com, password=password123');
    // console.log('- Admin user: email=admin@example.com, password=admin123');
  } catch (error) {
    log.error('Error seeding test data:', error);
  }
};

export default createUserTable;