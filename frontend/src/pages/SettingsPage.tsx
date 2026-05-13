import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import {
  Settings, User, Lock, Bell, Palette, Shield,
  Save, Loader2, Camera, Trash2
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';

type Tab = 'profile' | 'security' | 'notifications' | 'appearance';

const SettingsPage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', avatar: user?.avatar || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [notifications, setNotifications] = useState({
    taskAssigned: true,
    taskComment: true,
    taskDue: true,
    workspaceInvite: true,
    aiReminders: false,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put('/users/profile', profileForm);
      return data.data.user;
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      toast.success('Profile updated successfully!');
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      await api.put('/users/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
    },
    onSuccess: () => {
      toast.success('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (err: any) => toast.error(err.message || err.response?.data?.error?.message || 'Failed to change password'),
  });

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Lock className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-dark-50 flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary-400" /> Settings
        </h1>
        <p className="text-dark-400 text-sm mt-1">Manage your account preferences</p>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="md:w-56 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left',
                  activeTab === tab.id
                    ? 'bg-primary-600/20 text-primary-400'
                    : 'text-dark-400 hover:text-dark-100 hover:bg-dark-800'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="card p-6"
          >
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-dark-100 mb-1">Profile Information</h2>
                  <p className="text-sm text-dark-400">Update your personal details</p>
                </div>

                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-dark-700">
                      {profileForm.avatar ? (
                        <img src={profileForm.avatar} alt={profileForm.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary-600 flex items-center justify-center text-white text-2xl font-bold">
                          {profileForm.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-dark-300 font-medium">{user?.name}</p>
                    <p className="text-xs text-dark-500">{user?.email}</p>
                    <span className="inline-block mt-1 text-xs font-medium bg-primary-600/20 text-primary-400 px-2 py-0.5 rounded-full">
                      {user?.role}
                    </span>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">Full Name</label>
                  <input
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                    className="input"
                    placeholder="Your full name"
                  />
                </div>

                {/* Avatar URL */}
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">Avatar URL</label>
                  <input
                    value={profileForm.avatar}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, avatar: e.target.value }))}
                    className="input"
                    placeholder="https://example.com/avatar.jpg"
                  />
                  <p className="text-xs text-dark-500 mt-1">Enter a URL for your profile picture</p>
                </div>

                {/* Email (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">Email Address</label>
                  <input value={user?.email || ''} disabled className="input opacity-50 cursor-not-allowed" />
                  <p className="text-xs text-dark-500 mt-1">Email cannot be changed</p>
                </div>

                <button
                  onClick={() => updateProfileMutation.mutate()}
                  disabled={updateProfileMutation.isPending}
                  className="btn-primary"
                >
                  {updateProfileMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
                  ) : (
                    <><Save className="w-4 h-4" />Save Changes</>
                  )}
                </button>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-dark-100 mb-1">Security</h2>
                  <p className="text-sm text-dark-400">Manage your password and security settings</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">Current Password</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="input"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">New Password</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="input"
                      placeholder="Min. 8 characters"
                      minLength={8}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="input"
                      placeholder="Repeat new password"
                    />
                  </div>
                </div>

                <button
                  onClick={() => changePasswordMutation.mutate()}
                  disabled={!passwordForm.currentPassword || !passwordForm.newPassword || changePasswordMutation.isPending}
                  className="btn-primary"
                >
                  {changePasswordMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Changing...</>
                  ) : (
                    <><Shield className="w-4 h-4" />Change Password</>
                  )}
                </button>

                <div className="pt-6 border-t border-dark-800">
                  <h3 className="text-sm font-semibold text-dark-200 mb-3">Active Sessions</h3>
                  <div className="p-4 bg-dark-800 rounded-xl border border-dark-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-dark-200 font-medium">Current Session</p>
                        <p className="text-xs text-dark-500 mt-0.5">This browser · Active now</p>
                      </div>
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-dark-100 mb-1">Notification Preferences</h2>
                  <p className="text-sm text-dark-400">Choose what notifications you receive</p>
                </div>

                <div className="space-y-3">
                  {Object.entries(notifications).map(([key, value]) => {
                    const labels: Record<string, { title: string; desc: string }> = {
                      taskAssigned: { title: 'Task Assigned', desc: 'When a task is assigned to you' },
                      taskComment: { title: 'Task Comments', desc: 'When someone comments on your task' },
                      taskDue: { title: 'Due Date Reminders', desc: '24 hours before task due date' },
                      workspaceInvite: { title: 'Workspace Invitations', desc: 'When invited to a workspace' },
                      aiReminders: { title: 'AI Reminders', desc: 'AI-powered productivity reminders' },
                    };
                    const label = labels[key];
                    return (
                      <div key={key} className="flex items-center justify-between p-4 bg-dark-800 rounded-xl border border-dark-700">
                        <div>
                          <p className="text-sm font-medium text-dark-200">{label.title}</p>
                          <p className="text-xs text-dark-500 mt-0.5">{label.desc}</p>
                        </div>
                        <button
                          onClick={() => setNotifications(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                          className={cn(
                            'relative w-10 h-6 rounded-full transition-all duration-200',
                            value ? 'bg-primary-600' : 'bg-dark-700'
                          )}
                        >
                          <div className={cn(
                            'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200',
                            value ? 'translate-x-5' : 'translate-x-1'
                          )} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <button onClick={() => toast.success('Notification preferences saved!')} className="btn-primary">
                  <Save className="w-4 h-4" /> Save Preferences
                </button>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-dark-100 mb-1">Appearance</h2>
                  <p className="text-sm text-dark-400">Customize how NexusFlow looks</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-dark-300 mb-3">Theme</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'dark', label: 'Dark Mode', bg: 'bg-dark-950', selected: true },
                      { id: 'light', label: 'Light Mode', bg: 'bg-gray-100', selected: false },
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => toast('Light mode coming soon!', { icon: '🌙' })}
                        className={cn(
                          'p-4 rounded-xl border-2 transition-all text-left',
                          theme.selected
                            ? 'border-primary-500 bg-primary-600/10'
                            : 'border-dark-700 bg-dark-800 opacity-50'
                        )}
                      >
                        <div className={cn('w-full h-14 rounded-lg mb-3', theme.bg, 'border border-dark-700')} />
                        <p className="text-sm font-medium text-dark-200">{theme.label}</p>
                        {theme.selected && (
                          <p className="text-xs text-primary-400 mt-0.5">Currently active</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-dark-300 mb-3">Accent Color</h3>
                  <div className="flex gap-3 flex-wrap">
                    {[
                      { color: '#6366f1', label: 'Indigo' },
                      { color: '#8b5cf6', label: 'Purple' },
                      { color: '#ec4899', label: 'Pink' },
                      { color: '#3b82f6', label: 'Blue' },
                      { color: '#22c55e', label: 'Green' },
                      { color: '#f97316', label: 'Orange' },
                    ].map((c) => (
                      <button
                        key={c.color}
                        onClick={() => toast(`${c.label} theme coming soon!`, { icon: '🎨' })}
                        className="flex flex-col items-center gap-1"
                      >
                        <div
                          className="w-8 h-8 rounded-full ring-2 ring-offset-2 ring-offset-dark-900 ring-transparent hover:ring-white transition-all"
                          style={{ background: c.color }}
                        />
                        <span className="text-[10px] text-dark-500">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-dark-300 mb-3">Sidebar Default State</h3>
                  <div className="flex gap-3">
                    {['Expanded', 'Collapsed'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => toast.success(`Sidebar will default to ${opt}`)}
                        className={cn(
                          'px-4 py-2 rounded-xl text-sm border transition-all',
                          opt === 'Expanded'
                            ? 'bg-primary-600/20 border-primary-600/50 text-primary-400'
                            : 'bg-dark-800 border-dark-700 text-dark-400'
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
