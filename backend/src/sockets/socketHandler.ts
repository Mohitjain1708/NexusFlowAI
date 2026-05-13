import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

interface SocketUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
}

// Track online users per workspace
const workspacePresence: Map<string, Map<string, SocketUser>> = new Map();

export const initializeSocket = (io: Server): void => {
  // Authentication middleware for Socket.IO
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication required'));
      }
      const decoded = jwt.verify(token, config.jwt.secret) as { id: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, email: true, avatar: true },
      });
      if (!user) return next(new Error('User not found'));
      socket.user = { ...user, avatar: user.avatar ?? undefined };
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`Socket connected: ${socket.user?.name} (${socket.id})`);

    // Join workspace room
    socket.on('workspace:join', async (workspaceId: string) => {
      try {
        // Verify membership
        const member = await prisma.workspaceMember.findUnique({
          where: { userId_workspaceId: { userId: socket.user!.id, workspaceId } },
        });
        if (!member) {
          socket.emit('error', { message: 'Not a member of this workspace' });
          return;
        }

        socket.join(`workspace:${workspaceId}`);
        logger.info(`${socket.user?.name} joined workspace ${workspaceId}`);

        // Track presence
        if (!workspacePresence.has(workspaceId)) {
          workspacePresence.set(workspaceId, new Map());
        }
        workspacePresence.get(workspaceId)!.set(socket.user!.id, socket.user!);

        // Broadcast presence update
        const onlineUsers = Array.from(workspacePresence.get(workspaceId)!.values());
        io.to(`workspace:${workspaceId}`).emit('presence:update', { onlineUsers, workspaceId });

        // Send confirmation
        socket.emit('workspace:joined', { workspaceId, onlineUsers });
      } catch (err) {
        logger.error('workspace:join error:', err);
      }
    });

    // Leave workspace room
    socket.on('workspace:leave', (workspaceId: string) => {
      socket.leave(`workspace:${workspaceId}`);
      if (workspacePresence.has(workspaceId)) {
        workspacePresence.get(workspaceId)!.delete(socket.user!.id);
        const onlineUsers = Array.from(workspacePresence.get(workspaceId)!.values());
        io.to(`workspace:${workspaceId}`).emit('presence:update', { onlineUsers, workspaceId });
      }
      logger.info(`${socket.user?.name} left workspace ${workspaceId}`);
    });

    // Task events
    socket.on('task:create', (data: { task: unknown; workspaceId: string }) => {
      socket.to(`workspace:${data.workspaceId}`).emit('task:create', data.task);
    });

    socket.on('task:update', (data: { task: unknown; workspaceId: string }) => {
      socket.to(`workspace:${data.workspaceId}`).emit('task:update', data.task);
    });

    socket.on('task:delete', (data: { taskId: string; workspaceId: string }) => {
      socket.to(`workspace:${data.workspaceId}`).emit('task:delete', { id: data.taskId });
    });

    socket.on('task:move', (data: { taskId: string; status: string; position: number; workspaceId: string }) => {
      socket.to(`workspace:${data.workspaceId}`).emit('task:move', data);
    });

    // Comment events
    socket.on('comment:add', (data: { comment: unknown; taskId: string; workspaceId: string }) => {
      socket.to(`workspace:${data.workspaceId}`).emit('comment:add', {
        comment: data.comment,
        taskId: data.taskId,
      });
    });

    // Typing indicator
    socket.on('user:typing', (data: { taskId: string; workspaceId: string; isTyping: boolean }) => {
      socket.to(`workspace:${data.workspaceId}`).emit('user:typing', {
        user: { id: socket.user!.id, name: socket.user!.name, avatar: socket.user!.avatar },
        taskId: data.taskId,
        isTyping: data.isTyping,
      });
    });

    // Notification
    socket.on('notification:send', async (data: { userId: string; notification: unknown }) => {
      const userSockets = await io.in(`user:${data.userId}`).fetchSockets();
      if (userSockets.length > 0) {
        io.to(`user:${data.userId}`).emit('notification:new', data.notification);
      }
    });

    // Join personal room for notifications
    socket.join(`user:${socket.user!.id}`);

    // Disconnect handling
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.user?.name} (${socket.id})`);
      // Remove from all workspace presence maps
      workspacePresence.forEach((users, workspaceId) => {
        if (users.has(socket.user!.id)) {
          users.delete(socket.user!.id);
          const onlineUsers = Array.from(users.values());
          io.to(`workspace:${workspaceId}`).emit('presence:update', { onlineUsers, workspaceId });
        }
      });
    });

    // Ping/pong for connection health
    socket.on('ping', () => socket.emit('pong'));
  });
};
