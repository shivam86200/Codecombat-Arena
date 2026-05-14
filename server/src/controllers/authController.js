const User       = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError   = require('../utils/AppError');
const { createSendToken } = require('../utils/jwt');

const { processTransaction } = require('../services/walletService');

/**
 * Register a new user.
 */
exports.register = catchAsync(async (req, res, next) => {
  const { name, username, email, password } = req.body;

  // 1. Check if user already exists
  const existingUser = await User.findOne({ email });
  
  if (existingUser) {
    // If user exists via Google but has no password set, allow them to "register" (set a password)
    if (existingUser.googleId && !existingUser.passwordSet) {
      existingUser.passwordHash = password;
      existingUser.passwordSet = true;
      if (name) existingUser.name = name;
      if (username) existingUser.username = username;
      await existingUser.save();
      return createSendToken(existingUser, 200, res);
    }
    return next(new AppError('Email already in use.', 409));
  }

  // Check if username is already taken by someone else
  if (username) {
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return next(new AppError('Username is already taken.', 409));
    }
  }

  // 2. Create user (passwordHash is the field name in the model)
  const newUser = await User.create({
    name,
    username,
    email,
    passwordHash: password,
    passwordSet: true, // Manually registered users have a password set
  });

  // Grant 400 coins signup bonus
  await processTransaction(newUser._id, 400, 'SIGNUP');
  
  // Update the in-memory document so the frontend receives the correct balance immediately
  newUser.coins = 400;

  // 3. Send JWT token
  createSendToken(newUser, 201, res);
});

/**
 * Reset database (for dev testing)
 */
exports.resetDB = catchAsync(async (req, res, next) => {
  const Match = require('../models/Match');
  const Submission = require('../models/Submission');
  const Transaction = require('../models/Transaction');
  
  await User.deleteMany({});
  await Match.deleteMany({});
  await Submission.deleteMany({});
  await Transaction.deleteMany({});
  
  res.status(200).json({ status: 'success', message: 'All database records deleted' });
});

/**
 * Set password (for dev testing/fixing accounts)
 * POST /api/auth/set-password
 */
exports.setPassword = catchAsync(async (req, res, next) => {
  if (process.env.NODE_ENV === 'production') return next(new AppError('Forbidden', 403));
  
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) return next(new AppError('User not found', 404));

  user.passwordHash = password;
  user.passwordSet = true;
  await user.save();

  res.status(200).json({ status: 'success', message: 'Password updated successfully' });
});

/**
 * Login an existing user.
 */
exports.login = catchAsync(async (req, res, next) => {
  let { email, password } = req.body; // 'email' field now contains either email or username

  // 1. Check if email/username and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email/username and password.', 400));
  }

  const identifier = email.toLowerCase().trim();
  password = password.trim();

  // 2. Check if user exists && password is correct
  const user = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }],
  }).select('+passwordHash');

  if (!user) {
    return next(new AppError('Incorrect email or password.', 401));
  }

  const isPasswordCorrect = await user.correctPassword(password, user.passwordHash);

  if (!isPasswordCorrect) {
    // If it's a Google user and password fails
    if (user.googleId && !user.passwordSet) {
      return next(new AppError('This account is linked to Google and no password has been set. Please use "Continue with Google" or Register with this email to set a password.', 401));
    }
    return next(new AppError('Incorrect email or password.', 401));
  }

  // 3. If everything ok, send token to client
  createSendToken(user, 200, res);
});

/**
 * Logout the user by clearing the cookie.
 */
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

/**
 * Get the currently logged-in user profile.
 */
exports.getMe = catchAsync(async (req, res, next) => {
  // req.user is populated by the authRequired middleware
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user,
    },
  });
});

/**
 * Redirect to Google OAuth Consent Screen
 */
exports.googleAuth = (req, res) => {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/google/callback`,
    client_id: process.env.GOOGLE_CLIENT_ID,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '),
  };
  const qs = new URLSearchParams(options);
  res.redirect(`${rootUrl}?${qs.toString()}`);
};

/**
 * Handle Google OAuth Callback
 */
exports.googleCallback = catchAsync(async (req, res, next) => {
  const code = req.query.code;
  const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

  if (!code) {
    return res.redirect(`${clientOrigin}/login?error=Google_Login_Failed`);
  }

  // 1. Get tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  });
  
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    return res.redirect(`${clientOrigin}/login?error=Google_Token_Failed`);
  }

  // 2. Get user info
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const userData = await userRes.json();

  if (!userData.email) {
    return res.redirect(`${clientOrigin}/login?error=Google_Email_Missing`);
  }

  // 3. Find or create user
  let user = await User.findOne({ email: userData.email });
  if (!user) {
    user = await User.create({
      name: userData.name,
      email: userData.email,
      googleId: userData.id,
      passwordSet: false, // Google users don't have a manual password yet
      // Random secure password for OAuth users so they can't login via normal form
      passwordHash: require('crypto').randomBytes(16).toString('hex'),
    });
    // Grant signup bonus for new OAuth users
    const { processTransaction } = require('../services/walletService');
    await processTransaction(user._id, 400, 'SIGNUP');
  } else if (!user.googleId) {
    // Link google ID if email matches existing account
    user.googleId = userData.id;
    await user.save();
  }

  // 4. Create and send JWT cookie manually (similar to createSendToken but with redirect)
  const { signToken } = require('../utils/jwt');
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRES_DAYS) || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  res.cookie('jwt', token, cookieOptions);

  // 5. Redirect to Dashboard
  res.redirect(`${clientOrigin}/dashboard`);
});
