import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { createChatSession, sendMessage, getChatHistory } from '../controllers/chatController';

const router = Router();

router.use(authenticate);
router.post('/', createChatSession);
router.post('/:conversationId/message', sendMessage);
router.get('/:conversationId/history', getChatHistory);

export default router;
