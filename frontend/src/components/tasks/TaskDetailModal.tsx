import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X, Calendar, Flag, User, MessageSquare, Paperclip,
  Trash2, Edit2, Check, Loader2, Sparkles, ChevronDown,
  Upload, AlertCircle, Clock
} from 'lucide-react';
import api from '@/services/api';
import { Task, Comment, FileAttachment, TaskStatus, TaskPriority } from '@/types';
import { formatDate, formatRelative, isOverdue, getPriorityColor } from '@/utils/helpers';
import { cn } from '@/utils/cn';
import { emitTyping } from '@/sockets/socketClient';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  boardId: string;
  workspaceId: string;
  members: any[];
}

const STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'];
const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const STATUS_COLORS: Record<TaskStatus, string> = {
  TODO: 'text-dark-400 bg-dark-700',
  IN_PROGRESS: 'text-blue-400 bg-blue-500/20',
  REVIEW: 'text-yellow-400 bg-yellow-500/20',
  COMPLETED: 'text-green-400 bg-green-500/20',
};

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  LOW: 'text-dark-400 bg-dark-700',
  MEDIUM: 'text-yellow-400 bg-yellow-500/20',
  HIGH: 'text-orange-400 bg-orange-500/20',
  URGENT: 'text-red-400 bg-red-500/20',
};

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task: initialTask,
  onClose,
  boardId,
  workspaceId,
  members,
}) => {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [task, setTask] = useState(initialTask);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description || '');
  const [comment, setComment] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [activeTab, setActiveTab] = useState<'comments' | 'files' | 'ai'>('comments');
  let typingTimeout: ReturnType<typeof setTimeout>;

  // Fetch latest task data
  const { data: freshTask } = useQuery({
    queryKey: ['task', task.id],
    queryFn: () => api.get(`/tasks/${task.id}`).then(r => r.data.data.task),
    staleTime: 10000,
  });

  useEffect(() => {
    if (freshTask) setTask(freshTask);
  }, [freshTask]);

  // Comments
  const { data: commentsData } = useQuery({
    queryKey: ['comments', task.id],
    queryFn: () => api.get(`/comments/${task.id}`).then(r => r.data.data.comments),
  });
  const comments: Comment[] = commentsData || task.comments || [];

  // Update task mutation
  const updateMutation = useMutation({
    mutationFn: (updates: Partial<Task>) => api.put(`/tasks/${task.id}`, updates),
    onSuccess: (res) => {
      setTask(res.data.data.task);
      qc.invalidateQueries({ queryKey: ['board', boardId] });
      qc.invalidateQueries({ queryKey: ['task', task.id] });
    },
    onError: () => toast.error('Failed to update task'),
  });

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/tasks/${task.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['board', boardId] });
      toast.success('Task deleted');
      onClose();
    },
    onError: () => toast.error('Failed to delete task'),
  });

  // Add comment mutation
  const commentMutation = useMutation({
    mutationFn: (message: string) => api.post('/comments', { taskId: task.id, message }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', task.id] });
      setComment('');
      if (workspaceId) emitTyping(task.id, workspaceId, false);
    },
    onError: () => toast.error('Failed to add comment'),
  });

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('taskId', task.id);
      return api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task', task.id] });
      toast.success('File uploaded');
    },
    onError: () => toast.error('Upload failed'),
  });

  const handleTitleSave = () => {
    if (!editTitle.trim()) return;
    updateMutation.mutate({ title: editTitle, description: editDesc });
    setIsEditing(false);
  };

  const handleTyping = (value: string) => {
    setComment(value);
    if (!isTyping && workspaceId) {
      setIsTyping(true);
      emitTyping(task.id, workspaceId, true);
    }
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      setIsTyping(false);
      if (workspaceId) emitTyping(task.id, workspaceId, false);
    }, 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
  };

  const handleAISummarize = async () => {
    setAiLoading(true);
    setActiveTab('ai');
    try {
      const res = await api.post('/ai/summarize', { taskId: task.id });
      setAiResult(res.data.data.summary);
    } catch {
      setAiResult('AI service unavailable. Please configure your OpenAI API key.');
    } finally {
      setAiLoading(false);
    }
  };

  const overdue = task.dueDate && isOverdue(task.dueDate) && task.status !== 'COMPLETED';

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
        className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-dark-800">
          <div className="flex-1 mr-4">
            {isEditing ? (
              <div className="space-y-2">
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                  className="input text-base font-semibold w-full"
                  onKeyDown={e => e.key === 'Enter' && handleTitleSave()} autoFocus />
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)}
                  className="input text-sm w-full resize-none" rows={3}
                  placeholder="Add description..." />
                <div className="flex gap-2">
                  <button onClick={handleTitleSave} className="btn-primary btn-sm">
                    <Check className="w-3.5 h-3.5" /> Save
                  </button>
                  <button onClick={() => setIsEditing(false)} className="btn-secondary btn-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start gap-2">
                  <h2 className={cn('text-lg font-semibold text-dark-100 leading-snug cursor-pointer hover:text-primary-400 transition-colors',
                    task.status === 'COMPLETED' && 'line-through text-dark-500')}
                    onClick={() => setIsEditing(true)}>
                    {task.title}
                  </h2>
                  <button onClick={() => setIsEditing(true)}
                    className="mt-0.5 p-1 text-dark-600 hover:text-dark-300 hover:bg-dark-800 rounded transition-all flex-shrink-0">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {task.description && (
                  <p className="text-sm text-dark-400 mt-1 leading-relaxed">{task.description}</p>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleAISummarize}
              className="p-2 text-dark-500 hover:text-primary-400 hover:bg-primary-600/10 rounded-lg transition-all"
              title="AI Summarize">
              <Sparkles className="w-4 h-4" />
            </button>
            <button onClick={() => deleteMutation.mutate()}
              className="p-2 text-dark-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              title="Delete task">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose}
              className="p-2 text-dark-500 hover:text-dark-200 hover:bg-dark-800 rounded-lg transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Meta Info */}
        <div className="px-5 py-4 border-b border-dark-800 grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Status */}
          <div>
            <label className="text-[10px] text-dark-600 uppercase tracking-wider mb-1 block">Status</label>
            <select value={task.status}
              onChange={e => updateMutation.mutate({ status: e.target.value as TaskStatus })}
              className={cn('text-xs font-medium px-2 py-1 rounded-lg border-0 outline-none cursor-pointer w-full',
                STATUS_COLORS[task.status])}>
              {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          {/* Priority */}
          <div>
            <label className="text-[10px] text-dark-600 uppercase tracking-wider mb-1 block">Priority</label>
            <select value={task.priority}
              onChange={e => updateMutation.mutate({ priority: e.target.value as TaskPriority })}
              className={cn('text-xs font-medium px-2 py-1 rounded-lg border-0 outline-none cursor-pointer w-full',
                PRIORITY_BADGE[task.priority])}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {/* Assignee */}
          <div>
            <label className="text-[10px] text-dark-600 uppercase tracking-wider mb-1 block">Assignee</label>
            <select value={task.assigneeId || ''}
              onChange={e => updateMutation.mutate({ assigneeId: e.target.value || undefined })}
              className="text-xs text-dark-300 bg-dark-800 px-2 py-1 rounded-lg border border-dark-700 outline-none cursor-pointer w-full">
              <option value="">Unassigned</option>
              {members.map((m: any) => (
                <option key={m.user?.id} value={m.user?.id}>{m.user?.name}</option>
              ))}
            </select>
          </div>
          {/* Due Date */}
          <div>
            <label className="text-[10px] text-dark-600 uppercase tracking-wider mb-1 block">Due Date</label>
            <input type="date"
              value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
              onChange={e => updateMutation.mutate({ dueDate: e.target.value || undefined })}
              className={cn('text-xs px-2 py-1 bg-dark-800 rounded-lg border outline-none cursor-pointer w-full',
                overdue ? 'border-red-500/50 text-red-400' : 'border-dark-700 text-dark-300')} />
            {overdue && <p className="text-[10px] text-red-400 flex items-center gap-1 mt-0.5">
              <AlertCircle className="w-2.5 h-2.5" /> Overdue
            </p>}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-5 border-b border-dark-800">
          <div className="flex gap-4">
            {(['comments', 'files', 'ai'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={cn('py-3 text-sm font-medium transition-all border-b-2 -mb-px capitalize',
                  activeTab === tab
                    ? 'text-primary-400 border-primary-500'
                    : 'text-dark-500 border-transparent hover:text-dark-300')}>
                {tab === 'comments' ? `Comments (${comments.length})` :
                 tab === 'files' ? `Files (${task.files?.length || 0})` :
                 '✨ AI'}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-dark-500 text-sm text-center py-4">No comments yet. Be the first!</p>
              ) : (
                comments.map(c => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
                      {c.user?.avatar ? (
                        <img src={c.user.avatar} alt={c.user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary-600 flex items-center justify-center text-[10px] text-white font-bold">
                          {c.user?.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-dark-200">{c.user?.name}</span>
                        <span className="text-xs text-dark-600">{formatRelative(c.createdAt)}</span>
                      </div>
                      <div className="bg-dark-800 rounded-xl px-3 py-2.5 text-sm text-dark-300 leading-relaxed">
                        {c.message}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Files Tab */}
          {activeTab === 'files' && (
            <div className="space-y-3">
              <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-dark-700 rounded-xl cursor-pointer hover:border-primary-600/50 transition-colors">
                {uploadMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin text-primary-400" /><span className="text-sm text-dark-400">Uploading...</span></>
                ) : (
                  <><Upload className="w-4 h-4 text-dark-500" /><span className="text-sm text-dark-400">Click to upload file</span></>
                )}
                <input type="file" className="hidden" onChange={handleFileUpload} />
              </label>
              {(task.files || []).length === 0 ? (
                <p className="text-dark-500 text-sm text-center py-4">No files attached</p>
              ) : (
                (task.files || []).map((file: FileAttachment) => (
                  <div key={file.id} className="flex items-center gap-3 p-3 bg-dark-800 rounded-xl border border-dark-700">
                    <Paperclip className="w-4 h-4 text-dark-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-dark-200 truncate">{file.filename}</p>
                      <p className="text-xs text-dark-500">{(file.fileSize / 1024).toFixed(1)} KB</p>
                    </div>
                    <a href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${file.fileUrl}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-primary-400 hover:text-primary-300 text-xs">View</a>
                  </div>
                ))
              )}
            </div>
          )}

          {/* AI Tab */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="flex gap-3 flex-wrap">
                <button onClick={handleAISummarize} disabled={aiLoading}
                  className="btn-secondary btn-sm">
                  {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-primary-400" />}
                  Summarize
                </button>
                <button onClick={async () => {
                  setAiLoading(true);
                  try {
                    const res = await api.post('/ai/generate-subtasks', { title: task.title, description: task.description });
                    const subtasks = res.data.data.subtasks;
                    setAiResult('**Generated Subtasks:**\n' + subtasks.map((s: any) => `• ${s.title} (${s.priority}, ~${s.estimatedHours}h)`).join('\n'));
                  } catch { setAiResult('AI service unavailable'); }
                  finally { setAiLoading(false); }
                }} disabled={aiLoading} className="btn-secondary btn-sm">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Generate Subtasks
                </button>
                <button onClick={async () => {
                  if (!task.description) return toast.error('No description to rewrite');
                  setAiLoading(true);
                  try {
                    const res = await api.post('/ai/rewrite', { description: task.description, tone: 'professional' });
                    setAiResult('**Rewritten Description:**\n\n' + res.data.data.description);
                  } catch { setAiResult('AI service unavailable'); }
                  finally { setAiLoading(false); }
                }} disabled={aiLoading} className="btn-secondary btn-sm">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Rewrite Description
                </button>
              </div>
              {aiLoading && (
                <div className="flex items-center gap-3 p-4 bg-dark-800 rounded-xl">
                  <Loader2 className="w-5 h-5 animate-spin text-primary-400" />
                  <span className="text-sm text-dark-400">AI is thinking...</span>
                </div>
              )}
              {aiResult && !aiLoading && (
                <div className="p-4 bg-dark-800/80 border border-primary-600/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-primary-400" />
                    <span className="text-xs font-medium text-primary-400">AI Result</span>
                  </div>
                  <pre className="text-sm text-dark-300 whitespace-pre-wrap font-sans leading-relaxed">{aiResult}</pre>
                </div>
              )}
              {!aiResult && !aiLoading && (
                <div className="text-center py-6">
                  <Sparkles className="w-8 h-8 text-dark-600 mx-auto mb-2" />
                  <p className="text-dark-500 text-sm">Click an AI action to get started</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Comment Input - only in comments tab */}
        {activeTab === 'comments' && (
          <div className="px-5 pb-5 pt-2 border-t border-dark-800">
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-1">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary-600 flex items-center justify-center text-[10px] text-white font-bold">
                    {user?.name?.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  value={comment}
                  onChange={e => handleTyping(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && comment.trim() && commentMutation.mutate(comment)}
                  placeholder="Write a comment... (Enter to submit)"
                  className="input flex-1 text-sm"
                />
                <button
                  onClick={() => comment.trim() && commentMutation.mutate(comment)}
                  disabled={!comment.trim() || commentMutation.isPending}
                  className="btn-primary btn-sm px-4"
                >
                  {commentMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Send'}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default TaskDetailModal;
