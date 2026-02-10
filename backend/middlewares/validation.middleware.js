const validationUtil = require('../utils/validation.util');
const errorMiddleware = require('./error.middleware');

/**
 * Validation Middleware
 * Request validation middleware
 */
class ValidationMiddleware {
  /**
   * Validate request body against schema
   */
  validateBody(schema) {
    return (req, res, next) => {
      try {
        const { isValid, errors } = this.validate(req.body, schema);
        
        if (!isValid) {
          throw errorMiddleware.validationError(errors);
        }

        // Sanitize request body
        req.body = this.sanitize(req.body, schema);
        
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Validate request parameters
   */
  validateParams(schema) {
    return (req, res, next) => {
      try {
        const { isValid, errors } = this.validate(req.params, schema);
        
        if (!isValid) {
          throw errorMiddleware.validationError(errors);
        }

        // Sanitize parameters
        req.params = this.sanitize(req.params, schema);
        
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Validate query parameters
   */
  validateQuery(schema) {
    return (req, res, next) => {
      try {
        const { isValid, errors } = this.validate(req.query, schema);
        
        if (!isValid) {
          throw errorMiddleware.validationError(errors);
        }

        // Sanitize query parameters
        req.query = this.sanitize(req.query, schema);
        
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Validate pagination parameters
   */
  validatePagination() {
    return (req, res, next) => {
      try {
        const { isValid, errors, limit, offset } = validationUtil.validatePagination(
          req.query.limit,
          req.query.offset
        );
        
        if (!isValid) {
          throw errorMiddleware.validationError(errors);
        }

        req.query.limit = limit;
        req.query.offset = offset;
        
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Validate API key
   */
  validateApiKey() {
    return (req, res, next) => {
      try {
        const { key } = req.body;
        
        if (!key) {
          throw errorMiddleware.validationError('API key is required');
        }

        const validation = validationUtil.validateApiKey(key);
        
        if (!validation.isValid) {
          throw errorMiddleware.validationError(validation.errors);
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Validate PC data
   */
  validatePCData() {
    return (req, res, next) => {
      try {
        const validation = validationUtil.validatePCData(req.body);
        
        if (!validation.isValid) {
          throw errorMiddleware.validationError(validation.errors);
        }

        // Sanitize PC data
        req.body = this.sanitizePCData(req.body);
        
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Validate error data
   */
  validateErrorData() {
    return (req, res, next) => {
      try {
        const validation = validationUtil.validateErrorData(req.body);
        
        if (!validation.isValid) {
          throw errorMiddleware.validationError(validation.errors);
        }

        // Sanitize error data
        req.body = this.sanitizeErrorData(req.body);
        
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Validate heartbeat data
   */
  validateHeartbeatData() {
    return (req, res, next) => {
      try {
        const validation = validationUtil.validateHeartbeatData(req.body);
        
        if (!validation.isValid) {
          throw errorMiddleware.validationError(validation.errors);
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Validate chat message
   */
  validateChatMessage() {
    return (req, res, next) => {
      try {
        const { message } = req.body;
        
        const validation = validationUtil.validateChatMessage(message);
        
        if (!validation.isValid) {
          throw errorMiddleware.validationError(validation.errors);
        }

        // Sanitize message
        req.body.message = validationUtil.sanitizeString(message);
        
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Generic validation method
   */
  validate(data, schema) {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];

      // Required validation
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }

      // Skip validation if field is not required and not provided
      if (!rules.required && (value === undefined || value === null)) {
        continue;
      }

      // Type validation
      if (rules.type && typeof value !== rules.type) {
        errors.push(`${field} must be of type ${rules.type}`);
        continue;
      }

      // String validations
      if (typeof value === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters`);
        }
        
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} must not exceed ${rules.maxLength} characters`);
        }
        
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`${field} format is invalid`);
        }
      }

      // Number validations
      if (typeof value === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`${field} must be at least ${rules.min}`);
        }
        
        if (rules.max !== undefined && value > rules.max) {
          errors.push(`${field} must not exceed ${rules.max}`);
        }
      }

      // Array validations
      if (Array.isArray(value)) {
        if (rules.minItems && value.length < rules.minItems) {
          errors.push(`${field} must have at least ${rules.minItems} items`);
        }
        
        if (rules.maxItems && value.length > rules.maxItems) {
          errors.push(`${field} must not exceed ${rules.maxItems} items`);
        }
      }

      // Enum validation
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
      }

      // Custom validation
      if (rules.validate && typeof rules.validate === 'function') {
        const customError = rules.validate(value);
        if (customError) {
          errors.push(`${field}: ${customError}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize data based on schema
   */
  sanitize(data, schema) {
    const sanitized = {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];

      if (value !== undefined && value !== null) {
        if (typeof value === 'string') {
          sanitized[field] = validationUtil.sanitizeString(value);
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          sanitized[field] = this.sanitize(value, rules.properties || {});
        } else {
          sanitized[field] = value;
        }
      }
    }

    return sanitized;
  }

  /**
   * Sanitize PC data specifically
   */
  sanitizePCData(data) {
    return {
      pcId: validationUtil.sanitizeString(data.pcId),
      name: data.name ? validationUtil.sanitizeString(data.name) : undefined,
      ip: data.ip ? validationUtil.sanitizeString(data.ip) : undefined,
      os: data.os ? validationUtil.sanitizeString(data.os) : undefined,
      specs: data.specs || {}
    };
  }

  /**
   * Sanitize error data specifically
   */
  sanitizeErrorData(data) {
    return {
      pcId: validationUtil.sanitizeString(data.pcId),
      type: data.type ? validationUtil.sanitizeString(data.type) : undefined,
      severity: data.severity,
      message: validationUtil.sanitizeString(data.message),
      details: data.details || {},
      timestamp: data.timestamp
    };
  }

  /**
   * Common validation schemas
   */
  get schemas() {
    return {
      pcRegistration: {
        pcId: { required: true, type: 'string', minLength: 1, maxLength: 100 },
        name: { required: false, type: 'string', minLength: 1, maxLength: 50 },
        ip: { required: false, type: 'string', pattern: /^(\d{1,3}\.){3}\d{1,3}$/ },
        os: { required: false, type: 'string', maxLength: 100 },
        specs: { required: false, type: 'object' }
      },
      
      errorReport: {
        pcId: { required: true, type: 'string', minLength: 1 },
        type: { required: false, type: 'string', maxLength: 50 },
        severity: { required: false, type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        message: { required: true, type: 'string', minLength: 1, maxLength: 1000 },
        details: { required: false, type: 'object' },
        timestamp: { required: false, type: 'string' }
      },
      
      heartbeat: {
        status: { required: false, type: 'string', enum: ['online', 'offline'] },
        metrics: { required: false, type: 'object' },
        timestamp: { required: false, type: 'string' }
      },
      
      chatMessage: {
        message: { required: true, type: 'string', minLength: 1, maxLength: 10000 },
        context: { required: false, type: 'object' }
      },
      
      apiKey: {
        key: { required: true, type: 'string', minLength: 20, maxLength: 200 },
        description: { required: false, type: 'string', maxLength: 200 }
      },
      
      pagination: {
        limit: { required: false, type: 'string', pattern: /^\d+$/ },
        offset: { required: false, type: 'string', pattern: /^\d+$/ }
      }
    };
  }
}

module.exports = new ValidationMiddleware();
