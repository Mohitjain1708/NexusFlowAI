import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, name: true, email: true, role: true, avatar: true, createdAt: true,
        _count: { select: { assignedTasks: true, ownedWorkspaces: true } },
      },
    });
    res.json({ success: true, data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch profile' } });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, avatar } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { ...(name && { name }), ...(avatar && { avatar }) },
      select: { id: true, name: true, email: true, role: true, avatar: true },
    });
    res.json({ success: true, data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to update profile' } });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      res.status(400).json({ success: false, error: { message: 'Current password is incorrect' } });
      return;
    }
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user!.id }, data: { password: hashed } });
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to change password' } });
  }
};

export const searchUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { q } = req.query;
    if (!q || (q as string).length < 2) {
      res.json({ success: true, data: { users: [] } });
      return;
    }
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q as string, mode: 'insensitive' } },
          { email: { contains: q as string, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, email: true, avatar: true, role: true },
      take: 10,
    });
    res.json({ success: true, data: { users } });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Search failed' } });
  }
};
