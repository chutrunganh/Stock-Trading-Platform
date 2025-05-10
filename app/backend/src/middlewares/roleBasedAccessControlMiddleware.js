/**
 * @file roleBasedAccessControlMiddleware.js
 * @param {*} requiredRole the role that is required to access the route
 * 
 * @description This middleware checks if the user has the required role to access a specific route.
 * Usage example of this middleware in a route:
 * router.delete("/user/:id", authorizeRole('admin'), deleteUser); // Only access with admin role can access this route
 */

// ALWAYS have next() in the last line of the middleware function to pass control to the next 
// middleware or route handler (except for error handling middleware).

const authorizeRole = (requiredRole) => {
    return (req, res, next) => {
      const userRole = req.user.role; // Assume `req.user` is populated after authentication
      if (userRole !== requiredRole) {
        return res.status(403).json({ message: 'Access denied' });
      }
      next(); //ALWAYS have next() in the last line of the middleware function to pass control to the next middleware or the controller
    };
  };

export default authorizeRole;
