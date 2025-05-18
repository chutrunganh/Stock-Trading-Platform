/**
 * @file userValidationMiddleware.js
 * @description Middleware to validate and sanitize user input for creating, updating, and logging in users.
 */
import Joi from 'joi';
import xss from 'xss';

// Custom Joi extension for XSS sanitization
const joiXss = Joi.extend((joi) => ({
  type: 'string',
  base: joi.string(),
  messages: {
    'string.xss': 'Invalid characters detected'
  },
  rules: {
    xss: {
      validate(value, _helpers) {
        const clean = xss(value, {
          whiteList: {},        // No tags allowed
          stripIgnoreTag: true, // Strip tags not in whitelist
          stripIgnoreTagBody: ['script', 'style'] // Remove these tags and their content
        });
        return clean;
      }
    }
  }
}));

// Enhanced user schema with XSS protection
const userSchema = Joi.object({
  username: joiXss.string()
    .xss()
    .pattern(/^[a-zA-Z0-9_-]+$/) // Only allow alphanumeric, underscore, and hyphen
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.pattern.base': 'Username can only contain letters, numbers, underscores, and hyphens'
    }),
  email: joiXss.string()
    .xss()
    .email()
    .required()
    .messages({
      'string.email': 'Please enter a valid email address'
    }),
  password: Joi.string()
    .min(6)
    .max(72)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,72}$/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    })
});

const validateUser = (req, res, next) => {
  const { error, value } = userSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({ errors });
  }
  // Replace sanitized values
  req.body = value;
  next();
};

// Enhanced login schema with XSS protection
const loginSchema = Joi.object({
  identifier: joiXss.string()
    .xss()
    .required()
    .messages({
      'string.empty': 'Identifier is required',
      'any.required': 'Identifier is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required',
      'any.required': 'Password is required'
    }),
  turnstileToken: process.env.NODE_ENV === 'production' 
    ? Joi.string().required() 
    : Joi.string().optional(),
  otp: Joi.string()  // Removed strict validation to allow any string format
    .optional()
    .allow(''),
  visitorId: Joi.string()
    .optional()
    .allow(null),
  rememberDevice: Joi.boolean()
    .optional()
    .default(false),
  fingerprintConfidence: Joi.alternatives().try(
    Joi.number().min(0).max(1),
    Joi.object({
      score: Joi.number().min(0).max(1)
    })
  ).optional().allow(null)
}).options({ stripUnknown: true });

const validateLogin = (req, res, next) => {
  const { error, value } = loginSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => detail.message);
    if (errors.some(err => err.includes('turnstileToken'))) {
      return res.status(400).json({ error: 'Please complete the CAPTCHA verification first' });
    }
    return res.status(400).json({ errors });
  }

  // Handle fingerprintConfidence object format
  if (value.fingerprintConfidence && typeof value.fingerprintConfidence === 'object') {
    value.fingerprintConfidence = value.fingerprintConfidence.score;
  }

  // Replace sanitized values
  req.body = value;
  next();
};

// Enhanced update schema with XSS protection
const userUpdateSchema = Joi.object({
  username: joiXss.string()
    .xss()
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .min(3)
    .max(30)
    .optional()
    .messages({
      'string.pattern.base': 'Username can only contain letters, numbers, underscores, and hyphens'
    }),
  email: joiXss.string()
    .xss()
    .email()
    .optional()
    .messages({
      'string.email': 'Please enter a valid email address'
    }),
  password: Joi.string()
    .min(6)
    .max(72)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,72}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    })
}).min(1);

const validateUserUpdate = (req, res, next) => {
  const { error, value } = userUpdateSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({ errors });
  }
  // Replace sanitized values
  req.body = value;
  next();
};

export { validateUser, validateLogin, validateUserUpdate };
