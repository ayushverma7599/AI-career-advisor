const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  // Send verification email
  async sendVerificationEmail(email, name) {
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?email=${encodeURIComponent(email)}`;

    const mailOptions = {
      from: `"CareerNavigator" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - CareerNavigator',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">🎯 CareerNavigator</h1>
          </div>
          <div style="padding: 30px; background: white;">
            <h2>Welcome to CareerNavigator, ${name}!</h2>
            <p>Thank you for registering with CareerNavigator. To complete your account setup, please verify your email address.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p>If you didn't create an account with CareerNavigator, please ignore this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px;">
              This email was sent from CareerNavigator. If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      `
    };

    return this.transporter.sendMail(mailOptions);
  }

  // Send password reset email
  async sendPasswordResetEmail(email, name, resetToken) {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"CareerNavigator" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset Your Password - CareerNavigator',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">🔐 CareerNavigator</h1>
          </div>
          <div style="padding: 30px; background: white;">
            <h2>Password Reset Request</h2>
            <p>Hello ${name},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px;">
              This email was sent from CareerNavigator. Never share your password with anyone.
            </p>
          </div>
        </div>
      `
    };

    return this.transporter.sendMail(mailOptions);
  }

  // Send OTP email
  async sendOTPEmail(email, otp) {
    const mailOptions = {
      from: `"CareerNavigator" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Verification Code - CareerNavigator',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">🔢 CareerNavigator</h1>
          </div>
          <div style="padding: 30px; background: white;">
            <h2>Email Verification Code</h2>
            <p>Please use the following verification code to complete your registration:</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="background: #f8f9fa; border: 2px solid #667eea; padding: 20px; border-radius: 8px; display: inline-block;">
                <h1 style="margin: 0; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</h1>
              </div>
            </div>
            <p>This code will expire in 5 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
        </div>
      `
    };

    return this.transporter.sendMail(mailOptions);
  }

  // Send welcome email after successful registration
  async sendWelcomeEmail(email, name, coinsEarned) {
    const mailOptions = {
      from: `"CareerNavigator" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to CareerNavigator! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">🎉 Welcome to CareerNavigator!</h1>
          </div>
          <div style="padding: 30px; background: white;">
            <h2>Congratulations, ${name}!</h2>
            <p>Your registration is complete! You've earned <strong>${coinsEarned} coins</strong> as a welcome bonus.</p>

            <h3>What's Next?</h3>
            <ul style="line-height: 1.8;">
              <li>🎯 <strong>Take the Career Assessment</strong> - Discover your ideal career path</li>
              <li>🏫 <strong>Explore Colleges</strong> - Find the perfect institution for you</li>
              <li>🧩 <strong>Solve AI Puzzles</strong> - Earn more coins and improve skills</li>
              <li>💬 <strong>Join the Forum</strong> - Connect with peers and mentors</li>
              <li>🏆 <strong>Redeem Rewards</strong> - Use coins for mentorship and discounts</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/dashboard" style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Go to Dashboard
              </a>
            </div>

            <p>Happy learning!</p>
            <p>The CareerNavigator Team</p>
          </div>
        </div>
      `
    };

    return this.transporter.sendMail(mailOptions);
  }

  // Generic notification email
  async sendNotificationEmail(email, subject, message) {
    const mailOptions = {
      from: `"CareerNavigator" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">📧 CareerNavigator</h1>
          </div>
          <div style="padding: 30px; background: white;">
            ${message}
          </div>
        </div>
      `
    };

    return this.transporter.sendMail(mailOptions);
  }

  // Test email configuration
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email service connected successfully');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }
}

const emailService = new EmailService();
module.exports = { emailService };
