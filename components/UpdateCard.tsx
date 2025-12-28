"use client";

import { memo } from "react";
import {
  Sparkles,
  Bug,
  TrendingUp,
  Newspaper,
  CheckCircle,
  Calendar,
  User,
  ImageIcon,
} from "lucide-react";
import { UpdateCategory } from "@prisma/client";
import Image from "next/image";

interface UpdateCardProps {
  update: {
    id: string;
    title: string;
    summary?: string | null;
    content: string;
    category: UpdateCategory;
    source: string;
    tags: string[];
    imageUrl?: string | null;
    publishedAt: string | null;
    createdAt: string;
    createdBy?: {
      id: string;
      name: string;
    } | null;
    feedback?: {
      id: string;
      title: string;
    } | null;
  };
  onClick?: () => void;
  compact?: boolean;
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

function UpdateCardComponent({ update, onClick, compact = false }: UpdateCardProps) {
  const config = categoryConfig[update.category] || categoryConfig.NEWS;
  const Icon = config.icon;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  const displayContent = update.summary || update.content;
  const truncatedContent =
    displayContent.length > (compact ? 80 : 150)
      ? displayContent.substring(0, compact ? 80 : 150) + "..."
      : displayContent;

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700
        ${onClick ? "cursor-pointer hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all" : ""}
        ${compact ? "p-3" : "p-4"}`}
    >
      {/* تصویر - اگر وجود داشته باشد */}
      {!compact && update.imageUrl && (
        <div className="relative w-full h-40 mb-3 rounded-lg overflow-hidden">
          <Image
            src={update.imageUrl}
            alt={update.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* آیکون دسته‌بندی */}
        <div className={`${config.bgColor} rounded-lg p-2 flex-shrink-0`}>
          <Icon className={`${config.color} ${compact ? "w-4 h-4" : "w-5 h-5"}`} />
        </div>

        <div className="flex-1 min-w-0">
          {/* عنوان */}
          <h3
            className={`font-semibold text-gray-900 dark:text-white ${compact ? "text-sm" : "text-base"} line-clamp-1`}
          >
            {update.title}
          </h3>

          {/* محتوا/خلاصه */}
          <p
            className={`text-gray-600 dark:text-gray-300 mt-1 ${compact ? "text-xs" : "text-sm"} line-clamp-2`}
          >
            {truncatedContent}
          </p>

          {/* تگ‌ها */}
          {!compact && Array.isArray(update.tags) && update.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {update.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                >
                  {tag}
                </span>
              ))}
              {update.tags.length > 3 && (
                <span className="text-xs text-gray-500">+{update.tags.length - 3}</span>
              )}
            </div>
          )}

          {/* اطلاعات پایین */}
          <div
            className={`flex items-center gap-3 ${compact ? "mt-1" : "mt-3"} text-xs text-gray-500 dark:text-gray-400`}
          >
            {/* دسته‌بندی */}
            <span className={`${config.color} font-medium`}>{config.label}</span>

            {/* تاریخ */}
            {update.publishedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(update.publishedAt)}
              </span>
            )}

            {/* ایجادکننده */}
            {!compact && update.createdBy && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {update.createdBy.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const UpdateCard = memo(UpdateCardComponent);
