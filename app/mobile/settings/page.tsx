"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MobileLayout from "@/components/MobileLayout";
import { User, Bell, Lock, Moon, Sun, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

export default function MobileSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // بررسی حالت تاریک هنگام لود
  useEffect(() => {
    const darkMode = localStorage.getItem("darkMode") === "true" ||
      document.documentElement.classList.contains("dark");
    setIsDarkMode(darkMode);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem("darkMode", String(newDarkMode));
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    toast.success(newDarkMode ? "حالت تاریک فعال شد" : "حالت روشن فعال شد");
  };

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
              <button
                onClick={() => router.push("/mobile/profile/edit")}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-800 dark:text-white">اطلاعات شخصی</span>
                </div>
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
              <button
                onClick={() => router.push("/mobile/change-password")}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-800 dark:text-white">تغییر رمز عبور</span>
                </div>
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              تنظیمات اعلانات
            </h4>
            <div className="space-y-2">
              <button
                onClick={() => router.push("/mobile/announcements")}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-800 dark:text-white">اعلانات</span>
                </div>
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              تنظیمات نمایش
            </h4>
            <div className="space-y-2">
              <button
                onClick={toggleDarkMode}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <div className="flex items-center gap-3">
                  {isDarkMode ? (
                    <Sun className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  )}
                  <span className="text-gray-800 dark:text-white">
                    {isDarkMode ? "حالت روشن" : "حالت تاریک"}
                  </span>
                </div>
                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isDarkMode ? "bg-blue-600" : "bg-gray-300"}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isDarkMode ? "translate-x-6" : "translate-x-0"}`}></div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}

