import express from 'express';
import AdminController from '../../controllers/admin/admin-controller.js';
import { authenticate, requireAdmin } from '../../middlewares/auth-middleware.js';

const router = express.Router();

// Apply authentication and admin authorization to all admin routes
router.use(authenticate);
router.use(requireAdmin);

// GET /api/admin/users - List all users
router.get('/users', AdminController.getUsers);

// GET /api/admin/portfolios - View all portfolios
router.get('/portfolios', AdminController.getPortfolios);

// GET /api/admin/popular-funds - Most invested funds
router.get('/popular-funds', AdminController.getPopularFunds);

// GET /api/admin/stats - System statistics
router.get('/stats', AdminController.getSystemStats);

// GET /api/admin/cron-status - Get cron job status
router.get('/cron-status', AdminController.getCronStatus);

// POST /api/admin/cron/run-nav-update - Manually trigger NAV update
router.post('/cron/run-nav-update', AdminController.runNavUpdate);

export default router;
