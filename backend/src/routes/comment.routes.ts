import { Router } from 'express';
import { getComments, createComment, deleteComment, commentValidation } from '../controllers/comment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

router.use(authenticate);

router.get('/:taskId', getComments);
router.post('/', validate(commentValidation), createComment);
router.delete('/:id', deleteComment);

export default router;
