/** 
 * @file errorHandlerMiddleware.js
 * @description This file contains the centralized error handling middleware for the application. When an error
 * occurs in any controller, it will be passed to this middleware for standardized error response.
 * 
 * Every controller when an error occurs, it will call next(err) to pass the error to this middleware. The errorHandlingMiddleware
 * must be the last middleware in the middleware stack.
 * 
 * This middleware can also handle specific error types and provide more detailed responses based on the error type.
*/

const errorHandling = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 500,
        message: 'Internal Server Error',
        error: err.message,
    });
};

export default errorHandling;