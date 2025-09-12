import UserRepository from '../../repositories/user-repository.js';
import AuthRequest from '../../requests/auth-request.js';
import AuthResponse from '../../responses/auth-response.js';
import JwtService from '../../services/jwt-service.js';
import { CustomValidationError } from '../../exceptions/custom-validation-error.js';

class AuthController {
  // User signup
  async signup(req, res) {
    try {
      // Validate request data
      const validatedData = AuthRequest.validateSignup(req.body);
      
      // Check if email already exists
      const emailExists = await UserRepository.emailExists(validatedData.email);
      if (emailExists) {
        return res.status(409).json(
          AuthResponse.formatErrorResponse('Email already registered')
        );
      }
      
      // Create user
      const userResult = await UserRepository.createUser(validatedData);
      const user = userResult.data;
      
      // Generate JWT token (auto-login after signup)
      const token = JwtService.generateToken(
        user._id.toString(),
        user.email,
        user.role
      );
      
      // Return success response with token
      res.status(201).json(
        AuthResponse.formatSignupResponse(user, token)
      );
      
    } catch (error) {
      console.error('Signup error:', error);
      
      if (error instanceof CustomValidationError) {
        return res.status(400).json(
          AuthResponse.formatErrorResponse('Validation failed', error.errors)
        );
      }
      
      res.status(500).json(
        AuthResponse.formatErrorResponse('Registration failed. Please try again.')
      );
    }
  }
}

export default AuthController;
