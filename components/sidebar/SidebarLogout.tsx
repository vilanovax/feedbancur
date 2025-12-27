"use client";

import { memo } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

function SidebarLogout() {
  return (
    <div className="p-4 border-t border-gray-200 bg-gray-50/50">
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:shadow-sm font-medium"
      >
        <LogOut className="w-5 h-5" />
        <span>خروج</span>
      </button>
    </div>
  );
}

export default memo(SidebarLogout);
