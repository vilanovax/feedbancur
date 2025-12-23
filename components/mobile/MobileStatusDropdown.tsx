"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { User, ChevronDown, Edit, LogOut } from "lucide-react";
import { UserStatus } from "@/lib/hooks/useStatusChange";
import { RefObject } from "react";

interface MobileStatusDropdownProps {
  currentStatus: UserStatus | null;
  userStatuses: UserStatus[];
  statusMenuOpen: boolean;
  statusLoading: boolean;
  statusMenuRef: RefObject<HTMLDivElement | null>;
  onStatusMenuToggle: () => void;
  onStatusChange: (status: UserStatus | null) => void;
}

export default function MobileStatusDropdown({
  currentStatus,
  userStatuses,
  statusMenuOpen,
  statusLoading,
  statusMenuRef,
  onStatusMenuToggle,
  onStatusChange,
}: MobileStatusDropdownProps) {
  const router = useRouter();

  return (
    <div className="relative" ref={statusMenuRef}>
      <button
        onClick={onStatusMenuToggle}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="وضعیت"
      >
        <User className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        {currentStatus && (
          <span
            className="absolute top-1 right-1 w-2 h-2 rounded-full border border-white dark:border-gray-800"
            style={{ backgroundColor: currentStatus.color }}
          ></span>
        )}
        <ChevronDown
          size={14}
          className={`absolute bottom-0 left-0 ${
            statusMenuOpen ? "rotate-180" : ""
          } transition-transform`}
        />
      </button>

      {/* Status Dropdown */}
      {statusMenuOpen && (
        <div className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
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
              <span className="text-gray-700 dark:text-gray-300">
                {status.name}
              </span>
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
              router.push("/mobile/profile/edit");
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <Edit className="w-4 h-4" />
            <span>ویرایش اطلاعات</span>
          </button>

          {/* خروج */}
          <button
            onClick={() => {
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
