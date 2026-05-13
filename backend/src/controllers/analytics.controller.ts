import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

export const getAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.query;
    const userId = req.user!.id;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const boardFilter = workspaceId
      ? { board: { workspaceId: workspaceId as string } }
      : {};

    // Aggregate stats
    const [
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      myAssignedTasks,
    ] = await Promise.all([
      prisma.task.count({ where: boardFilter }),
      prisma.task.count({ where: { ...boardFilter, status: 'COMPLETED' } }),
      prisma.task.count({ where: { ...boardFilter, status: { not: 'COMPLETED' } } }),
      prisma.task.count({
        where: {
          ...boardFilter,
          status: { not: 'COMPLETED' },
          dueDate: { lt: now },
        },
      }),
      prisma.task.count({ where: { ...boardFilter, assigneeId: userId } }),
    ]);

    // Tasks by status
    const tasksByStatus = await prisma.task.groupBy({
      by: ['status'],
      where: boardFilter,
      _count: { status: true },
    });

    // Tasks by priority
    const tasksByPriority = await prisma.task.groupBy({
      by: ['priority'],
      where: boardFilter,
      _count: { priority: true },
    });

    // Completed tasks per day (last 7 days)
    const completedPerDay = await Promise.all(
      Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const start = new Date(date.setHours(0, 0, 0, 0));
        const end = new Date(date.setHours(23, 59, 59, 999));
        return prisma.task
          .count({
            where: {
              ...boardFilter,
              status: 'COMPLETED',
              updatedAt: { gte: start, lte: end },
            },
          })
          .then((count) => ({
            date: start.toISOString().split('T')[0],
            count,
          }));
      })
    );

    // Created tasks per week (last 4 weeks)
    const createdPerWeek = await Promise.all(
      Array.from({ length: 4 }, (_, i) => {
        const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        return prisma.task
          .count({
            where: {
              ...boardFilter,
              createdAt: { gte: weekStart, lt: weekEnd },
            },
          })
          .then((count) => ({
            week: `Week ${4 - i}`,
            count,
          }));
      })
    );

    // Top contributors
    const topContributors = await prisma.task.groupBy({
      by: ['assigneeId'],
      where: { ...boardFilter, status: 'COMPLETED', assigneeId: { not: null } },
      _count: { assigneeId: true },
      orderBy: { _count: { assigneeId: 'desc' } },
      take: 5,
    });

    const contributorsWithNames = await Promise.all(
      topContributors
        .filter((c) => c.assigneeId)
        .map(async (c) => {
          const user = await prisma.user.findUnique({
            where: { id: c.assigneeId! },
            select: { id: true, name: true, avatar: true },
          });
          return { user, completedTasks: c._count.assigneeId };
        })
    );

    // Recent activity
    const recentActivity = await prisma.activityLog.findMany({
      where: workspaceId ? { workspaceId: workspaceId as string } : {},
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Workspace stats
    const workspaceCount = await prisma.workspace.count({
      where: { members: { some: { userId } } },
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalTasks,
          completedTasks,
          pendingTasks,
          overdueTasks,
          myAssignedTasks,
          workspaceCount,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        },
        charts: {
          tasksByStatus: tasksByStatus.map((s) => ({
            status: s.status,
            count: s._count.status,
          })),
          tasksByPriority: tasksByPriority.map((p) => ({
            priority: p.priority,
            count: p._count.priority,
          })),
          completedPerDay: completedPerDay.reverse(),
          createdPerWeek: createdPerWeek.reverse(),
        },
        topContributors: contributorsWithNames,
        recentActivity,
      },
    });
  } catch (error) {
    logger.error('Analytics error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch analytics' } });
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const now = new Date();

    const [
      workspaceCount,
      assignedTasks,
      completedToday,
      overdueCount,
    ] = await Promise.all([
      prisma.workspace.count({ where: { members: { some: { userId } } } }),
      prisma.task.findMany({
        where: { assigneeId: userId, status: { not: 'COMPLETED' } },
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
          board: { include: { workspace: { select: { id: true, name: true } } } },
        },
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
        take: 5,
      }),
      prisma.task.count({
        where: {
          assigneeId: userId,
          status: 'COMPLETED',
          updatedAt: { gte: new Date(now.setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.task.count({
        where: {
          assigneeId: userId,
          status: { not: 'COMPLETED' },
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        workspaceCount,
        assignedTasks,
        completedToday,
        overdueCount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch dashboard stats' } });
  }
};
