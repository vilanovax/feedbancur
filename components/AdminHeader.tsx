"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Settings, Trash2, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";

export default function AppHeader() {
  const { data: session } = useSession();
  const [logoUrl, setLogoUrl] = useState("/logo.png");
  const [hasTrashItems, setHasTrashItems] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  useEffect(() => {
    // بارگذاری لوگو از localStorage یا API
    const savedLogo = localStorage.getItem("appLogo");
    if (savedLogo) {
      setLogoUrl(savedLogo);
    } else {
      // بارگذاری از API فقط برای ADMIN
      if (session?.user?.role === "ADMIN") {
        fetch("/api/settings")
          .then((res) => {
            if (res.ok) {
              return res.json();
            }
            return null;
          })
          .then((data) => {
            if (data?.logoUrl) {
              setLogoUrl(data.logoUrl);
              localStorage.setItem("appLogo", data.logoUrl);
            }
          })
          .catch(() => {
            // استفاده از لوگوی پیش‌فرض
          });
      }
    }
  }, [session]);

  // بررسی وجود آیتم در سطل آشغال
  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      const checkTrash = async () => {
        try {
          const res = await fetch("/api/feedback/trash/count");
          if (res.ok) {
            const data = await res.json();
            setHasTrashItems(data.count > 0);
          }
        } catch (error) {
          console.error("Error checking trash count:", error);
          setHasTrashItems(false);
        }
      };

      checkTrash();
      // بررسی هر 30 ثانیه یکبار
      const interval = setInterval(checkTrash, 30000);
      return () => clearInterval(interval);
    } else {
      setHasTrashItems(false);
    }
  }, [session]);

  // بررسی وجود پیام‌های خوانده نشده
  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      const checkUnreadMessages = async () => {
        try {
          const res = await fetch("/api/feedback/messages/unread-count");
          if (res.ok) {
            const data = await res.json();
            setHasUnreadMessages(data.count > 0);
          }
        } catch (error) {
          console.error("Error checking unread messages:", error);
          setHasUnreadMessages(false);
        }
      };

      checkUnreadMessages();
      // بررسی هر 30 ثانیه یکبار
      const interval = setInterval(checkUnreadMessages, 30000);
      return () => clearInterval(interval);
    } else {
      setHasUnreadMessages(false);
    }
  }, [session]);

  return (
    <header className="fixed top-0 left-0 right-0 lg:right-64 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-30 flex items-center justify-between px-4 sm:px-6 shadow-sm">
      <div className="flex items-center space-x-4 space-x-reverse">
        {/* لوگو */}
        <Link href="/" className="flex items-center space-x-2 space-x-reverse">
          <div className="relative w-10 h-10 flex items-center justify-center bg-blue-600 rounded-lg">
            {logoUrl && logoUrl !== "/logo.png" && logoUrl.startsWith("/") ? (
              <Image
                src={logoUrl}
                alt="لوگو"
                fill
                sizes="40px"
                className="object-contain p-1"
                onError={() => {
                  setLogoUrl("");
                }}
              />
            ) : (
              <span className="text-white font-bold text-lg">ف</span>
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white hidden sm:block">
            سیستم فیدبک
          </h1>
        </Link>
      </div>

      <div className="flex items-center space-x-3 space-x-reverse">
        {session?.user?.role === "ADMIN" && (
          <>
            <Link
              href="/feedback/with-chat"
              className="relative flex items-center space-x-2 space-x-reverse px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="فیدبک‌های دارای چت"
            >
              <MessageCircle size={20} />
              {hasUnreadMessages && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </Link>
            <Link
              href="/trash"
              className="relative flex items-center space-x-2 space-x-reverse px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="سطل آشغال"
            >
              <Trash2 size={20} />
              {hasTrashItems && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </Link>
            <Link
              href="/settings"
              className="flex items-center space-x-2 space-x-reverse px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Settings size={20} />
              <span className="hidden sm:inline">تنظیمات</span>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

