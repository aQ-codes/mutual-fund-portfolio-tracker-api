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

  // Find users with query and pagination
  static async findWithQuery(query, options = {}) {
    try {
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = -1 } = options;
      const skip = (page - 1) * limit;

      return await User.find(query)
        .select('-passwordHash')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit);
    } catch (error) {
      console.error('Error finding users with query:', error);
      throw error;
    }
  }

  // Count users by query
  static async countByQuery(query = {}) {
    try {
      return await User.countDocuments(query);
    } catch (error) {
      console.error('Error counting users by query:', error);
      throw error;
    }
  }

  // Get all users with pagination
  static async getAllWithPagination(options = {}) {
    try {
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = -1 } = options;
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        User.find()
          .select('-passwordHash')
          .sort({ [sortBy]: sortOrder })
          .skip(skip)
          .limit(limit),
        User.countDocuments()
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers: total,
          limit,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting users with pagination:', error);
      throw error;
    }
  }
}

export default UserRepository;
