import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import AIAssistant from '@/components/ai/AIAssistant';
import { initSocket, disconnectSocket } from '@/sockets/socketClient';
import { useAuthStore } from '@/store/authStore';

const AppLayout: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [aiOpen, setAiOpen] = React.useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      initSocket();
    }
    return () => { disconnectSocket(); };
  }, [isAuthenticated]);

  return (
    <div className="flex h-screen bg-dark-950 overflow-hidden">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onAIToggle={() => setAiOpen(!aiOpen)} />

        <main className="flex-1 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* AI Assistant Sidebar */}
      <AIAssistant isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
};

export default AppLayout;
