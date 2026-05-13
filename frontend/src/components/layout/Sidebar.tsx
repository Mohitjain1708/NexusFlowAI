import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Briefcase, KanbanSquare, CheckSquare,
  BarChart3, Settings, ChevronLeft, ChevronRight, Zap,
  Plus, LogOut, User
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { cn } from '@/utils/cn';
import api from '@/services/api';
import toast from 'react-hot-toast';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/workspaces', icon: Briefcase, label: 'Workspaces' },
  { to: '/tasks', icon: CheckSquare, label: 'My Tasks' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuthStore();
  const { workspaces, currentWorkspace } = useWorkspaceStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', { refreshToken: useAuthStore.getState().refreshToken });
    } catch {}
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative flex flex-col bg-dark-900 border-r border-dark-800 h-screen overflow-hidden z-10"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-dark-800 flex-shrink-0">
        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-glow">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-bold text-lg gradient-text whitespace-nowrap"
            >
              NexusFlow AI
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto no-scrollbar py-4 px-2 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
                isActive
                  ? 'bg-primary-600/20 text-primary-400'
                  : 'text-dark-400 hover:text-dark-100 hover:bg-dark-800'
              )
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="whitespace-nowrap"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}

        {/* Workspaces Section */}
        {!collapsed && workspaces.length > 0 && (
          <div className="pt-4">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-xs font-semibold text-dark-500 uppercase tracking-wider">
                Workspaces
              </span>
              <NavLink to="/workspaces" className="text-dark-500 hover:text-primary-400 transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </NavLink>
            </div>
            {workspaces.slice(0, 5).map((ws) => (
              <NavLink
                key={ws.id}
                to={`/workspaces/${ws.id}`}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 group',
                    isActive
                      ? 'bg-dark-800 text-dark-100'
                      : 'text-dark-400 hover:text-dark-100 hover:bg-dark-800'
                  )
                }
              >
                <span className="text-base flex-shrink-0">{ws.icon}</span>
                <span className="truncate">{ws.name}</span>
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* User Profile */}
      <div className="border-t border-dark-800 p-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-dark-700">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-medium text-dark-100 truncate">{user?.name}</p>
                <p className="text-xs text-dark-500 truncate">{user?.email}</p>
              </motion.div>
            )}
          </AnimatePresence>
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="p-1.5 text-dark-500 hover:text-red-400 transition-colors rounded-lg hover:bg-dark-800"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-dark-800 border border-dark-700 rounded-full flex items-center justify-center text-dark-400 hover:text-dark-100 hover:bg-dark-700 transition-all z-20 shadow-md"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </motion.aside>
  );
};

export default Sidebar;
