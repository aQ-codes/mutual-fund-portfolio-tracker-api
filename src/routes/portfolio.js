import express from 'express';
import PortfolioController from '../controllers/portfolio-controller.js';
import authenticate from '../middlewares/authenticate.js';

const router = express.Router();

// Apply authentication middleware to all portfolio routes
router.use(authenticate);

// POST /api/portfolio/add - Add mutual fund to user's portfolio
router.post('/add', PortfolioController.addFund);

// GET /api/portfolio/value - Get current portfolio value with P&L calculation
router.get('/value', PortfolioController.getPortfolioValue);

// GET /api/portfolio/list - Get user's complete portfolio
router.get('/list', PortfolioController.getPortfolioList);

// GET /api/portfolio/history - Get portfolio value history
router.get('/history', PortfolioController.getPortfolioHistory);

// DELETE /api/portfolio/remove/:schemeCode - Remove fund from portfolio
router.delete('/remove/:schemeCode', PortfolioController.removeFund);

export default router;
