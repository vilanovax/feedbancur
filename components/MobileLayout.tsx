"use client";

import { ReactNode, useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Home,
  MessageSquare,
  CheckSquare,
  Bell,
  Trophy,
  Menu,
  X,
  LogOut,
  User,
  Send,
  ArrowRight,
  Settings,
  Edit,
} from "lucide-react";

interface MobileLayoutProps {
  children: ReactNode;
  role: "EMPLOYEE" | "MANAGER";
  title?: string;
  showBackButton?: boolean;
  backHref?: string;
}

export default function MobileLayout({ 
  children, 
  role, 
  title,
  showBackButton,
  backHref 
}: MobileLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [hasNewAnnouncements, setHasNewAnnouncements] = useState(false);

  const isActive = (path: string) => pathname === path;
  
  // تشخیص صفحه اصلی
  const homePath = role === "EMPLOYEE" ? "/mobile/employee" : "/mobile/manager";
  const isHomePage = pathname === homePath;
  
  // نمایش دکمه بازگشت اگر در صفحه اصلی نیستیم یا به صورت صریح درخواست شده باشد
  const shouldShowBack = showBackButton !== undefined 
    ? showBackButton 
    : !isHomePage;
  
  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.push(homePath);
    }
  };

  // بررسی اعلان‌های جدید
  useEffect(() => {
    const checkNewAnnouncements = async () => {
      try {
        const res = await fetch("/api/announcements");
        if (res.ok) {
          const announcements = await res.json();
          // اعلان‌های 24 ساعت گذشته را به عنوان جدید در نظر می‌گیریم
          const oneDayAgo = new Date();
          oneDayAgo.setHours(oneDayAgo.getHours() - 24);
          
          const newAnnouncements = announcements.filter((announcement: any) => {
            const announcementDate = new Date(announcement.createdAt);
            return announcementDate > oneDayAgo && announcement.isActive;
          });
          
          setHasNewAnnouncements(newAnnouncements.length > 0);
        }
      } catch (error) {
        console.error("Error checking new announcements:", error);
      }
    };

    if (session) {
      checkNewAnnouncements();
      // بررسی هر 5 دقیقه یکبار
      const interval = setInterval(checkNewAnnouncements, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const navItems = [
    {
      name: "داشبورد",
      href: role === "EMPLOYEE" ? "/mobile/employee" : "/mobile/manager",
      icon: Home,
    },
    {
      name: "ثبت فیدبک",
      href: "/mobile/feedback/new",
      icon: MessageSquare,
    },
    {
      name: "فیدبک‌های من",
      href: "/mobile/feedback",
      icon: MessageSquare,
    },
    ...(role === "MANAGER"
      ? [
          {
            name: "تسک‌ها",
            href: "/mobile/manager/tasks",
            icon: CheckSquare,
          },
        ]
      : []),
    {
      name: "اعلانات",
      href: "/mobile/announcements",
      icon: Bell,
    },
    {
      name: "بورد افتخارات",
      href: "/mobile/public-board",
      icon: Trophy,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            {shouldShowBack && (
              <button
                onClick={handleBack}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="بازگشت"
              >
                <ArrowRight className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </button>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="منو"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              )}
            </button>
          </div>
          <h1 className="text-lg font-bold text-gray-800 dark:text-white flex-1 text-center">
            {title || (role === "EMPLOYEE" ? "پنل کارمند" : "پنل مدیر")}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/mobile/settings")}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="تنظیمات"
            >
              <Settings className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="پروفایل"
              >
                <User className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </button>
              {showProfileMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div className="absolute left-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3 mb-2">
                        {(session?.user as any)?.avatar ? (
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={(session?.user as any)?.avatar}
                              alt="پروفایل"
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 dark:text-white text-sm">
                            {session?.user?.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {session?.user?.mobile}
                          </p>
                        </div>
                      </div>
                      <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                        {role === "EMPLOYEE" ? "کارمند" : "مدیر"}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        router.push("/mobile/profile/edit");
                      }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      <span>ویرایش اطلاعات</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        signOut({ callbackUrl: "/login" });
                      }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition text-sm"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>خروج</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl z-50 overflow-y-auto">
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
                    {session?.user?.mobile}
                  </p>
                </div>
              </div>
              <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                {role === "EMPLOYEE" ? "کارمند" : "مدیر"}
              </span>
            </div>
            <nav className="p-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
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
      )}

      {/* Main Content */}
      <main className="px-4 py-4">{children}</main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-30">
        <div className="flex items-center justify-around px-2 py-2">
          {[
            navItems[0], // داشبورد
            role === "MANAGER"
              ? navItems.find((item) => item.href === "/mobile/manager/tasks") || {
                  name: "تسک‌ها",
                  href: "/mobile/manager/tasks",
                  icon: CheckSquare,
                }
              : navItems[1], // ثبت فیدبک (برای کارمند)
            navItems[2], // فیدبک‌های من
            role === "MANAGER"
              ? {
                  name: "اعلانات",
                  href: "/mobile/announcements",
                  icon: Bell,
                }
              : {
                  name: "اعلانات",
                  href: "/mobile/announcements",
                  icon: Bell,
                },
          ].map((item) => {
            const Icon = item.icon;
            const isAnnouncements = item.href === "/mobile/announcements";
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
                </div>
                <span className="text-xs">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

