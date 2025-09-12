/**
 * Admin Authentication Middleware
 * Ensures that the user has admin role to access admin endpoints
 */
const adminAuth = (req, res, next) => {
  try {
    // Check if user is authenticated (should be handled by authenticate middleware first)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required. Insufficient permissions.'
      });
    }

    // User is admin, proceed to next middleware/route handler
    next();

  } catch (error) {
    console.error('Admin auth middleware error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Authentication system error'
    });
  }
};

export default adminAuth;
