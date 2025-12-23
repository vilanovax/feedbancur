"use client";

import Link from "next/link";
import { Settings, Trash2, MessageCircle, Plus } from "lucide-react";

interface HeaderAdminActionsProps {
  hasTrashItems: boolean;
  hasUnreadMessages: boolean;
}

export default function HeaderAdminActions({
  hasTrashItems,
  hasUnreadMessages,
}: HeaderAdminActionsProps) {
  return (
    <>
      <Link
        href="/feedback/new"
        className="flex items-center justify-center p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="ثبت فیدبک جدید"
      >
        <Plus size={20} />
      </Link>
      <Link
        href="/feedback/with-chat"
        className="relative flex items-center justify-center p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="فیدبک‌های دارای چت"
      >
        <MessageCircle size={20} />
        {hasUnreadMessages && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </Link>
      <Link
        href="/trash"
        className="relative flex items-center justify-center p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="سطل آشغال"
      >
        <Trash2 size={20} />
        {hasTrashItems && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </Link>
      <Link
        href="/settings"
        className="flex items-center justify-center p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="تنظیمات"
      >
        <Settings size={20} />
      </Link>
    </>
  );
}
