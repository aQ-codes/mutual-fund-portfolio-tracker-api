import Joi from 'joi';
import { CustomValidationError } from '../exceptions/custom-validation-error.js';
import PasswordUtils from '../utils/password-utils.js';

class AuthRequest {
  // Validate signup request
  static validateSignup(data) {
    const schema = Joi.object({
      name: Joi.string()
        .min(2)
        .max(50)
        .trim()
        .required()
        .messages({
          'string.min': 'Name must be at least 2 characters long',
          'string.max': 'Name cannot exceed 50 characters',
          'string.empty': 'Name is required',
          'any.required': 'Name is required'
        }),
      
      email: Joi.string()
        .email()
        .trim()
        .lowercase()
        .required()
        .messages({
          'string.email': 'Please enter a valid email address',
          'string.empty': 'Email is required',
          'any.required': 'Email is required'
        }),
      
      password: Joi.string()
        .required()
        .messages({
          'string.empty': 'Password is required',
          'any.required': 'Password is required'
        })
    });

    const { error, value } = schema.validate(data, { abortEarly: false });

    if (error) {
      throw CustomValidationError.fromJoiError(error);
    }

    // Additional password strength validation using utility
    const passwordValidation = PasswordUtils.validatePasswordStrength(value.password);
    if (!passwordValidation.isValid) {
      throw new CustomValidationError([passwordValidation.message]);
    }

    return value;
  }
}

export default AuthRequest;
