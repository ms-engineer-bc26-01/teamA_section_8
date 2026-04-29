import { Router } from 'express';
import authRouter from './auth';
import conversationsRouter from './conversations';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.use('/auth', authRouter);
router.use('/conversations', conversationsRouter);

export default router;