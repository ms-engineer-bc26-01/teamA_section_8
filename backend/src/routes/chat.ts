import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { startChat, sendMessage, getChatHistory } from '../controllers/chatController';

const router = Router();

router.use(authenticate);

router.post('/', startChat);
router.post('/:id/message', sendMessage);
router.get('/:id/history', getChatHistory);

export default router;
