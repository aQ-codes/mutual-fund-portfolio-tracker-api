import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/mutual-fund-tracker',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
};

export default config;