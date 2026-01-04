import { Router } from 'express';
import { businessController } from './business.controller';

const router: Router = Router();

// Business routes
router.get('/', (req, res, next) => businessController.getCurrent(req, res, next));
router.get('/:id', (req, res, next) => businessController.getById(req, res, next));
router.put('/', (req, res, next) => businessController.update(req, res, next));
router.post('/activate', (req, res, next) => businessController.activate(req, res, next));

// Professional routes
router.get('/professionals', (req, res, next) => businessController.getProfessionals(req, res, next));
router.post('/professionals', (req, res, next) => businessController.addProfessional(req, res, next));
router.put('/professionals/:id', (req, res, next) => businessController.updateProfessional(req, res, next));
router.delete('/professionals/:id', (req, res, next) => businessController.removeProfessional(req, res, next));

// Working hours routes
router.get('/hours', (req, res, next) => businessController.getWorkingHours(req, res, next));
router.put('/hours', (req, res, next) => businessController.setWorkingHours(req, res, next));

// Public onboarding (no auth required) - moved to separate public route
export const publicBusinessRoutes: Router = Router();
publicBusinessRoutes.post('/onboarding', (req, res, next) => businessController.create(req, res, next));

export { router as businessRoutes };
