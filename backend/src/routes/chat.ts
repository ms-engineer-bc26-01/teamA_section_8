import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { createChat, getChatHistory, postChatMessage } from '../controllers/chatController';

const router = Router();

router.use(authenticate);
router.post('/', createChat);
router.post('/:id/message', postChatMessage);
router.get('/:id/history', getChatHistory);

export default router;
