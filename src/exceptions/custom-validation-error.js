export class CustomValidationError extends Error {
  constructor(errors) {
    super('Validation failed');
    this.name = 'CustomValidationError';
    this.errors = Array.isArray(errors) ? errors : [errors];
  }

  // Create from Joi validation error
  static fromJoiError(joiError) {
    const errors = joiError.details.map(detail => detail.message);
    return new CustomValidationError(errors);
  }

  // Create from Mongoose validation error
  static fromMongooseError(mongooseError) {
    const errors = Object.values(mongooseError.errors).map(err => err.message);
    return new CustomValidationError(errors);
  }

  // Create from duplicate key error (MongoDB)
  static fromDuplicateKeyError(field = 'field') {
    return new CustomValidationError([`${field} already exists`]);
  }
}

export default CustomValidationError;
