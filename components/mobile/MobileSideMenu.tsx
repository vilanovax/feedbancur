"use client";

import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { User, LogOut, LucideIcon } from "lucide-react";
import { UserStatus } from "@/lib/hooks/useStatusChange";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface MobileSideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session | null;
  role: "EMPLOYEE" | "MANAGER";
  navItems: NavItem[];
  currentStatus: UserStatus | null;
  userStatuses: UserStatus[];
  statusLoading: boolean;
  onStatusChange: (status: UserStatus | null) => void;
  isActive: (path: string) => boolean;
}

export default function MobileSideMenu({
  isOpen,
  onClose,
  session,
  role,
  navItems,
  currentStatus,
  userStatuses,
  statusLoading,
  onStatusChange,
  isActive,
}: MobileSideMenuProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl z-50 overflow-y-auto">
        {/* Profile Section */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            {(session?.user as any)?.avatar ? (
              <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={(session?.user as any)?.avatar}
                  alt="پروفایل"
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-800 dark:text-white">
                {session?.user?.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {(session?.user as any)?.mobile}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
              {role === "EMPLOYEE" ? "کارمند" : "مدیر"}
            </span>
            {/* Status Badge */}
            {currentStatus && (
              <span
                className="inline-block px-2 py-1 text-white text-xs rounded-full"
                style={{ backgroundColor: currentStatus.color }}
              >
                {currentStatus.name}
              </span>
            )}
          </div>

          {/* Status Selector */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              استتوس
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => onStatusChange(null)}
                disabled={statusLoading}
                className={`px-2 py-1 text-xs rounded-full border transition ${
                  !currentStatus
                    ? "bg-gray-200 dark:bg-gray-600 border-gray-400 text-gray-700 dark:text-white"
                    : "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                }`}
              >
                بدون
              </button>
              {userStatuses.map((status) => (
                <button
                  key={status.id}
                  onClick={() => onStatusChange(status)}
                  disabled={statusLoading}
                  className={`px-2 py-1 text-xs rounded-full transition ${
                    currentStatus?.id === status.id
                      ? "ring-2 ring-offset-1 ring-blue-500"
                      : "opacity-80"
                  }`}
                  style={{
                    backgroundColor: status.color,
                    color: "#fff",
                  }}
                >
                  {status.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition ${
                  isActive(item.href)
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">خروج</span>
          </button>
        </div>
      </div>
    </>
  );
}
