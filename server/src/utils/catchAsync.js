/**
 * Wraps an async route handler and passes errors to the next()
 * error-handling middleware automatically — no try/catch needed
 * in individual controllers.
 *
 * Usage:
 *   router.get('/path', catchAsync(myController));
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
