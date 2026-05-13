import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
  X, Calendar, User, Tag, AlertTriangle, Loader2, Sparkles,
  Trash2, MessageSquare, Paperclip, Send, Edit3, Check, Clock,
  ChevronDown, MoreVertical
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '@/services/api';
import { Task, Comment, FileAttachment } from '@/types';
import { formatDate, formatRelative, getPriorityColor, getStatusColor, isOverdue } from '@/utils/helpers';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { emitTyping } from '@/sockets/socketClient';
import { useAuthStore } from '@/store/authStore';

interface TaskModalProps {
  task: Task;
  workspaceId: string;
  onClose: () => void;
  onUpdate: (task: Task) => void;
  onDelete: (id: string) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, workspaceId, onClose, onUpdate, onDelete }) => {
  const { user } = useAuthStore();
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
  });
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Fetch comments
  const { data: commentsData, refetch: refetchComments } = useQuery({
    queryKey: ['comments', task.id],
    queryFn: async () => {
      const { data } = await api.get(`/comments/${task.id}`);
      return data.data.comments as Comment[];
    },
  });

  // Fetch files
  const { data: filesData } = useQuery({
    queryKey: ['files', task.id],
    queryFn: async () => {
      const { data } = await api.get(`/files/task/${task.id}`);
      return data.data.files as FileAttachment[];
    },
  });

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [commentsData]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Task>) => {
      const res = await api.put(`/tasks/${task.id}`, data);
      return res.data.data.task as Task;
    },
    onSuccess: (updated) => {
      onUpdate(updated);
      setIsEditing(false);
      toast.success('Task updated');
    },
    onError: () => toast.error('Failed to update task'),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/tasks/${task.id}`),
    onSuccess: () => {
      onDelete(task.id);
      toast.success('Task deleted');
    },
    onError: () => toast.error('Failed to delete task'),
  });

  const submitComment = async () => {
    if (!commentText.trim()) return;
    setIsSubmittingComment(true);
    try {
      await api.post('/comments', { taskId: task.id, message: commentText.trim() });
      setCommentText('');
      refetchComments();
      emitTyping(task.id, workspaceId, false);
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCommentInput = (value: string) => {
    setCommentText(value);
    emitTyping(task.id, workspaceId, true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(task.id, workspaceId, false);
    }, 2000);
  };

  const summarizeTask = async () => {
    setIsSummarizing(true);
    setSummary('');
    try {
      const { data } = await api.post('/ai/summarize', { taskId: task.id });
      if (data.success) setSummary(data.data.summary);
    } catch {
      toast.error('AI service unavailable');
    } finally {
      setIsSummarizing(false);
    }
  };

  const overdue = task.dueDate ? isOverdue(task.dueDate) : false;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-dark-800 flex-shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', getStatusColor(task.status))}>
              {task.status.replace('_', ' ')}
            </span>
            <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', getPriorityColor(task.priority))}>
              {task.priority}
            </span>
            {overdue && (
              <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                <AlertTriangle className="w-3 h-3" /> Overdue
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={summarizeTask}
              disabled={isSummarizing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-primary-400 hover:text-primary-300 hover:bg-primary-600/10 rounded-lg transition-all"
            >
              {isSummarizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              AI Summary
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1.5 text-dark-500 hover:text-dark-200 hover:bg-dark-800 rounded-lg transition-all"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => deleteMutation.mutate()}
              className="p-1.5 text-dark-500 hover:text-red-400 hover:bg-dark-800 rounded-lg transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 text-dark-500 hover:text-dark-200 hover:bg-dark-800 rounded-lg transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">
            {/* AI Summary */}
            {summary && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-primary-600/10 to-purple-600/10 border border-primary-600/20 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary-400" />
                  <span className="text-xs font-semibold text-primary-400">AI Summary</span>
                </div>
                <div className="prose-dark text-xs">
                  <ReactMarkdown>{summary}</ReactMarkdown>
                </div>
              </motion.div>
            )}

            {/* Title */}
            {isEditing ? (
              <div className="space-y-3">
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  className="input text-lg font-bold"
                  autoFocus
                />
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="input resize-none"
                  rows={4}
                  placeholder="Description..."
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as any }))}
                    className="input"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="REVIEW">In Review</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="input"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <input
                  type="date"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="input"
                />
                <div className="flex gap-2">
                  <button onClick={() => setIsEditing(false)} className="btn-secondary flex-1">Cancel</button>
                  <button
                    onClick={() => updateMutation.mutate({ ...editForm, dueDate: editForm.dueDate || undefined })}
                    disabled={updateMutation.isPending}
                    className="btn-primary flex-1"
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-dark-50">{task.title}</h2>
                {task.description ? (
                  <div className="prose-dark text-sm">
                    <ReactMarkdown>{task.description}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-dark-500 text-sm italic">No description provided</p>
                )}
              </>
            )}

            {/* Meta */}
            {!isEditing && (
              <div className="grid grid-cols-2 gap-3">
                {task.assignee && (
                  <div className="flex items-center gap-2 p-3 bg-dark-800 rounded-xl">
                    <User className="w-4 h-4 text-dark-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-dark-500 uppercase tracking-wider">Assignee</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0">
                          {task.assignee.avatar ? (
                            <img src={task.assignee.avatar} alt={task.assignee.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-primary-600 flex items-center justify-center text-white text-[8px]">
                              {task.assignee.name?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-dark-200 truncate">{task.assignee.name}</p>
                      </div>
                    </div>
                  </div>
                )}
                {task.dueDate && (
                  <div className={cn('flex items-center gap-2 p-3 rounded-xl', overdue ? 'bg-red-500/10' : 'bg-dark-800')}>
                    <Calendar className={cn('w-4 h-4 flex-shrink-0', overdue ? 'text-red-400' : 'text-dark-500')} />
                    <div>
                      <p className="text-[10px] text-dark-500 uppercase tracking-wider">Due Date</p>
                      <p className={cn('text-xs mt-0.5 font-medium', overdue ? 'text-red-400' : 'text-dark-200')}>
                        {formatDate(task.dueDate)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Labels */}
            {task.labels && task.labels.length > 0 && !isEditing && (
              <div className="flex gap-1.5 flex-wrap">
                {task.labels.map((label) => (
                  <span key={label} className="text-xs bg-primary-600/20 text-primary-400 px-2.5 py-1 rounded-full">
                    {label}
                  </span>
                ))}
              </div>
            )}

            {/* File Attachments */}
            {filesData && filesData.length > 0 && (
              <div>
                <p className="text-sm font-medium text-dark-300 mb-2 flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-dark-500" /> Attachments ({filesData.length})
                </p>
                <div className="space-y-1">
                  {filesData.map((file) => (
                    <a
                      key={file.id}
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 bg-dark-800 rounded-lg hover:bg-dark-700 transition-all text-sm text-dark-300 hover:text-dark-100"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-dark-500 flex-shrink-0" />
                      <span className="truncate flex-1">{file.filename}</span>
                      <span className="text-xs text-dark-600 flex-shrink-0">{formatDate(file.createdAt)}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <div>
              <p className="text-sm font-medium text-dark-300 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-dark-500" />
                Comments ({commentsData?.length ?? 0})
              </p>
              <div className="space-y-3 max-h-48 overflow-y-auto mb-3">
                {commentsData?.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
                      {comment.user.avatar ? (
                        <img src={comment.user.avatar} alt={comment.user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary-600 flex items-center justify-center text-white text-[9px] font-bold">
                          {comment.user.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 bg-dark-800 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-dark-200">{comment.user.name}</span>
                        <span className="text-[10px] text-dark-600">{formatRelative(comment.createdAt)}</span>
                      </div>
                      <p className="text-xs text-dark-300 leading-relaxed">{comment.message}</p>
                    </div>
                  </div>
                ))}
                {(!commentsData || commentsData.length === 0) && (
                  <p className="text-dark-600 text-xs text-center py-4">No comments yet. Start the conversation!</p>
                )}
                <div ref={commentsEndRef} />
              </div>

              {/* Comment Input */}
              <div className="flex gap-2 items-start">
                <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mt-1">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary-600 flex items-center justify-center text-white text-[9px] font-bold">
                      {user?.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 flex gap-2 items-end bg-dark-800 rounded-xl border border-dark-700 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-all px-3 py-2">
                  <textarea
                    value={commentText}
                    onChange={(e) => handleCommentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); }
                    }}
                    placeholder="Add a comment..."
                    rows={1}
                    className="flex-1 bg-transparent text-xs text-dark-200 placeholder-dark-600 resize-none outline-none"
                  />
                  <button
                    onClick={submitComment}
                    disabled={!commentText.trim() || isSubmittingComment}
                    className="w-6 h-6 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 rounded-md flex items-center justify-center transition-all flex-shrink-0"
                  >
                    {isSubmittingComment ? (
                      <Loader2 className="w-3 h-3 text-white animate-spin" />
                    ) : (
                      <Send className="w-3 h-3 text-white" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-dark-800 flex-shrink-0">
          <div className="text-xs text-dark-600">
            Created {formatRelative(task.createdAt)}
            {task.creator && ` by ${task.creator.name}`}
          </div>
          <div className="text-xs text-dark-600">
            Updated {formatRelative(task.updatedAt)}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TaskModal;
