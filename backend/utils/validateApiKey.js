/**
 * API Key Validation Utility
 * Validates OpenRouter API key format
 */

function validateApiKey(apiKey) {
  const errors = [];
  
  if (!apiKey) {
    errors.push('API key is required');
    return { isValid: false, errors };
  }

  if (typeof apiKey !== 'string') {
    errors.push('API key must be a string');
    return { isValid: false, errors };
  }

  const trimmedKey = apiKey.trim();
  
  if (trimmedKey.length < 20) {
    errors.push('API key is too short');
  }

  if (!trimmedKey.startsWith('sk-or-v1-')) {
    errors.push('API key must start with "sk-or-v1-"');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(trimmedKey)) {
    errors.push('API key contains invalid characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
    key: trimmedKey
  };
}

module.exports = { validateApiKey };
