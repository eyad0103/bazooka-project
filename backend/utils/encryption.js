const crypto = require('crypto');
const config = require('../config/serverConfig');

class Encryption {
  constructor() {
    this.algorithm = config.encryption.algorithm;
    this.keyLength = config.encryption.keyLength;
    this.ivLength = config.encryption.ivLength;
    this.saltLength = config.encryption.saltLength;
    this.tagLength = config.encryption.tagLength;
    this.secretKey = crypto.scryptSync(config.encryption.secretKey, 'salt', this.keyLength);
  }

  encrypt(text) {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const salt = crypto.randomBytes(this.saltLength);
      const key = crypto.scryptSync(this.secretKey, salt, this.keyLength);
      
      const cipher = crypto.createCipher(this.algorithm, key);
      cipher.setAAD(salt);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        salt: salt.toString('hex'),
        tag: tag.toString('hex')
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  decrypt(encryptedData) {
    try {
      const { encrypted, iv, salt, tag } = encryptedData;
      
      const key = crypto.scryptSync(this.secretKey, Buffer.from(salt, 'hex'), this.keyLength);
      
      const decipher = crypto.createDecipher(this.algorithm, key);
      decipher.setAAD(Buffer.from(salt, 'hex'));
      decipher.setAuthTag(Buffer.from(tag, 'hex'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }
}

module.exports = new Encryption();
