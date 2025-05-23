/**
 * @file authenticationMiddleware.js
 * @description Authentication middleware to verify JWT tokens
 * 
 * This middleware extracts the JWT token from cookies or Authorization header,
 * verifies it, and attaches the user information to the request object.
 * 
 * Protected routes that require login must use this middleware to ensure authentication before the request is processed.
 */

import { verifyAccessToken, verifyRefreshToken } from '../utils/jwtUtil.js';
import log from '../utils/loggerUtil.js';

// Helper function to calculate time until token expiration
const getTokenTimeInfo = (decoded) => {
  const expiresIn = decoded.exp * 1000 - Date.now();
  return Math.round(expiresIn / 1000);
};

// Middleware to verify access tokens
const authMiddleware = (req, res, next) => {
  let token;
  
  // Check for Bearer token in Authorization header first
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // Then check for cookie if no Bearer token
  else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }
  // Log token details for debugging
  if (token) {  }

  if (!token) {
    log.warn('[Token Debug] No token provided');
    return res.status(401).json({
      status: 401,
      message: 'Not authorized, no token provided',
      data: null
    });
  }

  try {
    // Verify token
    const decoded = verifyAccessToken(token);
    const timeUntilExpiration = getTokenTimeInfo(decoded);
    
    log.info(`[Token Debug] Access token verified successfully. Expires in: ${timeUntilExpiration}s`);
    
    // Attach user info to request object
    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
      portfolio_id: decoded.portfolio_id
    };
    
    next();
  } catch (error) {
    // Handle token verification errors
    if (error.name === 'TokenExpiredError') {
      log.warn('[Token Debug] Token expired');
      return res.status(401).json({
        status: 401,
        message: 'Token expired, please login again',
        data: null
      });
    }
    
    log.error(`[Token Debug] Token verification failed: ${error.message}`);
    return res.status(401).json({
      status: 401,
      message: 'Not authorized, token failed verification',
      data: null
    });
  }
};

// Middleware to verify refresh tokens
export const refreshTokenMiddleware = (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    log.warn('[Token Debug] No refresh token provided');
    return res.status(401).json({
      status: 401,
      message: 'No refresh token provided',
      data: null
    });
  }

  try {
    // Verify refresh token and check if it exists in storage
    const decoded = verifyRefreshToken(refreshToken);
    const timeUntilExpiration = getTokenTimeInfo(decoded);
    
    log.info(`[Token Debug] Refresh token verified successfully. Expires in: ${timeUntilExpiration}s`);
    
    // Attach user info and refresh token to request object
    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
      portfolio_id: decoded.portfolio_id
    };
    req.refreshToken = refreshToken;
    
    next();
  } catch (error) {
    if (error.message === 'Refresh token not found or revoked') {
      log.warn('[Token Debug] Refresh token not found in storage or was revoked');
      return res.status(401).json({
        status: 401,
        message: 'Refresh token has been revoked, please login again',
        data: null
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      log.warn('[Token Debug] Refresh token expired');
      return res.status(401).json({
        status: 401,
        message: 'Refresh token expired, please login again',
        data: null
      });
    }
    
    log.error('[Token Debug] Refresh token verification failed:', error.message);
    return res.status(401).json({
      status: 401,
      message: 'Invalid refresh token',
      data: null
    });
  }
};

export default authMiddleware;