const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Email/password routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Google OAuth routes
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed`,
  }),
  authController.googleCallback
);

// Protected route to get current user
router.get('/me', authMiddleware, authController.getCurrentUser);

module.exports = router;