import jwt from 'jsonwebtoken';
import log from './loggerUtil.js';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' }); // Load environment variables


const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'default-access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '30m';  // Default 1 minute for testing
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Store active refresh tokens in memory
// In production, this should be replaced with a database storage
const activeRefreshTokens = new Map();

// Helper to log the current state of refresh tokens
const logTokenStorage = (action) => {
  const tokens = Array.from(activeRefreshTokens.entries()).map(([userId, token]) => ({
    userId,
    tokenPreview: `${token.substring(0, 10)}...${token.substring(token.length - 10)}`,
    total: activeRefreshTokens.size
  }));
  log.info(`[Token Storage ${action}] Current tokens:`, tokens);
};

/**
 * Generate access and refresh tokens for a user payload.
 * @param {Object} payload - User info to encode in the token.
 * @returns {{ accessToken: string, refreshToken: string }}
 */
export function generateTokens(payload) {
  const login_at = Date.now();
  const accessToken = jwt.sign(
    { ...payload, type: 'access', login_at },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
  const refreshToken = jwt.sign(
    { ...payload, type: 'refresh', login_at },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
  
  // Store the refresh token with the user ID as the key
  if (payload.id) {
    activeRefreshTokens.set(payload.id, refreshToken);
    log.info(`[Token Storage] Stored new refresh token for user ID: ${payload.id}`);
    logTokenStorage('STORE');
  }
  
  return { accessToken, refreshToken };
}

/**
 * Verify an access token.
 * @param {string} token
 * @returns {Object} decoded payload
 */
export function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET);
    if (decoded.type !== 'access') throw new Error('Not an access token');
    return decoded;
  } catch (err) {
    log.error('Access token verification failed', { error: err });
    throw err;
  }
}

/**
 * Verify a refresh token.
 * @param {string} token
 * @returns {Object} decoded payload
 */
export function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET);
    if (decoded.type !== 'refresh') throw new Error('Not a refresh token');
    
    // Check if this refresh token is in our active tokens store
    const storedToken = activeRefreshTokens.get(decoded.id);
    if (!storedToken || storedToken !== token) {
      log.warn(`[Token Storage] Token not found or mismatch for user ID: ${decoded.id}`);
      logTokenStorage('VERIFY FAIL');
      throw new Error('Refresh token not found or revoked');
    }
    
    log.info(`[Token Storage] Valid refresh token found for user ID: ${decoded.id}`);
    logTokenStorage('VERIFY SUCCESS');
    return decoded;
  } catch (err) {
    log.error('Refresh token verification failed', { error: err });
    throw err;
  }
}

/**
 * Invalidate a user's refresh token (used during logout)
 * @param {string} userId - The user ID whose token should be invalidated
 * @returns {boolean} - Whether a token was removed
 */
export function invalidateRefreshToken(userId) {
  const result = activeRefreshTokens.delete(userId);
  if (result) {
    log.info(`[Token Storage] Invalidated refresh token for user ID: ${userId}`);
    logTokenStorage('DELETE');
  } else {
    log.warn(`[Token Storage] No refresh token found to invalidate for user ID: ${userId}`);
    logTokenStorage('DELETE FAIL');
  }
  return result;
}

/**
 * Generate new access token from a valid refresh token.
 * @param {string} refreshToken
 * @returns {{ accessToken: string }}
 */
export function refreshTokens(refreshToken) {
  const decoded = verifyRefreshToken(refreshToken);
  // Remove iat, exp, type from payload
  const { iat, exp, type, ...payload } = decoded;
  
  // Generate only a new access token, not a new refresh token
  const login_at = Date.now();
  const accessToken = jwt.sign(
    { ...payload, type: 'access', login_at },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
  
  log.info(`[Token Storage] Generated new access token for user ID: ${payload.id}`);
  logTokenStorage('REFRESH');
  
  return { accessToken };
} 