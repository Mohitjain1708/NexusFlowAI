import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useNotificationStore } from '@/store/notificationStore';
import { Task, Notification, OnlineUser } from '@/types';
import toast from 'react-hot-toast';

let socket: Socket | null = null;

export const getSocket = (): Socket | null => socket;

export const initSocket = (): Socket => {
  const token = useAuthStore.getState().accessToken;
  
  if (socket?.connected) return socket;

  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  // Task events
  socket.on('task:create', (task: Task) => {
    useWorkspaceStore.getState().addTaskToBoard(task);
    toast.success(`New task: "${task.title}"`, { icon: '📋', duration: 3000 });
  });

  socket.on('task:update', (task: Task) => {
    useWorkspaceStore.getState().updateTaskInBoard(task);
  });

  socket.on('task:delete', ({ id }: { id: string }) => {
    useWorkspaceStore.getState().removeTaskFromBoard(id);
  });

  socket.on('task:move', (data: { taskId: string; status: Task['status']; position: number }) => {
    useWorkspaceStore.getState().moveTask(data.taskId, data.status, data.position);
  });

  // Notification events
  socket.on('notification:new', (notification: Notification) => {
    useNotificationStore.getState().addNotification(notification);
    toast(notification.message, {
      icon: '🔔',
      duration: 4000,
      style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' },
    });
  });

  // Presence
  socket.on('presence:update', ({ onlineUsers }: { onlineUsers: OnlineUser[]; workspaceId: string }) => {
    useWorkspaceStore.getState().setOnlineUsers(onlineUsers);
  });

  return socket;
};

export const joinWorkspace = (workspaceId: string): void => {
  if (socket?.connected) {
    socket.emit('workspace:join', workspaceId);
  }
};

export const leaveWorkspace = (workspaceId: string): void => {
  if (socket?.connected) {
    socket.emit('workspace:leave', workspaceId);
  }
};

export const emitTyping = (taskId: string, workspaceId: string, isTyping: boolean): void => {
  socket?.emit('user:typing', { taskId, workspaceId, isTyping });
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
