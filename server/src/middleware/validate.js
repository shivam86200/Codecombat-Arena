const Joi = require('joi');
const AppError = require('../utils/AppError');

/**
 * Higher-order middleware to validate request body against a Joi schema.
 */
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, {
    abortEarly: false, // Include all errors, not just the first one
    allowUnknown: true, // Allow fields not in schema (like __v)
    stripUnknown: true, // Remove fields not in schema from req.body
  });

  if (error) {
    const errorMessage = error.details.map((details) => details.message).join('. ');
    return next(new AppError(errorMessage, 400));
  }

  next();
};

module.exports = validate;
