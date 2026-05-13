import { format, formatDistanceToNow, isToday, isPast, parseISO } from 'date-fns';

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy');
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy h:mm a');
};

export const formatRelative = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
};

export const isOverdue = (date: string | Date): boolean => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isPast(d) && !isToday(d);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    LOW: 'text-dark-400 bg-dark-700',
    MEDIUM: 'text-yellow-400 bg-yellow-500/20',
    HIGH: 'text-orange-400 bg-orange-500/20',
    URGENT: 'text-red-400 bg-red-500/20',
  };
  return colors[priority] || colors.MEDIUM;
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    TODO: 'text-dark-400 bg-dark-700',
    IN_PROGRESS: 'text-blue-400 bg-blue-500/20',
    REVIEW: 'text-yellow-400 bg-yellow-500/20',
    COMPLETED: 'text-green-400 bg-green-500/20',
  };
  return colors[status] || colors.TODO;
};

export const truncate = (str: string, length: number): string => {
  return str.length > length ? `${str.substring(0, length)}...` : str;
};

export const generateSlug = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
};

export const debounce = <T extends (...args: unknown[]) => unknown>(fn: T, delay: number): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};
