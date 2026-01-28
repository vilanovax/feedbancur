"use client";

import { useEffect, useState } from "react";
import {
  Database,
  MessageSquare,
  HardDrive,
  Building2,
  FolderOpen,
  FileText,
  TrendingUp
} from "lucide-react";

interface UsageStats {
  messages: {
    total: number;
    totalFileSize: number;
  };
  departments: Array<{
    id: string;
    name: string;
    userCount: number;
    feedbackCount: number;
  }>;
  projects: Array<{
    id: string;
    name: string;
    fileCount: number;
    totalSize: number;
  }>;
  summary: {
    totalFileSize: number;
    totalFileCount: number;
    totalFeedbacks: number;
    totalMessages: number;
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function UsageStatsWidget() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "departments" | "projects">("overview");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/usage-stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching usage stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            آمار استفاده از منابع
          </h3>
        </div>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          در حال بارگذاری...
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const maxDeptFeedbacks = Math.max(...stats.departments.map((d) => d.feedbackCount), 1);
  const maxProjectSize = Math.max(...stats.projects.map((p) => p.totalSize), 1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            آمار استفاده از منابع
          </h3>
        </div>
        <button
          onClick={fetchStats}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          بروزرسانی
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "overview"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
          }`}
        >
          خلاصه
        </button>
        <button
          onClick={() => setActiveTab("departments")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "departments"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
          }`}
        >
          بخش‌ها
        </button>
        <button
          onClick={() => setActiveTab("projects")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "projects"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
          }`}
        >
          پروژه‌ها
        </button>
      </div>

      {/* Content */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">پیام‌ها</span>
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {stats.summary.totalMessages.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatBytes(stats.messages.totalFileSize)} فایل
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">فیدبک‌ها</span>
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {stats.summary.totalFeedbacks.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                کل فیدبک‌های ثبت شده
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">حجم فایل‌ها</span>
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {formatBytes(stats.summary.totalFileSize)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats.summary.totalFileCount.toLocaleString()} فایل
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">رشد</span>
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {stats.departments.length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                بخش فعال
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "departments" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              فیدبک‌های هر بخش
            </h4>
          </div>
          {stats.departments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
              هیچ داده‌ای یافت نشد
            </div>
          ) : (
            stats.departments
              .sort((a, b) => b.feedbackCount - a.feedbackCount)
              .map((dept) => (
                <div key={dept.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300 truncate flex-1">
                      {dept.name}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      {dept.feedbackCount} فیدبک
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${(dept.feedbackCount / maxDeptFeedbacks) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {dept.userCount} کاربر
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {activeTab === "projects" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              حجم فایل‌های پروژه‌ها
            </h4>
          </div>
          {stats.projects.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
              هیچ پروژه‌ای یافت نشد
            </div>
          ) : (
            stats.projects
              .sort((a, b) => b.totalSize - a.totalSize)
              .map((project) => (
                <div key={project.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300 truncate flex-1">
                      {project.name}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      {formatBytes(project.totalSize)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${(project.totalSize / maxProjectSize) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {project.fileCount} فایل
                  </div>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
}
