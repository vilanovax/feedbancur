"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowRight, Image as ImageIcon, X } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";
import Image from "next/image";

export default function NewFeedbackPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [departments, setDepartments] = useState<any[]>([]);
  const DEPARTMENTS_CACHE_KEY = "feedback-departments-cache";
  const DEPARTMENTS_CACHE_TTL = 10 * 60 * 1000; // 10 دقیقه
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "SUGGESTION" as "CRITICAL" | "SUGGESTION" | "SURVEY",
    isAnonymous: false,
    departmentId: "",
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    loadDepartmentsFromCache();
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (departments.length === 0) return;

    setFormData((prev) => {
      const preferredDepartmentId =
        session?.user.departmentId || prev.departmentId || departments[0]?.id || "";

      if (!prev.departmentId && preferredDepartmentId) {
        return { ...prev, departmentId: preferredDepartmentId };
      }

      if (session?.user.departmentId && prev.departmentId !== session.user.departmentId) {
        return { ...prev, departmentId: session.user.departmentId };
      }

      return prev;
    });
  }, [departments, session?.user.departmentId]);

  const loadDepartmentsFromCache = () => {
    if (typeof window === "undefined") return;

    try {
      const cached = localStorage.getItem(DEPARTMENTS_CACHE_KEY);
      if (!cached) return;

      const parsed = JSON.parse(cached);
      const isValid =
        parsed &&
        Array.isArray(parsed.data) &&
        typeof parsed.timestamp === "number" &&
        Date.now() - parsed.timestamp < DEPARTMENTS_CACHE_TTL;

      if (isValid) {
        setDepartments(parsed.data);
      } else {
        localStorage.removeItem(DEPARTMENTS_CACHE_KEY);
      }
    } catch (err) {
      console.error("Error loading cached departments:", err);
      localStorage.removeItem(DEPARTMENTS_CACHE_KEY);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
        if (typeof window !== "undefined") {
          const cachePayload = {
            data,
            timestamp: Date.now(),
          };
          localStorage.setItem(DEPARTMENTS_CACHE_KEY, JSON.stringify(cachePayload));
        }
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of files) {
      // بررسی نوع فایل
      if (!file.type.startsWith("image/")) {
        setError("فقط فایل‌های تصویری مجاز هستند");
        continue;
      }

      // بررسی اندازه فایل (حداکثر 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("حجم هر فایل نباید بیشتر از 5 مگابایت باشد");
        continue;
      }

      validFiles.push(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === validFiles.length) {
          setImagePreviews((prev) => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    }

    if (validFiles.length > 0) {
      setSelectedImages((prev) => [...prev, ...validFiles]);
      setError("");
    }

    // Reset input
    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("content", formData.content);
      formDataToSend.append("type", formData.type);
      formDataToSend.append("isAnonymous", formData.isAnonymous.toString());
      formDataToSend.append("departmentId", formData.departmentId);
      
      // اضافه کردن همه تصاویر
      selectedImages.forEach((image, index) => {
        formDataToSend.append(`image_${index}`, image);
      });
      formDataToSend.append("imageCount", selectedImages.length.toString());

      const res = await fetch("/api/feedback", {
        method: "POST",
        body: formDataToSend,
      });

      if (res.ok) {
        router.push("/feedback");
      } else {
        const data = await res.json();
        setError(data.error || "خطا در ثبت فیدبک");
      }
    } catch (err) {
      setError("خطایی رخ داد. لطفا دوباره تلاش کنید");
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar />
      <AppHeader />
      <main className="flex-1 lg:mr-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">
            ثبت فیدبک جدید
          </h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="department"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                بخش
              </label>
              <select
                id="department"
                value={formData.departmentId}
                onChange={(e) =>
                  setFormData({ ...formData, departmentId: e.target.value })
                }
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">انتخاب بخش</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                عنوان
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="عنوان فیدبک"
              />
            </div>

            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                محتوا
              </label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                required
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="متن فیدبک خود را بنویسید..."
              />
            </div>

            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                نوع فیدبک
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as any })
                }
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="SUGGESTION">پیشنهادی</option>
                <option value="CRITICAL">انتقادی</option>
                <option value="SURVEY">نظرسنجی</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                id="isAnonymous"
                type="checkbox"
                checked={formData.isAnonymous}
                onChange={(e) =>
                  setFormData({ ...formData, isAnonymous: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="isAnonymous"
                className="mr-2 block text-sm text-gray-700 dark:text-gray-300"
              >
                ارسال به صورت ناشناس
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ضمیمه تصویر (اختیاری - می‌توانید چند تصویر انتخاب کنید)
              </label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImageIcon className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">کلیک کنید</span> یا تصاویر را اینجا بکشید
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG یا GIF (حداکثر 5MB برای هر تصویر)
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                  multiple
                    onChange={handleImageChange}
                  />
                </label>
              {imagePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                    <Image
                          src={preview}
                          alt={`Preview ${index + 1}`}
                      fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                        onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 left-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition"
                  >
                        <X size={18} />
                  </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 space-x-reverse">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 space-x-reverse"
              >
                <span>{loading ? "در حال ثبت..." : "ثبت فیدبک"}</span>
                <ArrowRight size={20} />
              </button>
            </div>
          </form>
          </div>
        </div>
      </main>
    </div>
  );
}
