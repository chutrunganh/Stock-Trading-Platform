import pool from '../../config/dbConnect.js';

const REMEMBER_DEVICE_MINUTES = 1; // Changed from days to minutes for testing

export const rememberDeviceService = async (userId, visitorId) => {
  try {
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + REMEMBER_DEVICE_MINUTES); // Changed from days to minutes

    // Store the device in the database
    await pool.query(
      `INSERT INTO remembered_devices (user_id, visitor_id, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, visitor_id) 
       DO UPDATE SET expires_at = EXCLUDED.expires_at`,
      [userId, visitorId, expiresAt]
    );

    return true;
  } catch (error) {
    console.error('Error remembering device:', error);
    return false;
  }
};

export const isDeviceRememberedService = async (userId, visitorId) => {
  try {
    // Check if device is remembered and not expired
    const result = await pool.query(
      `SELECT id FROM remembered_devices 
       WHERE user_id = $1 
       AND visitor_id = $2 
       AND expires_at > CURRENT_TIMESTAMP`,
      [userId, visitorId]
    );

    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking remembered device:', error);
    return false;
  }
}; 