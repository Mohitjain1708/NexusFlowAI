import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, CheckCircle2, Plus, ArrowRight, MessageSquare, Trash2 } from 'lucide-react';
import { ActivityLog } from '@/types';
import { formatRelative } from '@/utils/helpers';
import { cn } from '@/utils/cn';

interface ActivityFeedProps {
  activities: ActivityLog[];
  isLoading: boolean;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  TASK_CREATED: <Plus className="w-3 h-3 text-primary-400" />,
  TASK_MOVED: <ArrowRight className="w-3 h-3 text-blue-400" />,
  TASK_DELETED: <Trash2 className="w-3 h-3 text-red-400" />,
  WORKSPACE_CREATED: <Zap className="w-3 h-3 text-yellow-400" />,
  COMMENT_ADDED: <MessageSquare className="w-3 h-3 text-green-400" />,
};

const ACTION_COLORS: Record<string, string> = {
  TASK_CREATED: 'bg-primary-600/20',
  TASK_MOVED: 'bg-blue-500/20',
  TASK_DELETED: 'bg-red-500/20',
  WORKSPACE_CREATED: 'bg-yellow-500/20',
  COMMENT_ADDED: 'bg-green-500/20',
};

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-7 h-7 rounded-full skeleton flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 skeleton rounded w-4/5" />
              <div className="h-2.5 skeleton rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Activity className="w-10 h-10 text-dark-600 mb-3" />
        <p className="text-dark-500 text-sm">No recent activity</p>
        <p className="text-dark-700 text-xs mt-1">Start collaborating to see activity here</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-3 top-4 bottom-0 w-px bg-dark-800" />

      <div className="space-y-4">
        {activities.map((log, i) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex gap-3 relative"
          >
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 z-10 ring-2 ring-dark-900">
              {log.user?.avatar ? (
                <img src={log.user.avatar} alt={log.user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary-700 flex items-center justify-center text-[10px] text-white font-bold">
                  {log.user?.name?.charAt(0)}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 flex-wrap">
                <span className="text-xs text-dark-300 leading-relaxed">
                  <span className="font-medium text-dark-100">{log.user?.name}</span>
                  {' '}{log.description}
                </span>
              </div>
              <p className="text-[10px] text-dark-600 mt-0.5">{formatRelative(log.createdAt)}</p>
            </div>

            {/* Action badge */}
            <div className={cn(
              'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
              ACTION_COLORS[log.action] || 'bg-dark-700'
            )}>
              {ACTION_ICONS[log.action] || <Activity className="w-3 h-3 text-dark-400" />}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;
