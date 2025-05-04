const errorHandling = (err, req, res, next) => {
    console.error('Error caught in middleware:', err.message);

    // Handle "Invalid credentials" error
    if (err.message === 'Invalid credentials') {
        return res.status(401).json({
            status: 401, // Unauthorized
            code: 'INVALID_CREDENTIALS', // Unique error code
            message: 'Wrong login information', // User-friendly message
        });
    }

    // Handle too many failed login attempts (1-minute cooldown)
    if (err.message === 'Too many failed attempts. Please try again in 1 minute.') {
        return res.status(429).json({
            status: 429, // Too Many Requests
            code: 'LOGIN_COOLDOWN', // Unique error code
            message: err.message,
        });
    }

    // Handle too many failed login attempts (requires password reset)
    if (err.message === 'Too many failed attempts. Redirect to Forgot Password.') {
        return res.status(430).json({
            status: 430, // Custom status code
            code: 'PASSWORD_RESET_REQUIRED', // Unique error code
            message: err.message,
        });
    }
    if (err.message === 'Failed to send OTP. Please try again.') {
        return res.status(503).json({
            status: 503, // Service Unavailable
            code: 'OTP_SENDING_FAILED', // Unique error code
            message: err.message,
        });
    }

    // Default error handler for other errors
    res.status(500).json({
        status: 500,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal Server Error',
        error: err.message,
    });
// Handle 404 Not Found
    app.use((req, res, next) => {
        res.status(404).json({
            status: 404,
            code: 'NOT_FOUND',
            message: 'The requested resource was not found.',
        });
    });    
};

export default errorHandling;