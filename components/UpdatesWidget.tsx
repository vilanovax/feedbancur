"use client";

import { useState, memo } from "react";
import Link from "next/link";
import { Newspaper, ChevronLeft, Loader2 } from "lucide-react";
import { useLatestUpdates } from "@/lib/swr/hooks";
import { UpdateCard } from "./UpdateCard";
import { UpdateModal } from "./UpdateModal";

interface Update {
  id: string;
  title: string;
  summary?: string | null;
  content: string;
  category: any;
  source: string;
  tags: string[];
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
}

function UpdatesWidgetComponent() {
  const { data, isLoading, error } = useLatestUpdates(5);
  const [selectedUpdate, setSelectedUpdate] = useState<Update | null>(null);

  const updates: Update[] = data?.data || [];

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-blue-500" />
            اطلاع‌رسانی‌ها
          </h2>
        </div>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-blue-500" />
            اطلاع‌رسانی‌ها
          </h2>
        </div>
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          خطا در بارگذاری اطلاع‌رسانی‌ها
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-blue-500" />
            اطلاع‌رسانی‌ها
          </h2>
          <Link
            href="/updates"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            مشاهده همه
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>

        {updates.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>هنوز اطلاع‌رسانی‌ای وجود ندارد</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {updates.map((update) => (
              <UpdateCard
                key={update.id}
                update={update}
                onClick={() => setSelectedUpdate(update)}
                compact
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedUpdate && (
        <UpdateModal
          update={selectedUpdate}
          onClose={() => setSelectedUpdate(null)}
        />
      )}
    </>
  );
}

export const UpdatesWidget = memo(UpdatesWidgetComponent);
