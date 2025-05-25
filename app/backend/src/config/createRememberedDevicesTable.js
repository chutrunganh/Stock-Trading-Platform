import pool from './dbConnect.js';
import log from '../utils/loggerUtil.js';

const createRememberedDevicesTable = async () => {
  try {
    // First drop the table if it exists
    const dropTableQuery = `DROP TABLE IF EXISTS remembered_devices CASCADE;`;
    await pool.query(dropTableQuery);
    log.info('Remembered devices table dropped (if existed)');    // Then create the table with confidence score
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS remembered_devices (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        visitor_id VARCHAR(255) NOT NULL,
        confidence_score DECIMAL(4,3) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        UNIQUE(user_id, visitor_id)
      );
    `;
    
    await pool.query(createTableQuery);
    log.info('Remembered devices table created successfully with confidence score support');
  } catch (error) {
    log.error('Error handling remembered devices table:', error);
    throw error;
  }
};

export default createRememberedDevicesTable; 