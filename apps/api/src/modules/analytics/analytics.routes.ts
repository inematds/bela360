import { Router } from 'express';
import { analyticsController } from './analytics.controller';

const router: Router = Router();

// Dashboard
router.get('/dashboard', (req, res, next) => analyticsController.getDashboard(req, res, next));

// Reports
router.get('/reports/revenue', (req, res, next) => analyticsController.getRevenueReport(req, res, next));
router.get('/reports/services', (req, res, next) => analyticsController.getServiceReport(req, res, next));
router.get('/reports/professionals', (req, res, next) => analyticsController.getProfessionalReport(req, res, next));
router.get('/reports/retention', (req, res, next) => analyticsController.getClientRetention(req, res, next));

// Campaigns
router.post('/campaigns/birthday', (req, res, next) => analyticsController.sendBirthdayMessages(req, res, next));
router.post('/campaigns/reactivation', (req, res, next) => analyticsController.sendReactivationCampaign(req, res, next));

export { router as analyticsRoutes };
