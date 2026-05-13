import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, Users, CheckCircle2,
  AlertTriangle, Clock, Award, Activity
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line
} from 'recharts';
import api from '@/services/api';
import { AnalyticsData } from '@/types';
import StatCard from '@/components/dashboard/StatCard';
import ProductivityChart from '@/components/analytics/ProductivityChart';
import { formatRelative } from '@/utils/helpers';

const COLORS = ['#64748b', '#3b82f6', '#f59e0b', '#22c55e'];
const PRIORITY_COLORS = ['#64748b', '#f59e0b', '#f97316', '#ef4444'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-dark-400 mb-1">{label}</p>
        <p className="text-sm font-semibold text-primary-400">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const AnalyticsPage: React.FC = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics-full'],
    queryFn: async () => {
      const { data } = await api.get('/analytics');
      return data.data as AnalyticsData;
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const { summary, charts, topContributors, recentActivity } = analytics || {};

  const statusData = charts?.tasksByStatus.map((s) => ({
    name: s.status.replace('_', ' '),
    value: s.count,
  })) || [];

  const priorityData = charts?.tasksByPriority.map((p) => ({
    name: p.priority,
    value: p.count,
  })) || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-dark-50 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary-400" /> Analytics
        </h1>
        <p className="text-dark-400 text-sm mt-1">Track your team's productivity and progress</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Tasks" value={summary?.totalTasks ?? 0} icon={<BarChart3 className="w-5 h-5" />} color="text-primary-400" bg="bg-primary-500/10" delay={0} />
        <StatCard title="Completed" value={summary?.completedTasks ?? 0} icon={<CheckCircle2 className="w-5 h-5" />} color="text-green-400" bg="bg-green-500/10" delay={0.1} trend={{ value: summary?.completionRate ?? 0, label: 'completion rate' }} />
        <StatCard title="Overdue" value={summary?.overdueTasks ?? 0} icon={<AlertTriangle className="w-5 h-5" />} color="text-red-400" bg="bg-red-500/10" delay={0.2} />
        <StatCard title="Workspaces" value={summary?.workspaceCount ?? 0} icon={<Users className="w-5 h-5" />} color="text-purple-400" bg="bg-purple-500/10" delay={0.3} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Completions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <h2 className="text-lg font-semibold text-dark-100 mb-1">Daily Completions</h2>
          <p className="text-sm text-dark-400 mb-5">Tasks completed per day (last 7 days)</p>
          {charts?.completedPerDay && <ProductivityChart data={charts.completedPerDay} />}
        </motion.div>

        {/* Weekly Creation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <h2 className="text-lg font-semibold text-dark-100 mb-1">Weekly Task Creation</h2>
          <p className="text-sm text-dark-400 mb-5">Tasks created per week (last 4 weeks)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts?.createdPerWeek || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="week" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-6"
        >
          <h2 className="text-lg font-semibold text-dark-100 mb-5">Status Distribution</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                dataKey="value"
                paddingAngle={3}
              >
                {statusData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '11px' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Priority Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card p-6"
        >
          <h2 className="text-lg font-semibold text-dark-100 mb-5">Priority Distribution</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                dataKey="value"
                paddingAngle={3}
              >
                {priorityData.map((_, index) => (
                  <Cell key={index} fill={PRIORITY_COLORS[index % PRIORITY_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '11px' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Contributors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card p-6"
        >
          <h2 className="text-lg font-semibold text-dark-100 mb-1 flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-400" /> Top Contributors
          </h2>
          <p className="text-xs text-dark-400 mb-4">By completed tasks</p>
          <div className="space-y-3">
            {topContributors?.map((contributor, index) => (
              <div key={contributor.user?.id} className="flex items-center gap-3">
                <div className="w-6 h-6 flex items-center justify-center">
                  <span className={`text-sm font-bold ${
                    index === 0 ? 'text-yellow-400' :
                    index === 1 ? 'text-dark-300' :
                    index === 2 ? 'text-orange-400' : 'text-dark-500'
                  }`}>
                    {index + 1}
                  </span>
                </div>
                <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
                  {contributor.user?.avatar ? (
                    <img src={contributor.user.avatar} alt={contributor.user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary-600 flex items-center justify-center text-white text-[10px] font-bold">
                      {contributor.user?.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-dark-200 truncate">{contributor.user?.name}</p>
                </div>
                <span className="text-sm font-semibold text-primary-400 flex-shrink-0">
                  {contributor.completedTasks}
                </span>
              </div>
            ))}
            {(!topContributors || topContributors.length === 0) && (
              <p className="text-dark-500 text-sm text-center py-4">No data yet</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      {recentActivity && recentActivity.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card p-6"
        >
          <h2 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary-400" /> Recent Activity
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentActivity.slice(0, 8).map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 bg-dark-800 rounded-xl">
                <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
                  {activity.user?.avatar ? (
                    <img src={activity.user.avatar} alt={activity.user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary-600 flex items-center justify-center text-white text-[10px] font-bold">
                      {activity.user?.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-dark-300 truncate">{activity.description}</p>
                  <p className="text-[10px] text-dark-600 mt-0.5">{formatRelative(activity.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AnalyticsPage;
