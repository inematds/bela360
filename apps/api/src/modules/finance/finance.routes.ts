import { Router } from 'express';
import { financeController } from './finance.controller';

const router: Router = Router();

// Financial report
router.get('/report', (req, res, next) => financeController.getFinancialReport(req, res, next));

// Commission configs
router.get('/commissions/configs', (req, res, next) => financeController.getCommissionConfigs(req, res, next));
router.post('/commissions/configs', (req, res, next) => financeController.setCommissionConfig(req, res, next));
router.delete('/commissions/configs/:id', (req, res, next) => financeController.deleteCommissionConfig(req, res, next));

// Pending commissions
router.get('/commissions/pending', (req, res, next) => financeController.getPendingCommissions(req, res, next));

// Professional earnings
router.get('/earnings/:professionalId', (req, res, next) => financeController.getProfessionalEarnings(req, res, next));

// Cash register
router.get('/cash-register', (req, res, next) => financeController.getCashRegister(req, res, next));
router.get('/cash-register/history', (req, res, next) => financeController.getCashRegisterHistory(req, res, next));
router.post('/cash-register/close', (req, res, next) => financeController.closeCashRegister(req, res, next));

// Payments
router.get('/payments', (req, res, next) => financeController.getPayments(req, res, next));
router.post('/payments', (req, res, next) => financeController.registerPayment(req, res, next));

export { router as financeRoutes };
