import rateLimit from 'express-rate-limit';
import config from '../config/env.js';

// General API rate limiter - 100 requests per minute per user
export const apiRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs, // 1 minute
  max: config.rateLimitMaxRequests, // 100 requests per window
  message: {
    success: false,
    message: 'Too many API requests. Please try again later.',
    retryAfter: Math.ceil(config.rateLimitWindowMs / 1000) // seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise fall back to IP
    return req.user?.id || req.ip;
  },
  skip: (req) => {
    // Skip rate limiting for admin users in development
    return config.nodeEnv === 'development' && req.user?.role === 'admin';
  }
});

// Login rate limiter - 5 attempts per minute per IP
export const loginRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs, // 1 minute
  max: config.loginRateLimitMax, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many login attempts. Please try again later.',
    retryAfter: Math.ceil(config.rateLimitWindowMs / 1000) // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip, // Always use IP for login attempts
  skipSuccessfulRequests: true, // Don't count successful requests
  skipFailedRequests: false // Count failed requests
});

// Portfolio update rate limiter - 10 updates per minute per user
export const portfolioRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs, // 1 minute
  max: config.portfolioRateLimitMax, // 10 updates per window
  message: {
    success: false,
    message: 'Too many portfolio updates. Please try again later.',
    retryAfter: Math.ceil(config.rateLimitWindowMs / 1000) // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID for portfolio updates
    return req.user?.id || req.ip;
  },
  skip: (req) => {
    // Skip rate limiting for GET requests (only limit POST/PUT/DELETE)
    return req.method === 'GET';
  }
});

