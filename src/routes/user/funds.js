import express from 'express';
import fundController from '../../controllers/user/fund-controller.js';
import { authenticateUser } from '../../middlewares/auth-middleware.js';

const router = express.Router();

// Apply user authentication to all fund routes
router.use(authenticateUser);

// GET /api/funds - Get all funds with pagination and filters
router.get('/', fundController.getFunds.bind(fundController));

// GET /api/funds/search - Search funds (must be before /:schemeCode)
router.get('/search', fundController.searchFunds.bind(fundController));

// GET /api/funds/categories - Get all fund categories
router.get('/categories', fundController.getFundCategories.bind(fundController));

// GET /api/funds/fund-houses - Get all fund houses
router.get('/fund-houses', fundController.getFundHouses.bind(fundController));

// GET /api/funds/:schemeCode/nav - Get fund NAV and history
router.get('/:schemeCode/nav', fundController.getFundNav.bind(fundController));

// GET /api/funds/:schemeCode - Get single fund by scheme code (must be last)
router.get('/:schemeCode', fundController.getFundBySchemeCode.bind(fundController));

export default router;
