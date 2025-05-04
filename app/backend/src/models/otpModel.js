import pool from '../config/dbConnect.js';

class OTP {
  static async save(email, otp, otpExpiration) {
    try {
      await pool.query(
        'INSERT INTO otp_store (email, otp, otp_expiration) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET otp = $2, otp_expiration = $3',
        [email, otp, otpExpiration]
      );
    } catch (error) {
      console.error('Error saving OTP to database:', error.message);
      throw new Error('Failed to save OTP');
    }
  }

  static async findByEmail(email) {
    try {
      const result = await pool.query(
        'SELECT otp, otp_expiration FROM otp_store WHERE email = $1',
        [email]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error retrieving OTP from database:', error.message);
      throw new Error('Failed to retrieve OTP');
    }
  }

  static async deleteByEmail(email) {
    try {
      await pool.query('DELETE FROM otp_store WHERE email = $1', [email]);
    } catch (error) {
      console.error('Error deleting OTP from database:', error.message);
      throw new Error('Failed to delete OTP');
    }
  }
}

export default OTP;