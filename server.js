import express from 'express';
import cors from 'cors';
import connectDB from './src/config/db.js';
import config from './src/config/env.js';
import configureRoutes from './src/routes/routes.js';

const app = express();
const PORT = config.port;

// Basic middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Mutual Fund Portfolio Tracker API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// Configure all routes
configureRoutes(app);

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global Error:', error);
  
  // Don't expose error details in production
  const message = config.nodeEnv === 'production' 
    ? 'Something went wrong!' 
    : error.message;
  
  res.status(error.status || 500).json({
    success: false,
    message,
    ...(config.nodeEnv === 'development' && { stack: error.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server with database connection
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
