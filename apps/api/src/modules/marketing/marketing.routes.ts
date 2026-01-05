import { Router } from 'express';
import { marketingController } from './marketing.controller';

const router: Router = Router();

// Campaigns
router.get('/campaigns', (req, res, next) => marketingController.getCampaigns(req, res, next));
router.get('/campaigns/stats', (req, res, next) => marketingController.getCampaignStats(req, res, next));
router.post('/campaigns', (req, res, next) => marketingController.createCampaign(req, res, next));
router.get('/campaigns/:id', (req, res, next) => marketingController.getCampaignById(req, res, next));
router.put('/campaigns/:id', (req, res, next) => marketingController.updateCampaign(req, res, next));
router.delete('/campaigns/:id', (req, res, next) => marketingController.deleteCampaign(req, res, next));
router.post('/campaigns/:id/start', (req, res, next) => marketingController.startCampaign(req, res, next));

// Ratings
router.get('/ratings', (req, res, next) => marketingController.getRatings(req, res, next));
router.get('/ratings/stats', (req, res, next) => marketingController.getRatingStats(req, res, next));
router.post('/ratings', (req, res, next) => marketingController.registerRating(req, res, next));

// Segments
router.get('/segments', (req, res, next) => marketingController.getSegmentsOverview(req, res, next));
router.get('/segments/:segment/clients', (req, res, next) => marketingController.getSegmentClients(req, res, next));

export { router as marketingRoutes };
