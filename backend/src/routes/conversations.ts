import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { createConversation, listConversations } from '../controllers/conversationController';

const router = Router();

router.use(authenticate);
router.post('/', createConversation);
router.get('/', listConversations);

export default router;
