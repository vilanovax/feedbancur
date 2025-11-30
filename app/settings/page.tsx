"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";
import {
  Settings,
  Save,
  Bell,
  User,
  Shield,
  Database,
  Mail,
  Globe,
  Lock,
  Palette,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoUrl, setLogoUrl] = useState("/logo.png");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [settings, setSettings] = useState({
    // تنظیمات عمومی
    siteName: "سیستم فیدبک کارمندان",
    siteDescription: "سیستم مدیریت و اندازه‌گیری فیدبک کارمندان",
    language: "fa",
    timezone: "Asia/Tehran",
    logoUrl: "/logo.png",
    
    // تنظیمات اعلانات
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    
    // تنظیمات امنیتی
    requirePasswordChange: false,
    sessionTimeout: 30,
    twoFactorAuth: false,
    
    // تنظیمات فیدبک
    allowAnonymous: true,
    autoArchiveDays: 90,
    maxFeedbackLength: 5000,
    
    // تنظیمات نمایش
    itemsPerPage: 20,
    theme: "light",
    
    // تنظیمات تگ‌های وضعیت
    statusTexts: {
      PENDING: "در انتظار",
      REVIEWED: "بررسی شده",
      ARCHIVED: "آرشیو شده",
      DEFERRED: "رسیدگی آینده",
      COMPLETED: "انجام شد",
    },
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setSettings((prev) => ({ ...prev, ...data }));
          if (data.logoUrl) {
            setLogoUrl(data.logoUrl);
            localStorage.setItem("appLogo", data.logoUrl);
          }
          // Save status texts to localStorage
          if (data.statusTexts) {
            localStorage.setItem("statusTexts", JSON.stringify(data.statusTexts));
          }
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // بررسی نوع فایل
    if (!file.type.startsWith("image/")) {
      alert("فقط فایل‌های تصویری مجاز هستند");
      return;
    }

    // بررسی اندازه فایل
    if (file.size > 5 * 1024 * 1024) {
      alert("حجم فایل نباید بیشتر از 5 مگابایت باشد");
      return;
    }

    setUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setLogoUrl(data.url);
        setLogoPreview(data.url);
        setSettings({ ...settings, logoUrl: data.url });
        localStorage.setItem("appLogo", data.url);
        
        // ذخیره در تنظیمات
        await fetch("/api/settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...settings, logoUrl: data.url }),
        });

        alert("لوگو با موفقیت تغییر کرد");
      } else {
        const error = await res.json();
        alert(error.error || "خطا در آپلود لوگو");
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      alert("خطا در آپلود لوگو");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        
        // Save status texts to localStorage
        if (settings.statusTexts) {
          localStorage.setItem("statusTexts", JSON.stringify(settings.statusTexts));
        }
        
        // Save logo to localStorage
        if (settings.logoUrl) {
          localStorage.setItem("appLogo", settings.logoUrl);
        }
      } else {
        const errorData = await res.json();
        console.error("Error response:", errorData);
        alert(errorData.message || errorData.error || "خطا در ذخیره تنظیمات");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("خطا در ذخیره تنظیمات");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">در حال بارگذاری...</div>
      </div>
    );
  }

  if (session?.user?.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar />
      <AppHeader />
      
      <main className="flex-1 lg:mr-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center space-x-3 space-x-reverse mb-4">
              <Settings className="text-gray-700 dark:text-gray-300" size={32} />
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                تنظیمات سیستم
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              مدیریت تنظیمات و پیکربندی سیستم
            </p>
          </div>

          {saved && (
            <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
              تنظیمات با موفقیت ذخیره شد
            </div>
          )}

          <div className="space-y-6">
            {/* تنظیمات عمومی */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center space-x-2 space-x-reverse mb-6">
                <Globe className="text-blue-500" size={24} />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  تنظیمات عمومی
                </h2>
              </div>
              
              <div className="space-y-4">
                {/* تغییر لوگو */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <ImageIcon className="inline ml-2" size={16} />
                    لوگوی اپلیکیشن
                  </label>
                    <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="relative w-24 h-24 border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      {logoPreview || (logoUrl && logoUrl !== "/logo.png" && logoUrl.startsWith("/")) ? (
                        <Image
                          src={logoPreview || logoUrl}
                          alt="لوگو"
                          fill
                          sizes="96px"
                          className="object-contain p-2"
                          onError={() => {
                            setLogoUrl("");
                            setLogoPreview(null);
                          }}
                        />
                      ) : (
                        <span className="text-gray-400 text-4xl font-bold">ف</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="flex items-center justify-center space-x-2 space-x-reverse w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                        <Upload size={20} />
                        <span>
                          {uploadingLogo ? "در حال آپلود..." : "انتخاب لوگو"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        فرمت‌های مجاز: JPG, PNG, SVG (حداکثر 5MB)
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نام سایت
                  </label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) =>
                      setSettings({ ...settings, siteName: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    توضیحات سایت
                  </label>
                  <textarea
                    value={settings.siteDescription}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        siteDescription: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    منطقه زمانی
                  </label>
                  <select
                    value={settings.timezone}
                    onChange={(e) =>
                      setSettings({ ...settings, timezone: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="Asia/Tehran">تهران (IRST)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>
            </div>

            {/* تنظیمات اعلانات */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center space-x-2 space-x-reverse mb-6">
                <Bell className="text-yellow-500" size={24} />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  تنظیمات اعلانات
                </h2>
              </div>

              <div className="space-y-4">
                <label className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        emailNotifications: e.target.checked,
                      })
                    }
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    اعلانات ایمیل
                  </span>
                </label>

                <label className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.smsNotifications}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        smsNotifications: e.target.checked,
                      })
                    }
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    اعلانات پیامک
                  </span>
                </label>

                <label className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.pushNotifications}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        pushNotifications: e.target.checked,
                      })
                    }
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    اعلانات Push
                  </span>
                </label>
              </div>
            </div>

            {/* تنظیمات امنیتی */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center space-x-2 space-x-reverse mb-6">
                <Shield className="text-red-500" size={24} />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  تنظیمات امنیتی
                </h2>
              </div>

              <div className="space-y-4">
                <label className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.requirePasswordChange}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        requirePasswordChange: e.target.checked,
                      })
                    }
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    الزام به تغییر رمز عبور دوره‌ای
                  </span>
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    زمان انقضای Session (دقیقه)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="1440"
                    value={settings.sessionTimeout}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        sessionTimeout: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <label className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.twoFactorAuth}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        twoFactorAuth: e.target.checked,
                      })
                    }
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    احراز هویت دو مرحله‌ای
                  </span>
                </label>
              </div>
            </div>

            {/* تنظیمات فیدبک */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center space-x-2 space-x-reverse mb-6">
                <Mail className="text-green-500" size={24} />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  تنظیمات فیدبک
                </h2>
              </div>

              <div className="space-y-4">
                <label className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.allowAnonymous}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        allowAnonymous: e.target.checked,
                      })
                    }
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    اجازه ثبت فیدبک ناشناس
                  </span>
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    بایگانی خودکار بعد از (روز)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={settings.autoArchiveDays}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        autoArchiveDays: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    حداکثر طول فیدبک (کاراکتر)
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="10000"
                    value={settings.maxFeedbackLength}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        maxFeedbackLength: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* تنظیمات نمایش */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center space-x-2 space-x-reverse mb-6">
                <Palette className="text-purple-500" size={24} />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  تنظیمات نمایش
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    تعداد آیتم در هر صفحه
                  </label>
                  <select
                    value={settings.itemsPerPage}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        itemsPerPage: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    تم
                  </label>
                  <select
                    value={settings.theme}
                    onChange={(e) =>
                      setSettings({ ...settings, theme: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="light">روشن</option>
                    <option value="dark">تاریک</option>
                    <option value="auto">خودکار</option>
                  </select>
                </div>
              </div>
            </div>

            {/* تنظیمات تگ‌های وضعیت */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center space-x-2 space-x-reverse mb-6">
                <Database className="text-indigo-500" size={24} />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  مدیریت تگ‌های وضعیت فیدبک
                </h2>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  در این بخش می‌توانید متن نمایشی تگ‌های وضعیت فیدبک را تغییر دهید.
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    در انتظار (PENDING)
                  </label>
                  <input
                    type="text"
                    value={settings.statusTexts.PENDING}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        statusTexts: {
                          ...settings.statusTexts,
                          PENDING: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    بررسی شده (REVIEWED)
                  </label>
                  <input
                    type="text"
                    value={settings.statusTexts.REVIEWED}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        statusTexts: {
                          ...settings.statusTexts,
                          REVIEWED: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    آرشیو شده (ARCHIVED)
                  </label>
                  <input
                    type="text"
                    value={settings.statusTexts.ARCHIVED}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        statusTexts: {
                          ...settings.statusTexts,
                          ARCHIVED: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    رسیدگی آینده (DEFERRED)
                  </label>
                  <input
                    type="text"
                    value={settings.statusTexts.DEFERRED}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        statusTexts: {
                          ...settings.statusTexts,
                          DEFERRED: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    انجام شد (COMPLETED)
                  </label>
                  <input
                    type="text"
                    value={settings.statusTexts.COMPLETED}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        statusTexts: {
                          ...settings.statusTexts,
                          COMPLETED: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* دکمه ذخیره */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center space-x-2 space-x-reverse bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save size={20} />
                <span>{loading ? "در حال ذخیره..." : "ذخیره تنظیمات"}</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

