/**
 * @file authenticationMiddleware.js
 * @description Authentication middleware to verify JWT tokens
 * 
 * This middleware extracts the JWT token from cookies or Authorization header,
 * verifies it, and attaches the user information to the request object.
 * 
 * Protected routes that require login must use this middleware to ensure authentication before the request is processed.
 */

import { verifyAccessToken } from '../utils/jwtUtil.js';
import log from '../utils/loggerUtil.js';

// Helper function to calculate time until token expiration
const getTokenTimeInfo = (decoded) => {
  const expiresIn = decoded.exp * 1000 - Date.now();
  return Math.round(expiresIn / 1000);
};

const authMiddleware = (req, res, next) => {
  let token;
  
  // Get token from cookie
  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
    log.info('[Token Debug] Token source: Cookie');
  } 
  // Or from Authorization header (for API clients that don't use cookies)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    log.info('[Token Debug] Token source: Bearer header');
  }

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
    
    log.error('[Token Debug] Token verification failed:', error.message);
    return res.status(401).json({
      status: 401,
      message: 'Not authorized, token failed verification',
      data: null
    });
  }
};

export default authMiddleware;