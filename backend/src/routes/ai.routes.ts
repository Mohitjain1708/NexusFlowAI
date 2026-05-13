import { Router } from 'express';
import {
  summarizeTask,
  generateSubtasks,
  rewriteDescription,
  suggestDeadline,
  aiChat,
  generateMeetingSummary,
  getProductivityInsights,
} from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/summarize', summarizeTask);
router.post('/generate-subtasks', generateSubtasks);
router.post('/rewrite', rewriteDescription);
router.post('/suggest-deadline', suggestDeadline);
router.post('/chat', aiChat);
router.post('/meeting-summary', generateMeetingSummary);
router.get('/insights', getProductivityInsights);

export default router;
