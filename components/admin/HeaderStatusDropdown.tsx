"use client";

import { RefObject } from "react";
import { User, ChevronDown, Edit, LogOut } from "lucide-react";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserStatus } from "@/lib/hooks/useStatusChange";

interface HeaderStatusDropdownProps {
  session: Session;
  currentStatus: UserStatus | null;
  userStatuses: UserStatus[];
  statusMenuOpen: boolean;
  statusLoading: boolean;
  statusMenuRef: RefObject<HTMLDivElement | null>;
  onToggle: () => void;
  onStatusChange: (status: UserStatus | null) => void;
  onClose: () => void;
}

export default function HeaderStatusDropdown({
  session,
  currentStatus,
  userStatuses,
  statusMenuOpen,
  statusLoading,
  statusMenuRef,
  onToggle,
  onStatusChange,
  onClose,
}: HeaderStatusDropdownProps) {
  const router = useRouter();

  return (
    <div className="relative" ref={statusMenuRef}>
      <button
        onClick={onToggle}
        disabled={statusLoading}
        className="flex items-center gap-2 p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="پروفایل و وضعیت"
      >
        <User size={20} />
        {currentStatus && (
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: currentStatus.color }}
          ></span>
        )}
        <ChevronDown size={16} className={statusMenuOpen ? "rotate-180" : ""} />
      </button>

      {statusMenuOpen && (
        <div className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {session.user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {session.user.role === "ADMIN"
                    ? "مدیرعامل"
                    : session.user.role === "MANAGER"
                    ? "مدیر"
                    : "کارمند"}
                </p>
              </div>
            </div>
          </div>

          <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
            انتخاب استتوس
          </div>

          {/* بدون استتوس */}
          <button
            onClick={() => onStatusChange(null)}
            disabled={statusLoading}
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
              disabled={statusLoading}
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

          {/* Separator */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

          {/* ویرایش اطلاعات */}
          <button
            onClick={() => {
              onClose();
              router.push("/users");
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <Edit className="w-4 h-4" />
            <span>ویرایش اطلاعات</span>
          </button>

          {/* خروج */}
          <button
            onClick={() => {
              onClose();
              signOut({ callbackUrl: "/login" });
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج</span>
          </button>
        </div>
      )}
    </div>
  );
}
