import { create } from 'zustand';
import { Workspace, Board, Task, OnlineUser } from '@/types';

interface WorkspaceStore {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  currentBoard: Board | null;
  onlineUsers: OnlineUser[];
  setWorkspaces: (workspaces: Workspace[]) => void;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setCurrentBoard: (board: Board | null) => void;
  addWorkspace: (workspace: Workspace) => void;
  updateWorkspace: (id: string, data: Partial<Workspace>) => void;
  removeWorkspace: (id: string) => void;
  setOnlineUsers: (users: OnlineUser[]) => void;
  updateTaskInBoard: (task: Task) => void;
  addTaskToBoard: (task: Task) => void;
  removeTaskFromBoard: (taskId: string) => void;
  moveTask: (taskId: string, status: Task['status'], position: number) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  workspaces: [],
  currentWorkspace: null,
  currentBoard: null,
  onlineUsers: [],

  setWorkspaces: (workspaces) => set({ workspaces }),
  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
  setCurrentBoard: (board) => set({ currentBoard: board }),

  addWorkspace: (workspace) =>
    set((state) => ({ workspaces: [workspace, ...state.workspaces] })),

  updateWorkspace: (id, data) =>
    set((state) => ({
      workspaces: state.workspaces.map((w) => (w.id === id ? { ...w, ...data } : w)),
      currentWorkspace: state.currentWorkspace?.id === id
        ? { ...state.currentWorkspace, ...data }
        : state.currentWorkspace,
    })),

  removeWorkspace: (id) =>
    set((state) => ({
      workspaces: state.workspaces.filter((w) => w.id !== id),
      currentWorkspace: state.currentWorkspace?.id === id ? null : state.currentWorkspace,
    })),

  setOnlineUsers: (onlineUsers) => set({ onlineUsers }),

  updateTaskInBoard: (task) =>
    set((state) => ({
      currentBoard: state.currentBoard
        ? {
            ...state.currentBoard,
            tasks: state.currentBoard.tasks.map((t) =>
              t.id === task.id ? { ...t, ...task } : t
            ),
          }
        : null,
    })),

  addTaskToBoard: (task) =>
    set((state) => ({
      currentBoard: state.currentBoard
        ? { ...state.currentBoard, tasks: [...state.currentBoard.tasks, task] }
        : null,
    })),

  removeTaskFromBoard: (taskId) =>
    set((state) => ({
      currentBoard: state.currentBoard
        ? {
            ...state.currentBoard,
            tasks: state.currentBoard.tasks.filter((t) => t.id !== taskId),
          }
        : null,
    })),

  moveTask: (taskId, status, position) =>
    set((state) => ({
      currentBoard: state.currentBoard
        ? {
            ...state.currentBoard,
            tasks: state.currentBoard.tasks.map((t) =>
              t.id === taskId ? { ...t, status, position } : t
            ),
          }
        : null,
    })),
}));
