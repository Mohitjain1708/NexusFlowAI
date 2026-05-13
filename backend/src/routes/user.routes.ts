import { Router } from 'express';
import { getProfile, updateProfile, changePassword, searchUsers } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.get('/search', searchUsers);

export default router;
