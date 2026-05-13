import { Response } from 'express';
import { body } from 'express-validator';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

export const workspaceValidation = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required (max 100 chars)'),
  body('description').optional().trim().isLength({ max: 500 }),
];

export const getWorkspaces = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const workspaces = await prisma.workspace.findMany({
      where: {
        members: { some: { userId: req.user!.id } },
      },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        members: {
          include: { user: { select: { id: true, name: true, avatar: true, email: true } } },
        },
        boards: {
          include: {
            _count: { select: { tasks: true } },
          },
        },
        _count: { select: { boards: true, members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: { workspaces } });
  } catch (error) {
    logger.error('Get workspaces error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch workspaces' } });
  }
};

export const getWorkspace = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const workspace = await prisma.workspace.findFirst({
      where: {
        id,
        members: { some: { userId: req.user!.id } },
      },
      include: {
        owner: { select: { id: true, name: true, avatar: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, avatar: true, email: true, role: true } } },
        },
        boards: {
          include: {
            tasks: {
              include: {
                assignee: { select: { id: true, name: true, avatar: true } },
                _count: { select: { comments: true, files: true } },
              },
              orderBy: { position: 'asc' },
            },
          },
        },
        activityLogs: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!workspace) {
      res.status(404).json({ success: false, error: { message: 'Workspace not found' } });
      return;
    }
    res.json({ success: true, data: { workspace } });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch workspace' } });
  }
};

export const createWorkspace = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, color, icon } = req.body;
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

    const workspace = await prisma.workspace.create({
      data: {
        name,
        description,
        slug,
        color: color || '#6366f1',
        icon: icon || '🚀',
        ownerId: req.user!.id,
        members: {
          create: { userId: req.user!.id, role: 'ADMIN' },
        },
        boards: {
          create: { title: 'Main Board', description: 'Default board' },
        },
      },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        members: { include: { user: { select: { id: true, name: true, avatar: true } } } },
        boards: true,
        _count: { select: { members: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'WORKSPACE_CREATED',
        description: `Created workspace "${name}"`,
        workspaceId: workspace.id,
        userId: req.user!.id,
      },
    });

    res.status(201).json({ success: true, data: { workspace } });
  } catch (error) {
    logger.error('Create workspace error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to create workspace' } });
  }
};

export const updateWorkspace = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, color, icon } = req.body;

    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: req.user!.id, workspaceId: id } },
    });
    if (!membership || !['ADMIN'].includes(membership.role)) {
      res.status(403).json({ success: false, error: { message: 'Insufficient permissions' } });
      return;
    }

    const workspace = await prisma.workspace.update({
      where: { id },
      data: { name, description, color, icon },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        members: { include: { user: { select: { id: true, name: true, avatar: true } } } },
      },
    });
    res.json({ success: true, data: { workspace } });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to update workspace' } });
  }
};

export const deleteWorkspace = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const workspace = await prisma.workspace.findFirst({
      where: { id, ownerId: req.user!.id },
    });
    if (!workspace) {
      res.status(403).json({ success: false, error: { message: 'Only owner can delete workspace' } });
      return;
    }
    await prisma.workspace.delete({ where: { id } });
    res.json({ success: true, message: 'Workspace deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to delete workspace' } });
  }
};

export const inviteMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;

    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: req.user!.id, workspaceId: id } },
    });
    if (!membership || membership.role === 'VIEWER') {
      res.status(403).json({ success: false, error: { message: 'Insufficient permissions' } });
      return;
    }

    const userToInvite = await prisma.user.findUnique({ where: { email } });
    if (!userToInvite) {
      res.status(404).json({ success: false, error: { message: 'User not found' } });
      return;
    }

    const existing = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: userToInvite.id, workspaceId: id } },
    });
    if (existing) {
      res.status(409).json({ success: false, error: { message: 'User already a member' } });
      return;
    }

    await prisma.workspaceMember.create({
      data: { userId: userToInvite.id, workspaceId: id, role: role || 'MEMBER' },
    });

    await prisma.notification.create({
      data: {
        type: 'WORKSPACE_INVITE',
        message: `You've been invited to join workspace`,
        userId: userToInvite.id,
        metadata: { workspaceId: id },
      },
    });

    res.json({ success: true, message: 'Member invited successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to invite member' } });
  }
};

export const removeMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, userId } = req.params;
    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: req.user!.id, workspaceId: id } },
    });
    if (!membership || membership.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: { message: 'Only admins can remove members' } });
      return;
    }
    await prisma.workspaceMember.delete({
      where: { userId_workspaceId: { userId, workspaceId: id } },
    });
    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to remove member' } });
  }
};
