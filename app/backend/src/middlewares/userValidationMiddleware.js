/**
 * @file userValidationMiddleware.js
 * @description Middleware to validate user input for creating, updating, and logging in users.
 */
import Joi from 'joi';

// Middleware to validate user input when creating a new user
const userSchema = Joi.object({
  username: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const validateUser = (req, res, next) => {
  const { error } = userSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

// Middleware to validate login input - accepts identifier (email or username), password, turnstileToken, and optional otp
const loginSchema = Joi.object({
  identifier: Joi.string().required(),
  password: Joi.string().required(),
  turnstileToken: process.env.NODE_ENV === 'production' ? Joi.string().required() : Joi.string().optional(),
  otp: Joi.string().optional(),
  visitorId: Joi.string().optional(),
  rememberDevice: Joi.boolean().optional()
});

const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    // Check if the error is related to the turnstileToken
    if (error.details[0].path.includes('turnstileToken')) {
      return res.status(400).json({ error: 'Please complete the CAPTCHA verification first' });
    }
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

// Middleware to validate user input when updating an existing user
const userUpdateSchema = Joi.object({
  username: Joi.string(),
  email: Joi.string().email(),
  password: Joi.string()
}).min(1); // At least one field must be provided

const validateUserUpdate = (req, res, next) => {
  const { error } = userUpdateSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

export { validateUser, validateLogin, validateUserUpdate };
