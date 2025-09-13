import AuthResponse from '../../responses/user/auth-response.js';

/**
 * Middleware to check if user has admin role
 * Must be used after auth-middleware
 */
const adminRoleMiddleware = (req, res, next) => {
  try {
    // Check if user exists (should be set by auth-middleware)
    if (!req.user) {
      return res.status(401).json(
        AuthResponse.formatErrorResponse('Authentication required')
      );
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json(
        AuthResponse.formatErrorResponse('Access denied. Admin role required.')
      );
    }

    // User is admin, proceed to next middleware/controller
    next();
  } catch (error) {
    console.error('Admin role middleware error:', error);
    return res.status(500).json(
      AuthResponse.formatErrorResponse('Internal server error')
    );
  }
};

export default adminRoleMiddleware;
