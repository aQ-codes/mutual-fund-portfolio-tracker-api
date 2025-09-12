import authRoutes from './auth.js';

const configureRoutes = (app) => {
  // API version prefix
  const API_PREFIX = '/api';
  
  // Health check route (no prefix) - already handled in server.js
  
  // API information route
  app.get(API_PREFIX, (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Mutual Fund Portfolio Tracker API',
      version: '1.0.0',
      status: 'Database connected and server running',
      endpoints: {
        auth: `${API_PREFIX}/auth`,
        health: '/health'
      }
    });
  });
  
  // Configure route groups
  app.use(`${API_PREFIX}/auth`, authRoutes);
  
  // API route not found handler
  app.use(`${API_PREFIX}/*`, (req, res) => {
    res.status(404).json({
      success: false,
      message: `API endpoint ${req.originalUrl} not found`,
      availableEndpoints: {
        auth: `${API_PREFIX}/auth`,
        health: '/health'
      }
    });
  });
};

export default configureRoutes;
