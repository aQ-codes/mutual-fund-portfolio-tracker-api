import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/mutual-fund-tracker',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h', // 24 hours as per current prompt requirements
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // External API (from full-project)
  mfApiBaseUrl: process.env.MFAPI_BASE_URL || 'https://api.mfapi.in/mf',
  
  // Rate Limiting (from full-project)
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  loginRateLimitMax: parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 5,
  portfolioRateLimitMax: parseInt(process.env.PORTFOLIO_RATE_LIMIT_MAX) || 10,
  
  // Security (from full-project)
  bcryptRounds: 12,
  
  // Pagination (from full-project)
  defaultPageSize: 20,
  maxPageSize: 100,
  
  // Cron Jobs
  cronSchedule: process.env.CRON_SCHEDULE || '0 0 * * *', // Daily at 12:00 AM IST
  
  // Admin User Configuration
  ADMIN_NAME: process.env.ADMIN_NAME || 'Admin',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@mutualfund.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin@123456',
};

// Validation (from full-project)
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

export default config;