"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Send,
  Loader2,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  X,
  MessageSquare,
  Lightbulb,
  Bug,
  HelpCircle,
  ThumbsUp,
  LogIn,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ProjectInfo {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  requireLogin: boolean;
  allowAnonymous: boolean;
}

const feedbackTypes = [
  { value: "SUGGESTION", label: "پیشنهاد", icon: Lightbulb, color: "text-yellow-500" },
  { value: "BUG", label: "گزارش مشکل", icon: Bug, color: "text-red-500" },
  { value: "QUESTION", label: "سوال", icon: HelpCircle, color: "text-blue-500" },
  { value: "PRAISE", label: "تشکر", icon: ThumbsUp, color: "text-green-500" },
  { value: "OTHER", label: "سایر", icon: MessageSquare, color: "text-gray-500" },
];

export default function PublicFeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const token = params.token as string;

  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("SUGGESTION");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/projects/${token}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("پروژه یافت نشد یا لینک اشتباه است");
        } else {
          const data = await res.json();
          setError(data.error || "خطا در بارگذاری اطلاعات پروژه");
        }
        return;
      }
      const data = await res.json();
      setProject(data);
    } catch (err) {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("حجم تصویر نباید بیشتر از 5 مگابایت باشد");
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert("لطفاً عنوان و توضیحات را وارد کنید");
      return;
    }

    // اگر ناشناس نیست و لاگین نشده، نام الزامی است
    if (!isAnonymous && !session && !senderName.trim()) {
      alert("لطفاً نام خود را وارد کنید یا گزینه ناشناس را انتخاب کنید");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("content", content.trim());
      formData.append("type", type);
      formData.append("isAnonymous", String(isAnonymous));

      if (!isAnonymous && !session) {
        formData.append("senderName", senderName.trim());
        if (senderEmail.trim()) {
          formData.append("senderEmail", senderEmail.trim());
        }
      }

      if (image) {
        formData.append("image", image);
      }

      const res = await fetch(`/api/public/projects/${token}/feedback`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "خطا در ارسال فیدبک");
      }

      setSubmitted(true);
    } catch (err: any) {
      alert(err.message || "خطا در ارسال فیدبک");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setType("SUGGESTION");
    setIsAnonymous(false);
    setSenderName("");
    setSenderEmail("");
    setImage(null);
    setImagePreview(null);
    setSubmitted(false);
  };

  // Loading state
  if (loading || sessionStatus === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            خطا
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  // Need login state
  if (project?.requireLogin && !session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <LogIn className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            ورود الزامی
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            برای ارسال فیدبک به این پروژه باید وارد سیستم شوید
          </p>
          <Link
            href={`/login?callbackUrl=/p/${token}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <LogIn className="w-5 h-5" />
            ورود به سیستم
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            فیدبک شما ثبت شد!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            با تشکر از شما. فیدبک شما با موفقیت ارسال شد و توسط تیم بررسی خواهد شد.
          </p>
          <button
            onClick={resetForm}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            ارسال فیدبک جدید
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {project?.name}
          </h1>
          {project?.description && (
            <p className="text-gray-600 dark:text-gray-400">
              {project.description}
            </p>
          )}
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            ارسال فیدبک
          </h2>

          {/* نوع فیدبک */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              نوع فیدبک
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {feedbackTypes.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                      type === t.value
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${t.color}`} />
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* عنوان */}
          <div className="mb-4">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              عنوان <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="عنوان فیدبک خود را وارد کنید"
              required
            />
          </div>

          {/* توضیحات */}
          <div className="mb-4">
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              توضیحات <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="فیدبک خود را به طور کامل شرح دهید..."
              required
            />
          </div>

          {/* تصویر */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              تصویر (اختیاری)
            </label>
            {imagePreview ? (
              <div className="relative inline-block">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  width={200}
                  height={150}
                  className="rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                <ImageIcon className="w-6 h-6 text-gray-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  کلیک کنید یا تصویر را بکشید
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
            <p className="text-xs text-gray-500 mt-1">
              حداکثر 5 مگابایت - فرمت‌های JPG, PNG, GIF
            </p>
          </div>

          {/* اطلاعات فرستنده - اگر لاگین نشده */}
          {!session && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              {/* ناشناس */}
              {project?.allowAnonymous && (
                <label className="flex items-center gap-2 mb-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    ارسال به صورت ناشناس
                  </span>
                </label>
              )}

              {!isAnonymous && (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="senderName"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      نام شما <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="senderName"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="نام خود را وارد کنید"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="senderEmail"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      ایمیل (اختیاری)
                    </label>
                    <input
                      type="email"
                      id="senderEmail"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="email@example.com"
                      dir="ltr"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* کاربر لاگین شده */}
          {session && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                فیدبک با نام <strong>{session.user?.name}</strong> ارسال خواهد شد
              </p>
              {project?.allowAnonymous && (
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    ارسال به صورت ناشناس
                  </span>
                </label>
              )}
            </div>
          )}

          {/* دکمه ارسال */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                در حال ارسال...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                ارسال فیدبک
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          این فرم توسط سیستم فیدبان ایجاد شده است
        </p>
      </div>
    </div>
  );
}
