"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MobileLayout from "@/components/MobileLayout";
import { User, Bell, Lock, Moon, Sun } from "lucide-react";

export default function MobileSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">در حال بارگذاری...</div>
      </div>
    );
  }

  const role = session?.user?.role === "MANAGER" ? "MANAGER" : "EMPLOYEE";

  return (
    <MobileLayout role={role} title="تنظیمات">
      <div className="space-y-4">
        {/* Profile Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {session?.user?.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {session?.user?.mobile}
              </p>
              <span className="inline-block mt-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                {role === "EMPLOYEE" ? "کارمند" : "مدیر"}
              </span>
            </div>
          </div>
        </div>

        {/* Settings Options */}
        <div className="space-y-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              تنظیمات حساب کاربری
            </h4>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-800 dark:text-white">اطلاعات شخصی</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <Lock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-800 dark:text-white">تغییر رمز عبور</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              تنظیمات اعلانات
            </h4>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-800 dark:text-white">اعلان‌ها</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              تنظیمات نمایش
            </h4>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-800 dark:text-white">حالت تاریک</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}

