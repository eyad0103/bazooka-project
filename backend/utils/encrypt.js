const crypto = require('crypto');

/**
 * Simple XOR encryption for API keys
 * This is a temporary solution - replace with proper encryption in production
 */
const ENCRYPTION_KEY = process.env.ENCRYPTION_PASSWORD || 'default-key-12345';

function encrypt(text) {
  if (!text) return '';
  
  const key = Buffer.from(ENCRYPTION_KEY, 'utf8');
  const textBuffer = Buffer.from(text, 'utf8');
  const encrypted = Buffer.alloc(textBuffer.length);
  
  for (let i = 0; i < textBuffer.length; i++) {
    encrypted[i] = textBuffer[i] ^ key[i % key.length];
  }
  
  return encrypted.toString('base64');
}

function decrypt(encryptedText) {
  if (!encryptedText) return '';
  
  try {
    const key = Buffer.from(ENCRYPTION_KEY, 'utf8');
    const encrypted = Buffer.from(encryptedText, 'base64');
    const decrypted = Buffer.alloc(encrypted.length);
    
    for (let i = 0; i < encrypted.length; i++) {
      decrypted[i] = encrypted[i] ^ key[i % key.length];
    }
    
    return decrypted.toString('utf8');
  } catch (error) {
    throw new Error('Failed to decrypt API key');
  }
}

module.exports = { encrypt, decrypt };
