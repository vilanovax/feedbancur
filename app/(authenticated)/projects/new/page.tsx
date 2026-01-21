"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Save, FolderPlus } from "lucide-react";
import Link from "next/link";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [requireLogin, setRequireLogin] = useState(false);
  const [allowAnonymous, setAllowAnonymous] = useState(true);
  const [membersCanViewFeedbacks, setMembersCanViewFeedbacks] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("نام پروژه الزامی است");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          isPublic,
          requireLogin,
          allowAnonymous,
          membersCanViewFeedbacks,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "خطا در ایجاد پروژه");
      }

      const project = await res.json();
      router.push(`/projects/${project.id}`);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/projects"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div className="flex items-center gap-3">
          <FolderPlus className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              پروژه جدید
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ایجاد پروژه و تنظیم دسترسی‌ها
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        {/* نام */}
        <div className="mb-6">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            نام پروژه <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="مثال: اپلیکیشن موبایل"
            required
          />
        </div>

        {/* توضیحات */}
        <div className="mb-6">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            توضیحات (اختیاری)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="توضیحات مختصری درباره پروژه..."
          />
        </div>

        {/* تنظیمات دسترسی */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            تنظیمات دسترسی
          </h3>

          <div className="space-y-4">
            {/* عمومی/خصوصی */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
              />
              <div>
                <span className="block text-sm font-medium text-gray-900 dark:text-white">
                  فعال بودن پروژه
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  اگر غیرفعال شود، کسی نمی‌تواند فیدبک ارسال کند
                </span>
              </div>
            </label>

            {/* نیاز به ورود */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={requireLogin}
                onChange={(e) => setRequireLogin(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
              />
              <div>
                <span className="block text-sm font-medium text-gray-900 dark:text-white">
                  نیاز به ورود به سیستم
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  فقط کاربران لاگین‌شده می‌توانند فیدبک ارسال کنند
                </span>
              </div>
            </label>

            {/* ارسال ناشناس */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowAnonymous}
                onChange={(e) => setAllowAnonymous(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
              />
              <div>
                <span className="block text-sm font-medium text-gray-900 dark:text-white">
                  اجازه ارسال ناشناس
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  کاربران می‌توانند بدون درج نام فیدبک ارسال کنند
                </span>
              </div>
            </label>

            {/* دسترسی اعضا */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={membersCanViewFeedbacks}
                onChange={(e) => setMembersCanViewFeedbacks(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
              />
              <div>
                <span className="block text-sm font-medium text-gray-900 dark:text-white">
                  اعضا فیدبک‌ها را ببینند
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  اعضای پروژه می‌توانند فیدبک‌های دریافتی را مشاهده کنند
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* دکمه‌ها */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                در حال ایجاد...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                ایجاد پروژه
              </>
            )}
          </button>
          <Link
            href="/projects"
            className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
          >
            انصراف
          </Link>
        </div>
      </form>
    </div>
  );
}
