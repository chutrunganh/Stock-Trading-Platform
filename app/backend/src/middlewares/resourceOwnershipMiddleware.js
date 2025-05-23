/**
 * @file resourceOwnershipMiddleware.js
 * @description Middleware for IDOR (Insecure Direct Object Reference) prevention through ownership verification.
 * This middleware ensures that users can only access resources they own.
 * 
 * The middleware performs the following checks:
 * 1. Verifies the user is authenticated
 * 2. Extracts the resource ID from the request
 * 3. Queries the database to verify ownership
 * 4. Allows or denies access based on ownership verification
 * 
 * This prevents scenarios where an authenticated user could access another user's resources
 * by simply changing IDs in the URL or request body.
 */

import pool from '../config/dbConnect.js';
import log from '../utils/loggerUtil.js';

/**
 * Factory function to create ownership verification middleware for any resource type.
 * @param {Object} config - Configuration for the middleware
 * @param {string} config.resourceType - Human-readable name of the resource (for logging)
 * @param {string} config.resourceIdParam - The request parameter containing the resource ID
 * @param {string} config.resourceTable - Database table name for the resource
 * @param {string} config.ownerIdField - Field name in the table that contains the owner's user ID
 * @param {string[]} config.bypassRoles - User roles that can bypass ownership checks (default: ['admin'])
 * @returns {Function} Express middleware function for ownership verification
 */
export const createOwnershipMiddleware = ({
  resourceType,
  resourceIdParam = 'id',
  resourceTable,
  ownerIdField = 'user_id',
  bypassRoles = ['admin']
}) => {
  return async (req, res, next) => {
    // Ensure we have an authenticated user
    if (!req.user || !req.user.id) {
      log.warn(`[IDOR Prevention] ${resourceType} access attempted without authentication`);
      return res.status(401).json({
        status: 401,
        message: 'Authentication required',
        data: null
      });
    }

    // Admin users can bypass ownership checks
    if (bypassRoles.includes(req.user.role)) {
      log.info(`[IDOR Prevention] ${req.user.role} user ${req.user.id} bypassing ownership check for ${resourceType}`);
      return next();
    }

    // Extract resource ID from request
    const resourceId = req.params[resourceIdParam] || req.body[resourceIdParam];
    if (!resourceId) {
      log.warn(`[IDOR Prevention] ${resourceType} ID not found in request`);
      return res.status(400).json({
        status: 400,
        message: `${resourceType} ID is required`,
        data: null
      });
    }

    try {
      // Special handling for orders (using in-memory storage)
      if (resourceType === 'order') {
        // Get the order from in-memory storage
        const orders = global.orders || new Map();
        const order = orders.get(resourceId);
        
        if (!order) {
          log.warn(`[IDOR Prevention] Order ${resourceId} not found`);
          return res.status(403).json({
            status: 403,
            message: 'Access denied',
            data: null
          });
        }

        // Check ownership using userId in the order object (both are UUID strings)
        const requestUserId = req.user.id;
        const orderUserId = order.userId;
        
        if (requestUserId !== orderUserId) {
          log.warn(`[IDOR Prevention] User ${requestUserId} attempted to access order ${resourceId} owned by user ${orderUserId}`);
          return res.status(403).json({
            status: 403,
            message: 'Access denied',
            data: null
          });
        }
        
        log.info(`[IDOR Prevention] Order ownership verified for user ${req.user.id} accessing order ${resourceId}`);
        next();
      } else {
        // For other resources, use database query
        // Query the database to get the resource owner
        const query = `
          SELECT ${ownerIdField}
          FROM ${resourceTable}
          WHERE id = $1
        `;
        
        const result = await pool.query(query, [resourceId]);

        // Resource not found or owner not found
        if (!result.rows || result.rows.length === 0) {
          log.warn(`[IDOR Prevention] ${resourceType} with ID ${resourceId} not found or has no owner`);
          // Return 403 instead of 404 to avoid information leakage
          return res.status(403).json({
            status: 403,
            message: 'Access denied',
            data: null
          });
        }

        const ownerId = result.rows[0][ownerIdField];
        // Check if the authenticated user is the owner (both are UUID strings)
        const requestUserId = req.user.id;
        const resourceOwnerId = ownerId;
        
        if (requestUserId !== resourceOwnerId) {
          log.warn(`[IDOR Prevention] User ${requestUserId} attempted to access ${resourceType} ${resourceId} owned by user ${resourceOwnerId}`);
          return res.status(403).json({
            status: 403,
            message: 'Access denied',
            data: null
          });
        }

        // User is the owner - allow access
        log.info(`[IDOR Prevention] Ownership verified for user ${req.user.id} accessing ${resourceType} ${resourceId}`);
        next();
      }
    } catch (error) {
      log.error(`[IDOR Prevention] Error verifying ownership for ${resourceType} ${resourceId}:`, error);
      return res.status(500).json({
        status: 500,
        message: 'Server error during ownership verification',
        data: null
      });
    }
  };
};

