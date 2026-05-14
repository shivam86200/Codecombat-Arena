const AppError = require('../utils/AppError');

/* ── Mongoose-specific error handlers ──────────────────── */
const handleCastError = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateKey = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  return new AppError(`Duplicate value for '${field}'. Please use a different value.`, 409);
};

const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new AppError(`Validation failed: ${messages.join('. ')}`, 400);
};

/* ── JWT error handlers ─────────────────────────────────── */
const handleJWTExpired  = () => new AppError('Your session has expired. Please log in again.', 401);
const handleJWTInvalid  = () => new AppError('Invalid authentication token. Please log in again.', 401);

/* ── Dev response (full stack) ──────────────────────────── */
const sendDevError = (err, res) => {
  res.status(err.statusCode).json({
    status:  err.status,
    message: err.message,
    stack:   err.stack,
    error:   err,
  });
};

/* ── Prod response (safe, no internals) ─────────────────── */
const sendProdError = (err, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status:  err.status,
      message: err.message,
    });
  }
  // Programming/unknown error — don't leak details
  console.error('💥 UNHANDLED ERROR:', err);
  res.status(500).json({ status: 'error', message: 'Something went wrong.' });
};

/* ── Global error middleware ────────────────────────────── */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status     = err.status     || 'error';

  if (process.env.NODE_ENV === 'development') {
    return sendDevError(err, res);
  }

  // Production: normalise known error types
  let error = { ...err, message: err.message };

  if (err.name === 'CastError')            error = handleCastError(error);
  if (err.code === 11000)                  error = handleDuplicateKey(error);
  if (err.name === 'ValidationError')      error = handleValidationError(error);
  if (err.name === 'TokenExpiredError')    error = handleJWTExpired();
  if (err.name === 'JsonWebTokenError')    error = handleJWTInvalid();

  sendProdError(error, res);
};

module.exports = errorHandler;
