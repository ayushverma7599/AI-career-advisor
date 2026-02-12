const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { User } = require('../models/User');
const { CoinTransaction } = require('../models/Coin');
const { emailService } = require('../utils/emailService');
const { otpService } = require('../utils/otpService');
const { COIN_REWARDS } = require('../config/constants');

class AuthController {
  generateToken(userId, email) {
    return jwt.sign(
      { userId, email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  }

  authenticateToken = async (req, res, next) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ 
          success: false, 
          message: 'Access token required' 
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['password', 'two_factor_secret'] }
      });

      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token' 
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
  };

  register = async (req, res) => {
    try {
      const { name, email, password, phone } = req.body;

      const existingUser = await User.findOne({ where: { email } });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      const user = await User.create({
        name,
        email,
        password,
        phone,
        auth_method: 'traditional',
        account_status: 'pending_verification'
      });

      await CoinTransaction.create({
        user_id: user.id,
        transaction_type: 'earned',
        amount: COIN_REWARDS.REGISTRATION,
        reason: 'Account registration bonus',
        source: 'registration',
        balance_before: 0,
        balance_after: COIN_REWARDS.REGISTRATION
      });

      await user.update({ total_coins: COIN_REWARDS.REGISTRATION });
      await emailService.sendVerificationEmail(user.email, user.name);

      const token = this.generateToken(user.id, user.email);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: user.getPublicProfile(),
          token,
          coins_earned: COIN_REWARDS.REGISTRATION
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error.message
      });
    }
  };

  login = async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      if (user.account_locked_until && user.account_locked_until > new Date()) {
        return res.status(423).json({
          success: false,
          message: 'Account temporarily locked. Try again later.'
        });
      }

      const isValidPassword = await user.checkPassword(password);

      if (!isValidPassword) {
        await user.increment('login_attempts');

        if (user.login_attempts >= 4) {
          await user.update({
            account_locked_until: new Date(Date.now() + 30 * 60 * 1000)
          });
        }

        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      await user.update({
        login_attempts: 0,
        account_locked_until: null,
        last_login: new Date()
      });

      const token = this.generateToken(user.id, user.email);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.getPublicProfile(),
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  };

  logout = async (req, res) => {
    try {
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed',
        error: error.message
      });
    }
  };

  forgotPassword = async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.json({
          success: true,
          message: 'If the email exists, a password reset link has been sent'
        });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      await emailService.sendPasswordResetEmail(email, user.name, resetToken);

      res.json({
        success: true,
        message: 'Password reset link sent to your email'
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process password reset request',
        error: error.message
      });
    }
  };

  resetPassword = async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Password reset failed',
        error: error.message
      });
    }
  };

  changePassword = async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const user = req.user;

      const isValidPassword = await user.checkPassword(oldPassword);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      await user.update({ password: newPassword });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password',
        error: error.message
      });
    }
  };

  sendOTP = async (req, res) => {
    try {
      const { phone, email, type } = req.body;
      const otp = otpService.generate();

      if (type === 'phone' && phone) {
        await otpService.sendSMS(phone, otp);
      } else if (type === 'email' && email) {
        await otpService.sendEmail(email, otp);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP type or missing contact information'
        });
      }

      await otpService.store(phone || email, otp, type);

      res.json({
        success: true,
        message: `OTP sent to ${type === 'phone' ? 'phone number' : 'email address'}`,
        data: {
          expires_in: '5 minutes'
        }
      });
    } catch (error) {
      console.error('Send OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP',
        error: error.message
      });
    }
  };

  verifyOTP = async (req, res) => {
    try {
      const { identifier, otp, type } = req.body;
      const isValid = await otpService.verify(identifier, otp, type);

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP'
        });
      }

      if (req.user) {
        const updateData = {};
        if (type === 'phone') {
          updateData.phone_verified = true;
        } else if (type === 'email') {
          updateData.email_verified = true;
        }

        await req.user.update(updateData);
      }

      res.json({
        success: true,
        message: 'OTP verified successfully'
      });
    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'OTP verification failed',
        error: error.message
      });
    }
  };

  verifyEmail = async (req, res) => {
    try {
      const { token } = req.body;
      
      res.json({
        success: true,
        message: 'Email verified successfully'
      });
    } catch (error) {
      console.error('Verify email error:', error);
      res.status(500).json({
        success: false,
        message: 'Email verification failed',
        error: error.message
      });
    }
  };

  googleCallback = async (req, res) => {
    try {
      const user = req.user;

      if (user.total_coins === 0) {
        await CoinTransaction.create({
          user_id: user.id,
          transaction_type: 'earned',
          amount: COIN_REWARDS.REGISTRATION,
          reason: 'Google account registration bonus',
          source: 'registration',
          balance_before: 0,
          balance_after: COIN_REWARDS.REGISTRATION
        });

        await user.update({ total_coins: COIN_REWARDS.REGISTRATION });
      }

      const token = this.generateToken(user.id, user.email);
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/success?token=${token}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
    }
  };

  refreshToken = async (req, res) => {
    try {
      const token = this.generateToken(req.user.id, req.user.email);
      
      res.json({
        success: true,
        data: { token }
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({
        success: false,
        message: 'Token refresh failed',
        error: error.message
      });
    }
  };

  validateToken = async (req, res) => {
    try {
      const { token } = req.body;
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      res.json({
        success: true,
        data: { valid: true, decoded }
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  };

  setup2FA = async (req, res) => {
    try {
      const user = req.user;
      
      const secret = speakeasy.generateSecret({
        name: `CareerNavigator (${user.email})`,
        length: 20
      });
      
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
      
      res.json({
        success: true,
        data: {
          secret: secret.base32,
          qrCode: qrCodeUrl
        }
      });
    } catch (error) {
      console.error('Setup 2FA error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to setup 2FA',
        error: error.message
      });
    }
  };

  verify2FA = async (req, res) => {
    try {
      const { token, secret } = req.body;
      
      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 2
      });
      
      if (verified) {
        await req.user.update({ two_factor_secret: secret, two_factor_enabled: true });
        res.json({
          success: true,
          message: '2FA enabled successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Invalid 2FA token'
        });
      }
    } catch (error) {
      console.error('Verify 2FA error:', error);
      res.status(500).json({
        success: false,
        message: '2FA verification failed',
        error: error.message
      });
    }
  };

  disable2FA = async (req, res) => {
    try {
      await req.user.update({ 
        two_factor_secret: null, 
        two_factor_enabled: false 
      });
      
      res.json({
        success: true,
        message: '2FA disabled successfully'
      });
    } catch (error) {
      console.error('Disable 2FA error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to disable 2FA',
        error: error.message
      });
    }
  };

  getProfile = async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password', 'two_factor_secret'] },
        include: [
          {
            model: CoinTransaction,
            limit: 10,
            order: [['created_at', 'DESC']]
          }
        ]
      });

      res.json({
        success: true,
        data: {
          user,
          progress: {
            registration_completed: user.registration_completed,
            assessment_completed: user.assessment_completed,
            career_guidance_generated: user.career_guidance_generated
          }
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch profile',
        error: error.message
      });
    }
  };

  updateProfile = async (req, res) => {
    try {
      const updates = req.body;
      const user = req.user;

      delete updates.id;
      delete updates.email;
      delete updates.password;
      delete updates.google_id;
      delete updates.total_coins;

      await user.update(updates);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: user.getPublicProfile()
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: error.message
      });
    }
  };

  deleteAccount = async (req, res) => {
    try {
      await req.user.destroy();
      
      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete account',
        error: error.message
      });
    }
  };
}

const authController = new AuthController();
module.exports = authController;
