import React, { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext, DragOverlay, closestCorners, PointerSensor,
  useSensor, useSensors, DragStartEvent, DragEndEvent
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus, X, Loader2, Calendar, User, Flag, MessageSquare,
  Paperclip, MoreHorizontal, Sparkles, GripVertical, AlertCircle
} from 'lucide-react';
import api from '@/services/api';
import { Task, TaskStatus, TaskPriority } from '@/types';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { joinWorkspace, leaveWorkspace } from '@/sockets/socketClient';
import { formatDate, isOverdue, getPriorityColor, getStatusColor } from '@/utils/helpers';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import CreateTaskModal from '@/components/tasks/CreateTaskModal';

const COLUMNS: { id: TaskStatus; title: string; color: string; bg: string }[] = [
  { id: 'TODO', title: 'To Do', color: 'text-dark-400', bg: 'bg-dark-700' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  { id: 'REVIEW', title: 'Review', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  { id: 'COMPLETED', title: 'Completed', color: 'text-green-400', bg: 'bg-green-500/20' },
];

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: 'text-dark-500',
  MEDIUM: 'text-yellow-400',
  HIGH: 'text-orange-400',
  URGENT: 'text-red-400',
};

// ── Sortable Task Card ──────────────────────────────────────────────────────
const TaskCard: React.FC<{
  task: Task;
  onOpen: (task: Task) => void;
  isDragging?: boolean;
}> = React.memo(({ task, onOpen, isDragging }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  };

  const overdue = task.dueDate && isOverdue(task.dueDate) && task.status !== 'COMPLETED';

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <motion.div
        layout
        onClick={() => onOpen(task)}
        className={cn(
          'bg-dark-800 border rounded-xl p-3.5 cursor-pointer group transition-all duration-150',
          'hover:border-dark-600 hover:shadow-card-hover',
          isDragging ? 'shadow-xl border-primary-500/50' : 'border-dark-700',
          overdue && 'border-red-500/30'
        )}
      >
        {/* Drag handle */}
        <div className="flex items-start gap-2">
          <div
            {...listeners}
            className="mt-0.5 p-0.5 text-dark-700 hover:text-dark-500 cursor-grab active:cursor-grabbing flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            {/* Labels */}
            {task.labels.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {task.labels.slice(0, 3).map((label) => (
                  <span key={label}
                    className="px-1.5 py-0.5 bg-primary-600/20 text-primary-400 text-[10px] rounded-md font-medium">
                    {label}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <p className={cn(
              'text-sm font-medium text-dark-200 leading-snug mb-2',
              task.status === 'COMPLETED' && 'line-through text-dark-500'
            )}>
              {task.title}
            </p>

            {/* Priority + Due */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag className={cn('w-3 h-3', PRIORITY_COLORS[task.priority])} />
                <span className={cn('text-[10px] font-medium', PRIORITY_COLORS[task.priority])}>
                  {task.priority}
                </span>
              </div>
              {task.dueDate && (
                <span className={cn(
                  'text-[10px] flex items-center gap-1',
                  overdue ? 'text-red-400' : 'text-dark-500'
                )}>
                  {overdue && <AlertCircle className="w-3 h-3" />}
                  <Calendar className="w-3 h-3" />
                  {formatDate(task.dueDate)}
                </span>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-dark-700/50">
              {/* Assignee */}
              {task.assignee ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full overflow-hidden">
                    {task.assignee.avatar ? (
                      <img src={task.assignee.avatar} alt={task.assignee.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-primary-600 flex items-center justify-center text-[9px] text-white font-bold">
                        {task.assignee.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-dark-500 truncate max-w-[60px]">{task.assignee.name.split(' ')[0]}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-dark-600">
                  <User className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Unassigned</span>
                </div>
              )}

              {/* Meta counts */}
              <div className="flex items-center gap-2 text-dark-600">
                {(task._count?.comments || 0) > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px]">
                    <MessageSquare className="w-3 h-3" /> {task._count?.comments}
                  </span>
                )}
                {(task._count?.files || 0) > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px]">
                    <Paperclip className="w-3 h-3" /> {task._count?.files}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
});
TaskCard.displayName = 'TaskCard';

// ── Kanban Column ───────────────────────────────────────────────────────────
const KanbanColumn: React.FC<{
  column: typeof COLUMNS[0];
  tasks: Task[];
  onTaskOpen: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
  workspaceMembers: any[];
}> = ({ column, tasks, onTaskOpen, onAddTask }) => {
  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={cn('w-2 h-2 rounded-full', column.bg)} />
          <span className={cn('text-sm font-semibold', column.color)}>{column.title}</span>
          <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', column.bg, column.color)}>
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(column.id)}
          className="p-1 text-dark-600 hover:text-dark-300 hover:bg-dark-700 rounded-lg transition-all"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Tasks list */}
      <div className="flex-1 bg-dark-900/50 rounded-xl p-2 min-h-[200px] border border-dark-800">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            <AnimatePresence>
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} onOpen={onTaskOpen} />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>

        {tasks.length === 0 && (
          <div
            onClick={() => onAddTask(column.id)}
            className="flex flex-col items-center justify-center h-24 text-dark-600 cursor-pointer hover:text-dark-400 transition-colors"
          >
            <Plus className="w-5 h-5 mb-1" />
            <span className="text-xs">Add task</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Kanban Page ─────────────────────────────────────────────────────────────
const KanbanPage: React.FC = () => {
  const { workspaceId, boardId } = useParams<{ workspaceId: string; boardId: string }>();
  const qc = useQueryClient();
  const { currentBoard, setCurrentBoard, moveTask } = useWorkspaceStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createStatus, setCreateStatus] = useState<TaskStatus | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const { data: boardData, isLoading } = useQuery({
    queryKey: ['board', boardId],
    queryFn: () => api.get(`/boards/${boardId}`).then(r => r.data.data.board),
    enabled: !!boardId,
  });

  useEffect(() => {
    if (boardData) setCurrentBoard(boardData);
    if (workspaceId) joinWorkspace(workspaceId);
    return () => { if (workspaceId) leaveWorkspace(workspaceId); };
  }, [boardData, workspaceId]);

  const moveMutation = useMutation({
    mutationFn: ({ taskId, status, position }: { taskId: string; status: TaskStatus; position: number }) =>
      api.patch(`/tasks/${taskId}/move`, { status, position }),
    onError: () => {
      qc.invalidateQueries({ queryKey: ['board', boardId] });
      toast.error('Failed to move task');
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const board = currentBoard || boardData;
    const task = board?.tasks?.find((t: Task) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over || active.id === over.id) return;

    const board = currentBoard || boardData;
    if (!board) return;

    const activeTask = board.tasks?.find((t: Task) => t.id === active.id);
    const overTask = board.tasks?.find((t: Task) => t.id === over.id);

    if (!activeTask) return;

    // Determine target column
    let targetStatus: TaskStatus = activeTask.status;
    const colId = COLUMNS.find(c => c.id === over.id)?.id;
    if (colId) {
      targetStatus = colId;
    } else if (overTask) {
      targetStatus = overTask.status;
    }

    if (targetStatus !== activeTask.status) {
      moveTask(activeTask.id, targetStatus, 0);
      moveMutation.mutate({ taskId: activeTask.id, status: targetStatus, position: 0 });
    }
  };

  const board = currentBoard || boardData;
  const members = board?.workspace?.members || [];

  const getColumnTasks = (status: TaskStatus): Task[] => {
    if (!board?.tasks) return [];
    return board.tasks
      .filter((t: Task) => t.status === status)
      .sort((a: Task, b: Task) => a.position - b.position);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse flex gap-4 overflow-x-auto">
          {COLUMNS.map(c => (
            <div key={c.id} className="w-72 flex-shrink-0">
              <div className="h-6 skeleton rounded mb-3 w-24" />
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <div key={i} className="h-28 skeleton rounded-xl" />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Board Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-dark-800 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-dark-100">{board?.title}</h1>
          <p className="text-xs text-dark-500">{board?.tasks?.length || 0} total tasks</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Online presence */}
          <div className="flex -space-x-1.5">
            {useWorkspaceStore.getState().onlineUsers.slice(0, 4).map(u => (
              <div key={u.id} title={u.name}
                className="w-7 h-7 rounded-full border-2 border-green-400 overflow-hidden">
                {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" /> :
                  <div className="w-full h-full bg-primary-600 flex items-center justify-center text-[10px] text-white font-bold">{u.name.charAt(0)}</div>}
              </div>
            ))}
          </div>
          <button onClick={() => setCreateStatus('TODO')} className="btn-primary btn-sm">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full">
            {COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={getColumnTasks(column.id)}
                onTaskOpen={setSelectedTask}
                onAddTask={setCreateStatus}
                workspaceMembers={members}
              />
            ))}
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeTask ? (
              <div className="rotate-3 scale-105">
                <TaskCard task={activeTask} onOpen={() => {}} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {selectedTask && (
          <TaskDetailModal
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            boardId={boardId!}
            workspaceId={workspaceId!}
            members={members}
          />
        )}
      </AnimatePresence>

      {/* Create Task Modal */}
      <AnimatePresence>
        {createStatus && (
          <CreateTaskModal
            boardId={boardId!}
            defaultStatus={createStatus}
            members={members}
            onClose={() => setCreateStatus(null)}
            onCreated={(task) => {
              qc.invalidateQueries({ queryKey: ['board', boardId] });
              setCreateStatus(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default KanbanPage;
