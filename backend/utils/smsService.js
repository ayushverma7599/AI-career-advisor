class SMSService {
  constructor() {
    this.provider = process.env.SMS_PROVIDER || 'console';
    this.apiKey = process.env.SMS_API_KEY;
    this.apiSecret = process.env.SMS_API_SECRET;
  }

  // Send OTP SMS
  async sendOTP(phoneNumber, otp) {
    const message = `Your CareerNavigator verification code is: ${otp}. Valid for 5 minutes.`;
    return this.sendSMS(phoneNumber, message, 'OTP');
  }

  // Generic SMS sending method
  async sendSMS(phoneNumber, message, type = 'General') {
    try {
      console.log('📱 SMS NOTIFICATION');
      console.log('===================');
      console.log(`Type: ${type}`);
      console.log(`To: ${phoneNumber}`);
      console.log(`Message: ${message}`);
      console.log(`Timestamp: ${new Date().toISOString()}`);
      console.log('===================');

      return {
        success: true,
        message: 'SMS sent successfully',
        messageId: `console_${Date.now()}`,
        provider: this.provider
      };
    } catch (error) {
      console.error('SMS sending error:', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  // Check if SMS service is configured
  isConfigured() {
    return true; // Console mode is always available
  }
}

const smsService = new SMSService();
module.exports = { smsService };
