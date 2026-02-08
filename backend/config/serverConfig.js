const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  database: {
    url: process.env.MONGODB_URL || 'mongodb://localhost:27017/bazooka-monitoring',
    fallbackToMemory: true
  },
  
  // Encryption
  encryption: {
    algorithm: 'aes-256-cbc',
    keyLength: 32,
    ivLength: 16,
    saltLength: 32,
    tagLength: 16,
    secretKey: process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production'
  },
  
  // OpenRouter AI
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'anthropic/claude-3-haiku',
    maxTokens: 1000,
    temperature: 0.7
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs (more lenient for development)
    skipSuccessfulRequests: false // Don't count successful requests
  },
  
  // CORS
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
};

module.exports = config;
