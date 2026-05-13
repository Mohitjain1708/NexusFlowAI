import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Send, Bot, User, RotateCcw, Loader2, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { ChatMessage } from '@/types';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const suggestedPrompts = [
  "Summarize my overdue tasks",
  "How can I improve my productivity?",
  "Generate subtasks for a feature release",
  "What are best practices for sprint planning?",
  "Help me write a task description",
];

const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hello, ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm your NexusFlow AI assistant. I can help you:\n\n- 📋 Summarize tasks and projects\n- ✅ Generate subtasks\n- ✍️ Rewrite descriptions\n- 📊 Provide productivity insights\n- 🗓️ Suggest deadlines\n\nHow can I assist you today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = async (content?: string) => {
    const messageContent = content || input.trim();
    if (!messageContent || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: messageContent, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data } = await api.post('/ai/chat', {
        message: messageContent,
        chatHistory: messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
      });

      if (data.success) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.data.reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error?.message || 'AI service unavailable';
      toast.error(errorMsg);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ I encountered an error. Please check your OpenAI API key configuration.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: 'Chat cleared. How can I help you?',
      timestamp: new Date(),
    }]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed right-0 top-0 h-full w-96 bg-dark-900 border-l border-dark-800 flex flex-col z-50 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-dark-800 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center shadow-glow">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-dark-100">AI Assistant</h3>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-dark-400">Powered by GPT-4o mini</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="p-1.5 text-dark-500 hover:text-dark-200 hover:bg-dark-800 rounded-lg transition-all"
                title="Clear chat"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-dark-500 hover:text-dark-200 hover:bg-dark-800 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn('flex gap-3', message.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
              >
                {/* Avatar */}
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1',
                  message.role === 'assistant'
                    ? 'bg-gradient-to-br from-primary-500 to-purple-600'
                    : 'bg-dark-700'
                )}>
                  {message.role === 'assistant' ? (
                    <Bot className="w-4 h-4 text-white" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-dark-300" />
                  )}
                </div>

                {/* Message */}
                <div className={cn(
                  'max-w-[85%] rounded-xl px-3 py-2.5 text-sm',
                  message.role === 'assistant'
                    ? 'bg-dark-800 text-dark-200'
                    : 'bg-primary-600 text-white'
                )}>
                  {message.role === 'assistant' ? (
                    <div className="prose-dark text-xs leading-relaxed">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-xs leading-relaxed">{message.content}</p>
                  )}
                  <p className={cn(
                    'text-[10px] mt-1',
                    message.role === 'assistant' ? 'text-dark-500' : 'text-primary-200'
                  )}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3 items-start"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-dark-800 rounded-xl px-4 py-3">
                  <div className="flex gap-1.5 items-center">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex gap-2 flex-wrap">
              {suggestedPrompts.slice(0, 3).map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-xs bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-dark-100 px-3 py-1.5 rounded-lg border border-dark-700 transition-all truncate max-w-full"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-dark-800 flex-shrink-0">
            <div className="flex gap-2 items-end bg-dark-800 rounded-xl border border-dark-700 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-all px-3 py-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask AI anything..."
                rows={1}
                className="flex-1 bg-transparent text-dark-100 placeholder-dark-500 text-sm resize-none outline-none max-h-32 leading-relaxed"
                style={{ height: 'auto', minHeight: '20px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className="w-7 h-7 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-white" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-dark-600 text-center mt-2">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIAssistant;
