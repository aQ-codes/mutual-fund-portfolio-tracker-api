import Joi from 'joi';

class PortfolioRequest {
  // Validation schema for adding fund to portfolio
  static addFundSchema = Joi.object({
    schemeCode: Joi.number()
      .integer()
      .min(100000)
      .max(999999)
      .required()
      .messages({
        'number.base': 'Scheme code must be a number',
        'number.integer': 'Scheme code must be an integer',
        'number.min': 'Scheme code must be at least 100000',
        'number.max': 'Scheme code cannot exceed 999999',
        'any.required': 'Scheme code is required'
      }),
    units: Joi.number()
      .positive()
      .precision(3)
      .required()
      .messages({
        'number.base': 'Units must be a number',
        'number.positive': 'Units must be greater than 0',
        'any.required': 'Units is required'
      })
  });

  // Validation schema for selling fund from portfolio
  static sellFundSchema = Joi.object({
    schemeCode: Joi.number()
      .integer()
      .min(100000)
      .max(999999)
      .required()
      .messages({
        'number.base': 'Scheme code must be a number',
        'number.integer': 'Scheme code must be an integer',
        'number.min': 'Scheme code must be at least 100000',
        'number.max': 'Scheme code cannot exceed 999999',
        'any.required': 'Scheme code is required'
      }),
    units: Joi.number()
      .positive()
      .precision(3)
      .required()
      .messages({
        'number.base': 'Units must be a number',
        'number.positive': 'Units must be greater than 0',
        'any.required': 'Units is required'
      })
  });

  // Validation schema for scheme code parameter
  static schemeCodeSchema = Joi.object({
    schemeCode: Joi.number()
      .integer()
      .min(100000)
      .max(999999)
      .required()
      .messages({
        'number.base': 'Scheme code must be a number',
        'number.integer': 'Scheme code must be an integer',
        'number.min': 'Scheme code must be at least 100000',
        'number.max': 'Scheme code cannot exceed 999999',
        'any.required': 'Scheme code is required'
      })
  });

  // Validation schema for portfolio history query
  static historyQuerySchema = Joi.object({
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
      }),
    days: Joi.number()
      .integer()
      .min(1)
      .max(365)
      .default(30)
      .optional()
      .messages({
        'number.base': 'Days must be a number',
        'number.integer': 'Days must be an integer',
        'number.min': 'Days must be at least 1',
        'number.max': 'Days cannot exceed 365'
      })
  });

  // Validate add fund request
  static validateAddFund(data) {
    const { error, value } = this.addFundSchema.validate(data, { 
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

  // Validate sell fund request
  static validateSellFund(data) {
    const { error, value } = this.sellFundSchema.validate(data, { 
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

  // Validate scheme code parameter
  static validateSchemeCode(schemeCode) {
    // Convert string to number if needed
    const numericSchemeCode = typeof schemeCode === 'string' ? parseInt(schemeCode, 10) : schemeCode;
    
    const { error, value } = this.schemeCodeSchema.validate({ schemeCode: numericSchemeCode }, { 
      abortEarly: false 
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

  // Validate portfolio history query parameters
  static validateHistoryQuery(query) {
    const { error, value } = this.historyQuerySchema.validate(query, { 
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

      // Check if date range is not too large (max 1 year)
      const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      if (daysDiff > 365) {
        return {
          isValid: false,
          errors: [{
            field: 'dateRange',
            message: 'Date range cannot exceed 365 days'
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

  // Validation schema for portfolio list query
  static listQuerySchema = Joi.object({
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
    sortBy: Joi.string()
      .valid('investmentAmount', 'currentValue', 'profitLoss', 'schemeName', 'units')
      .default('investmentAmount')
      .optional()
      .messages({
        'any.only': 'Sort by must be one of: investmentAmount, currentValue, profitLoss, schemeName, units'
      }),
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .optional()
      .messages({
        'any.only': 'Sort order must be either asc or desc'
      })
  });

  // Validate portfolio list query parameters
  static validateListQuery(query) {
    const { error, value } = this.listQuerySchema.validate(query, { 
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

export default PortfolioRequest;
