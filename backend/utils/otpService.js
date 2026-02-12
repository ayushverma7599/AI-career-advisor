const crypto = require('crypto');
const twilio = require('twilio');

// Use correct environment variable names
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '+918755242509';

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// In-memory OTP storage (use Redis in production)
const otpStore = new Map();

class OTPService {
  // Generate 6-digit OTP
  generate() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Store OTP with expiration
  async store(identifier, otp, type, expiryMinutes = 5) {
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    otpStore.set(`${type}:${identifier}`, {
      otp,
      expiresAt,
      attempts: 0,
      maxAttempts: 3
    });

    // Auto cleanup after expiration
    setTimeout(() => {
      otpStore.delete(`${type}:${identifier}`);
    }, expiryMinutes * 60 * 1000);
  }

  // Verify OTP
  async verify(identifier, inputOtp, type) {
    const key = `${type}:${identifier}`;
    const stored = otpStore.get(key);

    if (!stored) {
      return false; // OTP not found or expired
    }

    // Check expiration
    if (new Date() > stored.expiresAt) {
      otpStore.delete(key);
      return false;
    }

    // Check attempt limit
    if (stored.attempts >= stored.maxAttempts) {
      otpStore.delete(key);
      return false;
    }

    // Increment attempt count
    stored.attempts++;

    // Verify OTP
    if (stored.otp === inputOtp) {
      otpStore.delete(key); // Remove on successful verification
      return true;
    }

    return false;
  }

  // Send SMS (Twilio integration)
  async sendSMS(phone, otp) {
    try {
      const message = await twilioClient.messages.create({
        body: `Your OTP code is: ${otp}`,
        from: TWILIO_PHONE_NUMBER,
        to: phone
      });

      return {
        success: true,
        message: 'OTP sent successfully',
        sid: message.sid
      };
    } catch (error) {
      console.error('SMS sending error:', error);
      throw new Error('Failed to send SMS');
    }
  }

  // Send email OTP
  async sendEmail(email, otp) {
    try {
      const { emailService } = require('./emailService');
      await emailService.sendOTPEmail(email, otp);

      return {
        success: true,
        message: 'Email OTP sent successfully'
      };
    } catch (error) {
      console.error('Email OTP sending error:', error);
      throw new Error('Failed to send email OTP');
    }
  }

  // Generate secure token for password reset
  generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Hash token for storage
  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Clear expired OTPs (cleanup function)
  cleanup() {
    const now = new Date();
    for (const [key, value] of otpStore.entries()) {
      if (now > value.expiresAt) {
        otpStore.delete(key);
      }
    }
  }

  // Get OTP statistics (for monitoring)
  getStatistics() {
    const now = new Date();
    let active = 0;
    let expired = 0;

    for (const [key, value] of otpStore.entries()) {
      if (now > value.expiresAt) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      active,
      expired,
      total: active + expired
    };
  }
}

const otpService = new OTPService();

// Run cleanup every 5 minutes
setInterval(() => {
  otpService.cleanup();
}, 5 * 60 * 1000);

module.exports = { otpService };
