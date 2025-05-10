/**
 * @file authenticationMiddleware.js
 * @description Authentication middleware to verify JWT tokens
 * 
 * This middleware extracts the JWT token from cookies or Authorization header,
 * verifies it, and attaches the user information to the request object.
 * 
 * Protected routes that require login must use this middleware to ensure authentication before the request is processed.
 */

import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  let token;
  
  // Get token from cookie
  if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  } 
  // Or from Authorization header (for API clients that don't use cookies)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      status: 401,
      message: 'Not authorized, no token provided',
      data: null
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here');
    
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
      return res.status(401).json({
        status: 401,
        message: 'Token expired, please login again',
        data: null
      });
    }
    
    return res.status(401).json({
      status: 401,
      message: 'Not authorized, token failed verification',
      data: null
    });
  }
};

export default authMiddleware;