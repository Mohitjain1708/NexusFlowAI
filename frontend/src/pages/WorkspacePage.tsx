import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Briefcase, Users, Layout, Activity, Plus, Settings,
  ArrowRight, CheckCircle2, Clock, BarChart3
} from 'lucide-react';
import api from '@/services/api';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { joinWorkspace, leaveWorkspace } from '@/sockets/socketClient';
import { formatRelative, getStatusColor } from '@/utils/helpers';
import { cn } from '@/utils/cn';

const WorkspacePage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { setCurrentWorkspace, onlineUsers } = useWorkspaceStore();

  const { data, isLoading } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}`).then(r => r.data.data.workspace),
    enabled: !!workspaceId,
  });

  useEffect(() => {
    if (data) setCurrentWorkspace(data);
    if (workspaceId) joinWorkspace(workspaceId);
    return () => { if (workspaceId) leaveWorkspace(workspaceId); };
  }, [data, workspaceId]);

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 skeleton rounded w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="card h-32 skeleton" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!data) return <div className="p-6 text-dark-400">Workspace not found</div>;

  const workspace = data;
  const allTasks = workspace.boards?.flatMap((b: any) => b.tasks || []) || [];
  const completedCount = allTasks.filter((t: any) => t.status === 'COMPLETED').length;
  const pendingCount = allTasks.filter((t: any) => t.status !== 'COMPLETED').length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
            style={{ backgroundColor: workspace.color + '22', border: `2px solid ${workspace.color}40` }}>
            {workspace.icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark-50">{workspace.name}</h1>
            <p className="text-dark-400 text-sm mt-0.5">{workspace.description || 'No description'}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-xs text-dark-500 flex items-center gap-1">
                <Users className="w-3 h-3" /> {workspace.members?.length} members
              </span>
              <span className="text-xs text-dark-500 flex items-center gap-1">
                <Layout className="w-3 h-3" /> {workspace.boards?.length} boards
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Online users */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {onlineUsers.slice(0, 3).map(u => (
                <div key={u.id} title={`${u.name} (online)`}
                  className="w-7 h-7 rounded-full border-2 border-green-500 overflow-hidden">
                  {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" /> :
                    <div className="w-full h-full bg-primary-600 flex items-center justify-center text-[10px] text-white font-bold">{u.name.charAt(0)}</div>}
                </div>
              ))}
            </div>
            {onlineUsers.length > 0 && (
              <span className="text-xs text-green-400 flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                {onlineUsers.length} online
              </span>
            )}
          </div>
          <Link to={`/workspaces/${workspaceId}`} className="btn-ghost btn-sm">
            <Settings className="w-4 h-4" /> Settings
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Tasks', value: allTasks.length, icon: Layout, color: 'text-primary-400', bg: 'bg-primary-600/10' },
          { label: 'Completed', value: completedCount, icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'In Progress', value: pendingCount, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Members', value: workspace.members?.length, icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card p-4 flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', stat.bg)}>
              <stat.icon className={cn('w-5 h-5', stat.color)} />
            </div>
            <div>
              <p className="text-xl font-bold text-dark-100">{stat.value}</p>
              <p className="text-xs text-dark-500">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Boards */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-dark-100 flex items-center gap-2">
            <Layout className="w-5 h-5 text-primary-400" /> Boards
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspace.boards?.map((board: any) => {
            const boardTasks = board.tasks || [];
            const done = boardTasks.filter((t: any) => t.status === 'COMPLETED').length;
            return (
              <Link key={board.id} to={`/workspaces/${workspaceId}/board/${board.id}`}>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="card p-5 hover:border-primary-600/50 cursor-pointer transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-dark-100 group-hover:text-primary-400 transition-colors">{board.title}</h3>
                      {board.description && <p className="text-xs text-dark-500 mt-0.5">{board.description}</p>}
                    </div>
                    <ArrowRight className="w-4 h-4 text-dark-600 group-hover:text-primary-400 transition-colors" />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-dark-500">
                    <span>{boardTasks.length} tasks</span>
                    <span className="text-green-400">{done} done</span>
                  </div>
                  {boardTasks.length > 0 && (
                    <div className="mt-3 bg-dark-800 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${(done / boardTasks.length) * 100}%` }} />
                    </div>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Members + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Members */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-dark-200 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary-400" /> Members
          </h3>
          <div className="space-y-3">
            {workspace.members?.map((member: any) => (
              <div key={member.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  {member.user?.avatar ? (
                    <img src={member.user.avatar} alt={member.user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary-600 flex items-center justify-center text-xs text-white font-bold">
                      {member.user?.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark-200 truncate">{member.user?.name}</p>
                  <p className="text-xs text-dark-500 truncate">{member.user?.email}</p>
                </div>
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                  member.role === 'ADMIN' ? 'bg-primary-600/20 text-primary-400' :
                  member.role === 'VIEWER' ? 'bg-dark-700 text-dark-400' :
                  'bg-blue-500/20 text-blue-400')}>
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-dark-200 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary-400" /> Recent Activity
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {workspace.activityLogs?.length === 0 ? (
              <p className="text-dark-500 text-sm">No activity yet</p>
            ) : (
              workspace.activityLogs?.slice(0, 8).map((log: any) => (
                <div key={log.id} className="flex items-start gap-2.5 text-xs">
                  <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
                    {log.user?.avatar ? (
                      <img src={log.user.avatar} alt={log.user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-primary-700 flex items-center justify-center text-white text-[9px] font-bold">
                        {log.user?.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-dark-300">{log.description}</span>
                    <p className="text-dark-600 mt-0.5">{formatRelative(log.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspacePage;
