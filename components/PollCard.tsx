import { CheckCircle, Users, Calendar } from 'lucide-react';
import { TypeBadge, VisibilityBadge, StatusBadge } from './PollBadges';

interface PollCardProps {
  poll: {
    id: string;
    title: string;
    description?: string | null;
    type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'RATING_SCALE' | 'TEXT_INPUT';
    visibilityMode: 'ANONYMOUS' | 'PUBLIC';
    isActive: boolean;
    isRequired?: boolean;
    scheduledAt?: string | Date | null;
    closedAt?: string | Date | null;
    createdAt: string | Date;
    createdBy: {
      id: string;
      name: string;
      role: string;
    };
    department?: {
      id: string;
      name: string;
    } | null;
    _count?: {
      responses: number;
    };
  };
  hasVoted?: boolean;
  onClick?: () => void;
}

export default function PollCard({ poll, hasVoted, onClick }: PollCardProps) {
  const isClosed = poll.closedAt && new Date(poll.closedAt) < new Date();
  const isScheduled = poll.scheduledAt && new Date(poll.scheduledAt) > new Date();

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-200 dark:border-gray-700 p-4 ${
        isClosed ? 'opacity-75' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
            {poll.title}
          </h3>
          {poll.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {poll.description}
            </p>
          )}
        </div>
        {hasVoted && (
          <div className="mr-2 flex-shrink-0">
            <CheckCircle size={24} className="text-green-500" />
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <TypeBadge type={poll.type} size="sm" />
        <VisibilityBadge mode={poll.visibilityMode} size="sm" />
        <StatusBadge poll={poll} size="sm" />
        {poll.isRequired && (
          <span className="text-xs px-2 py-1 font-medium rounded-full border bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 border-orange-200 dark:border-orange-800">
            اجباری
          </span>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-4">
          {poll._count && poll.visibilityMode === 'PUBLIC' && (
            <div className="flex items-center gap-1">
              <Users size={14} />
              <span>{poll._count.responses} رای</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            <span>{new Date(poll.createdAt).toLocaleDateString('fa-IR')}</span>
          </div>
        </div>
        <div className="text-left">
          {poll.department ? (
            <span className="font-medium">{poll.department.name}</span>
          ) : (
            <span className="font-medium text-blue-600 dark:text-blue-400">همه شرکت</span>
          )}
        </div>
      </div>

      {/* Closing Date Alert */}
      {poll.closedAt && !isClosed && (
        <div className="mt-2 text-xs text-orange-600 dark:text-orange-400">
          پایان: {new Date(poll.closedAt).toLocaleDateString('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      )}
    </div>
  );
}
