import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  CheckSquare, Search, Filter, SortAsc, AlertTriangle,
  Calendar, ChevronDown, RefreshCw
} from 'lucide-react';
import api from '@/services/api';
import { Task, TaskStatus, TaskPriority } from '@/types';
import { getPriorityColor, getStatusColor, formatDate, isOverdue } from '@/utils/helpers';
import { cn } from '@/utils/cn';
import TaskModal from '@/components/tasks/TaskModal';
import { AnimatePresence } from 'framer-motion';

const TasksPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tasks', search, status, priority, sortBy, sortOrder, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        sortBy,
        sortOrder,
        ...(search && { search }),
        ...(status && { status }),
        ...(priority && { priority }),
      });
      const { data } = await api.get(`/tasks?${params}`);
      return data.data;
    },
    placeholderData: (previousData: any) => previousData,
  });

  const tasks: Task[] = data?.tasks || [];
  const pagination = data?.pagination;

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setPriority('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
  };

  const hasFilters = search || status || priority;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-50 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-primary-400" /> My Tasks
          </h1>
          <p className="text-dark-400 text-sm mt-1">
            {pagination ? `${pagination.total} total tasks` : 'All tasks assigned to you'}
          </p>
        </div>
        <button onClick={() => refetch()} className="btn-ghost btn-sm">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search tasks..."
            className="input pl-9"
          />
        </div>

        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="input w-auto"
        >
          <option value="">All Status</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="REVIEW">In Review</option>
          <option value="COMPLETED">Completed</option>
        </select>

        <select
          value={priority}
          onChange={(e) => { setPriority(e.target.value); setPage(1); }}
          className="input w-auto"
        >
          <option value="">All Priority</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>

        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split('-');
            setSortBy(field);
            setSortOrder(order);
          }}
          className="input w-auto"
        >
          <option value="createdAt-desc">Newest First</option>
          <option value="createdAt-asc">Oldest First</option>
          <option value="dueDate-asc">Due Date (Soonest)</option>
          <option value="priority-desc">Priority (High First)</option>
          <option value="title-asc">Title (A-Z)</option>
        </select>

        {hasFilters && (
          <button onClick={clearFilters} className="btn-ghost btn-sm text-dark-400 hover:text-red-400">
            Clear filters
          </button>
        )}
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-20">
          <CheckSquare className="w-16 h-16 text-dark-700 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-dark-300 mb-2">No tasks found</h3>
          <p className="text-dark-500">{hasFilters ? 'Try clearing your filters' : 'No tasks assigned to you yet'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task, index) => {
            const overdue = task.dueDate ? isOverdue(task.dueDate) : false;
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => setSelectedTask(task)}
                className="flex items-center gap-4 p-4 card hover:border-dark-700 transition-all cursor-pointer group"
              >
                {/* Priority Indicator */}
                <div className={cn(
                  'w-1 h-10 rounded-full flex-shrink-0',
                  task.priority === 'URGENT' ? 'bg-red-400' :
                  task.priority === 'HIGH' ? 'bg-orange-400' :
                  task.priority === 'MEDIUM' ? 'bg-yellow-400' : 'bg-dark-600'
                )} />

                {/* Task Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={cn(
                      'text-sm font-medium truncate group-hover:text-white transition-colors',
                      task.status === 'COMPLETED' ? 'text-dark-500 line-through' : 'text-dark-100'
                    )}>
                      {task.title}
                    </p>
                    {task.labels?.slice(0, 2).map((label) => (
                      <span key={label} className="text-[10px] bg-primary-600/20 text-primary-400 px-1.5 py-0.5 rounded-full hidden sm:inline-flex">
                        {label}
                      </span>
                    ))}
                  </div>
                  {task.description && (
                    <p className="text-xs text-dark-500 truncate">{task.description}</p>
                  )}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full hidden md:flex', getStatusColor(task.status))}>
                    {task.status.replace('_', ' ')}
                  </span>

                  {task.dueDate && (
                    <div className={cn(
                      'flex items-center gap-1 text-xs hidden sm:flex',
                      overdue ? 'text-red-400' : 'text-dark-500'
                    )}>
                      {overdue && <AlertTriangle className="w-3 h-3" />}
                      <Calendar className="w-3 h-3" />
                      {formatDate(task.dueDate)}
                    </div>
                  )}

                  {task.assignee && (
                    <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0" title={task.assignee.name}>
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
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="btn-secondary btn-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-dark-400">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
            disabled={page === pagination.totalPages}
            className="btn-secondary btn-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Task Detail Modal */}
      <AnimatePresence>
        {selectedTask && (
          <TaskModal
            task={selectedTask}
            workspaceId=""
            onClose={() => setSelectedTask(null)}
            onUpdate={(updated) => setSelectedTask(null)}
            onDelete={(id) => setSelectedTask(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TasksPage;
