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
  Download,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit,
  ArrowUp,
  ArrowDown,
  MessageCircle,
  AlertCircle,
  Clock,
  Calendar,
  X,
} from "lucide-react";
import Image from "next/image";
import { useToast } from "@/contexts/ToastContext";

export default function SettingsPage() {
  const toast = useToast();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoUrl, setLogoUrl] = useState("/logo.png");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "feedback" | "notifications" | "chat" | "storage" | "database" | "workingHours" | "openai">("general");

  // State های بکاپ و ریستور انتخابی
  const [backupSections, setBackupSections] = useState({
    settings: false,
    departments: false,
    users: false,
    userStatuses: false,
    feedbacks: false,
    polls: false,
    assessments: false,
    announcements: false,
    tasks: false,
    analytics: false,
  });

  const [restoreSections, setRestoreSections] = useState({
    settings: false,
    departments: false,
    users: false,
    userStatuses: false,
    feedbacks: false,
    polls: false,
    assessments: false,
    announcements: false,
    tasks: false,
    analytics: false,
  });

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
    
    // تنظیمات نوتیفیکیشن
    notificationSettings: {
      directFeedbackToManager: true, // نوتیفیکیشن برای فیدبک مستقیم به مدیر
      feedbackCompletedByManager: true, // نوتیفیکیشن برای فیدبک انجام شده توسط مدیر
    },
    
    // تنظیمات چت
    chatSettings: {
      maxFileSize: 5, // حداکثر حجم فایل به مگابایت
      allowedFileTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"], // فرمت‌های مجاز
    },
    
    // تنظیمات Object Storage (لیارا)
    objectStorageSettings: {
      enabled: false,
      endpoint: "https://storage.c2.liara.space",
      accessKeyId: "3ipqq41nabtsqsdh",
      secretAccessKey: "49ae07a8-d515-4700-8daa-65ef98da8cab",
      bucket: "feedban",
      region: "us-east-1",
    },

    // تنظیمات ساعت کاری
    workingHoursSettings: {
      enabled: false,
      startHour: 8, // 8 صبح
      endHour: 17, // 5 عصر
      workingDays: [6, 0, 1, 2, 3], // شنبه تا چهارشنبه (6=شنبه، 0=یکشنبه، 1=دوشنبه، 2=سه‌شنبه، 3=چهارشنبه)
      holidays: [] as string[], // تاریخ‌های تعطیل (فرمت: YYYY-MM-DD)
    },

    // تنظیمات OpenAI
    openAISettings: {
      enabled: false,
      apiKey: "",
      model: "gpt-3.5-turbo",
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
          // بارگذاری workingHoursSettings اگر وجود دارد
          if (data.workingHoursSettings) {
            setSettings((prev) => ({
              ...prev,
              workingHoursSettings: {
                enabled: data.workingHoursSettings.enabled ?? false,
                startHour: data.workingHoursSettings.startHour ?? 8,
                endHour: data.workingHoursSettings.endHour ?? 17,
                workingDays: Array.isArray(data.workingHoursSettings.workingDays)
                  ? data.workingHoursSettings.workingDays
                  : [6, 0, 1, 2, 3],
                holidays: Array.isArray(data.workingHoursSettings.holidays)
                  ? data.workingHoursSettings.holidays
                  : [],
              },
            }));
          }
          // بارگذاری openAISettings اگر وجود دارد
          if (data.openAISettings) {
            setSettings((prev) => ({
              ...prev,
              openAISettings: {
                enabled: data.openAISettings.enabled ?? false,
                apiKey: data.openAISettings.apiKey ?? "",
                model: data.openAISettings.model ?? "gpt-3.5-turbo",
              },
            }));
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
      toast.info("فقط فایل‌های تصویری مجاز هستند");
      return;
    }

    // بررسی اندازه فایل
    if (file.size > 5 * 1024 * 1024) {
      toast.info("حجم فایل نباید بیشتر از 5 مگابایت باشد");
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
        const newLogoUrl = data.url;

        // ساخت تنظیمات جدید با لوگوی آپلود شده
        const updatedSettings = { ...settings, logoUrl: newLogoUrl };

        // ذخیره در تنظیمات دیتابیس
        const saveRes = await fetch("/api/settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedSettings),
        });

        if (saveRes.ok) {
          // فقط اگر ذخیره موفق بود، state را به‌روز کن
          setLogoUrl(newLogoUrl);
          setLogoPreview(newLogoUrl);
          setSettings(updatedSettings);
          localStorage.setItem("appLogo", newLogoUrl);
          toast.success("لوگو با موفقیت ذخیره شد");
        } else {
          const saveError = await saveRes.json();
          console.error("Error saving logo to settings:", saveError);
          toast.error(saveError.message || saveError.error || "خطا در ذخیره لوگو در تنظیمات");
        }
      } else {
        const error = await res.json();
        toast.error(error.error || "خطا در آپلود لوگو");
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("خطا در آپلود لوگو");
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

      console.log("Saving settings:", settingsToSave);
      console.log("workingHoursSettings:", settingsToSave.workingHoursSettings);

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settingsToSave),
      });

      console.log("Response status:", res.status, res.statusText);

      if (res.ok) {
        setSaved(true);
        toast.success("تنظیمات با موفقیت ذخیره شد");
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
        toast.error(errorData.message || errorData.error || "خطا در ذخیره تنظیمات");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("خطا در ذخیره تنظیمات");
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
              <button
                onClick={() => setActiveTab("notifications")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "notifications"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                نوتیفیکیشن‌ها
              </button>
              <button
                onClick={() => setActiveTab("chat")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "chat"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                تنظیمات چت
              </button>
              <button
                onClick={() => setActiveTab("storage")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "storage"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Object Storage
              </button>
              <button
                onClick={() => setActiveTab("workingHours")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "workingHours"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                ساعت کاری
              </button>
              <button
                onClick={() => setActiveTab("database")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "database"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                پشتیبان‌گیری
              </button>
              <button
                onClick={() => setActiveTab("openai")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "openai"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                هوش مصنوعی (OpenAI)
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
                      {logoPreview || (logoUrl && logoUrl !== "/logo.png") ? (
                        <Image
                          src={logoPreview || logoUrl}
                          alt="لوگو"
                          fill
                          sizes="96px"
                          className="object-contain p-2"
                          unoptimized={logoUrl?.startsWith("http")}
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

            {/* محتوای تب نوتیفیکیشن */}
            {activeTab === "notifications" && (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <div className="flex items-center space-x-2 space-x-reverse mb-6">
                    <Bell className="text-blue-500" size={24} />
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                      تنظیمات نوتیفیکیشن
                    </h2>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    انتخاب کنید که برای کدام رویدادها نوتیفیکیشن دریافت کنید.
                  </p>

                  <div className="space-y-4">
                    {/* فیدبک مستقیم به مدیر */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-800 dark:text-white mb-1">
                          فیدبک مستقیم به مدیر
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          زمانی که یک فیدبک به صورت مستقیم از طرف کارمند یا مدیر به بخشی ارسال می‌شود
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notificationSettings?.directFeedbackToManager ?? true}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              notificationSettings: {
                                ...settings.notificationSettings,
                                directFeedbackToManager: e.target.checked,
                              },
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* فیدبک انجام شده توسط مدیر */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-800 dark:text-white mb-1">
                          فیدبک انجام شده توسط مدیر
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          زمانی که یک مدیر وضعیت فیدبک را به "انجام شد" تغییر می‌دهد
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notificationSettings?.feedbackCompletedByManager ?? true}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              notificationSettings: {
                                ...settings.notificationSettings,
                                feedbackCompletedByManager: e.target.checked,
                              },
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* محتوای تب تنظیمات چت */}
            {activeTab === "chat" && (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <div className="flex items-center space-x-2 space-x-reverse mb-6">
                    <MessageCircle className="text-blue-500" size={24} />
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                      تنظیمات چت
                    </h2>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    تنظیمات مربوط به چت و ضمیمه فایل در پیام‌ها.
                  </p>

                  <div className="space-y-6">
                    {/* حداکثر حجم فایل */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        حداکثر حجم فایل (مگابایت)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={settings.chatSettings?.maxFileSize || 5}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            chatSettings: {
                              ...settings.chatSettings,
                              maxFileSize: parseInt(e.target.value) || 5,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        حداکثر حجم مجاز برای فایل‌های ضمیمه شده در چت (1 تا 50 مگابایت)
                      </p>
                    </div>

                    {/* فرمت‌های مجاز */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        فرمت‌های مجاز فایل
                      </label>
                      <div className="space-y-2">
                        {[
                          { value: "image/jpeg", label: "JPEG (JPG)" },
                          { value: "image/png", label: "PNG" },
                          { value: "image/gif", label: "GIF" },
                          { value: "image/webp", label: "WebP" },
                        ].map((type) => (
                          <label key={type.value} className="flex items-center space-x-2 space-x-reverse">
                            <input
                              type="checkbox"
                              checked={(settings.chatSettings?.allowedFileTypes || []).includes(type.value)}
                              onChange={(e) => {
                                const currentTypes = settings.chatSettings?.allowedFileTypes || [];
                                const newTypes = e.target.checked
                                  ? [...currentTypes, type.value]
                                  : currentTypes.filter((t) => t !== type.value);
                                setSettings({
                                  ...settings,
                                  chatSettings: {
                                    ...settings.chatSettings,
                                    allowedFileTypes: newTypes.length > 0 ? newTypes : ["image/jpeg"], // حداقل یک نوع باید انتخاب شود
                                  },
                                });
                              }}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{type.label}</span>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        حداقل یک فرمت باید انتخاب شود
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* محتوای تب Object Storage */}
            {activeTab === "storage" && (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <div className="flex items-center space-x-2 space-x-reverse mb-6">
                    <Upload className="text-blue-500" size={24} />
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                      تنظیمات Object Storage (لیارا)
                    </h2>
                  </div>
                  
                  <div className="space-y-4">
                    {/* فعال/غیرفعال کردن Object Storage */}
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <input
                        type="checkbox"
                        id="storageEnabled"
                        checked={settings.objectStorageSettings?.enabled || false}
                        onChange={(e) => {
                          setSettings({
                            ...settings,
                            objectStorageSettings: {
                              ...settings.objectStorageSettings,
                              enabled: e.target.checked,
                            },
                          });
                        }}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="storageEnabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        استفاده از Object Storage برای ذخیره تصاویر
                      </label>
                    </div>

                    {settings.objectStorageSettings?.enabled && (
                      <>
                        {/* Endpoint */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Endpoint
                          </label>
                          <input
                            type="text"
                            value={settings.objectStorageSettings?.endpoint || ""}
                            onChange={(e) => {
                              setSettings({
                                ...settings,
                                objectStorageSettings: {
                                  ...settings.objectStorageSettings,
                                  endpoint: e.target.value,
                                },
                              });
                            }}
                            placeholder="https://storage.iran.liara.space"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            آدرس endpoint لیارا Object Storage
                          </p>
                        </div>

                        {/* Access Key ID */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Access Key ID
                          </label>
                          <input
                            type="text"
                            value={settings.objectStorageSettings?.accessKeyId || ""}
                            onChange={(e) => {
                              setSettings({
                                ...settings,
                                objectStorageSettings: {
                                  ...settings.objectStorageSettings,
                                  accessKeyId: e.target.value,
                                },
                              });
                            }}
                            placeholder="Access Key ID"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                        </div>

                        {/* Secret Access Key */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Secret Access Key
                          </label>
                          <input
                            type="password"
                            value={settings.objectStorageSettings?.secretAccessKey || ""}
                            onChange={(e) => {
                              setSettings({
                                ...settings,
                                objectStorageSettings: {
                                  ...settings.objectStorageSettings,
                                  secretAccessKey: e.target.value,
                                },
                              });
                            }}
                            placeholder="Secret Access Key"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                        </div>

                        {/* Bucket */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Bucket Name
                          </label>
                          <input
                            type="text"
                            value={settings.objectStorageSettings?.bucket || ""}
                            onChange={(e) => {
                              setSettings({
                                ...settings,
                                objectStorageSettings: {
                                  ...settings.objectStorageSettings,
                                  bucket: e.target.value,
                                },
                              });
                            }}
                            placeholder="bucket-name"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                        </div>

                        {/* Region */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Region
                          </label>
                          <input
                            type="text"
                            value={settings.objectStorageSettings?.region || "us-east-1"}
                            onChange={(e) => {
                              setSettings({
                                ...settings,
                                objectStorageSettings: {
                                  ...settings.objectStorageSettings,
                                  region: e.target.value,
                                },
                              });
                            }}
                            placeholder="us-east-1"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            معمولاً us-east-1 برای لیارا
                          </p>
                        </div>

                        {/* Important Note */}
                        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg p-4 mt-4">
                          <div className="flex items-start space-x-2 space-x-reverse">
                            <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={24} />
                            <div>
                              <h4 className="text-base font-bold text-red-800 dark:text-red-300 mb-2">
                                ⚠️ نکته بسیار مهم: فعال‌سازی دسترسی عمومی
                              </h4>
                              <p className="text-sm text-red-700 dark:text-red-400 mb-2">
                                برای نمایش تصاویر در مرورگر، <strong>حتماً</strong> باید دسترسی عمومی (Public Access) را در پنل لیارا برای bucket خود فعال کنید.
                              </p>
                              <div className="bg-white dark:bg-gray-800 rounded p-3 mt-2 border border-red-200 dark:border-red-800">
                                <p className="text-xs font-mono text-red-800 dark:text-red-300 mb-1">
                                  <strong>مراحل فعال‌سازی:</strong>
                                </p>
                                <ol className="text-xs text-red-700 dark:text-red-400 list-decimal list-inside space-y-1">
                                  <li>وارد پنل مدیریت لیارا شوید</li>
                                  <li>به بخش <strong>Object Storage</strong> بروید</li>
                                  <li>bucket خود را انتخاب کنید</li>
                                  <li>به بخش <strong>تنظیمات (Settings)</strong> بروید</li>
                                  <li>گزینه <strong>"Public Access"</strong> یا <strong>"دسترسی عمومی"</strong> را فعال کنید</li>
                                  <li>تغییرات را ذخیره کنید</li>
                                </ol>
                              </div>
                              <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-semibold">
                                ⚠️ بدون این تنظیم، تصاویر با خطای <code className="bg-red-100 dark:bg-red-900/30 px-1 rounded">403 Forbidden</code> نمایش داده می‌شوند و قابل مشاهده نخواهند بود.
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* محتوای تب ساعت کاری */}
            {activeTab === "workingHours" && (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <div className="flex items-center space-x-2 space-x-reverse mb-6">
                    <Clock className="text-blue-500" size={24} />
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                      تنظیمات ساعت کاری
                    </h2>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    تنظیم ساعات کاری برای محاسبه زمان انجام فیدبک‌ها. با فعال کردن این گزینه، زمان انجام فیدبک‌ها فقط بر اساس ساعات کاری محاسبه می‌شود.
                  </p>

                  <div className="space-y-6">
                    {/* فعال/غیرفعال کردن محاسبه بر اساس ساعت کاری */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-800 dark:text-white mb-1">
                          محاسبه بر اساس ساعت کاری
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          با فعال کردن این گزینه، زمان انجام فیدبک‌ها فقط در ساعات کاری محاسبه می‌شود (مثلاً 4 روز × 9 ساعت = 36 ساعت به جای 96 ساعت)
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer mr-4">
                        <input
                          type="checkbox"
                          checked={settings.workingHoursSettings?.enabled ?? false}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              workingHoursSettings: {
                                ...settings.workingHoursSettings,
                                enabled: e.target.checked,
                              },
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {settings.workingHoursSettings?.enabled && (
                      <>
                        {/* ساعت شروع و پایان کار */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              <Clock className="inline ml-2" size={16} />
                              ساعت شروع کار
                            </label>
                            <select
                              value={settings.workingHoursSettings?.startHour ?? 8}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  workingHoursSettings: {
                                    ...settings.workingHoursSettings,
                                    startHour: parseInt(e.target.value),
                                  },
                                })
                              }
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            >
                              {Array.from({ length: 24 }, (_, i) => (
                                <option key={i} value={i}>
                                  {i.toString().padStart(2, '0')}:00
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              <Clock className="inline ml-2" size={16} />
                              ساعت پایان کار
                            </label>
                            <select
                              value={settings.workingHoursSettings?.endHour ?? 17}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  workingHoursSettings: {
                                    ...settings.workingHoursSettings,
                                    endHour: parseInt(e.target.value),
                                  },
                                })
                              }
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            >
                              {Array.from({ length: 24 }, (_, i) => (
                                <option key={i} value={i}>
                                  {i.toString().padStart(2, '0')}:00
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* روزهای کاری */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            <Calendar className="inline ml-2" size={16} />
                            روزهای کاری
                          </label>
                          <div className="grid grid-cols-7 gap-2">
                            {[
                              { day: 6, label: 'شنبه' },
                              { day: 0, label: 'یکشنبه' },
                              { day: 1, label: 'دوشنبه' },
                              { day: 2, label: 'سه‌شنبه' },
                              { day: 3, label: 'چهارشنبه' },
                              { day: 4, label: 'پنج‌شنبه' },
                              { day: 5, label: 'جمعه' },
                            ].map(({ day, label }) => {
                              const isSelected = (settings.workingHoursSettings?.workingDays || []).includes(day);
                              return (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => {
                                    const currentDays = settings.workingHoursSettings?.workingDays || [];
                                    const newDays = isSelected
                                      ? currentDays.filter(d => d !== day)
                                      : [...currentDays, day].sort();
                                    setSettings({
                                      ...settings,
                                      workingHoursSettings: {
                                        ...settings.workingHoursSettings,
                                        workingDays: newDays,
                                      },
                                    });
                                  }}
                                  className={`p-3 rounded-lg text-xs font-medium transition-colors ${
                                    isSelected
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                  }`}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            روزهای کاری را انتخاب کنید (حداقل یک روز)
                          </p>
                        </div>

                        {/* تعطیلات */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            <Calendar className="inline ml-2" size={16} />
                            تعطیلات رسمی
                          </label>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                            تاریخ‌های تعطیل را به فرمت YYYY-MM-DD وارد کنید (مثال: 2025-03-21 برای نوروز)
                          </p>

                          {/* لیست تعطیلات */}
                          <div className="space-y-2 mb-3">
                            {(settings.workingHoursSettings?.holidays || []).map((holiday, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                              >
                                <Calendar size={16} className="text-gray-500" />
                                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                                  {holiday}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newHolidays = (settings.workingHoursSettings?.holidays || []).filter((_, i) => i !== index);
                                    setSettings({
                                      ...settings,
                                      workingHoursSettings: {
                                        ...settings.workingHoursSettings,
                                        holidays: newHolidays,
                                      },
                                    });
                                  }}
                                  className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                                  title="حذف"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* افزودن تعطیل جدید */}
                          <div className="flex gap-2">
                            <input
                              type="date"
                              id="new-holiday"
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.getElementById('new-holiday') as HTMLInputElement;
                                const dateValue = input?.value;
                                if (dateValue) {
                                  const currentHolidays = settings.workingHoursSettings?.holidays || [];
                                  if (!currentHolidays.includes(dateValue)) {
                                    setSettings({
                                      ...settings,
                                      workingHoursSettings: {
                                        ...settings.workingHoursSettings,
                                        holidays: [...currentHolidays, dateValue].sort(),
                                      },
                                    });
                                    input.value = '';
                                  } else {
                                    toast.info('این تاریخ قبلاً اضافه شده است');
                                  }
                                }
                              }}
                              className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                            >
                              <Plus size={16} />
                              افزودن
                            </button>
                          </div>
                        </div>

                        {/* نمایش اطلاعات خلاصه */}
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">
                            📊 خلاصه تنظیمات:
                          </h4>
                          <ul className="text-xs text-green-700 dark:text-green-400 space-y-1">
                            <li>• ساعات کاری: {settings.workingHoursSettings?.startHour?.toString().padStart(2, '0')}:00 تا {settings.workingHoursSettings?.endHour?.toString().padStart(2, '0')}:00 ({(settings.workingHoursSettings?.endHour ?? 17) - (settings.workingHoursSettings?.startHour ?? 8)} ساعت در روز)</li>
                            <li>• روزهای کاری: {(settings.workingHoursSettings?.workingDays || []).length} روز در هفته</li>
                            <li>• تعطیلات رسمی: {(settings.workingHoursSettings?.holidays || []).length} روز</li>
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* محتوای تب OpenAI */}
            {activeTab === "openai" && (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <div className="flex items-center space-x-2 space-x-reverse mb-6">
                    <Settings className="text-blue-500" size={24} />
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                      تنظیمات OpenAI
                    </h2>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    تنظیمات مربوط به OpenAI برای استخراج کلمات کلیدی از فیدبک‌ها.
                  </p>

                  <div className="space-y-6">
                    {/* فعال/غیرفعال کردن OpenAI */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-800 dark:text-white mb-1">
                          فعال‌سازی استخراج کلمات کلیدی با AI
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          با فعال کردن این گزینه، می‌توانید از OpenAI برای استخراج خودکار کلمات کلیدی از فیدبک‌ها استفاده کنید.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer mr-4">
                        <input
                          type="checkbox"
                          checked={settings.openAISettings?.enabled ?? false}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              openAISettings: {
                                ...settings.openAISettings,
                                enabled: e.target.checked,
                              },
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {settings.openAISettings?.enabled && (
                      <>
                        {/* API Key */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            API Key
                          </label>
                          <input
                            type="password"
                            value={settings.openAISettings?.apiKey || ""}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                openAISettings: {
                                  ...settings.openAISettings,
                                  apiKey: e.target.value,
                                },
                              })
                            }
                            placeholder="sk-..."
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            کلید API خود را از پنل OpenAI دریافت کنید
                          </p>
                        </div>

                        {/* Model */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            مدل
                          </label>
                          <select
                            value={settings.openAISettings?.model || "gpt-3.5-turbo"}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                openAISettings: {
                                  ...settings.openAISettings,
                                  model: e.target.value,
                                },
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          >
                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                            <option value="gpt-4">GPT-4</option>
                            <option value="gpt-4-turbo">GPT-4 Turbo</option>
                            <option value="gpt-4o">GPT-4o</option>
                          </select>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            مدل OpenAI که می‌خواهید استفاده کنید
                          </p>
                        </div>

                        {/* توضیحات */}
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                            💡 نکات مهم:
                          </h4>
                          <ul className="text-xs text-yellow-700 dark:text-yellow-400 space-y-1 list-disc list-inside">
                            <li>API Key شما به صورت امن ذخیره می‌شود</li>
                            <li>برای استخراج کلمات کلیدی، از API endpoint مربوطه استفاده کنید</li>
                            <li>استفاده از OpenAI ممکن است هزینه‌بر باشد</li>
                            <li>مدل GPT-3.5 Turbo برای اکثر موارد کافی است</li>
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* محتوای تب پشتیبان‌گیری */}
            {activeTab === "database" && (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <div className="flex items-center space-x-2 space-x-reverse mb-6">
                    <Database className="text-blue-500" size={24} />
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                      پشتیبان‌گیری و بازیابی دیتابیس
                    </h2>
                  </div>

                  {/* هشدار امنیتی */}
                  <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg p-4 mb-6">
                    <div className="flex items-start space-x-2 space-x-reverse">
                      <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={24} />
                      <div>
                        <h4 className="text-base font-bold text-red-800 dark:text-red-300 mb-2">
                          ⚠️ هشدار امنیتی
                        </h4>
                        <ul className="text-sm text-red-700 dark:text-red-400 space-y-1 list-disc list-inside">
                          <li>بازیابی دیتابیس تمام اطلاعات فعلی را پاک می‌کند</li>
                          <li>حتماً قبل از بازیابی، از دیتابیس فعلی نسخه پشتیبان تهیه کنید</li>
                          <li>فایل‌های پشتیبان را در مکانی امن نگهداری کنید</li>
                          <li>فقط از فایل‌های پشتیبان معتبر استفاده کنید</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* بخش پشتیبان‌گیری */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                        دانلود نسخه پشتیبان
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        بخش‌های مورد نظر برای پشتیبان‌گیری را انتخاب کنید یا بکاپ کامل بگیرید.
                      </p>

                      {/* انتخاب بخش‌ها برای بکاپ */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 border border-blue-100 dark:border-blue-900">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">انتخاب بخش‌ها:</span>
                          <button
                            type="button"
                            onClick={() => {
                              const allSelected = backupSections.settings && backupSections.departments &&
                                backupSections.users && backupSections.feedbacks && backupSections.polls &&
                                backupSections.assessments && backupSections.announcements && backupSections.tasks;
                              setBackupSections({
                                settings: !allSelected,
                                departments: !allSelected,
                                users: !allSelected,
                                userStatuses: !allSelected,
                                feedbacks: !allSelected,
                                polls: !allSelected,
                                assessments: !allSelected,
                                announcements: !allSelected,
                                tasks: !allSelected,
                                analytics: !allSelected,
                              });
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                          >
                            انتخاب همه / هیچکدام
                          </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                          {[
                            { key: 'settings', label: 'تنظیمات', icon: '⚙️' },
                            { key: 'departments', label: 'بخش‌ها', icon: '🏢' },
                            { key: 'users', label: 'کاربران', icon: '👥' },
                            { key: 'userStatuses', label: 'وضعیت کاربران', icon: '📊' },
                            { key: 'feedbacks', label: 'فیدبک‌ها', icon: '💬' },
                            { key: 'polls', label: 'نظرسنجی‌ها', icon: '📊' },
                            { key: 'assessments', label: 'آزمون‌ها', icon: '📝' },
                            { key: 'announcements', label: 'اعلانات', icon: '📢' },
                            { key: 'tasks', label: 'وظایف', icon: '✅' },
                            { key: 'analytics', label: 'کلمات کلیدی و گزارشات', icon: '📈' },
                          ].map((section) => (
                            <label
                              key={section.key}
                              className={`flex items-center space-x-2 space-x-reverse p-2 rounded-lg cursor-pointer transition ${
                                backupSections[section.key as keyof typeof backupSections]
                                  ? 'bg-blue-100 dark:bg-blue-900/50 border-2 border-blue-500'
                                  : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={backupSections[section.key as keyof typeof backupSections]}
                                onChange={(e) => setBackupSections(prev => ({ ...prev, [section.key]: e.target.checked }))}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className="text-lg">{section.icon}</span>
                              <span className="text-xs text-gray-700 dark:text-gray-300 ml-[5px]">{section.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-4">
                        💡 اگر هیچ بخشی انتخاب نشود، بکاپ کامل گرفته می‌شود
                      </p>
                      <button
                        onClick={async () => {
                          if (!confirm("آیا از دانلود نسخه پشتیبان اطمینان دارید؟")) return;

                          try {
                            // ساخت query string برای بخش‌های انتخاب شده
                            const hasSelection = Object.values(backupSections).some(v => v);
                            const url = hasSelection
                              ? `/api/backup?sections=${encodeURIComponent(JSON.stringify(backupSections))}`
                              : "/api/backup";

                            const res = await fetch(url);
                            if (res.ok) {
                              const blob = await res.blob();
                              const blobUrl = window.URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = blobUrl;
                              const contentDisposition = res.headers.get("Content-Disposition");
                              const filename = contentDisposition
                                ? contentDisposition.split("filename=")[1].replace(/"/g, "")
                                : `backup-${new Date().toISOString().split("T")[0]}.json`;
                              a.download = filename;
                              document.body.appendChild(a);
                              a.click();
                              window.URL.revokeObjectURL(blobUrl);
                              document.body.removeChild(a);
                              toast.success("نسخه پشتیبان با موفقیت دانلود شد");
                            } else {
                              const data = await res.json();
                              toast.error(data.error || "خطا در ایجاد نسخه پشتیبان");
                            }
                          } catch (error) {
                            console.error("Error downloading backup:", error);
                            toast.error("خطا در دانلود نسخه پشتیبان");
                          }
                        }}
                        className="flex items-center space-x-2 space-x-reverse bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                      >
                        <Download className="ml-2" size={20} />
                        <span>دانلود نسخه پشتیبان</span>
                      </button>
                    </div>

                    {/* بخش بازیابی */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                        بازیابی از نسخه پشتیبان
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        دیتابیس را از یک فایل پشتیبان بازیابی کنید. می‌توانید بخش‌های مورد نظر را انتخاب کنید.
                      </p>

                      {/* انتخاب بخش‌ها برای ریستور */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">بخش‌های مورد نظر برای بازیابی:</span>
                          <button
                            type="button"
                            onClick={() => {
                              const allSelected = restoreSections.settings && restoreSections.departments &&
                                restoreSections.users && restoreSections.feedbacks && restoreSections.polls &&
                                restoreSections.assessments && restoreSections.announcements && restoreSections.tasks;
                              setRestoreSections({
                                settings: !allSelected,
                                departments: !allSelected,
                                users: !allSelected,
                                userStatuses: !allSelected,
                                feedbacks: !allSelected,
                                polls: !allSelected,
                                assessments: !allSelected,
                                announcements: !allSelected,
                                tasks: !allSelected,
                                analytics: !allSelected,
                              });
                            }}
                            className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400"
                          >
                            انتخاب همه / هیچکدام
                          </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                          {[
                            { key: 'settings', label: 'تنظیمات', icon: '⚙️' },
                            { key: 'departments', label: 'بخش‌ها', icon: '🏢' },
                            { key: 'users', label: 'کاربران', icon: '👥' },
                            { key: 'userStatuses', label: 'وضعیت کاربران', icon: '📊' },
                            { key: 'feedbacks', label: 'فیدبک‌ها', icon: '💬' },
                            { key: 'polls', label: 'نظرسنجی‌ها', icon: '📊' },
                            { key: 'assessments', label: 'آزمون‌ها', icon: '📝' },
                            { key: 'announcements', label: 'اعلانات', icon: '📢' },
                            { key: 'tasks', label: 'وظایف', icon: '✅' },
                            { key: 'analytics', label: 'کلمات کلیدی و گزارشات', icon: '📈' },
                          ].map((section) => (
                            <label
                              key={section.key}
                              className={`flex items-center space-x-2 space-x-reverse p-2 rounded-lg cursor-pointer transition ${
                                restoreSections[section.key as keyof typeof restoreSections]
                                  ? 'bg-orange-100 dark:bg-orange-900/50 border-2 border-orange-500'
                                  : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={restoreSections[section.key as keyof typeof restoreSections]}
                                onChange={(e) => setRestoreSections(prev => ({ ...prev, [section.key]: e.target.checked }))}
                                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                              />
                              <span className="text-lg">{section.icon}</span>
                              <span className="text-xs text-gray-700 dark:text-gray-300 ml-[5px]">{section.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-orange-600 dark:text-orange-400 mb-4">
                        ⚠️ اگر هیچ بخشی انتخاب نشود، تمام داده‌ها بازیابی می‌شوند. فقط فایل‌های JSON از بازیابی انتخابی پشتیبانی می‌کنند.
                      </p>
                      <div className="space-y-4">
                        <input
                          type="file"
                          id="restore-file"
                          accept=".sql,.json"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            if (!file.name.endsWith(".sql") && !file.name.endsWith(".json")) {
                              toast.info("فقط فایل‌های SQL یا JSON پشتیبانی می‌شوند");
                              return;
                            }

                            // بررسی اینکه آیا فایل SQL است و بخش انتخاب شده
                            const hasSelection = Object.values(restoreSections).some(v => v);
                            if (file.name.endsWith(".sql") && hasSelection) {
                              toast.error("بازیابی انتخابی فقط برای فایل‌های JSON امکان‌پذیر است");
                              e.target.value = "";
                              return;
                            }

                            if (!confirm(
                              "⚠️ هشدار: این عملیات داده‌های بخش‌های انتخاب شده را حذف و جایگزین می‌کند.\n\nآیا مطمئن هستید؟"
                            )) {
                              e.target.value = "";
                              return;
                            }

                            if (!confirm(
                              "آیا از دیتابیس فعلی نسخه پشتیبان گرفته‌اید؟\n\nبدون نسخه پشتیبان، داده‌های فعلی برای همیشه از بین می‌روند."
                            )) {
                              e.target.value = "";
                              return;
                            }

                            try {
                              const formData = new FormData();
                              formData.append("backup", file);

                              // اضافه کردن بخش‌های انتخاب شده
                              if (hasSelection) {
                                formData.append("sections", JSON.stringify(restoreSections));
                              }

                              const res = await fetch("/api/backup", {
                                method: "POST",
                                body: formData,
                              });

                              const data = await res.json();

                              if (res.ok) {
                                const restoredCount = data.restored?.length || 0;
                                const skippedCount = data.skipped?.length || 0;
                                toast.success(`بازیابی موفق! ${restoredCount} بخش بازیابی شد${skippedCount > 0 ? ` و ${skippedCount} بخش رد شد` : ''}`);
                                if (typeof window !== "undefined") {
                                  setTimeout(() => window.location.reload(), 2000);
                                }
                              } else {
                                toast.error(data.error || "خطا در بازیابی دیتابیس");
                              }
                            } catch (error) {
                              console.error("Error restoring backup:", error);
                              toast.error("خطا در بازیابی دیتابیس");
                            } finally {
                              e.target.value = "";
                            }
                          }}
                        />
                        <label
                          htmlFor="restore-file"
                          className="flex items-center space-x-2 space-x-reverse bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition cursor-pointer inline-flex"
                        >
                          <Upload className="ml-2" size={20} />
                          <span>انتخاب فایل و بازیابی</span>
                        </label>
                      </div>
                    </div>

                    {/* توضیحات تکمیلی */}
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                        💡 نکات مهم:
                      </h4>
                      <ul className="text-xs text-yellow-700 dark:text-yellow-400 space-y-1 list-disc list-inside">
                        <li>پشتیبان‌گیری منظم (روزانه یا هفتگی) را فراموش نکنید</li>
                        <li>فایل‌های پشتیبان را در چند مکان مختلف ذخیره کنید</li>
                        <li>قبل از هر به‌روزرسانی مهم، حتماً نسخه پشتیبان بگیرید</li>
                        <li>فایل‌های پشتیبان را در محیط توسعه تست کنید</li>
                        <li>برای سرورهای production، از ابزارهای خودکار پشتیبان‌گیری استفاده کنید</li>
                      </ul>
                    </div>
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

