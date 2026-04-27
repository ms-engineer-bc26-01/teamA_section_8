import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { createConversation } from '../controllers/conversationController';

const router = Router();

router.use(authenticate);
router.post('/', createConversation);

export default router;
