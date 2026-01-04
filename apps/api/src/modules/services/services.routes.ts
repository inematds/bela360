import { Router } from 'express';
import { servicesController } from './services.controller';

const router: Router = Router();

router.get('/', (req, res, next) => servicesController.getAll(req, res, next));
router.get('/:id', (req, res, next) => servicesController.getById(req, res, next));
router.post('/', (req, res, next) => servicesController.create(req, res, next));
router.put('/:id', (req, res, next) => servicesController.update(req, res, next));
router.delete('/:id', (req, res, next) => servicesController.delete(req, res, next));
router.get('/professional/:professionalId', (req, res, next) =>
  servicesController.getByProfessional(req, res, next)
);

export { router as servicesRoutes };
