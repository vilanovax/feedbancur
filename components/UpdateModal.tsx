"use client";

import { memo } from "react";
import {
  X,
  Sparkles,
  Bug,
  TrendingUp,
  Newspaper,
  CheckCircle,
  Calendar,
  User,
  Link as LinkIcon,
  ExternalLink,
} from "lucide-react";
import { UpdateCategory } from "@prisma/client";
import Link from "next/link";
import Image from "next/image";

interface UpdateModalProps {
  update: {
    id: string;
    title: string;
    summary?: string | null;
    content: string;
    category: UpdateCategory;
    source: string;
    tags: string[];
    imageUrl?: string | null;
    isDraft?: boolean;
    isPublished?: boolean;
    publishedAt: string | null;
    createdAt: string;
    createdBy?: {
      id: string;
      name: string;
    } | null;
    feedback?: {
      id: string;
      title: string;
      content?: string;
      type?: string;
    } | null;
  };
  onClose: () => void;
}

const categoryConfig: Record<
  UpdateCategory,
  { icon: typeof Sparkles; color: string; bgColor: string; label: string }
> = {
  FEATURE: {
    icon: Sparkles,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    label: "قابلیت جدید",
  },
  BUG_FIX: {
    icon: Bug,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    label: "رفع مشکل",
  },
  IMPROVEMENT: {
    icon: TrendingUp,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    label: "بهبود",
  },
  NEWS: {
    icon: Newspaper,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    label: "خبر",
  },
  FEEDBACK_COMPLETED: {
    icon: CheckCircle,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    label: "فیدبک تکمیل شده",
  },
};

const sourceLabels: Record<string, string> = {
  AUTOMATIC: "خودکار",
  MANUAL: "دستی",
  SYSTEM: "سیستمی",
};

function UpdateModalComponent({ update, onClose }: UpdateModalProps) {
  const config = categoryConfig[update.category] || categoryConfig.NEWS;
  const Icon = config.icon;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${config.bgColor} p-4 flex items-start gap-3`}>
          <div className={`${config.bgColor} rounded-lg p-2`}>
            <Icon className={`${config.color} w-6 h-6`} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {update.title}
            </h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
              <span className={`${config.color} font-medium`}>{config.label}</span>
              <span>•</span>
              <span>{sourceLabels[update.source] || update.source}</span>
              {update.isDraft && (
                <>
                  <span>•</span>
                  <span className="text-orange-600 dark:text-orange-400 font-medium">
                    پیش‌نویس
                  </span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {/* تصویر - اگر وجود داشته باشد */}
          {update.imageUrl && (
            <div className="relative w-full h-64 mb-4 rounded-lg overflow-hidden">
              <Image
                src={update.imageUrl}
                alt={update.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          {/* خلاصه (اگر وجود داشته باشد) */}
          {update.summary && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-r-4 border-blue-500">
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                {update.summary}
              </p>
            </div>
          )}

          {/* محتوای اصلی */}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {update.content}
            </p>
          </div>

          {/* فیدبک مرتبط */}
          {update.feedback && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 mb-2">
                <LinkIcon className="w-4 h-4" />
                <span className="font-medium">فیدبک مرتبط:</span>
              </div>
              <Link
                href={`/feedback/${update.feedback.id}`}
                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
              >
                <span>{update.feedback.title}</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* تگ‌ها */}
          {Array.isArray(update.tags) && update.tags.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {update.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-sm px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-4">
              {update.createdBy && (
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {update.createdBy.name}
                </span>
              )}
              {update.publishedAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(update.publishedAt)}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              بستن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const UpdateModal = memo(UpdateModalComponent);
