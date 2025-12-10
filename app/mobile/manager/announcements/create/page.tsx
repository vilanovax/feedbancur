"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MobileLayout from "@/components/MobileLayout";
import { Bell, ArrowRight, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function CreateAnnouncementMobilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "MEDIUM",
    departmentId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [canCreate, setCanCreate] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [allowedDepartments, setAllowedDepartments] = useState<any[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      if (session.user.role !== "MANAGER") {
        router.push("/mobile/announcements");
      } else {
        checkPermission();
      }
    }
  }, [status, session, router]);

  const checkPermission = async () => {
    if (!session?.user?.departmentId) {
      setCanCreate(false);
      setCheckingPermission(false);
      return;
    }

    try {
      const [deptRes, allDeptsRes] = await Promise.all([
        fetch(`/api/departments/${session.user.departmentId}`),
        fetch('/api/departments')
      ]);

      if (deptRes.ok && allDeptsRes.ok) {
        const department = await deptRes.json();
        const allDepartments = await allDeptsRes.json();

        const hasPermission = department.canCreateAnnouncement || false;
        setCanCreate(hasPermission);

        if (hasPermission && department.allowedAnnouncementDepartments?.length > 0) {
          // Filter departments to only show allowed ones
          const allowed = allDepartments.filter((dept: any) =>
            department.allowedAnnouncementDepartments.includes(dept.id)
          );
          setAllowedDepartments(allowed);

          // Set first department as default
          if (allowed.length > 0) {
            setFormData(prev => ({ ...prev, departmentId: allowed[0].id }));
          }
        } else if (hasPermission) {
          // If no specific departments allowed, default to manager's own department
          const ownDept = allDepartments.find((dept: any) => dept.id === session.user.departmentId);
          if (ownDept) {
            setAllowedDepartments([ownDept]);
            setFormData(prev => ({ ...prev, departmentId: ownDept.id }));
          }
        }
      } else {
        setCanCreate(false);
      }
    } catch (error) {
      console.error("Error checking permission:", error);
      setCanCreate(false);
    } finally {
      setCheckingPermission(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.departmentId) {
      setError("لطفاً بخش مورد نظر را انتخاب کنید");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          priority: formData.priority,
          departmentId: formData.departmentId, // Use selected department
          isActive: true,
        }),
      });

      if (res.ok) {
        router.push("/mobile/announcements");
      } else {
        const data = await res.json();
        setError(data.error || "خطا در ایجاد اعلان");
      }
    } catch (err) {
      setError("خطایی رخ داد. لطفا دوباره تلاش کنید");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || checkingPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">در حال بارگذاری...</div>
      </div>
    );
  }

  if (!canCreate) {
    return (
      <MobileLayout role="MANAGER" title="ایجاد اعلان">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <AlertTriangle className="w-16 h-16 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-red-800 dark:text-red-200 mb-2">
            عدم دسترسی
          </h2>
          <p className="text-red-700 dark:text-red-300 mb-4">
            شما مجوز ایجاد اعلان ندارید. لطفاً با مدیرعامل تماس بگیرید.
          </p>
          <Link
            href="/mobile/announcements"
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <ArrowRight size={20} />
            <span>بازگشت به اعلانات</span>
          </Link>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout role="MANAGER" title="ایجاد اعلان">
      <div className="space-y-4">
        {/* Back Button */}
        <Link
          href="/mobile/announcements"
          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4"
        >
          <ArrowRight size={20} />
          <span>بازگشت به لیست اعلانات</span>
        </Link>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
              <Bell className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              ایجاد اعلان جدید
            </h1>
          </div>

          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {allowedDepartments.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  بخش مقصد *
                </label>
                <select
                  value={formData.departmentId}
                  onChange={(e) =>
                    setFormData({ ...formData, departmentId: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  {allowedDepartments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  اعلان برای کارمندان این بخش ارسال خواهد شد
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                عنوان اعلان *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="عنوان اعلان را وارد کنید"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                محتوای اعلان *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                required
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                placeholder="متن اعلان را وارد کنید"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                اولویت
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="LOW">کم</option>
                <option value="MEDIUM">متوسط</option>
                <option value="HIGH">بالا</option>
              </select>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>توجه:</strong> این اعلان برای کارمندان بخش انتخاب شده ارسال خواهد شد.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Link
                href="/mobile/announcements"
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-center font-medium"
              >
                انصراف
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
              >
                {loading ? "در حال ارسال..." : "ارسال اعلان"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MobileLayout>
  );
}
