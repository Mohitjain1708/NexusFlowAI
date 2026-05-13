import { Response } from 'express';
import { body } from 'express-validator';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

export const taskValidation = [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required'),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']),
];

export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { boardId, status, priority, assigneeId, search, page = '1', limit = '20', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const where: Record<string, unknown> = {};
    if (boardId) where.boardId = boardId as string;
    if (status) where.status = status as string;
    if (priority) where.priority = priority as string;
    if (assigneeId) where.assigneeId = assigneeId as string;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignee: { select: { id: true, name: true, avatar: true, email: true } },
          creator: { select: { id: true, name: true, avatar: true } },
          _count: { select: { comments: true, files: true } },
        },
        orderBy: { [sortBy as string]: sortOrder },
        skip,
        take: limitNum,
      }),
      prisma.task.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    logger.error('Get tasks error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch tasks' } });
  }
};

export const getTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true, avatar: true, email: true } },
        creator: { select: { id: true, name: true, avatar: true } },
        comments: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'asc' },
        },
        files: { orderBy: { createdAt: 'desc' } },
        board: { include: { workspace: { select: { id: true, name: true } } } },
      },
    });

    if (!task) {
      res.status(404).json({ success: false, error: { message: 'Task not found' } });
      return;
    }
    res.json({ success: true, data: { task } });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch task' } });
  }
};

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, boardId, status, priority, dueDate, assigneeId, labels, position } = req.body;

    const board = await prisma.board.findUnique({ where: { id: boardId }, include: { workspace: true } });
    if (!board) {
      res.status(404).json({ success: false, error: { message: 'Board not found' } });
      return;
    }

    // Get max position for the status column
    const maxPositionTask = await prisma.task.findFirst({
      where: { boardId, status: status || 'TODO' },
      orderBy: { position: 'desc' },
    });
    const newPosition = position !== undefined ? position : (maxPositionTask ? maxPositionTask.position + 1 : 0);

    const task = await prisma.task.create({
      data: {
        title,
        description,
        boardId,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: assigneeId || null,
        creatorId: req.user!.id,
        labels: labels || [],
        position: newPosition,
      },
      include: {
        assignee: { select: { id: true, name: true, avatar: true, email: true } },
        creator: { select: { id: true, name: true, avatar: true } },
        _count: { select: { comments: true, files: true } },
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: 'TASK_CREATED',
        description: `Created task "${title}"`,
        workspaceId: board.workspaceId,
        userId: req.user!.id,
        metadata: { taskId: task.id },
      },
    });

    // Notify assignee
    if (assigneeId && assigneeId !== req.user!.id) {
      await prisma.notification.create({
        data: {
          type: 'TASK_ASSIGNED',
          message: `You've been assigned to "${title}"`,
          userId: assigneeId,
          metadata: { taskId: task.id, boardId },
        },
      });
    }

    // Emit via socket
    const io = req.app.get('io');
    if (io) io.to(`workspace:${board.workspaceId}`).emit('task:create', task);

    res.status(201).json({ success: true, data: { task } });
  } catch (error) {
    logger.error('Create task error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to create task' } });
  }
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, dueDate, assigneeId, labels, position } = req.body;

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { board: true },
    });
    if (!existingTask) {
      res.status(404).json({ success: false, error: { message: 'Task not found' } });
      return;
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
        ...(labels !== undefined && { labels }),
        ...(position !== undefined && { position }),
      },
      include: {
        assignee: { select: { id: true, name: true, avatar: true, email: true } },
        creator: { select: { id: true, name: true, avatar: true } },
        _count: { select: { comments: true, files: true } },
      },
    });

    // Log status change
    if (status && status !== existingTask.status) {
      await prisma.activityLog.create({
        data: {
          action: 'TASK_MOVED',
          description: `Moved "${task.title}" from ${existingTask.status} to ${status}`,
          workspaceId: existingTask.board.workspaceId,
          userId: req.user!.id,
          metadata: { taskId: id, fromStatus: existingTask.status, toStatus: status },
        },
      });
    }

    // Notify new assignee
    if (assigneeId && assigneeId !== existingTask.assigneeId && assigneeId !== req.user!.id) {
      await prisma.notification.create({
        data: {
          type: 'TASK_ASSIGNED',
          message: `You've been assigned to "${task.title}"`,
          userId: assigneeId,
          metadata: { taskId: id },
        },
      });
    }

    const io = req.app.get('io');
    if (io) io.to(`workspace:${existingTask.board.workspaceId}`).emit('task:update', task);

    res.json({ success: true, data: { task } });
  } catch (error) {
    logger.error('Update task error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to update task' } });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const task = await prisma.task.findUnique({ where: { id }, include: { board: true } });
    if (!task) {
      res.status(404).json({ success: false, error: { message: 'Task not found' } });
      return;
    }

    await prisma.task.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        action: 'TASK_DELETED',
        description: `Deleted task "${task.title}"`,
        workspaceId: task.board.workspaceId,
        userId: req.user!.id,
      },
    });

    const io = req.app.get('io');
    if (io) io.to(`workspace:${task.board.workspaceId}`).emit('task:delete', { id });

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to delete task' } });
  }
};

export const moveTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, position } = req.body;

    const task = await prisma.task.update({
      where: { id },
      data: { status, position },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        _count: { select: { comments: true, files: true } },
        board: true,
      },
    });

    const io = req.app.get('io');
    if (io) io.to(`workspace:${task.board.workspaceId}`).emit('task:move', task);

    res.json({ success: true, data: { task } });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to move task' } });
  }
};
