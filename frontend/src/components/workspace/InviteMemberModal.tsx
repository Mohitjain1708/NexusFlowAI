import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { X, UserPlus, Mail, Loader2 } from 'lucide-react';
import api from '@/services/api';
import toast from 'react-hot-toast';

interface InviteMemberModalProps {
  workspaceId: string;
  onClose: () => void;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ workspaceId, onClose }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'MEMBER' | 'VIEWER'>('MEMBER');

  const inviteMutation = useMutation({
    mutationFn: async () => api.post(`/workspaces/${workspaceId}/invite`, { email, role }),
    onSuccess: () => {
      toast.success(`Invitation sent to ${email}`);
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to invite member'),
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-dark-900 border border-dark-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-dark-50 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary-400" /> Invite Member
          </h2>
          <button onClick={onClose} className="p-1.5 text-dark-500 hover:text-dark-200 hover:bg-dark-800 rounded-lg transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="colleague@company.com"
                className="input pl-9"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {(['MEMBER', 'VIEWER'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all text-left ${
                    role === r
                      ? 'bg-primary-600/20 border-primary-600/50 text-primary-400'
                      : 'bg-dark-800 border-dark-700 text-dark-400 hover:border-dark-600'
                  }`}
                >
                  <div className="font-semibold">{r}</div>
                  <div className="text-xs opacity-70 mt-0.5">
                    {r === 'MEMBER' ? 'Can create & edit tasks' : 'Can view only'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={() => inviteMutation.mutate()}
            disabled={!email.trim() || inviteMutation.isPending}
            className="btn-primary flex-1"
          >
            {inviteMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Inviting...</>
            ) : (
              <><UserPlus className="w-4 h-4" />Send Invite</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default InviteMemberModal;
