"use client";

import { BarChart3, Users, Star, MessageSquare } from "lucide-react";

interface PollResultsProps {
  results: any;
  stats: any;
  pollType: string;
}

export default function PollResults({ results, stats, pollType }: PollResultsProps) {
  if (!results || !stats) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={24} className="text-blue-600 dark:text-blue-400" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          نتایج نظرسنجی
        </h2>
      </div>

      {/* آمار کلی */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <Users size={20} className="text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-blue-600 dark:text-blue-400">کل افراد</span>
          </div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
            {stats.totalTargetUsers}
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <Users size={20} className="text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-600 dark:text-green-400">شرکت کردند</span>
          </div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-300">
            {stats.totalResponses}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2 mb-2">
            <Users size={20} className="text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">شرکت نکردند</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-300">
            {stats.totalNotResponded}
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={20} className="text-purple-600 dark:text-purple-400" />
            <span className="text-sm text-purple-600 dark:text-purple-400">نرخ مشارکت</span>
          </div>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-300">
            {stats.responseRate}%
          </div>
        </div>
      </div>

      {/* نتایج بر اساس نوع نظرسنجی */}
      {(pollType === "SINGLE_CHOICE" || pollType === "MULTIPLE_CHOICE") && results.options && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
            نتایج گزینه‌ها:
          </h3>
          {results.options.map((option: any) => (
            <div key={option.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-800 dark:text-white font-medium">
                  {option.text}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {option.voteCount} رای
                  </span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {option.percentage}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${option.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {pollType === "RATING_SCALE" && results.average !== undefined && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <Star size={32} className="text-yellow-500" fill="currentColor" />
            <div>
              <div className="text-sm text-yellow-700 dark:text-yellow-400">
                میانگین امتیاز
              </div>
              <div className="text-3xl font-bold text-yellow-900 dark:text-yellow-300">
                {results.average.toFixed(2)}
              </div>
            </div>
          </div>

          <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
            توزیع امتیازها:
          </h3>
          {results.distribution && results.distribution.map((item: any) => (
            <div key={item.rating} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-yellow-500" fill="currentColor" />
                  <span className="text-gray-800 dark:text-white font-medium">
                    {item.rating} ستاره
                  </span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {item.count} رای
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${results.totalRatings > 0 ? (item.count / results.totalRatings) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {pollType === "TEXT_INPUT" && results.textResponses && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={20} className="text-gray-600 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-800 dark:text-white">
              پاسخ‌های دریافتی: ({results.textResponses.length})
            </h3>
          </div>
          {results.textResponses.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              هنوز پاسخی ثبت نشده است
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.textResponses.map((response: any) => (
                <div
                  key={response.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  {response.user && (
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {response.user.name}
                    </div>
                  )}
                  <p className="text-gray-800 dark:text-white whitespace-pre-wrap">
                    {response.textValue}
                  </p>
                  {response.comment && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
                      توضیحات: {response.comment}
                    </p>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {new Date(response.createdAt).toLocaleDateString("fa-IR", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
