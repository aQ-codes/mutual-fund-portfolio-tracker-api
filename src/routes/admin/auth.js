import express from 'express';
import AuthController from '../../controllers/user/auth-controller.js';
import { loginRateLimiter } from '../../middlewares/rate-limit-middleware.js';

const router = express.Router();
const authController = new AuthController();

// Admin login route - with rate limiting
router.post('/login', loginRateLimiter, authController.adminLogin.bind(authController));

export default router;
