import express from 'express';
import FundController from '../../controllers/user/fund-controller.js';
import { authenticateAdmin } from '../../middlewares/auth-middleware.js';

const router = express.Router();

// Apply admin authentication to all admin fund routes
router.use(authenticateAdmin);

// GET /api/admin/funds/stats - Get fund statistics (admin only)
router.get('/stats', FundController.getFundStats);

// GET /api/admin/funds - Get all funds with pagination and filters (admin view)
router.get('/', FundController.getFunds);

// GET /api/admin/funds/search - Search funds (admin)
router.get('/search', FundController.searchFunds);

// GET /api/admin/funds/categories - Get all fund categories (admin)
router.get('/categories', FundController.getFundCategories);

// GET /api/admin/funds/fund-houses - Get all fund houses (admin)
router.get('/fund-houses', FundController.getFundHouses);

// GET /api/admin/funds/:schemeCode/nav - Get fund NAV and history (admin)
router.get('/:schemeCode/nav', FundController.getFundNav);

// GET /api/admin/funds/:schemeCode - Get single fund by scheme code (admin)
router.get('/:schemeCode', FundController.getFundBySchemeCode);

export default router;
