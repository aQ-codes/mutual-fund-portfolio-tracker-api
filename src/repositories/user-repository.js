import User from '../models/user.js';
import { CustomValidationError } from '../exceptions/custom-validation-error.js';

class UserRepository {
  // Create a new user
  static async createUser(userData) {
    try {
      const user = new User({
        name: userData.name,
        email: userData.email,
        passwordHash: userData.password, // Will be hashed by pre-save hook
        role: userData.role || 'user'
      });

      const savedUser = await user.save();
      
      return {
        status: true,
        data: savedUser
      };
    } catch (error) {
      console.error('Error creating user:', error);

      // Handle duplicate email error
      if (error.code === 11000 && error.keyPattern?.email) {
        throw CustomValidationError.fromDuplicateKeyError('Email');
      }

      // Handle mongoose validation errors
      if (error.name === 'ValidationError') {
        throw CustomValidationError.fromMongooseError(error);
      }

      throw error;
    }
  }

  // Check if email already exists
  static async emailExists(email) {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      return !!user;
    } catch (error) {
      console.error('Error checking email existence:', error);
      return false;
    }
  }

  // Find user by email (for future login use)
  static async findByEmail(email) {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      return user;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  // Get user by ID (for future authenticated requests)
  static async findById(userId) {
    try {
      const user = await User.findById(userId);
      return user;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }
}

export default UserRepository;
