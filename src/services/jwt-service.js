import jwt from 'jsonwebtoken';
import config from '../config/env.js';

class JwtService {
  // Generate JWT token for user
  static generateToken(userId, email, role = 'user') {
    const payload = {
      userId,
      email,
      role
    };

    const options = {
      expiresIn: '7d', // Token expires in 7 days
      issuer: 'mutual-fund-tracker'
    };

    return jwt.sign(payload, config.jwtSecret, options);
  }

  // Verify JWT token
  static verifyToken(token) {
    try {
      return jwt.verify(token, config.jwtSecret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Decode token without verification (for debugging)
  static decodeToken(token) {
    return jwt.decode(token);
  }
}

export default JwtService;
