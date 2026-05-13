import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { Task } from '@/types';
import { formatDate, isOverdue, getPriorityColor } from '@/utils/helpers';
import { cn } from '@/utils/cn';

interface TasksWidgetProps {
  tasks: Task[];
  isLoading: boolean;
}

const TasksWidget: React.FC<TasksWidgetProps> = ({ tasks, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-lg skeleton flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 skeleton rounded w-3/4" />
              <div className="h-2.5 skeleton rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CheckCircle2 className="w-10 h-10 text-green-500 mb-3" />
        <p className="text-dark-300 text-sm font-medium">All caught up!</p>
        <p className="text-dark-600 text-xs mt-1">No pending tasks assigned to you</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task, i) => {
        const overdue = task.dueDate && isOverdue(task.dueDate);
        return (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3 p-3 bg-dark-800/50 rounded-xl border border-dark-800 hover:border-dark-700 transition-all group cursor-pointer"
          >
            <div className={cn(
              'w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0',
              task.status === 'COMPLETED' ? 'bg-green-400' :
              task.status === 'IN_PROGRESS' ? 'bg-blue-400' :
              task.status === 'REVIEW' ? 'bg-yellow-400' : 'bg-dark-500'
            )} />
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-sm text-dark-200 font-medium truncate leading-snug',
                task.status === 'COMPLETED' && 'line-through text-dark-500'
              )}>
                {task.title}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className={cn('text-[10px] font-medium', getPriorityColor(task.priority).split(' ')[0])}>
                  {task.priority}
                </span>
                {task.dueDate && (
                  <span className={cn(
                    'text-[10px] flex items-center gap-0.5',
                    overdue ? 'text-red-400' : 'text-dark-600'
                  )}>
                    {overdue ? <AlertTriangle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                    {formatDate(task.dueDate)}
                  </span>
                )}
                {task.board?.workspace && (
                  <span className="text-[10px] text-dark-600 truncate">
                    {task.board.workspace.name}
                  </span>
                )}
              </div>
            </div>
            {task.status !== 'COMPLETED' && (
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-md font-medium flex-shrink-0',
                task.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' :
                task.status === 'REVIEW' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-dark-700 text-dark-400'
              )}>
                {task.status.replace('_', ' ')}
              </span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default TasksWidget;
