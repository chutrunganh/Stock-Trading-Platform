// Centralized error handling
// Every controller when an error occurs, it will call next(err) to pass the error to this middleware
const errorHandling = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 500,
        message: 'Internal Server Error',
        error: err.message,
    });
};

export default errorHandling;