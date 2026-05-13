import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Task, TaskStatus, WorkspaceMember } from '@/types';
import SortableTaskCard from './SortableTaskCard';
import { cn } from '@/utils/cn';

interface KanbanColumnProps {
  column: { id: TaskStatus; title: string; color: string };
  tasks: Task[];
  onAddTask: () => void;
  onTaskClick: (task: Task) => void;
  boardMembers: WorkspaceMember[];
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ column, tasks, onAddTask, onTaskClick, boardMembers }) => {
  const { isOver, setNodeRef } = useDroppable({ id: column.id });

  return (
    <div className="flex-shrink-0 w-72 flex flex-col">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: column.color }} />
          <span className="text-sm font-semibold text-dark-200">{column.title}</span>
          <span className="text-xs font-medium bg-dark-800 text-dark-400 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={onAddTask}
          className="p-1 text-dark-500 hover:text-dark-200 hover:bg-dark-800 rounded-md transition-all"
          title="Add task"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 rounded-xl p-2 min-h-[200px] transition-all duration-200',
          isOver
            ? 'bg-dark-800/80 ring-2 ring-primary-500/50'
            : 'bg-dark-900/50'
        )}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <SortableTaskCard
                  task={task}
                  onClick={() => onTaskClick(task)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </SortableContext>

        {tasks.length === 0 && (
          <div
            className="h-full min-h-[120px] flex flex-col items-center justify-center gap-2 cursor-pointer group"
            onClick={onAddTask}
          >
            <div className="w-8 h-8 rounded-full border-2 border-dashed border-dark-700 group-hover:border-dark-500 flex items-center justify-center transition-colors">
              <Plus className="w-4 h-4 text-dark-600 group-hover:text-dark-400 transition-colors" />
            </div>
            <p className="text-xs text-dark-600 group-hover:text-dark-400 transition-colors">Add task</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
