"use client";

import { useState, useEffect } from "react";
import { Trophy, Star, Clock } from "lucide-react";

interface Performer {
  id: string;
  name: string;
  avatar: string | null;
  completedCount: number;
  avgRating: number;
  avgResponseHours: number;
}

export default function TopPerformersWidget() {
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopPerformers();
  }, []);

  const fetchTopPerformers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/dashboard/top-performers");
      if (response.ok) {
        const data = await response.json();
        setPerformers(data);
      }
    } catch (error) {
      console.error("Error fetching top performers:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalColor = (index: number) => {
    switch (index) {
      case 0:
        return "text-yellow-500"; // طلایی
      case 1:
        return "text-gray-400"; // نقره‌ای
      case 2:
        return "text-orange-600"; // برنز
      default:
        return "text-gray-300";
    }
  };

  const formatResponseTime = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} دقیقه`;
    } else if (hours < 24) {
      return `${hours.toFixed(1)} ساعت`;
    } else {
      return `${Math.round(hours / 24)} روز`;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
          <Trophy className="text-yellow-600 dark:text-yellow-400" size={24} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            کارمندان برتر
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            بر اساس تعداد فیدبک تکمیل شده
          </p>
        </div>
      </div>

      {/* Performers List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : performers.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Trophy size={48} className="mx-auto mb-2 opacity-50" />
            <p>هنوز داده‌ای وجود ندارد</p>
          </div>
        ) : (
          performers.map((performer, index) => (
            <div
              key={performer.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              {/* Rank */}
              <div className="flex-shrink-0">
                <Trophy className={`${getMedalColor(index)}`} size={20} />
              </div>

              {/* Avatar */}
              <div className="flex-shrink-0">
                {performer.avatar ? (
                  <img
                    src={performer.avatar}
                    alt={performer.name}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {performer.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {performer.name}
                </h4>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <Trophy size={12} />
                    <span>{performer.completedCount}</span>
                  </div>
                  {performer.avgRating > 0 && (
                    <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                      <Star size={12} fill="currentColor" />
                      <span>{performer.avgRating}</span>
                    </div>
                  )}
                  {performer.avgResponseHours > 0 && (
                    <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                      <Clock size={12} />
                      <span>{formatResponseTime(performer.avgResponseHours)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Score Badge */}
              <div className="flex-shrink-0">
                <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    #{index + 1}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
