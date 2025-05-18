/**
 * @file responseSanitizationMiddleware.js
 * @description Middleware to sanitize all responses against XSS attacks
 */

import { sanitizeValue } from './errorHandlerMiddleware.js';

/**
 * Middleware that sanitizes all JSON responses
 * This middleware overrides the res.json method to sanitize all outgoing data
 */
const sanitizeResponse = (req, res, next) => {
  const originalJson = res.json;
  
  // Override the json method
  res.json = function (data) {
    // Skip sanitization for specific cases (like file downloads or binary data)
    if (req.skipSanitization || res.getHeader('Content-Type')?.includes('application/octet-stream')) {
      return originalJson.call(this, data);
    }
    
    // Sanitize the response data
    const sanitizedData = sanitizeValue(data);
    
    // Call the original json method with sanitized data
    return originalJson.call(this, sanitizedData);
  };
  
  next();
};

/**
 * Skip sanitization for specific routes
 * Use this middleware for routes that need to send raw data
 */
const skipSanitization = (req, res, next) => {
  req.skipSanitization = true;
  next();
};

export { sanitizeResponse, skipSanitization }; 