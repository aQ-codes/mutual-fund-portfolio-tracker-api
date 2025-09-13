import config from '../config/env.js';
import authRoutes from './user/auth.js';
import fundRoutes from './funds.js';
import portfolioRoutes from './user/portfolio.js';
import transactionRoutes from './user/transaction.js';
import adminRoutes from './admin/admin.js';

const configureRoutes = (app) => {
  // API version prefix
  const API_PREFIX = '/api';
  
  // Root route
  app.get('/', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Mutual Fund Portfolio Tracker API',
      version: '1.0.0',
      environment: config.nodeEnv,
      endpoints: {
        auth: `${API_PREFIX}/auth`,
        funds: `${API_PREFIX}/funds`,
        portfolio: `${API_PREFIX}/portfolio`,
        transactions: `${API_PREFIX}/transactions`,
        admin: `${API_PREFIX}/admin`
      }
    });
  });
  
  // API information route
  app.get(API_PREFIX, (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Mutual Fund Portfolio Tracker API',
      version: '1.0.0',
      status: 'Database connected and server running',
      endpoints: {
        auth: `${API_PREFIX}/auth`,
        funds: `${API_PREFIX}/funds`,
        portfolio: `${API_PREFIX}/portfolio`,
        transactions: `${API_PREFIX}/transactions`,
        admin: `${API_PREFIX}/admin`
      }
    });
  });
  
  // Configure route groups
  app.use(`${API_PREFIX}/auth`, authRoutes);
  app.use(`${API_PREFIX}/funds`, fundRoutes);
  app.use(`${API_PREFIX}/portfolio`, portfolioRoutes);
  app.use(`${API_PREFIX}/transactions`, transactionRoutes);
  app.use(`${API_PREFIX}/admin`, adminRoutes);
  
  // API route not found handler
  app.use(`${API_PREFIX}/*`, (req, res) => {
    res.status(404).json({
      success: false,
      message: `API endpoint ${req.originalUrl} not found`,
      availableEndpoints: {
        auth: `${API_PREFIX}/auth`,
        funds: `${API_PREFIX}/funds`,
        portfolio: `${API_PREFIX}/portfolio`,
        transactions: `${API_PREFIX}/transactions`,
        admin: `${API_PREFIX}/admin`
      }
    });
  });
};

export default configureRoutes;
