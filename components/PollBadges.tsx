import { CheckSquare, Square, Star, MessageSquare, Eye, EyeOff, Clock, Lock } from 'lucide-react';

interface TypeBadgeProps {
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'RATING_SCALE' | 'TEXT_INPUT';
  size?: 'sm' | 'md';
}

export function TypeBadge({ type, size = 'md' }: TypeBadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1';

  const config = {
    SINGLE_CHOICE: {
      icon: CheckSquare,
      label: 'تک‌انتخابی',
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    },
    MULTIPLE_CHOICE: {
      icon: Square,
      label: 'چندانتخابی',
      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    },
    RATING_SCALE: {
      icon: Star,
      label: 'امتیازدهی',
      color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    },
    TEXT_INPUT: {
      icon: MessageSquare,
      label: 'متن آزاد',
      color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800',
    },
  };

  const { icon: Icon, label, color } = config[type];

  return (
    <span className={`inline-flex items-center gap-1 ${sizeClasses} font-medium rounded-full border ${color}`}>
      <Icon size={size === 'sm' ? 12 : 14} />
      {label}
    </span>
  );
}

interface VisibilityBadgeProps {
  mode: 'ANONYMOUS' | 'PUBLIC';
  size?: 'sm' | 'md';
}

export function VisibilityBadge({ mode, size = 'md' }: VisibilityBadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1';

  if (mode === 'ANONYMOUS') {
    return (
      <span className={`inline-flex items-center gap-1 ${sizeClasses} font-medium rounded-full border bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700`}>
        <EyeOff size={size === 'sm' ? 12 : 14} />
        مخفی
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 ${sizeClasses} font-medium rounded-full border bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800`}>
      <Eye size={size === 'sm' ? 12 : 14} />
      عمومی
    </span>
  );
}

interface StatusBadgeProps {
  poll: {
    isActive: boolean;
    scheduledAt?: string | Date | null;
    closedAt?: string | Date | null;
  };
  size?: 'sm' | 'md';
}

export function StatusBadge({ poll, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1';

  // بررسی زمان‌بندی
  if (poll.scheduledAt && new Date(poll.scheduledAt) > new Date()) {
    return (
      <span className={`inline-flex items-center gap-1 ${sizeClasses} font-medium rounded-full border bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800`}>
        <Clock size={size === 'sm' ? 12 : 14} />
        زمان‌بندی شده
      </span>
    );
  }

  // بررسی بسته شدن
  if (poll.closedAt && new Date(poll.closedAt) < new Date()) {
    return (
      <span className={`inline-flex items-center gap-1 ${sizeClasses} font-medium rounded-full border bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800`}>
        <Lock size={size === 'sm' ? 12 : 14} />
        بسته شده
      </span>
    );
  }

  // فعال یا غیرفعال
  if (poll.isActive) {
    return (
      <span className={`${sizeClasses} font-medium rounded-full border bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800`}>
        فعال
      </span>
    );
  }

  return (
    <span className={`${sizeClasses} font-medium rounded-full border bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700`}>
      غیرفعال
    </span>
  );
}
