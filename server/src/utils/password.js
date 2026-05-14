const bcrypt = require('bcryptjs');

/**
 * Hash a plain text password.
 */
exports.hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

/**
 * Compare a plain text password with a hashed password.
 */
exports.comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};
