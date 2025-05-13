import jwt from 'jsonwebtoken';
import log from './loggerUtil.js';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' }); // Load environment variables


const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'default-access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '1m';  // Default 1 minute for testing
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

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
  return { accessToken, refreshToken };
}

/**
 * Verify an access token.
 * @param {string} token
 * @returns {Object} decoded payload
 * @throws if invalid/expired
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
 * @throws if invalid/expired
 */
export function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET);
    if (decoded.type !== 'refresh') throw new Error('Not a refresh token');
    return decoded;
  } catch (err) {
    log.error('Refresh token verification failed', { error: err });
    throw err;
  }
}

/**
 * Optionally: Generate new tokens from a valid refresh token.
 * @param {string} refreshToken
 * @returns {{ accessToken: string, refreshToken: string }}
 */
export function refreshTokens(refreshToken) {
  const decoded = verifyRefreshToken(refreshToken);
  // Remove iat, exp, type from payload
  const { iat, exp, type, ...payload } = decoded;
  return generateTokens(payload);
} 