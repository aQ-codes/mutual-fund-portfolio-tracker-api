import express from 'express';
import TransactionController from '../../controllers/user/transaction-controller.js';
import authenticate from '../../middlewares/auth-middleware.js';

const router = express.Router();

// Apply authentication middleware to all transaction routes
router.use(authenticate);

// GET /api/transactions - Get user's transaction history
router.get('/', TransactionController.getTransactions);

// POST /api/transactions/rebuild-holdings - Rebuild holdings from transactions
router.post('/rebuild-holdings', TransactionController.rebuildHoldings);

export default router;
