import express from 'express';
import cors from 'cors';
import connectDB from './src/config/db.js';
import config from './src/config/env.js';
import configureRoutes from './src/routes/routes.js';
import CronService from './src/services/cron-service.js';

const app = express();
const PORT = config.port;

// Basic middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    
    // Initialize cron jobs after database connection
    CronService.init();
    
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${config.nodeEnv}`);
    });

    // Graceful shutdown handler
    const gracefulShutdown = (signal) => {
      console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
      
      // Stop accepting new connections
      server.close(() => {
        console.log('HTTP server closed.');
        
        // Destroy all cron jobs
        CronService.destroyAll();
        
        // Close database connection
        console.log('Database connection closed.');
        process.exit(0);
      });
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
