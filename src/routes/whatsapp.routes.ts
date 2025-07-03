import { Router } from 'express';
import { WhatsAppController } from '../controllers/whatsapp.controller';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';

const whatsappRoutes = Router();
const whatsappController = new WhatsAppController();

// Middleware de autenticação
whatsappRoutes.use(ensureAuthenticated);

// Rotas de instâncias
whatsappRoutes.get('/instances', whatsappController.listInstances);
whatsappRoutes.post('/instances', whatsappController.createInstance);
whatsappRoutes.delete('/instances/:instanceId', whatsappController.deleteInstance);

// Rotas de conexão
whatsappRoutes.post('/instances/:instanceName/connect', whatsappController.connectInstance);
whatsappRoutes.get('/instances/:instanceName/qr', whatsappController.getQRCode);

// Rotas de configuração
whatsappRoutes.put('/instances/:instanceName/settings', whatsappController.updateSettings);

export { whatsappRoutes }; 