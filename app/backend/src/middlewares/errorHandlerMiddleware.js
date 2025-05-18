/** 
 * @file errorHandlerMiddleware.js
 * @description Centralized error handling and response sanitization middleware
 */

import xss from 'xss';

// Custom error class for known operational errors
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Sanitize any value recursively
const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    return xss(value, {
      whiteList: {}, // No HTML tags allowed
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script', 'style']
    });
  }
  if (Array.isArray(value)) {
    return value.map(item => sanitizeValue(item));
  }
  if (value && typeof value === 'object') {
    const sanitized = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeValue(val);
    }
    return sanitized;
  }
  return value;
};

// Handle different types of errors
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = () => new AppError('Your token has expired. Please log in again.', 401);

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value.`;
  return new AppError(message, 400);
};

const errorHandling = (err, req, res, _next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Development error response
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });

    return res.status(err.statusCode).json(sanitizeValue({
      status: err.status,
      error: err,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }));
  }

  // Production error handling
  let error = { ...err };
  error.message = err.message;

  // Handle specific error types
  if (error.name === 'CastError') error = handleCastError(error);
  if (error.name === 'ValidationError') error = handleValidationError(error);
  if (error.code === 11000) error = handleDuplicateFieldsDB(error);
  if (error.name === 'JsonWebTokenError') error = handleJWTError();
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

  // Operational, trusted error: send message to client
  if (error.isOperational) {
    return res.status(error.statusCode).json(sanitizeValue({
      status: error.status,
      message: error.message
    }));
  }

  // Programming or other unknown error: don't leak error details
  console.error('ERROR 💥:', error);
  return res.status(500).json(sanitizeValue({
    status: 'error',
    message: 'Something went wrong'
  }));
};

// Response sanitization middleware
const sanitizeResponse = (req, res, next) => {
  const originalJson = res.json;
  res.json = function (data) {
    return originalJson.call(this, sanitizeValue(data));
  };
  next();
};

export { AppError, errorHandling as default, sanitizeResponse, sanitizeValue };