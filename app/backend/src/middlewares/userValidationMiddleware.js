import Joi from 'joi';

// Middleware to validate user input when creating a new user
const userSchema = Joi.object({
  username: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string()
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,72}$/)
  .required()
  .messages({
    'string.pattern.base': 'Password must include uppercase, lowercase, numbers, symbols, and be 8-72 characters long.',
  }),
});

const validateUser = (req, res, next) => {
  const { error } = userSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

// Middleware to validate login input - accepts identifier (email or username) and password
const loginSchema = Joi.object({
  identifier: Joi.string().required(),
  password: Joi.string().required()
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,72}$/)
  .required()
  .messages({
    'string.pattern.base': 'Password must include uppercase, lowercase, numbers, symbols, and be 8-72 characters long.',
  }),
});

const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

// Middleware to validate user input when updating an existing user
const userUpdateSchema = Joi.object({
  username: Joi.string(),
  email: Joi.string().email(),
  password: Joi.string()
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,72}$/)
  .required()
  .messages({
    'string.pattern.base': 'Password must include uppercase, lowercase, numbers, symbols, and be 8-72 characters long.',
  }),
}).min(1); // At least one field must be provided

const validateUserUpdate = (req, res, next) => {
  const { error } = userUpdateSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

export { validateUser, validateLogin, validateUserUpdate };
