import express from 'express';
import PortfolioController from '../../controllers/user/portfolio-controller.js';
import authenticate from '../../middlewares/auth-middleware.js';

const router = express.Router();

// Apply authentication middleware to all portfolio routes
router.use(authenticate);

// POST /api/portfolio/add - Add mutual fund to user's portfolio
router.post('/add', PortfolioController.addFund);

// POST /api/portfolio/sell - Sell units from portfolio
router.post('/sell', PortfolioController.sellFund);

// GET /api/portfolio/value - Get current portfolio value with P&L calculation
router.get('/value', PortfolioController.getPortfolioValue);

// GET /api/portfolio/list - Get user's complete portfolio
router.get('/list', PortfolioController.getPortfolioList);

// GET /api/portfolio/history - Get portfolio value history
router.get('/history', PortfolioController.getPortfolioHistory);

// Note: Remove endpoint replaced with sell endpoint for better transaction tracking

export default router;
