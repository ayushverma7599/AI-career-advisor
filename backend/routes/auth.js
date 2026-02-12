const express = require('express');
const passport = require('passport');
const authController = require('../controllers/authController');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const { rateLimiting } = require('../middleware/rateLimiting');

const router = express.Router();

// Traditional Authentication Routes
router.post('/register', rateLimiting.registration, validateRegistration, authController.register);
router.post('/login', rateLimiting.login, validateLogin, authController.login);
router.post('/logout', authController.logout);

// Password Management
router.post('/forgot-password', rateLimiting.passwordReset, authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/change-password', authController.authenticateToken, authController.changePassword);

// Email and Phone Verification
router.post('/send-otp', rateLimiting.otpSend, authController.sendOTP);
router.post('/verify-otp', rateLimiting.otpVerify, authController.verifyOTP);
router.post('/verify-email', authController.verifyEmail);

// Google OAuth Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  authController.googleCallback
);

// Token Management
router.post('/refresh-token', authController.refreshToken);
router.post('/validate-token', authController.validateToken);

// Two-Factor Authentication
router.post('/2fa/setup', authController.authenticateToken, authController.setup2FA);
router.post('/2fa/verify', authController.authenticateToken, authController.verify2FA);
router.post('/2fa/disable', authController.authenticateToken, authController.disable2FA);

// Account Management
router.get('/profile', authController.authenticateToken, authController.getProfile);
router.put('/profile', authController.authenticateToken, authController.updateProfile);
router.delete('/account', authController.authenticateToken, authController.deleteAccount);

module.exports = router;
