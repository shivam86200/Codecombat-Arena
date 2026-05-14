const jwt        = require('jsonwebtoken');
const User       = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError   = require('../utils/AppError');

/**
 * Middleware to protect routes.
 * Checks for JWT in cookies OR Authorization header.
 */
exports.authRequired = catchAsync(async (req, res, next) => {
  let token;

  // 1. Get token from header or cookie
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  // 2. Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 3. Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // 4. Grant access to protected route
  req.user   = currentUser;
  req.userId = currentUser._id;
  next();
});
