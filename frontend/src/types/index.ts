// Global type definitions for NexusFlow AI

export type Role = 'ADMIN' | 'MEMBER' | 'VIEWER';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_COMMENT'
  | 'TASK_DUE'
  | 'WORKSPACE_INVITE'
  | 'MENTION'
  | 'AI_REMINDER'
  | 'TASK_COMPLETED'
  | 'TASK_MOVED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  createdAt: string;
  _count?: { assignedTasks: number; ownedWorkspaces: number };
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  slug: string;
  color: string;
  icon: string;
  ownerId: string;
  owner: Pick<User, 'id' | 'name' | 'avatar'>;
  members: WorkspaceMember[];
  boards: Board[];
  activityLogs?: ActivityLog[];
  _count?: { boards: number; members: number };
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: Role;
  user: Pick<User, 'id' | 'name' | 'avatar' | 'email'>;
  joinedAt: string;
}

export interface Board {
  id: string;
  title: string;
  description?: string;
  workspaceId: string;
  workspace?: Workspace;
  tasks: Task[];
  _count?: { tasks: number };
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  position: number;
  labels: string[];
  boardId: string;
  board?: Board;
  assigneeId?: string;
  assignee?: Pick<User, 'id' | 'name' | 'avatar' | 'email'>;
  creatorId: string;
  creator?: Pick<User, 'id' | 'name' | 'avatar'>;
  comments?: Comment[];
  files?: FileAttachment[];
  _count?: { comments: number; files: number };
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  message: string;
  taskId: string;
  userId: string;
  user: Pick<User, 'id' | 'name' | 'avatar'>;
  createdAt: string;
  updatedAt: string;
}

export interface FileAttachment {
  id: string;
  filename: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  taskId: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  userId: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  description?: string;
  metadata?: Record<string, unknown>;
  workspaceId: string;
  userId: string;
  user: Pick<User, 'id' | 'name' | 'avatar'>;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { message: string; details?: unknown };
  message?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AnalyticsSummary {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  myAssignedTasks: number;
  workspaceCount: number;
  completionRate: number;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  charts: {
    tasksByStatus: { status: string; count: number }[];
    tasksByPriority: { priority: string; count: number }[];
    completedPerDay: { date: string; count: number }[];
    createdPerWeek: { week: string; count: number }[];
  };
  topContributors: { user: Pick<User, 'id' | 'name' | 'avatar'>; completedTasks: number }[];
  recentActivity: ActivityLog[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  color: string;
  tasks: Task[];
}

export interface OnlineUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface SocketTypingEvent {
  user: Pick<User, 'id' | 'name' | 'avatar'>;
  taskId: string;
  isTyping: boolean;
}
