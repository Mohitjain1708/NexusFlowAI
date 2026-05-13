import { Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { config } from '../config/env';
import { logger } from '../utils/logger';

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../', config.upload.dir);
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|csv|zip|mp4|webm/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.test(ext.substring(1))) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${ext} not allowed`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.upload.maxFileSize },
});

export const uploadFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: { message: 'No file uploaded' } });
      return;
    }
    const { taskId } = req.body;
    if (!taskId) {
      res.status(400).json({ success: false, error: { message: 'taskId is required' } });
      return;
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const file = await prisma.file.create({
      data: {
        filename: req.file.originalname,
        fileUrl,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        taskId,
      },
    });
    res.status(201).json({ success: true, data: { file } });
  } catch (error) {
    logger.error('File upload error:', error);
    res.status(500).json({ success: false, error: { message: 'File upload failed' } });
  }
};

export const getTaskFiles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const files = await prisma.file.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: { files } });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch files' } });
  }
};

export const deleteFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const file = await prisma.file.findUnique({ where: { id } });
    if (!file) {
      res.status(404).json({ success: false, error: { message: 'File not found' } });
      return;
    }

    // Delete physical file
    const filePath = path.join(__dirname, '../../', file.fileUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.file.delete({ where: { id } });
    res.json({ success: true, message: 'File deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to delete file' } });
  }
};
