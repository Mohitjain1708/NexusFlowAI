import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { X, Loader2, Calendar, Flag, User, Tag } from 'lucide-react';
import api from '@/services/api';
import { Task, TaskStatus, TaskPriority } from '@/types';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

interface CreateTaskModalProps {
  boardId: string;
  defaultStatus: TaskStatus;
  members: any[];
  onClose: () => void;
  onCreated: (task: Task) => void;
}

const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: 'text-dark-400',
  MEDIUM: 'text-yellow-400',
  HIGH: 'text-orange-400',
  URGENT: 'text-red-400',
};

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  boardId, defaultStatus, members, onClose, onCreated
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [labels, setLabels] = useState<string[]>([]);

  const mutation = useMutation({
    mutationFn: (data: object) => api.post('/tasks', data),
    onSuccess: (res) => {
      onCreated(res.data.data.task);
      toast.success('Task created!');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to create task'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error('Title is required');
    mutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      boardId,
      status: defaultStatus,
      priority,
      dueDate: dueDate || undefined,
      assigneeId: assigneeId || undefined,
      labels,
    });
  };

  const addLabel = () => {
    const l = labelInput.trim();
    if (l && !labels.includes(l)) {
      setLabels(prev => [...prev, l]);
      setLabelInput('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-dark-100">Create New Task</h2>
          <button onClick={onClose} className="p-1.5 text-dark-500 hover:text-dark-200 hover:bg-dark-800 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?" className="input" autoFocus required />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Add more details..." className="input resize-none" rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">
                <Flag className="inline w-3.5 h-3.5 mr-1" />Priority
              </label>
              <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)}
                className="input text-sm">
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">
                <Calendar className="inline w-3.5 h-3.5 mr-1" />Due Date
              </label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="input text-sm" min={new Date().toISOString().split('T')[0]} />
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">
              <User className="inline w-3.5 h-3.5 mr-1" />Assign To
            </label>
            <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}
              className="input text-sm">
              <option value="">Unassigned</option>
              {members.map((m: any) => (
                <option key={m.user?.id} value={m.user?.id}>{m.user?.name}</option>
              ))}
            </select>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">
              <Tag className="inline w-3.5 h-3.5 mr-1" />Labels
            </label>
            <div className="flex gap-2">
              <input value={labelInput} onChange={e => setLabelInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLabel(); } }}
                placeholder="Add label, press Enter" className="input text-sm flex-1" />
              <button type="button" onClick={addLabel} className="btn-secondary btn-sm px-3">Add</button>
            </div>
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {labels.map(l => (
                  <span key={l}
                    className="flex items-center gap-1 px-2 py-0.5 bg-primary-600/20 text-primary-400 text-xs rounded-full">
                    {l}
                    <button type="button" onClick={() => setLabels(prev => prev.filter(x => x !== l))}
                      className="text-primary-500 hover:text-primary-300">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-2 p-3 bg-dark-800 rounded-xl">
            <span className="text-xs text-dark-500">Adding to:</span>
            <span className={cn('badge text-xs',
              defaultStatus === 'TODO' ? 'bg-dark-700 text-dark-300' :
              defaultStatus === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' :
              defaultStatus === 'REVIEW' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-green-500/20 text-green-400')}>
              {defaultStatus.replace('_', ' ')}
            </span>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={mutation.isPending || !title.trim()} className="btn-primary flex-1">
              {mutation.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</>
                : 'Create Task'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default CreateTaskModal;
