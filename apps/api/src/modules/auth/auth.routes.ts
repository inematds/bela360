import { Router } from 'express';
import { authController } from './auth.controller';
import { authMiddleware } from '../../common/middleware/auth.middleware';

const router: Router = Router();

// Public routes
router.post('/otp/request', (req, res, next) => authController.requestOTP(req, res, next));
router.post('/otp/verify', (req, res, next) => authController.verifyOTP(req, res, next));
router.post('/refresh', (req, res, next) => authController.refreshToken(req, res, next));

// Protected routes
router.post('/logout', authMiddleware, (req, res, next) => authController.logout(req, res, next));
router.get('/me', authMiddleware, (req, res, next) => authController.me(req, res, next));

export { router as authRoutes };
