import { Router } from 'express';
import { uploadFile, getTaskFiles, deleteFile, upload } from '../controllers/file.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/task/:taskId', getTaskFiles);
router.post('/upload', upload.single('file'), uploadFile);
router.delete('/:id', deleteFile);

export default router;
