import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  createConversation,
  listConversations,
  updateConversation,
  deleteConversation,
} from '../controllers/conversationController';

const router = Router();

router.use(authenticate);
router.post('/', createConversation);
router.get('/', listConversations);
router.put('/:id', updateConversation);
router.delete('/:id', deleteConversation);

export default router;
