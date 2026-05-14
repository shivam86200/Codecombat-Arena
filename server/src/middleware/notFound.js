const AppError = require('../utils/AppError');

/**
 * Handles requests to routes that don't exist.
 * Must be mounted AFTER all other routes.
 */
const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

module.exports = notFound;