/**
 * Create middleware for checking ownership of a portfolio
 * The middleware looks for portfolio ID in both request parameters and body
 * @param {string} paramName - The request parameter containing the portfolio ID
 * @returns {Function} Middleware for portfolio ownership verification
 */
export const verifyPortfolioOwnership = (paramName = 'portfolioId') => {
    return async (req, res, next) => {
        // Ensure we have an authenticated user
        if (!req.user || !req.user.id) {
            log.warn('[IDOR Prevention] Portfolio access attempted without valid JWT token data');
            return res.status(401).json({
                status: 401,
                message: 'Authentication required',
                data: null
            });
        }

        try {
            // Determine which portfolio ID to verify
            let portfolioIdToVerify;
            
            // First check for explicitly provided portfolio IDs (for testing cross-user access)
            if (req.params[paramName]) {
                portfolioIdToVerify = req.params[paramName];
            } else if (req.body && req.body[paramName]) {
                portfolioIdToVerify = req.body[paramName];
            } else if (req.query && req.query[paramName]) {
                portfolioIdToVerify = req.query[paramName];
            } else if (req.params.id) {
                portfolioIdToVerify = req.params.id;
            } else if (req.headers['x-portfolio-id'] && req.headers['x-portfolio-id'].trim() !== '') {
                // Check for portfolio ID in headers (ignore empty strings)
                portfolioIdToVerify = req.headers['x-portfolio-id'];
            }
            // Then check if the JWT token contains a portfolio_id (fallback for normal usage)
            else if (req.user.portfolio_id) {
                portfolioIdToVerify = req.user.portfolio_id; // UUID string
            } 
            else {
                // If no portfolio ID is found anywhere, we need to get the user's portfolio_id from database
                const portfolioQuery = `
                    SELECT portfolio_id 
                    FROM portfolios 
                    WHERE user_id = $1`;
                
                const portfolioResult = await pool.query(portfolioQuery, [req.user.id]);
                
                if (!portfolioResult.rows[0]) {
                    log.warn(`[IDOR Prevention] No portfolio found for user ${req.user.id}`);
                    return res.status(404).json({
                        status: 404,
                        message: 'Portfolio not found',
                        data: null
                    });
                }
                
                portfolioIdToVerify = portfolioResult.rows[0].portfolio_id;
                // Add portfolio_id to req.user for controllers to use
                req.user.portfolio_id = portfolioIdToVerify;
            }

            // Validate UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!portfolioIdToVerify || !uuidRegex.test(portfolioIdToVerify)) {
                log.warn(`[IDOR Prevention] Invalid portfolio ID format: "${portfolioIdToVerify}"`);
                return res.status(400).json({
                    status: 400,
                    message: 'Invalid portfolio ID format',
                    data: null
                });
            }

            const query = `
                SELECT portfolio_id 
                FROM portfolios 
                WHERE portfolio_id = $1 
                AND user_id = $2`;
            
            const result = await pool.query(query, [
                portfolioIdToVerify,
                req.user.id
            ]);
            
            if (!result.rows[0]) {
                log.warn(`[IDOR Prevention] Portfolio verification failed for user ${req.user.id}, portfolio ${portfolioIdToVerify}`);
                return res.status(403).json({
                    status: 403,
                    message: 'Access denied',
                    data: null
                });
            }
            
            // Portfolio ownership verified
            log.info(`[IDOR Prevention] Portfolio access verified for user ${req.user.id}`);
            
            // Add the verified portfolio ID to the request for use by controllers
            req.verifiedPortfolioId = portfolioIdToVerify;
            
            // Also make sure we update the user's JWT payload with the portfolio ID
            // This helps if the token didn't have the portfolio_id initially
            if (!req.user.portfolio_id) {
                req.user.portfolio_id = portfolioIdToVerify;
            }
            
            next();
        } catch (error) {
            log.error('Error verifying portfolio ownership:', error);
            return res.status(500).json({
                status: 500,
                message: 'Server error',
                data: null
            });
        }
    };
};

/**
 * Create middleware for checking ownership of an order
 * @param {string} paramName - The request parameter containing the order ID
 * @returns {Function} Middleware for order ownership verification
 */
export const verifyOrderOwnership = (paramName = 'orderId') => createOwnershipMiddleware({
  resourceType: 'order',
  resourceIdParam: paramName,
  resourceTable: 'orders',  // This value is still needed for the middleware factory, even though we use in-memory verification
  ownerIdField: 'user_id'
});

/**
 * Create middleware for checking ownership of a payment transaction
 * @param {string} paramName - The request parameter containing the transaction ID
 * @returns {Function} Middleware for payment transaction ownership verification
 */
export const verifyTransactionOwnership = (paramName = 'transactionId') => createOwnershipMiddleware({
  resourceType: 'payment_transaction',
  resourceIdParam: paramName,
  resourceTable: 'payment_transactions',
  ownerIdField: 'user_id'
});
