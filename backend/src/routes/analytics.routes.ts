import { Router } from 'express';
import { getAnalytics, getDashboardStats } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getAnalytics);
router.get('/dashboard', getDashboardStats);

export default router;
