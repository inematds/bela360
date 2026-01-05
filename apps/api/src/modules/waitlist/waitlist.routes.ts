import { Router } from 'express';
import { waitlistController } from './waitlist.controller';

const router: Router = Router();

// Get stats
router.get('/stats', (req, res, next) => waitlistController.getStats(req, res, next));

// Get demand by date
router.get('/demand', (req, res, next) => waitlistController.getDemand(req, res, next));

// Get all waitlist entries
router.get('/', (req, res, next) => waitlistController.getAll(req, res, next));

// Get entry by ID
router.get('/:id', (req, res, next) => waitlistController.getById(req, res, next));

// Add to waitlist
router.post('/', (req, res, next) => waitlistController.add(req, res, next));

// Convert to appointment
router.post('/:id/convert', (req, res, next) => waitlistController.convert(req, res, next));

// Remove from waitlist
router.delete('/:id', (req, res, next) => waitlistController.remove(req, res, next));

export { router as waitlistRoutes };
