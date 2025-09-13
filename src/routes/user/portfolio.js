import express from 'express';
import PortfolioController from '../../controllers/user/portfolio-controller.js';
import { authenticateUser } from '../../middlewares/auth-middleware.js';
import { portfolioRateLimiter } from '../../middlewares/rate-limit-middleware.js';

const router = express.Router();

// Apply user authentication middleware to all portfolio routes
router.use(authenticateUser);

// POST /api/portfolio/add - Add mutual fund to user's portfolio
router.post('/add', portfolioRateLimiter, PortfolioController.addFund);

// POST /api/portfolio/sell - Sell units from portfolio
router.post('/sell', portfolioRateLimiter, PortfolioController.sellFund);

// DELETE /api/portfolio/remove/:schemeCode - Remove fund from portfolio
router.delete('/remove/:schemeCode', portfolioRateLimiter, PortfolioController.removeFund);

// GET /api/portfolio/value - Get current portfolio value with P&L calculation
router.get('/value', PortfolioController.getPortfolioValue);

// GET /api/portfolio/list - Get user's complete portfolio
router.get('/list', PortfolioController.getPortfolioList);

// GET /api/portfolio/history - Get portfolio value history
router.get('/history', PortfolioController.getPortfolioHistory);

// Note: Remove endpoint replaced with sell endpoint for better transaction tracking

export default router;
