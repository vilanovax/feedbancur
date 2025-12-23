"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface MobileBottomNavProps {
  items: NavItem[];
  isActive: (path: string) => boolean;
  hasNewAnnouncements: boolean;
  hasAssignedTasks: boolean;
  role: "EMPLOYEE" | "MANAGER";
}

export default function MobileBottomNav({
  items,
  isActive,
  hasNewAnnouncements,
  hasAssignedTasks,
  role,
}: MobileBottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-30">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isAnnouncements = item.href === "/mobile/announcements";
          const isTasks = item.href === "/mobile/manager/tasks";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition ${
                isActive(item.href)
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {isAnnouncements && hasNewAnnouncements && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                )}
                {isTasks && hasAssignedTasks && role === "MANAGER" && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                )}
              </div>
              <span className="text-xs">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
