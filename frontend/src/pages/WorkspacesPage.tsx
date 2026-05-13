import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, Briefcase, Users, Layout, Trash2,
  Settings, MoreHorizontal, Crown, Clock, Loader2, X
} from 'lucide-react';
import api from '@/services/api';
import { Workspace } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { formatRelative } from '@/utils/helpers';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';

const WORKSPACE_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6'];
const WORKSPACE_ICONS = ['🚀','💼','🎯','⚡','🔥','🌟','🛸','🎪','🏗️','🧩'];

const CreateWorkspaceModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(WORKSPACE_COLORS[0]);
  const [icon, setIcon] = useState(WORKSPACE_ICONS[0]);
  const qc = useQueryClient();
  const { addWorkspace } = useWorkspaceStore();

  const mutation = useMutation({
    mutationFn: (data: object) => api.post('/workspaces', data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['workspaces'] });
      addWorkspace(res.data.data.workspace);
      toast.success('Workspace created!');
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to create'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    mutation.mutate({ name, description, color, icon });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-md p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-dark-100">Create Workspace</h2>
          <button onClick={onClose} className="p-1.5 text-dark-500 hover:text-dark-200 hover:bg-dark-800 rounded-lg transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preview */}
          <div className="flex items-center gap-3 p-4 bg-dark-800 rounded-xl border border-dark-700">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: color + '33', border: `2px solid ${color}` }}>
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium text-dark-100">{name || 'Workspace Name'}</p>
              <p className="text-xs text-dark-500">{description || 'No description'}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="My Awesome Workspace" className="input" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="What's this workspace for?" className="input" />
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {WORKSPACE_ICONS.map(i => (
                <button key={i} type="button" onClick={() => setIcon(i)}
                  className={cn('w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all', icon === i ? 'bg-primary-600/30 ring-2 ring-primary-500' : 'bg-dark-800 hover:bg-dark-700')}>
                  {i}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {WORKSPACE_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={cn('w-7 h-7 rounded-full transition-all', color === c ? 'ring-2 ring-offset-2 ring-offset-dark-900 ring-white scale-110' : 'hover:scale-105')}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={mutation.isPending || !name.trim()} className="btn-primary flex-1">
              {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</> : 'Create Workspace'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const WorkspaceCard: React.FC<{ workspace: Workspace }> = ({ workspace }) => {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { removeWorkspace } = useWorkspaceStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const isOwner = workspace.ownerId === user?.id;

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/workspaces/${workspace.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspaces'] });
      removeWorkspace(workspace.id);
      toast.success('Workspace deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to delete'),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="card p-5 hover:border-dark-600 transition-all duration-200 group relative"
    >
      <div className="flex items-start justify-between mb-4">
        <Link to={`/workspaces/${workspace.id}`} className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ backgroundColor: workspace.color + '22', border: `2px solid ${workspace.color}40` }}>
            {workspace.icon}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-dark-100 group-hover:text-primary-400 transition-colors truncate">{workspace.name}</h3>
            <p className="text-xs text-dark-500 truncate">{workspace.description || 'No description'}</p>
          </div>
        </Link>
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 text-dark-500 hover:text-dark-200 hover:bg-dark-800 rounded-lg transition-all opacity-0 group-hover:opacity-100">
            <MoreHorizontal className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                className="absolute right-0 top-8 w-40 bg-dark-800 border border-dark-700 rounded-xl shadow-xl z-10 overflow-hidden"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <Link to={`/workspaces/${workspace.id}`}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm text-dark-300 hover:bg-dark-700 hover:text-dark-100 transition-colors">
                  <Settings className="w-3.5 h-3.5" /> Settings
                </Link>
                {isOwner && (
                  <button onClick={() => { deleteMutation.mutate(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-dark-500 mb-4">
        <span className="flex items-center gap-1.5">
          <Layout className="w-3.5 h-3.5" />
          {workspace._count?.boards || workspace.boards?.length || 0} boards
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          {workspace._count?.members || workspace.members?.length || 0} members
        </span>
        {isOwner && (
          <span className="flex items-center gap-1.5 ml-auto text-yellow-500">
            <Crown className="w-3 h-3" /> Owner
          </span>
        )}
      </div>

      {/* Member Avatars */}
      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {(workspace.members || []).slice(0, 4).map(m => (
            <div key={m.id} title={m.user?.name}
              className="w-7 h-7 rounded-full border-2 border-dark-900 overflow-hidden">
              {m.user?.avatar ? (
                <img src={m.user.avatar} alt={m.user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary-600 flex items-center justify-center text-[10px] text-white font-bold">
                  {m.user?.name?.charAt(0)}
                </div>
              )}
            </div>
          ))}
          {(workspace.members?.length || 0) > 4 && (
            <div className="w-7 h-7 rounded-full border-2 border-dark-900 bg-dark-700 flex items-center justify-center text-[10px] text-dark-400 font-medium">
              +{(workspace.members?.length || 0) - 4}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-dark-600">
          <Clock className="w-3 h-3" />
          {formatRelative(workspace.createdAt)}
        </div>
      </div>

      {/* Color accent */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl opacity-60"
        style={{ backgroundColor: workspace.color }} />
    </motion.div>
  );
};

const WorkspacesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const { setWorkspaces } = useWorkspaceStore();

  const { data, isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => api.get('/workspaces').then(r => r.data.data.workspaces),
  });

  useEffect(() => {
    if (data) setWorkspaces(data as Workspace[]);
  }, [data]);

  const workspaces: Workspace[] = data || [];
  const filtered = workspaces.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-50 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary-400" /> Workspaces
          </h1>
          <p className="text-dark-400 text-sm mt-1">Manage and collaborate across your workspaces</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Workspace
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search workspaces..."
          className="input pl-9" />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 h-48 animate-pulse">
              <div className="flex gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl skeleton" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 skeleton rounded w-3/4" />
                  <div className="h-3 skeleton rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 skeleton rounded" />
                <div className="h-3 skeleton rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-dark-800 rounded-2xl flex items-center justify-center mb-4">
            <Briefcase className="w-8 h-8 text-dark-500" />
          </div>
          <h3 className="text-lg font-semibold text-dark-300 mb-2">
            {search ? 'No workspaces found' : 'No workspaces yet'}
          </h3>
          <p className="text-dark-500 text-sm mb-6">
            {search ? 'Try a different search term' : 'Create your first workspace to get started'}
          </p>
          {!search && (
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> Create Workspace
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(w => <WorkspaceCard key={w.id} workspace={w} />)}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && <CreateWorkspaceModal onClose={() => setShowCreate(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default WorkspacesPage;
