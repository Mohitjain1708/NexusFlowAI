import React, { useState } from 'react';
import { Bell, Search, Sparkles, Sun, Moon, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import NotificationPanel from '@/components/notifications/NotificationPanel';
import { NavLink } from 'react-router-dom';

interface HeaderProps {
  onAIToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAIToggle }) => {
  const { unreadCount } = useNotificationStore();
  const { user } = useAuthStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="h-16 bg-dark-900 border-b border-dark-800 flex items-center justify-between px-6 flex-shrink-0 z-10">
      {/* Search */}
      <div className="relative max-w-xs w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
        <input
          type="text"
          placeholder="Search tasks, workspaces..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-sm text-dark-200 placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        />
        {searchQuery && (
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-dark-500 bg-dark-700 px-1.5 py-0.5 rounded">
            Esc
          </kbd>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* AI Button */}
        <button
          onClick={onAIToggle}
          className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-primary-500 hover:to-purple-500 transition-all shadow-glow hover:shadow-glow-lg active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">AI Assistant</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-dark-400 hover:text-dark-100 hover:bg-dark-800 rounded-lg transition-all"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 text-dark-400 hover:text-dark-100 hover:bg-dark-800 rounded-lg transition-all"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <NotificationPanel onClose={() => setNotifOpen(false)} />
            )}
          </AnimatePresence>
        </div>

        {/* Settings */}
        <NavLink
          to="/settings"
          className="p-2 text-dark-400 hover:text-dark-100 hover:bg-dark-800 rounded-lg transition-all"
        >
          <Settings className="w-4 h-4" />
        </NavLink>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-dark-700 cursor-pointer hover:ring-primary-500 transition-all">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
