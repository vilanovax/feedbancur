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
  Plus,
  Trash2,
  Edit,
  ArrowUp,
  ArrowDown,
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
  const [activeTab, setActiveTab] = useState<"general" | "feedback">("general");
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
    
    // تنظیمات تگ‌های وضعیت (به صورت array برای حفظ ترتیب)
    statusTexts: [
      { key: "PENDING", label: "در انتظار" },
      { key: "REVIEWED", label: "بررسی شده" },
      { key: "ARCHIVED", label: "آرشیو شده" },
      { key: "DEFERRED", label: "رسیدگی آینده" },
      { key: "COMPLETED", label: "انجام شد" },
    ],
    
    // تنظیمات انواع فیدبک
    feedbackTypes: [
      { key: "SUGGESTION", label: "پیشنهادی" },
      { key: "CRITICAL", label: "انتقادی" },
      { key: "SURVEY", label: "نظرسنجی" },
    ],
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
            // تبدیل object به array اگر لازم باشد
            let statusTextsArray = data.statusTexts;
            if (!Array.isArray(data.statusTexts)) {
              // تبدیل object به array با ترتیب پیش‌فرض
              const order = ["PENDING", "REVIEWED", "ARCHIVED", "DEFERRED", "COMPLETED"];
              statusTextsArray = order.map((key) => ({
                key,
                label: data.statusTexts[key] || "",
              }));
            }
            setSettings((prev) => ({ ...prev, statusTexts: statusTextsArray }));
            const statusTextsJson = JSON.stringify(statusTextsArray);
            localStorage.setItem("statusTexts", statusTextsJson);
            // Dispatch custom event برای به‌روزرسانی در همان تب
            window.dispatchEvent(new CustomEvent("statusTextsUpdated", { detail: statusTextsJson }));
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
      // تبدیل statusTexts array به object برای API
      const settingsToSave = { ...settings };
      if (Array.isArray(settingsToSave.statusTexts)) {
        settingsToSave.statusTexts = settingsToSave.statusTexts.reduce((acc, item) => {
          acc[item.key] = item.label;
          return acc;
        }, {} as Record<string, string>);
      }
      
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settingsToSave),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        
        // Save status texts to localStorage (به صورت array)
        if (settings.statusTexts) {
          const statusTextsArray = Array.isArray(settings.statusTexts) 
            ? settings.statusTexts 
            : Object.entries(settings.statusTexts).map(([key, label]) => ({ key, label }));
          const statusTextsJson = JSON.stringify(statusTextsArray);
          localStorage.setItem("statusTexts", statusTextsJson);
          // Dispatch custom event برای به‌روزرسانی در همان تب
          window.dispatchEvent(new CustomEvent("statusTextsUpdated", { detail: statusTextsJson }));
        }
        
        // Save feedback types to localStorage
        if (settings.feedbackTypes) {
          const feedbackTypesJson = JSON.stringify(settings.feedbackTypes);
          localStorage.setItem("feedbackTypes", feedbackTypesJson);
          // Dispatch custom event برای به‌روزرسانی در همان تب
          window.dispatchEvent(new CustomEvent("feedbackTypesUpdated", { detail: feedbackTypesJson }));
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

          {/* تب‌های تنظیمات */}
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 space-x-reverse">
              <button
                onClick={() => setActiveTab("general")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "general"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                تنظیمات عمومی
              </button>
              <button
                onClick={() => setActiveTab("feedback")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "feedback"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                مدیریت فیدبک
              </button>
            </nav>
          </div>

          <div className="space-y-6">
            {/* محتوای تب تنظیمات عمومی */}
            {activeTab === "general" && (
              <>
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
              </>
            )}

            {/* محتوای تب مدیریت فیدبک */}
            {activeTab === "feedback" && (
              <>
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
                  در این بخش می‌توانید متن نمایشی تگ‌های وضعیت فیدبک را تغییر دهید و ترتیب نمایش آنها را تنظیم کنید.
                </p>

                {Array.isArray(settings.statusTexts) ? (
                  settings.statusTexts.map((status, index) => (
                    <div
                      key={status.key}
                      className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      {/* دکمه‌های جابجایی */}
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => {
                            if (index > 0) {
                              const newStatuses = [...settings.statusTexts];
                              [newStatuses[index - 1], newStatuses[index]] = [newStatuses[index], newStatuses[index - 1]];
                              setSettings({ ...settings, statusTexts: newStatuses });
                            }
                          }}
                          disabled={index === 0}
                          className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
                          title="جابجایی به بالا"
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          onClick={() => {
                            if (index < settings.statusTexts.length - 1) {
                              const newStatuses = [...settings.statusTexts];
                              [newStatuses[index], newStatuses[index + 1]] = [newStatuses[index + 1], newStatuses[index]];
                              setSettings({ ...settings, statusTexts: newStatuses });
                            }
                          }}
                          disabled={index === settings.statusTexts.length - 1}
                          className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
                          title="جابجایی به پایین"
                        >
                          <ArrowDown size={16} />
                        </button>
                      </div>

                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            کلید (Key)
                          </label>
                          <input
                            type="text"
                            value={status.key}
                            readOnly
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-400 cursor-not-allowed"
                            placeholder="PENDING"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            متن نمایشی (Label)
                          </label>
                          <input
                            type="text"
                            value={status.label}
                            onChange={(e) => {
                              const newStatuses = [...settings.statusTexts];
                              newStatuses[index].label = e.target.value;
                              setSettings({ ...settings, statusTexts: newStatuses });
                            }}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                            placeholder="در انتظار"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  // Fallback برای حالت قدیمی (object)
                  Object.entries(settings.statusTexts || {}).map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {key}
                      </label>
                      <input
                        type="text"
                        value={label as string}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            statusTexts: {
                              ...settings.statusTexts,
                              [key]: e.target.value,
                            },
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* تنظیمات انواع فیدبک */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center space-x-2 space-x-reverse mb-6">
                <Mail className="text-blue-500" size={24} />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  مدیریت انواع فیدبک
                </h2>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  در این بخش می‌توانید انواع فیدبک را مدیریت کنید. می‌توانید انواع جدید اضافه کنید، متن آنها را ویرایش کنید یا حذف کنید.
                </p>

                {settings.feedbackTypes.map((type, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    {/* دکمه‌های جابجایی */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => {
                          if (index > 0) {
                            const newTypes = [...settings.feedbackTypes];
                            [newTypes[index - 1], newTypes[index]] = [newTypes[index], newTypes[index - 1]];
                            setSettings({ ...settings, feedbackTypes: newTypes });
                          }
                        }}
                        disabled={index === 0}
                        className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
                        title="جابجایی به بالا"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (index < settings.feedbackTypes.length - 1) {
                            const newTypes = [...settings.feedbackTypes];
                            [newTypes[index], newTypes[index + 1]] = [newTypes[index + 1], newTypes[index]];
                            setSettings({ ...settings, feedbackTypes: newTypes });
                          }
                        }}
                        disabled={index === settings.feedbackTypes.length - 1}
                        className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
                        title="جابجایی به پایین"
                      >
                        <ArrowDown size={16} />
                      </button>
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          کلید (Key)
                        </label>
                        <input
                          type="text"
                          value={type.key}
                          onChange={(e) => {
                            const newTypes = [...settings.feedbackTypes];
                            newTypes[index].key = e.target.value.toUpperCase().trim();
                            setSettings({ ...settings, feedbackTypes: newTypes });
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                          placeholder="SUGGESTION"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          متن نمایشی (Label)
                        </label>
                        <input
                          type="text"
                          value={type.label}
                          onChange={(e) => {
                            const newTypes = [...settings.feedbackTypes];
                            newTypes[index].label = e.target.value;
                            setSettings({ ...settings, feedbackTypes: newTypes });
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                          placeholder="پیشنهادی"
                        />
                      </div>
                    </div>
                    {settings.feedbackTypes.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm("آیا مطمئن هستید که می‌خواهید این نوع فیدبک را حذف کنید؟")) {
                            const newTypes = settings.feedbackTypes.filter((_, i) => i !== index);
                            setSettings({ ...settings, feedbackTypes: newTypes });
                          }
                        }}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                        title="حذف"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  onClick={() => {
                    const newTypes = [
                      ...settings.feedbackTypes,
                      { key: "NEW_TYPE", label: "نوع جدید" },
                    ];
                    setSettings({ ...settings, feedbackTypes: newTypes });
                  }}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Plus size={18} />
                  <span>افزودن نوع جدید</span>
                </button>
              </div>
            </div>
              </>
            )}

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

