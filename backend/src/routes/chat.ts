import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { listMessages, sendMessage } from '../controllers/chatController';

const router = Router();

router.use(authenticate);
router.get('/:conversationId/messages', listMessages);
router.post('/:conversationId/messages', sendMessage);

export default router;
