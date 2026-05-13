import React from 'react';
import { Task } from '@/types';
import { Calendar, MessageSquare, Paperclip, AlertTriangle } from 'lucide-react';
import { formatDate, getPriorityColor, isOverdue } from '@/utils/helpers';
import { cn } from '@/utils/cn';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onClick: () => void;
}

const priorityDot: Record<string, string> = {
  LOW: 'bg-dark-500',
  MEDIUM: 'bg-yellow-400',
  HIGH: 'bg-orange-400',
  URGENT: 'bg-red-400',
};

const TaskCard: React.FC<TaskCardProps> = ({ task, isDragging, onClick }) => {
  const overdue = task.dueDate ? isOverdue(task.dueDate) : false;

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-dark-900 border rounded-xl p-3.5 mb-2 cursor-pointer select-none transition-all duration-150',
        isDragging
          ? 'border-primary-500/50 shadow-glow rotate-2 scale-105'
          : 'border-dark-800 hover:border-dark-700 hover:bg-dark-850 hover:shadow-card-hover'
      )}
    >
      {/* Priority indicator + Labels */}
      <div className="flex items-center gap-2 mb-2">
        <div className={cn('w-2 h-2 rounded-full flex-shrink-0', priorityDot[task.priority])} />
        {task.labels && task.labels.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {task.labels.slice(0, 2).map((label) => (
              <span key={label} className="text-[10px] font-medium px-1.5 py-0.5 bg-primary-600/20 text-primary-400 rounded-full">
                {label}
              </span>
            ))}
          </div>
        )}
        <span className={cn(
          'ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full',
          getPriorityColor(task.priority)
        )}>
          {task.priority}
        </span>
      </div>

      {/* Title */}
      <p className={cn(
        'text-sm font-medium leading-snug mb-3',
        task.status === 'COMPLETED' ? 'text-dark-500 line-through' : 'text-dark-100'
      )}>
        {task.title}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        {/* Due Date */}
        {task.dueDate && (
          <div className={cn(
            'flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md',
            overdue
              ? 'text-red-400 bg-red-500/10'
              : 'text-dark-500 bg-dark-800'
          )}>
            {overdue ? <AlertTriangle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
            {formatDate(task.dueDate)}
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {/* Comments */}
          {(task._count?.comments ?? 0) > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-dark-500">
              <MessageSquare className="w-3 h-3" />
              {task._count?.comments}
            </div>
          )}

          {/* Files */}
          {(task._count?.files ?? 0) > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-dark-500">
              <Paperclip className="w-3 h-3" />
              {task._count?.files}
            </div>
          )}

          {/* Assignee Avatar */}
          {task.assignee && (
            <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0" title={task.assignee.name}>
              {task.assignee.avatar ? (
                <img src={task.assignee.avatar} alt={task.assignee.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary-600 flex items-center justify-center text-white text-[9px] font-bold">
                  {task.assignee.name?.charAt(0)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
