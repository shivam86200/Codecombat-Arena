const express        = require('express');
const authController = require('../controllers/authController');
const { authRequired } = require('../middleware/auth');
const validate = require('../middleware/validate');
const Joi = require('joi');

const router = express.Router();

/* ── Schemas ──────────────────────────────────────────── */
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  username: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().required(), // accepts email OR username
  password: Joi.string().required(),
});

// Public routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/reset', authController.resetDB);
router.post('/set-password', authController.setPassword);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout',   authController.logout);

// Google OAuth routes
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);

// Protected routes
router.get('/me', authRequired, authController.getMe);

module.exports = router;
