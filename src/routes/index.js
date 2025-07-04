import { Router } from 'express';
import { whatsappRoutes } from './whatsapp.routes';
const router = Router();
// Rotas do WhatsApp
router.use('/whatsapp', whatsappRoutes);
export { router };
