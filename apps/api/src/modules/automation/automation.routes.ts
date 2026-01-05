import { Router } from 'express';
import { automationController } from './automation.controller';

const router: Router = Router();

// Get automation stats
router.get('/stats', (req, res, next) => automationController.getStats(req, res, next));

// Initialize default automations
router.post('/initialize', (req, res, next) => automationController.initializeDefaults(req, res, next));

// Get all automations
router.get('/', (req, res, next) => automationController.getAll(req, res, next));

// Get automation by ID
router.get('/:id', (req, res, next) => automationController.getById(req, res, next));

// Create or update automation
router.post('/', (req, res, next) => automationController.upsert(req, res, next));

// Update automation
router.put('/:id', (req, res, next) => automationController.update(req, res, next));

// Toggle automation
router.patch('/:id/toggle', (req, res, next) => automationController.toggle(req, res, next));

// Delete automation
router.delete('/:id', (req, res, next) => automationController.delete(req, res, next));

export { router as automationRoutes };
