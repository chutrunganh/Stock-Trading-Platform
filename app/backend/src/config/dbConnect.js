import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' }); // Adjust based on relative depth
import log from '../utils/loggerUtil.js';

// DEBUG: Print database environment variables
// console.log('Database connection parameters:');
// console.log('DB_USER:', process.env.DB_USER);
// console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
// console.log('DB_HOST:', process.env.DB_HOST);
// console.log('DB_PORT:', process.env.DB_PORT);
// console.log('DB_NAME:', process.env.DB_NAME);

// Database connection parameters
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

log.info(`Database is running on port: ${process.env.DB_PORT}`);
log.info(`PgAdmin is running on port: ${process.env.PGADMIN_PORT}`);
if (process.env.NODE_ENV === 'development') {
  log.warn('Recreateing all tables in development mode. This will drop all existing data!');
}

export default pool;