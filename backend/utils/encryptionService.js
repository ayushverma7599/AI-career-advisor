const crypto = require('crypto');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.secretKey = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here!';
    this.keyBuffer = crypto.scryptSync(this.secretKey, 'salt', 32);
  }

  // Encrypt sensitive data
  encrypt(text) {
    if (!text) return null;

    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.algorithm, this.keyBuffer, iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt sensitive data
  decrypt(encryptedData) {
    if (!encryptedData) return null;

    try {
      const { encrypted, iv, authTag } = encryptedData;

      const decipher = crypto.createDecipher(
        this.algorithm, 
        this.keyBuffer, 
        Buffer.from(iv, 'hex')
      );

      decipher.setAuthTag(Buffer.from(authTag, 'hex'));

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Hash password (one-way)
  hash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Generate random string
  generateRandom(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Mask sensitive data for display
  maskAadhaar(aadhaar) {
    if (!aadhaar || aadhaar.length !== 12) return '****-****-****';
    return `${aadhaar.slice(0, 4)}-${aadhaar.slice(4, 8)}-****`;
  }

  maskPhone(phone) {
    if (!phone || phone.length !== 10) return '******-****';
    return `${phone.slice(0, 6)}-****`;
  }

  maskEmail(email) {
    if (!email || !email.includes('@')) return '****@****.***';
    const [local, domain] = email.split('@');
    const maskedLocal = local.length <= 2 ? '**' : local.slice(0, 2) + '*'.repeat(local.length - 2);
    return `${maskedLocal}@${domain}`;
  }
}

const encryptionService = new EncryptionService();
module.exports = { encryptionService };
