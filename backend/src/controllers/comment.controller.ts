import { Response } from 'express';
import { body } from 'express-validator';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

export const commentValidation = [
  body('message').trim().isLength({ min: 1, max: 2000 }).withMessage('Comment cannot be empty'),
];

export const getComments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: { user: { select: { id: true, name: true, avatar: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: { comments } });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch comments' } });
  }
};

export const createComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId, message } = req.body;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { board: true },
    });
    if (!task) {
      res.status(404).json({ success: false, error: { message: 'Task not found' } });
      return;
    }

    const comment = await prisma.comment.create({
      data: { taskId, message, userId: req.user!.id },
      include: { user: { select: { id: true, name: true, avatar: true, email: true } } },
    });

    // Notify task creator if different user
    if (task.creatorId !== req.user!.id) {
      await prisma.notification.create({
        data: {
          type: 'TASK_COMMENT',
          message: `${req.user!.name} commented on "${task.title}"`,
          userId: task.creatorId,
          metadata: { taskId, commentId: comment.id },
        },
      });
    }

    // Notify assignee if different from commenter and creator
    if (task.assigneeId && task.assigneeId !== req.user!.id && task.assigneeId !== task.creatorId) {
      await prisma.notification.create({
        data: {
          type: 'TASK_COMMENT',
          message: `${req.user!.name} commented on "${task.title}"`,
          userId: task.assigneeId,
          metadata: { taskId, commentId: comment.id },
        },
      });
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`workspace:${task.board.workspaceId}`).emit('comment:add', { comment, taskId });
    }

    res.status(201).json({ success: true, data: { comment } });
  } catch (error) {
    logger.error('Create comment error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to create comment' } });
  }
};

export const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      res.status(404).json({ success: false, error: { message: 'Comment not found' } });
      return;
    }
    if (comment.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: { message: 'Not authorized' } });
      return;
    }
    await prisma.comment.delete({ where: { id } });
    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to delete comment' } });
  }
};
