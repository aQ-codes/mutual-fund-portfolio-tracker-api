import Joi from 'joi';

class AdminRequest {
  // Validation schema for users query
  static usersQuerySchema = Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .optional()
      .messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1'
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20)
      .optional()
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
      }),
    search: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .optional()
      .messages({
        'string.min': 'Search term must be at least 2 characters',
        'string.max': 'Search term cannot exceed 50 characters'
      }),
    role: Joi.string()
      .valid('user', 'admin')
      .optional()
      .messages({
        'any.only': 'Role must be either user or admin'
      })
  });

  // Validation schema for portfolios query
  static portfoliosQuerySchema = Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .optional(),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20)
      .optional(),
    userId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'User ID must be a valid MongoDB ObjectId'
      })
  });

  // Validation schema for popular funds query
  static popularFundsQuerySchema = Joi.object({
    limit: Joi.number()
      .integer()
      .min(1)
      .max(50)
      .default(10)
      .optional()
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 50'
      })
  });

  // Validation schema for date range queries
  static dateRangeSchema = Joi.object({
    startDate: Joi.string()
      .pattern(/^\d{2}-\d{2}-\d{4}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Start date must be in DD-MM-YYYY format'
      }),
    endDate: Joi.string()
      .pattern(/^\d{2}-\d{2}-\d{4}$/)
      .optional()
      .messages({
        'string.pattern.base': 'End date must be in DD-MM-YYYY format'
      })
  });

  // Validate users query parameters
  static validateUsersQuery(query) {
    const { error, value } = this.usersQuerySchema.validate(query, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      return {
        isValid: false,
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      };
    }

    return {
      isValid: true,
      data: value
    };
  }

  // Validate portfolios query parameters
  static validatePortfoliosQuery(query) {
    const { error, value } = this.portfoliosQuerySchema.validate(query, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      return {
        isValid: false,
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      };
    }

    return {
      isValid: true,
      data: value
    };
  }

  // Validate popular funds query parameters
  static validatePopularFundsQuery(query) {
    const { error, value } = this.popularFundsQuerySchema.validate(query, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      return {
        isValid: false,
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      };
    }

    return {
      isValid: true,
      data: value
    };
  }

  // Validate date range parameters
  static validateDateRange(query) {
    const { error, value } = this.dateRangeSchema.validate(query, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      return {
        isValid: false,
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      };
    }

    // Additional validation for date range
    if (value.startDate && value.endDate) {
      const start = this.parseDate(value.startDate);
      const end = this.parseDate(value.endDate);
      
      if (start > end) {
        return {
          isValid: false,
          errors: [{
            field: 'dateRange',
            message: 'Start date must be before or equal to end date'
          }]
        };
      }
    }

    return {
      isValid: true,
      data: value
    };
  }

  // Helper method to parse DD-MM-YYYY date string
  static parseDate(dateString) {
    const [day, month, year] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  // Validation schema for user management operations
  static userManagementSchema = Joi.object({
    action: Joi.string()
      .valid('activate', 'deactivate', 'promote', 'demote')
      .required()
      .messages({
        'any.only': 'Action must be one of: activate, deactivate, promote, demote',
        'any.required': 'Action is required'
      }),
    userId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'User ID must be a valid MongoDB ObjectId',
        'any.required': 'User ID is required'
      }),
    reason: Joi.string()
      .trim()
      .min(5)
      .max(200)
      .optional()
      .messages({
        'string.min': 'Reason must be at least 5 characters',
        'string.max': 'Reason cannot exceed 200 characters'
      })
  });

  // Validate user management operations
  static validateUserManagement(data) {
    const { error, value } = this.userManagementSchema.validate(data, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      return {
        isValid: false,
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      };
    }

    return {
      isValid: true,
      data: value
    };
  }
}

export default AdminRequest;
