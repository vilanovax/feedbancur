"use client";

import { RefObject } from "react";
import { Session } from "next-auth";
import { ChevronDown } from "lucide-react";
import { UserStatus } from "@/lib/hooks/useStatusChange";

interface SidebarHeaderProps {
  session: Session | null;
  currentStatus: UserStatus | null;
  userStatuses: UserStatus[];
  statusMenuOpen: boolean;
  statusLoading: boolean;
  statusMenuRef: RefObject<HTMLDivElement | null>;
  onStatusMenuToggle: () => void;
  onStatusChange: (status: UserStatus | null) => void;
}

export default function SidebarHeader({
  session,
  currentStatus,
  userStatuses,
  statusMenuOpen,
  statusLoading,
  statusMenuRef,
  onStatusMenuToggle,
  onStatusChange,
}: SidebarHeaderProps) {
  return (
    <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-blue-600 to-blue-700">
      <h2 className="text-2xl font-bold text-white mb-1">سیستم فیدبک</h2>
      {session?.user && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-white">{session.user.name}</p>
          <p className="text-xs text-blue-100 mt-1">{session.user.mobile}</p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full border border-white/30">
              {session.user.role === "ADMIN"
                ? "مدیرعامل"
                : session.user.role === "MANAGER"
                ? "مدیر"
                : "کارمند"}
            </span>

            {/* Status Selector */}
            <div className="relative" ref={statusMenuRef}>
              <button
                onClick={onStatusMenuToggle}
                disabled={statusLoading}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  currentStatus
                    ? "text-white border-white/30"
                    : "bg-white/10 text-white/80 border-white/20 hover:bg-white/20"
                }`}
                style={currentStatus ? { backgroundColor: currentStatus.color } : {}}
              >
                {statusLoading ? (
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        currentStatus ? "bg-white" : "bg-white/50"
                      }`}
                    ></span>
                    <span>{currentStatus?.name || "استتوس"}</span>
                    <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>

              {/* Status Dropdown */}
              {statusMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                    انتخاب استتوس
                  </div>

                  {/* بدون استتوس */}
                  <button
                    onClick={() => onStatusChange(null)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition ${
                      !currentStatus ? "bg-blue-50 dark:bg-blue-900/20" : ""
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                    <span className="text-gray-700 dark:text-gray-300">بدون استتوس</span>
                    {!currentStatus && <span className="mr-auto text-blue-600">✓</span>}
                  </button>

                  {/* لیست استتوس‌ها */}
                  {userStatuses.map((status) => (
                    <button
                      key={status.id}
                      onClick={() => onStatusChange(status)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition ${
                        currentStatus?.id === status.id
                          ? "bg-blue-50 dark:bg-blue-900/20"
                          : ""
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: status.color }}
                      ></span>
                      <span className="text-gray-700 dark:text-gray-300">{status.name}</span>
                      {currentStatus?.id === status.id && (
                        <span className="mr-auto text-blue-600">✓</span>
                      )}
                    </button>
                  ))}

                  {userStatuses.length === 0 && (
                    <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                      استتوسی تعریف نشده
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
