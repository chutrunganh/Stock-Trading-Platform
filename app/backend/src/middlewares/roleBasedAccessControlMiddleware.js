/**
 * @file roleBasedAccessControlMiddleware.js
 * @description Simple RBAC middleware focusing on admin dashboard access and trading session control
 */

import { AppError } from './errorHandlerMiddleware.js';

// Define roles
const ROLE_HIERARCHY = {
  ADMIN: 'admin',    // Can access admin dashboard and control trading sessions
  USER: 'user'       // Regular user access
};

// Current active roles
const VALID_ROLES = [
  ROLE_HIERARCHY.ADMIN,
  ROLE_HIERARCHY.USER
];

// Simple permissions matrix
const ROLE_PERMISSIONS = {
  [ROLE_HIERARCHY.ADMIN]: {
    canAccessAdminDashboard: true,
    canControlTradingSession: true
  },
  [ROLE_HIERARCHY.USER]: {
    canAccessAdminDashboard: false,
    canControlTradingSession: false
  }
};

// Validate role
const validateRole = (role) => {
  if (!role || typeof role !== 'string') {
    return next(new AppError('Invalid role format', 400));
  }
  
  const normalizedRole = role.toLowerCase();
  if (!VALID_ROLES.includes(normalizedRole)) {
    return next(new AppError(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`, 400));
  }
  
  return normalizedRole;
};

/**
 * Check if user has required permission
 * @param {string} userRole - The user's role
 * @param {string} permission - The required permission
 * @returns {boolean}
 */
const hasPermission = (userRole, permission) => {
  // Admin has all permissions
  if (userRole === ROLE_HIERARCHY.ADMIN) return true;
  
  // Check specific permission for other roles
  return ROLE_PERMISSIONS[userRole]?.[permission] || false;
};

/**
 * Middleware to check if user has admin access
 */
const requireAdminRole = (req, res, next) => {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const validatedRole = validateRole(req.user.role);
    
    if (!hasPermission(validatedRole, 'canAccessAdminDashboard')) {
      return next(new AppError('Admin access required', 403));
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user can control trading session
 */
const requireTradingSessionControl = (req, res, next) => {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const validatedRole = validateRole(req.user.role);
    
    if (!hasPermission(validatedRole, 'canControlTradingSession')) {
      return next(new AppError('You do not have permission to control trading sessions', 403));
    }

    next();
  } catch (error) {
    next(error);
  }
};

export { 
  requireAdminRole,
  requireTradingSessionControl,
  ROLE_HIERARCHY,
  VALID_ROLES
};
