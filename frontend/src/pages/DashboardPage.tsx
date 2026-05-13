import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, CheckCircle2, Clock, AlertTriangle,
  Briefcase, Sparkles, Activity, ArrowRight, TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import StatCard from '@/components/dashboard/StatCard';
import TasksWidget from '@/components/dashboard/TasksWidget';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import { Task, AnalyticsData } from '@/types';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl p-3 shadow-xl">
      <p className="text-xs text-dark-400 mb-1">
        {label ? new Date(label).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }) : ''}
      </p>
      <p className="text-sm font-semibold text-primary-400">{payload[0].value} completed</p>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { workspaces, setWorkspaces } = useWorkspaceStore();

  // Fetch analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
    queryKey: ['analytics'],
    queryFn: () => api.get('/analytics').then(r => r.data.data),
    staleTime: 1000 * 60 * 2,
  });

  // Fetch workspaces
  const { data: wsData } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => api.get('/workspaces').then(r => r.data.data.workspaces),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch dashboard stats (my tasks etc)
  const { data: dashStats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/analytics/dashboard').then(r => r.data.data),
    staleTime: 1000 * 60 * 1,
  });

  // AI insights
  const { data: insightsData, isLoading: insightsLoading } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: () => api.get('/ai/insights').then(r => r.data.data),
    staleTime: 1000 * 60 * 30,
    retry: false,
  });

  useEffect(() => {
    if (wsData) setWorkspaces(wsData);
  }, [wsData]);

  const summary = analytics?.summary;
  const assignedTasks: Task[] = dashStats?.assignedTasks || [];
  const recentActivity = analytics?.recentActivity || [];
  const chartData = analytics?.charts.completedPerDay || [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-dark-50">
            {greeting}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-dark-400 text-sm mt-1">
            Here's what's happening in your workspace today.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-dark-300 font-medium">
              {new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-xs text-dark-500">{new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Workspaces"
          value={summary?.workspaceCount ?? (analyticsLoading ? '...' : '0')}
          icon={<Briefcase className="w-5 h-5" />}
          color="text-primary-400"
          bg="bg-primary-600/10"
          trend={{ value: 10, label: 'this month' }}
          delay={0}
        />
        <StatCard
          title="Completed"
          value={summary?.completedTasks ?? (analyticsLoading ? '...' : '0')}
          subtitle={`${summary?.completionRate ?? 0}% completion rate`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="text-green-400"
          bg="bg-green-500/10"
          trend={{ value: 8, label: 'vs last week' }}
          delay={0.05}
        />
        <StatCard
          title="Pending"
          value={summary?.pendingTasks ?? (analyticsLoading ? '...' : '0')}
          icon={<Clock className="w-5 h-5" />}
          color="text-blue-400"
          bg="bg-blue-500/10"
          trend={{ value: -3, label: 'vs last week' }}
          delay={0.1}
        />
        <StatCard
          title="Overdue"
          value={summary?.overdueTasks ?? (analyticsLoading ? '...' : '0')}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="text-red-400"
          bg="bg-red-500/10"
          delay={0.15}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-dark-100">Productivity Trend</h3>
              <p className="text-xs text-dark-500">Tasks completed over the last 7 days</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+12%</span>
            </div>
          </div>
          {analyticsLoading ? (
            <div className="h-48 skeleton rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={v => new Date(v).toLocaleDateString('en', { weekday: 'short' })} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" stroke="#6366f1"
                  fill="url(#dashGrad)" strokeWidth={2.5}
                  dot={{ fill: '#6366f1', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#6366f1' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* AI Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-dark-100">AI Insights</h3>
              <p className="text-xs text-dark-500">Powered by GPT-4o mini</p>
            </div>
          </div>

          {insightsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 skeleton rounded-xl" />
              ))}
            </div>
          ) : insightsData?.insights ? (
            <div className="space-y-3">
              {insightsData.insights.split('\n')
                .filter((line: string) => line.trim() && line.includes('•'))
                .slice(0, 4)
                .map((insight: string, i: number) => (
                  <div key={i}
                    className="p-3 bg-gradient-to-r from-primary-600/10 to-purple-600/5 rounded-xl border border-primary-600/20">
                    <p className="text-xs text-dark-300 leading-relaxed">{insight.replace('•', '').trim()}</p>
                  </div>
                ))}
              {insightsData.stats && (
                <div className="pt-2 border-t border-dark-800 grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-dark-800 rounded-lg">
                    <p className="text-lg font-bold text-green-400">{insightsData.stats.completionRate}%</p>
                    <p className="text-[10px] text-dark-500">Completion Rate</p>
                  </div>
                  <div className="text-center p-2 bg-dark-800 rounded-lg">
                    <p className="text-lg font-bold text-primary-400">{insightsData.stats.completedTasks}</p>
                    <p className="text-[10px] text-dark-500">Done (30d)</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Sparkles className="w-8 h-8 text-dark-700 mb-2" />
              <p className="text-dark-500 text-sm">Configure OpenAI API key</p>
              <p className="text-dark-700 text-xs mt-1">to get AI-powered insights</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-dark-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary-400" />
              My Assigned Tasks
            </h3>
            <Link to="/tasks" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <TasksWidget tasks={assignedTasks.slice(0, 5)} isLoading={statsLoading} />
        </motion.div>

        {/* Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-dark-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary-400" />
              Recent Activity
            </h3>
          </div>
          <ActivityFeed activities={recentActivity.slice(0, 8)} isLoading={analyticsLoading} />
        </motion.div>
      </div>

      {/* Workspaces Quick Access */}
      {workspaces.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-dark-100 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary-400" />
              Quick Access – Workspaces
            </h3>
            <Link to="/workspaces" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors">
              All workspaces <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {workspaces.slice(0, 4).map((ws, i) => (
              <Link key={ws.id} to={`/workspaces/${ws.id}`}>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 bg-dark-800 rounded-xl border border-dark-700 hover:border-primary-600/40 transition-all group cursor-pointer"
                >
                  <span className="text-xl">{ws.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-dark-200 truncate group-hover:text-primary-400 transition-colors">
                      {ws.name}
                    </p>
                    <p className="text-xs text-dark-600">{ws.members?.length || 0} members</p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DashboardPage;
