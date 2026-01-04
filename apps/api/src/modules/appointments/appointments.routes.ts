import { Router } from 'express';
import { appointmentsController } from './appointments.controller';

const router: Router = Router();

router.get('/', (req, res, next) => appointmentsController.getAll(req, res, next));
router.get('/today', (req, res, next) => appointmentsController.getToday(req, res, next));
router.get('/availability', (req, res, next) => appointmentsController.getAvailability(req, res, next));
router.get('/:id', (req, res, next) => appointmentsController.getById(req, res, next));
router.post('/', (req, res, next) => appointmentsController.create(req, res, next));
router.put('/:id', (req, res, next) => appointmentsController.update(req, res, next));
router.post('/:id/confirm', (req, res, next) => appointmentsController.confirm(req, res, next));
router.post('/:id/cancel', (req, res, next) => appointmentsController.cancel(req, res, next));
router.post('/:id/complete', (req, res, next) => appointmentsController.complete(req, res, next));
router.post('/:id/no-show', (req, res, next) => appointmentsController.noShow(req, res, next));

export { router as appointmentsRoutes };
