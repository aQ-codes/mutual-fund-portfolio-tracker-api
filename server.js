import express from 'express';
import cors from 'cors';
import connectDB from './src/config/db.js';
import config from './src/config/env.js';

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
  res.json({
    success: true,
    message: 'Mutual Fund Portfolio Tracker API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// Basic API info endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Mutual Fund Portfolio Tracker API',
    version: '1.0.0',
    status: 'Database connected and server running'
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
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`📡 API info: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
