import jwt from 'jsonwebtoken';
import config from '../config/env.js';

// JWT utilities - pure functions for token operations

class JwtUtils {
  // Generate JWT token for user
  static generateToken(userId, email, role = 'user') {
    const payload = {
      userId,
      email,
      role
    };

    const options = {
      expiresIn: '24h', // Token expires in 24 hours as per requirements
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

  // Extract token from Authorization header
  static extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    return authHeader.substring(7);
  }

  // Check if token is expired
  static isTokenExpired(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return true;
      }
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  // Get token expiry time
  static getTokenExpiry(token) {
    try {
      const decoded = this.decodeToken(token);
      return decoded?.exp ? new Date(decoded.exp * 1000) : null;
    } catch (error) {
      return null;
    }
  }
}

export default JwtUtils;
