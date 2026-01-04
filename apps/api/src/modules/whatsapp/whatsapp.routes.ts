import { Router } from 'express';
import { whatsappController } from './whatsapp.controller';
import { authMiddleware } from '../../common/middleware/auth.middleware';

const router: Router = Router();

// Webhook endpoint (no auth required - called by Evolution API)
router.post('/webhook', (req, res, next) => whatsappController.handleWebhook(req, res, next));

// Protected endpoints
router.use(authMiddleware);

// Connect WhatsApp instance
router.post('/connect', (req, res, next) => whatsappController.connectInstance(req, res, next));

// Get connection status
router.get('/status/:businessId', (req, res, next) => whatsappController.getStatus(req, res, next));

// Get QR code
router.get('/qrcode/:businessId', (req, res, next) => whatsappController.getQRCode(req, res, next));

// Send message
router.post('/send', (req, res, next) => whatsappController.sendMessage(req, res, next));

// Disconnect
router.post('/disconnect/:businessId', (req, res, next) => whatsappController.disconnect(req, res, next));

export { router as whatsappRoutes };
