import express from 'express';
import TransactionController from '../../controllers/user/transaction-controller.js';
import { authenticateUser } from '../../middlewares/auth-middleware.js';

const router = express.Router();

// Apply user authentication middleware to all transaction routes
router.use(authenticateUser);

// GET /api/transactions - Get user's transaction history
router.get('/', TransactionController.getTransactions);

export default router;
