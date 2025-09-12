import express from 'express';
import AuthController from '../controllers/auth/auth-controller.js';

const router = express.Router();
const authController = new AuthController();

// User signup route
router.post('/signup', authController.signup.bind(authController));

// User login route
router.post('/login', authController.login.bind(authController));

export default router;
