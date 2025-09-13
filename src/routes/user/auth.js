import express from 'express';
import AuthController from '../../controllers/user/auth-controller.js';
import { loginRateLimiter } from '../../middlewares/rate-limit-middleware.js';

const router = express.Router();
const authController = new AuthController();

// User signup route
router.post('/signup', authController.signup.bind(authController));

// User login route - with rate limiting
router.post('/login', loginRateLimiter, authController.login.bind(authController));

export default router;
