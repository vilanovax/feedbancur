"use client";

import { memo } from "react";
import { FolderKanban, CheckCircle, Users, MessageSquare } from "lucide-react";

interface ProjectsStatsCardsProps {
  totalProjects: number;
  activeProjects: number;
  totalMembers: number;
  totalFeedbacks: number;
}

const ProjectsStatsCards = memo(function ProjectsStatsCards({
  totalProjects,
  activeProjects,
  totalMembers,
  totalFeedbacks,
}: ProjectsStatsCardsProps) {
  const stats = [
    {
      icon: FolderKanban,
      label: "کل پروژه‌ها",
      value: totalProjects,
      color: "blue",
    },
    {
      icon: CheckCircle,
      label: "پروژه‌های فعال",
      value: activeProjects,
      color: "green",
    },
    {
      icon: Users,
      label: "کل اعضا",
      value: totalMembers,
      color: "purple",
    },
    {
      icon: MessageSquare,
      label: "کل فیدبک‌ها",
      value: totalFeedbacks,
      color: "orange",
    },
  ];

  const colorClasses = {
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                {stat.label}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </p>
            </div>
            <div
              className={`p-3 rounded-lg ${
                colorClasses[stat.color as keyof typeof colorClasses]
              }`}
            >
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

export default ProjectsStatsCards;
