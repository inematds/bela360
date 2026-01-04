import { Router } from 'express';
import { clientsController } from './clients.controller';

const router: Router = Router();

router.get('/', (req, res, next) => clientsController.getAll(req, res, next));
router.get('/birthdays', (req, res, next) => clientsController.getUpcomingBirthdays(req, res, next));
router.get('/inactive', (req, res, next) => clientsController.getInactiveClients(req, res, next));
router.get('/:id', (req, res, next) => clientsController.getById(req, res, next));
router.post('/', (req, res, next) => clientsController.create(req, res, next));
router.put('/:id', (req, res, next) => clientsController.update(req, res, next));
router.delete('/:id', (req, res, next) => clientsController.delete(req, res, next));

export { router as clientsRoutes };
