const crypto = require('crypto');
const config = require('../config/serverConfig');

class EncryptionService {
  constructor() {
    this.algorithm = config.encryption.algorithm;
    this.keyLength = config.encryption.keyLength;
    this.ivLength = config.encryption.ivLength;
    this.saltLength = config.encryption.saltLength;
  }

  encrypt(text) {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const salt = crypto.randomBytes(this.saltLength);
      const key = crypto.scryptSync(config.encryption.secretKey, salt, this.keyLength);
      
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        salt: salt.toString('hex')
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  decrypt(encryptedData) {
    try {
      const { encrypted, iv, salt } = encryptedData;
      
      const key = crypto.scryptSync(config.encryption.secretKey, Buffer.from(salt, 'hex'), this.keyLength);
      
      const decipher = crypto.createDecipheriv(this.algorithm, key, Buffer.from(iv, 'hex'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }
}

module.exports = new EncryptionService();
