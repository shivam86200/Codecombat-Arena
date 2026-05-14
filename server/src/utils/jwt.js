const jwt = require('jsonwebtoken');

/**
 * Sign a JWT token for a given user ID.
 */
exports.signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Verify a JWT token.
 */
exports.verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Set the JWT as a cookie on the response.
 */
exports.createSendToken = (user, statusCode, res) => {
  const token = exports.signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRES_DAYS) || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // Prevent XSS
    secure:   process.env.NODE_ENV === 'production', // Only over HTTPS in production
    sameSite: 'lax', // Basic CSRF protection
  };

  // Remove password from output
  user.passwordHash = undefined;

  res.status(statusCode).cookie('jwt', token, cookieOptions).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
