import { Router } from 'express';
import authRouter from './auth';
import conversationsRouter from './conversations';
import chatRouter from './chat';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.use('/auth', authRouter);
router.use('/conversations', conversationsRouter);
router.use('/chat', chatRouter);

export default router;
