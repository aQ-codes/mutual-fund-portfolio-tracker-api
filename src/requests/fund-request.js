import Joi from 'joi';
import { CustomValidationError } from '../exceptions/custom-validation-error.js';

class FundRequest {
  // Validate fund query parameters
  static validateFundQuery(data) {
    const schema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      search: Joi.string().trim().max(100).optional(),
      category: Joi.string().trim().max(150).optional(),
      fundHouse: Joi.string().trim().max(150).optional(),
      sortBy: Joi.string().valid(
        'schemeName', 
        'fundHouse', 
        'schemeCategory', 
        'schemeCode',
        'createdAt',
        'updatedAt'
      ).default('schemeName'),
      sortOrder: Joi.number().valid(1, -1).default(1)
    });

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      throw new CustomValidationError(
        'Fund query validation failed',
        error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      );
    }

    return value;
  }

  // Validate scheme code parameter
  static validateSchemeCode(schemeCode) {
    const schema = Joi.number()
      .integer()
      .min(100000)
      .max(999999)
      .required()
      .messages({
        'number.base': 'Scheme code must be a number',
        'number.integer': 'Scheme code must be an integer',
        'number.min': 'Scheme code must be at least 100000',
        'number.max': 'Scheme code must be at most 999999',
        'any.required': 'Scheme code is required'
      });

    const { error, value } = schema.validate(schemeCode);

    if (error) {
      throw new CustomValidationError(
        'Scheme code validation failed',
        error.details.map(detail => ({
          field: 'schemeCode',
          message: detail.message
        }))
      );
    }

    return value;
  }

  // Validate fund creation data (for admin use)
  static validateFundCreation(data) {
    const schema = Joi.object({
      schemeCode: Joi.number()
        .integer()
        .min(100000)
        .max(999999)
        .required()
        .messages({
          'number.base': 'Scheme code must be a number',
          'number.integer': 'Scheme code must be an integer',
          'number.min': 'Scheme code must be at least 100000',
          'number.max': 'Scheme code must be at most 999999',
          'any.required': 'Scheme code is required'
        }),
      
      schemeName: Joi.string()
        .trim()
        .min(5)
        .max(300)
        .required()
        .messages({
          'string.base': 'Scheme name must be a string',
          'string.min': 'Scheme name must be at least 5 characters',
          'string.max': 'Scheme name cannot exceed 300 characters',
          'any.required': 'Scheme name is required'
        }),
      
      isinGrowth: Joi.string()
        .trim()
        .pattern(/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/)
        .optional()
        .allow(null, '')
        .messages({
          'string.pattern.base': 'ISIN Growth must be in valid format (e.g., INF109K01LX9)'
        }),
      
      isinDivReinvestment: Joi.string()
        .trim()
        .pattern(/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/)
        .optional()
        .allow(null, '')
        .messages({
          'string.pattern.base': 'ISIN Dividend Reinvestment must be in valid format (e.g., INF109K01LY7)'
        }),
      
      fundHouse: Joi.string()
        .trim()
        .min(2)
        .max(150)
        .required()
        .messages({
          'string.base': 'Fund house must be a string',
          'string.min': 'Fund house must be at least 2 characters',
          'string.max': 'Fund house cannot exceed 150 characters',
          'any.required': 'Fund house is required'
        }),
      
      schemeType: Joi.string()
        .trim()
        .min(5)
        .max(100)
        .required()
        .messages({
          'string.base': 'Scheme type must be a string',
          'string.min': 'Scheme type must be at least 5 characters',
          'string.max': 'Scheme type cannot exceed 100 characters',
          'any.required': 'Scheme type is required'
        }),
      
      schemeCategory: Joi.string()
        .trim()
        .min(5)
        .max(150)
        .required()
        .messages({
          'string.base': 'Scheme category must be a string',
          'string.min': 'Scheme category must be at least 5 characters',
          'string.max': 'Scheme category cannot exceed 150 characters',
          'any.required': 'Scheme category is required'
        })
    });

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      throw new CustomValidationError(
        'Fund creation validation failed',
        error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      );
    }

    return value;
  }

  // Validate fund search request
  static validateFundSearch(data) {
    const schema = Joi.object({
      q: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required()
        .messages({
          'string.base': 'Search query must be a string',
          'string.min': 'Search query must be at least 2 characters',
          'string.max': 'Search query cannot exceed 100 characters',
          'any.required': 'Search query is required'
        }),
      
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(50).default(20),
      sortBy: Joi.string().valid(
        'schemeName', 
        'fundHouse', 
        'schemeCategory',
        'relevance'
      ).default('relevance'),
      sortOrder: Joi.number().valid(1, -1).default(1)
    });

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      throw new CustomValidationError(
        'Fund search validation failed',
        error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      );
    }

    return value;
  }

  // Validate NAV query parameters
  static validateNavQuery(data) {
    const schema = Joi.object({
      includeHistory: Joi.boolean().default(true),
      days: Joi.number().integer().min(1).max(365).default(30),
      source: Joi.string().valid('database', 'api', 'auto').default('auto')
    });

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      throw new CustomValidationError(
        'NAV query validation failed',
        error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      );
    }

    return value;
  }
}

export default FundRequest;
