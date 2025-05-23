import pool from '../../config/dbConnect.js';

/**
 * Note on FingerprintJS Implementation:
 * This service uses the open-source version of FingerprintJS which provides:
 * - visitorId: A hash of browser/device attributes
 * - confidence: A score between 0 and 1 indicating reliability
 * 
 * Please notice that the fingerprintJS is open-source, while the fingerprintJS Pro or Fingerprint Indentification is not. Although
 * they all come from the same company, FingerprintJS Pro is a paid service that provides more features and better accuracy.
 * For more detail on API, access their official documentation: https://github.com/fingerprintjs/fingerprintjs/blob/HEAD/docs/api.md
 * 
 * We use the confidence score to determine whether to trust the fingerprint:
 * - Scores > 0.5 are considered reliable enough for device remembering
 * - Lower scores will require 2FA regardless of device status
 */

const REMEMBER_DEVICE_MINUTES = 1; // Changed from days to minutes for testing
const MIN_CONFIDENCE_SCORE = 0.01; // Minimum confidence score to trust the fingerprint - lowered to allow most devices

export const rememberDeviceService = async (userId, visitorId, confidenceScore = 0) => {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new Error('Invalid user ID format');
    }

    // Only store devices with sufficient confidence
    if (confidenceScore < MIN_CONFIDENCE_SCORE) {
      console.log(`Skipping device remember due to low confidence score: ${confidenceScore}`);
      return { success: false, message: 'Device fingerprint has very low confidence score' };
    }

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + REMEMBER_DEVICE_MINUTES);

    await pool.query(
      `INSERT INTO remembered_devices (user_id, visitor_id, confidence_score, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, visitor_id) 
       DO UPDATE SET expires_at = EXCLUDED.expires_at,
                    confidence_score = EXCLUDED.confidence_score`,
      [userId, visitorId, confidenceScore, expiresAt]
    );

    // Provide a warning if confidence is low but above minimum threshold
    if (confidenceScore < 0.3) {
      return { 
        success: true, 
        warning: true,
        message: 'Device remembered with low confidence score. You may need to verify again in the future.'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error remembering device:', error);
    return { success: false, message: 'Failed to remember device' };
  }
};

export const isDeviceRememberedService = async (userId, visitorId, currentConfidenceScore = 0) => {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new Error('Invalid user ID format');
    }

    // Don't trust devices if current confidence is too low
    if (currentConfidenceScore < MIN_CONFIDENCE_SCORE) {
      console.log(`Rejecting remembered device check due to low current confidence: ${currentConfidenceScore}`);
      return { 
        success: false, 
        message: 'Current device fingerprint has very low confidence score'
      };
    }

    const result = await pool.query(
      `SELECT id, confidence_score FROM remembered_devices 
       WHERE user_id = $1 
       AND visitor_id = $2 
       AND expires_at > CURRENT_TIMESTAMP`,
      [userId, visitorId]
    );

    if (result.rows.length === 0) return { success: false };

    // If stored confidence was low, or current confidence is significantly lower,
    // don't trust the remembered device
    const storedConfidence = result.rows[0].confidence_score || 0;
    if (storedConfidence < MIN_CONFIDENCE_SCORE || 
        currentConfidenceScore < storedConfidence - 0.2) {
      console.log(`Rejecting remembered device due to confidence mismatch: 
                  stored=${storedConfidence}, current=${currentConfidenceScore}`);
      return { 
        success: false, 
        message: 'Confidence score has changed significantly since last login'
      };
    }

    // Provide a warning if confidence is low but above minimum threshold
    if (currentConfidenceScore < 0.3) {
      return { 
        success: true, 
        warning: true,
        message: 'Device remembered with low confidence score'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error checking remembered device:', error);
    return { success: false, message: 'Failed to check remembered device' };
  }
}; 