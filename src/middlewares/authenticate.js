import JwtService from '../services/jwt-service.js';
import UserRepository from '../repositories/user-repository.js';

// Main authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided or invalid format.',
        error: 'Authentication required'
      });
    }
    
    // Extract token from "Bearer <token>"
    const token = authHeader.substring(7);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        error: 'Authentication required'
      });
    }
    
    // Verify token
    let decoded;
    try {
      decoded = JwtService.verifyToken(token);
    } catch (jwtError) {
      if (jwtError.message.includes('expired')) {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please login again.',
          error: 'Token expired'
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Please login again.',
          error: 'Invalid token'
        });
      }
    }
    
    // Check if user exists
    const user = await UserRepository.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please login again.',
        error: 'User not found'
      });
    }
    
    // Add user to request object
    req.user = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role
    };
    
    next();
    
  } catch (error) {
    console.error('Authentication error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Authentication failed due to server error.',
      error: 'Internal server error'
    });
  }
};

// Role-based guard helper
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'No user found in request'
      });
    }
    
    const userRole = req.user.role;
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!rolesArray.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        error: `Required roles: ${rolesArray.join(', ')}, but user has: ${userRole}`
      });
    }
    
    next();
  };
};

// Convenience middleware for user-only access
export const requireUser = requireRole(['user', 'admin']);

// Convenience middleware for admin-only access
export const requireAdmin = requireRole('admin');

export default authenticate;
