import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell, X, Check, CheckCheck, Trash2,
  Briefcase, MessageSquare, Calendar, AlertTriangle, Zap
} from 'lucide-react';
import api from '@/services/api';
import { useNotificationStore } from '@/store/notificationStore';
import { Notification, NotificationType } from '@/types';
import { formatRelative } from '@/utils/helpers';
import { cn } from '@/utils/cn';

const NOTIF_ICONS: Record<NotificationType, React.ReactNode> = {
  TASK_ASSIGNED: <Zap className="w-3.5 h-3.5 text-primary-400" />,
  TASK_COMMENT: <MessageSquare className="w-3.5 h-3.5 text-blue-400" />,
  TASK_DUE: <Calendar className="w-3.5 h-3.5 text-yellow-400" />,
  WORKSPACE_INVITE: <Briefcase className="w-3.5 h-3.5 text-green-400" />,
  MENTION: <Bell className="w-3.5 h-3.5 text-purple-400" />,
  AI_REMINDER: <Zap className="w-3.5 h-3.5 text-pink-400" />,
  TASK_COMPLETED: <Check className="w-3.5 h-3.5 text-green-400" />,
  TASK_MOVED: <Zap className="w-3.5 h-3.5 text-orange-400" />,
};

interface NotificationPanelProps {
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose }) => {
  const qc = useQueryClient();
  const { notifications, setNotifications, markAsRead, markAllAsRead, removeNotification } =
    useNotificationStore();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data.data),
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (data?.notifications) setNotifications(data.notifications);
  }, [data]);

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.put(`/notifications/${id}/read`),
    onMutate: (id) => markAsRead(id),
    onError: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onMutate: () => markAllAsRead(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onMutate: (id) => removeNotification(id),
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -5 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-10 w-80 bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-800">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary-400" />
          <span className="text-sm font-semibold text-dark-100">Notifications</span>
          {notifications.filter(n => !n.isRead).length > 0 && (
            <span className="w-5 h-5 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {notifications.filter(n => !n.isRead).length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {notifications.some(n => !n.isRead) && (
            <button
              onClick={() => markAllMutation.mutate()}
              className="p-1.5 text-dark-500 hover:text-primary-400 hover:bg-dark-800 rounded-lg transition-all"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={onClose}
            className="p-1.5 text-dark-500 hover:text-dark-200 hover:bg-dark-800 rounded-lg transition-all">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-7 h-7 rounded-full skeleton flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 skeleton rounded w-4/5" />
                  <div className="h-2 skeleton rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Bell className="w-8 h-8 text-dark-700 mb-2" />
            <p className="text-dark-500 text-sm">No notifications yet</p>
            <p className="text-dark-700 text-xs mt-1">You're all caught up!</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {notifications.map(notif => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={cn(
                  'flex items-start gap-3 px-4 py-3 border-b border-dark-800 hover:bg-dark-800/50 transition-colors group',
                  !notif.isRead && 'bg-primary-600/5'
                )}
              >
                {/* Icon */}
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                  !notif.isRead ? 'bg-dark-700' : 'bg-dark-800'
                )}>
                  {NOTIF_ICONS[notif.type]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={cn('text-xs leading-relaxed', notif.isRead ? 'text-dark-400' : 'text-dark-200')}>
                    {notif.message}
                  </p>
                  <p className="text-[10px] text-dark-600 mt-0.5">{formatRelative(notif.createdAt)}</p>
                </div>

                {/* Unread dot + actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!notif.isRead && (
                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                  )}
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notif.isRead && (
                      <button
                        onClick={() => markReadMutation.mutate(notif.id)}
                        className="p-1 text-dark-600 hover:text-primary-400 hover:bg-dark-700 rounded transition-all"
                        title="Mark as read"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteMutation.mutate(notif.id)}
                      className="p-1 text-dark-600 hover:text-red-400 hover:bg-dark-700 rounded transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-dark-800 text-center">
          <button
            onClick={() => markAllMutation.mutate()}
            className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
          >
            Mark all as read
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default NotificationPanel;
