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

// Suggestions (idle slots, marketing recommendations)
router.get('/suggestions', (req, res, next) => marketingController.getSuggestions(req, res, next));
router.get('/suggestions/counts', (req, res, next) => marketingController.getSuggestionCounts(req, res, next));
router.post('/suggestions/generate', (req, res, next) => marketingController.generateSuggestions(req, res, next));
router.put('/suggestions/:id/read', (req, res, next) => marketingController.markSuggestionAsRead(req, res, next));
router.put('/suggestions/:id/action', (req, res, next) => marketingController.markSuggestionAsActioned(req, res, next));
router.delete('/suggestions/:id', (req, res, next) => marketingController.dismissSuggestion(req, res, next));
router.get('/idle-slots', (req, res, next) => marketingController.getIdleSlots(req, res, next));

// Content Templates
router.get('/templates', (req, res, next) => marketingController.getTemplates(req, res, next));
router.get('/templates/stats', (req, res, next) => marketingController.getTemplateStats(req, res, next));
router.get('/templates/category/:category', (req, res, next) => marketingController.getTemplatesByCategory(req, res, next));
router.post('/templates', (req, res, next) => marketingController.createTemplate(req, res, next));
router.get('/templates/:id', (req, res, next) => marketingController.getTemplateById(req, res, next));
router.put('/templates/:id', (req, res, next) => marketingController.updateTemplate(req, res, next));
router.delete('/templates/:id', (req, res, next) => marketingController.deleteTemplate(req, res, next));
router.post('/templates/:id/duplicate', (req, res, next) => marketingController.duplicateTemplate(req, res, next));
router.post('/templates/:id/fill', (req, res, next) => marketingController.fillTemplate(req, res, next));

export { router as marketingRoutes };
