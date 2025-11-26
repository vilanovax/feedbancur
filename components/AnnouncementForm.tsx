"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AlertCircle } from "lucide-react";

interface AnnouncementFormProps {
  mode: "create" | "edit";
  initialData?: {
    title: string;
    content: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
    departmentId: string | null;
    isActive: boolean;
    scheduledAt: string | null;
  };
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export default function AnnouncementForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
}: AnnouncementFormProps) {
  const { data: session } = useSession();
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [useSchedule, setUseSchedule] = useState(!!initialData?.scheduledAt);

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    content: initialData?.content || "",
    priority: initialData?.priority || "MEDIUM",
    departmentId: initialData?.departmentId || (session?.user.role === "MANAGER" ? session.user.departmentId : ""),
    isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
    scheduledAt: initialData?.scheduledAt || "",
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Update isActive when scheduledAt changes
  useEffect(() => {
    if (useSchedule && formData.scheduledAt) {
      setFormData((prev) => ({ ...prev, isActive: false }));
    }
  }, [useSchedule, formData.scheduledAt]);

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        departmentId: formData.departmentId || null,
        scheduledAt: useSchedule && formData.scheduledAt ? formData.scheduledAt : null,
      };

      await onSubmit(submitData);
    } catch (err: any) {
      setError(err.message || "خطایی رخ داد. لطفا دوباره تلاش کنید");
    } finally {
      setLoading(false);
    }
  };

  const isManager = session?.user.role === "MANAGER";
  const isAdmin = session?.user.role === "ADMIN";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          عنوان *
        </label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          required
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="عنوان اعلان"
        />
      </div>

      <div>
        <label
          htmlFor="content"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          محتوا *
        </label>
        <textarea
          id="content"
          value={formData.content}
          onChange={(e) =>
            setFormData({ ...formData, content: e.target.value })
          }
          required
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="متن اعلان خود را بنویسید..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="priority"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            اولویت
          </label>
          <select
            id="priority"
            value={formData.priority}
            onChange={(e) =>
              setFormData({ ...formData, priority: e.target.value as any })
            }
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="LOW">کم</option>
            <option value="MEDIUM">متوسط</option>
            <option value="HIGH">بالا</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="department"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            بخش {isAdmin && "(اختیاری)"}
          </label>
          <select
            id="department"
            value={formData.departmentId || ""}
            onChange={(e) =>
              setFormData({ ...formData, departmentId: e.target.value })
            }
            disabled={isManager}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
          >
            {isAdmin && <option value="">همه شرکت (اعلان عمومی)</option>}
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
          {isManager && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              مدیران فقط می‌توانند برای بخش خودشان اعلان ایجاد کنند
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center">
          <input
            id="useSchedule"
            type="checkbox"
            checked={useSchedule}
            onChange={(e) => {
              setUseSchedule(e.target.checked);
              if (!e.target.checked) {
                setFormData({ ...formData, scheduledAt: "" });
              }
            }}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
          />
          <label
            htmlFor="useSchedule"
            className="mr-2 block text-sm text-gray-700 dark:text-gray-300"
          >
            زمان‌بندی انتشار
          </label>
        </div>

        {useSchedule && (
          <div>
            <label
              htmlFor="scheduledAt"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              تاریخ و زمان انتشار
            </label>
            <input
              id="scheduledAt"
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) =>
                setFormData({ ...formData, scheduledAt: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              اعلان به صورت خودکار در زمان مشخص شده منتشر می‌شود
            </p>
          </div>
        )}
      </div>

      {!useSchedule && (
        <div className="flex items-center">
          <input
            id="isActive"
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) =>
              setFormData({ ...formData, isActive: e.target.checked })
            }
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
          />
          <label
            htmlFor="isActive"
            className="mr-2 block text-sm text-gray-700 dark:text-gray-300"
          >
            فعال (نمایش اعلان)
          </label>
        </div>
      )}

      <div className="flex justify-end space-x-4 space-x-reverse pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          انصراف
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "در حال ذخیره..." : mode === "create" ? "ایجاد اعلان" : "بروزرسانی اعلان"}
        </button>
      </div>
    </form>
  );
}
