import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

export const getBoards = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.query;
    const boards = await prisma.board.findMany({
      where: workspaceId ? { workspaceId: workspaceId as string } : {},
      include: {
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, avatar: true } },
            creator: { select: { id: true, name: true, avatar: true } },
            _count: { select: { comments: true, files: true } },
          },
          orderBy: { position: 'asc' },
        },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: { boards } });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch boards' } });
  }
};

export const getBoard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const board = await prisma.board.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, avatar: true, email: true } },
            creator: { select: { id: true, name: true, avatar: true } },
            _count: { select: { comments: true, files: true } },
          },
          orderBy: { position: 'asc' },
        },
        workspace: {
          include: {
            members: { include: { user: { select: { id: true, name: true, avatar: true } } } },
          },
        },
      },
    });
    if (!board) {
      res.status(404).json({ success: false, error: { message: 'Board not found' } });
      return;
    }
    res.json({ success: true, data: { board } });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch board' } });
  }
};

export const createBoard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, workspaceId } = req.body;
    const board = await prisma.board.create({
      data: { title, description, workspaceId },
      include: { _count: { select: { tasks: true } } },
    });
    res.status(201).json({ success: true, data: { board } });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to create board' } });
  }
};

export const updateBoard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const board = await prisma.board.update({
      where: { id },
      data: { title, description },
    });
    res.json({ success: true, data: { board } });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to update board' } });
  }
};

export const deleteBoard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.board.delete({ where: { id } });
    res.json({ success: true, message: 'Board deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to delete board' } });
  }
};
