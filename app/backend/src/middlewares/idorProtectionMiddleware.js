/**
 * @file idorProtectionMiddleware.js
 * @description General IDOR (Insecure Direct Object Reference) protection middleware
 * This middleware provides flexible protection by comparing JWT token values with request parameters
 */

import { verifyAccessToken } from '../utils/jwtUtil.js';

/**
 * General IDOR protection middleware
 * @param {Object} options - Configuration options
 * @param {string} options.jwtProperty - Property name in JWT token to compare (e.g., 'userId', 'id')
 * @param {string} options.requestSource - Where to find the value in request ('params', 'body', 'query', 'headers')
 * @param {string} options.requestProperty - Property name in request to compare (e.g., 'id', 'userId', 'portfolio_id')
 * @param {string} [options.errorMessage] - Custom error message
 * @returns {Function} Express middleware function
 */
export const createIdorProtection = (options) => {
  const {
    jwtProperty,
    requestSource,
    requestProperty,
    errorMessage = 'Forbidden: Access denied'
  } = options;

  return (req, res, next) => {
    try {
      // Extract JWT token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization token required' });
      }

      const token = authHeader.split(' ')[1];

      // Verify and decode JWT token
      const tokenData = verifyAccessToken(token);

      // Get the value from JWT token
      const jwtValue = tokenData[jwtProperty];
      if (jwtValue === undefined) {
        return res.status(403).json({ error: 'Invalid token data' });
      }

      // Get the value from request based on source
      let requestValue;
      switch (requestSource) {
        case 'params':
          requestValue = req.params[requestProperty];
          break;
        case 'body':
          requestValue = req.body[requestProperty];
          break;
        case 'query':
          requestValue = req.query[requestProperty];
          break;
        case 'headers':
          requestValue = req.headers[requestProperty];
          break;
        default:
          return res.status(500).json({ error: 'Invalid request source configuration' });
      }

      if (requestValue === undefined) {
        return res.status(400).json({ error: `Missing ${requestProperty} in ${requestSource}` });
      }

      // Compare values (handle both string and number comparisons)
      const jwtValueStr = String(jwtValue);
      const requestValueStr = String(requestValue);

      if (jwtValueStr !== requestValueStr) {
        return res.status(403).json({ error: errorMessage });
      }

      // Attach token data to request for use in subsequent middleware/routes
      req.user = tokenData;
      next();
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error during IDOR check' });
    }
  };
};

/**
 * Pre-configured middleware for user ID protection
 * Compares JWT userId with request params id
 */
export const verifyUserId = createIdorProtection({
  jwtProperty: 'userId',
  requestSource: 'params',
  requestProperty: 'id',
  errorMessage: 'Forbidden: You can only access your own resources'
});

/**
 * Pre-configured middleware for portfolio ID protection
 * Compares JWT userId with portfolio ownership
 * Note: This requires a database check and should be used with resourceOwnershipMiddleware
 */
export const verifyPortfolioAccess = createIdorProtection({
  jwtProperty: 'portfolioId',
  requestSource: 'params',
  requestProperty: 'portfolio_id',
  errorMessage: 'Forbidden: You can only access your own portfolio'
});

/**
 * Flexible middleware factory for custom IDOR protection
 * @param {string} jwtProp - JWT property name
 * @param {string} reqSource - Request source ('params', 'body', 'query', 'headers')
 * @param {string} reqProp - Request property name
 * @param {string} [customError] - Custom error message
 * @returns {Function} Configured middleware
 */
export const createCustomIdorProtection = (jwtProp, reqSource, reqProp, customError) => {
  return createIdorProtection({
    jwtProperty: jwtProp,
    requestSource: reqSource,
    requestProperty: reqProp,
    errorMessage: customError
  });
};