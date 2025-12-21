"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Building2, Trash2, Pencil, Users, Edit } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";
import { useToast } from "@/contexts/ToastContext";

export default function DepartmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [departments, setDepartments] = useState<any[]>(() => {
    // بارگذاری از cache در صورت وجود
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("departments_cache");
      const cacheTime = localStorage.getItem("departments_cache_time");
      if (cached && cacheTime) {
        const timeDiff = Date.now() - parseInt(cacheTime);
        // Cache برای 10 دقیقه معتبر است
        if (timeDiff < 10 * 60 * 1000) {
          try {
            return JSON.parse(cached);
          } catch (e) {
            localStorage.removeItem("departments_cache");
            localStorage.removeItem("departments_cache_time");
          }
        }
      }
    }
    return [];
  });
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null);
  const [departmentUsers, setDepartmentUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    keywords: "",
    allowDirectFeedback: false,
    canCreateAnnouncement: false,
    allowedAnnouncementDepartments: [] as string[],
    canCreatePoll: false,
    allowedPollDepartments: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (
      status === "authenticated" &&
      session.user.role !== "ADMIN" &&
      session.user.role !== "MANAGER"
    ) {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchDepartments();
    }
  }, [status]);

  const fetchDepartments = async () => {
    // اگر cache معتبر وجود دارد، از آن استفاده کن
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("departments_cache");
      const cacheTime = localStorage.getItem("departments_cache_time");
      if (cached && cacheTime) {
        const timeDiff = Date.now() - parseInt(cacheTime);
        if (timeDiff < 10 * 60 * 1000) {
          try {
            const cachedData = JSON.parse(cached);
            setDepartments(cachedData);
            // در پس‌زمینه به‌روزرسانی کن
            fetchDepartmentsFromAPI();
            return;
          } catch (e) {
            // اگر parse نشد، ادامه بده و از API بگیر
          }
        }
      }
    }

    // اگر cache وجود ندارد یا منقضی شده، از API بگیر
    await fetchDepartmentsFromAPI();
  };

  const fetchDepartmentsFromAPI = async () => {
    try {
      const res = await fetch("/api/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
        // ذخیره در cache
        if (typeof window !== "undefined") {
          localStorage.setItem("departments_cache", JSON.stringify(data));
          localStorage.setItem("departments_cache_time", Date.now().toString());
        }
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
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowModal(false);
        setFormData({ name: "", description: "", keywords: "", allowDirectFeedback: false, canCreateAnnouncement: false, allowedAnnouncementDepartments: [], canCreatePoll: false, allowedPollDepartments: [] });
        // پاک کردن cache برای به‌روزرسانی
        if (typeof window !== "undefined") {
          localStorage.removeItem("departments_cache");
          localStorage.removeItem("departments_cache_time");
        }
        fetchDepartments();
        toast.success("بخش با موفقیت ایجاد شد");
      } else {
        const data = await res.json();
        setError(data.error || "خطا در ایجاد بخش");
      }
    } catch (err) {
      setError("خطایی رخ داد. لطفا دوباره تلاش کنید");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepartment) return;
    setError("");
    setLoading(true);

    try {
      // آماده‌سازی داده‌ها برای ارسال
      const payload: any = {
        name: formData.name,
        allowDirectFeedback: formData.allowDirectFeedback || false,
        canCreateAnnouncement: formData.canCreateAnnouncement || false,
        allowedAnnouncementDepartments: formData.allowedAnnouncementDepartments || [],
        canCreatePoll: formData.canCreatePoll || false,
        allowedPollDepartments: formData.allowedPollDepartments || [],
      };

      // فقط فیلدهایی که مقدار دارند را اضافه می‌کنیم
      if (formData.description !== undefined) {
        payload.description = formData.description.trim() || null;
      }

      if (formData.keywords !== undefined) {
        payload.keywords = formData.keywords.trim() || "";
      }

      const res = await fetch(`/api/departments/${selectedDepartment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setShowEditModal(false);
        setSelectedDepartment(null);
        setFormData({ name: "", description: "", keywords: "", allowDirectFeedback: false, canCreateAnnouncement: false, allowedAnnouncementDepartments: [], canCreatePoll: false, allowedPollDepartments: [] });
        // پاک کردن cache برای به‌روزرسانی
        if (typeof window !== "undefined") {
          localStorage.removeItem("departments_cache");
          localStorage.removeItem("departments_cache_time");
        }
        fetchDepartments();
        toast.success("بخش با موفقیت بروزرسانی شد");
      } else {
        setError(data.error || data.message || "خطا در بروزرسانی بخش");
        console.error("Update error:", data);
      }
    } catch (err) {
      console.error("Update error:", err);
      setError("خطایی رخ داد. لطفا دوباره تلاش کنید");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDepartment) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/departments/${selectedDepartment.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setShowDeleteModal(false);
        setSelectedDepartment(null);
        // پاک کردن cache برای به‌روزرسانی
        if (typeof window !== "undefined") {
          localStorage.removeItem("departments_cache");
          localStorage.removeItem("departments_cache_time");
        }
        fetchDepartments();
        toast.success("بخش با موفقیت حذف شد");
      } else {
        const data = await res.json();
        setError(data.error || "خطا در حذف بخش");
        toast.error(data.error || "خطا در حذف بخش");
      }
    } catch (err) {
      setError("خطایی رخ داد. لطفا دوباره تلاش کنید");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (dept: any) => {
    setSelectedDepartment(dept);
    setFormData({
      name: dept.name,
      description: dept.description || "",
      keywords: Array.isArray(dept.keywords) ? dept.keywords.join(', ') : (dept.keywords || ""),
      allowDirectFeedback: dept.allowDirectFeedback || false,
      canCreateAnnouncement: dept.canCreateAnnouncement || false,
      allowedAnnouncementDepartments: Array.isArray(dept.allowedAnnouncementDepartments) ? dept.allowedAnnouncementDepartments : [],
      canCreatePoll: dept.canCreatePoll || false,
      allowedPollDepartments: Array.isArray(dept.allowedPollDepartments) ? dept.allowedPollDepartments : [],
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (dept: any) => {
    setSelectedDepartment(dept);
    setShowDeleteModal(true);
  };

  const fetchDepartmentUsers = async (deptId: string) => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`/api/departments/${deptId}/users`);
      if (res.ok) {
        const data = await res.json();
        setDepartmentUsers(data);
      }
    } catch (error) {
      console.error("Error fetching department users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const openUsersModal = (dept: any) => {
    setSelectedDepartment(dept);
    setShowUsersModal(true);
    fetchDepartmentUsers(dept.id);
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            مدیریت بخش‌ها
          </h1>
          <button
            onClick={() => {
              setFormData({ name: "", description: "", keywords: "", allowDirectFeedback: false, canCreateAnnouncement: false, allowedAnnouncementDepartments: [], canCreatePoll: false, allowedPollDepartments: [] });
              setShowModal(true);
            }}
            className="flex items-center space-x-2 space-x-reverse bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            <span>بخش جدید</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && departments.length === 0 ? (
            // Skeleton Loading
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 animate-pulse"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3 space-x-reverse flex-1">
                    <div className="bg-gray-300 dark:bg-gray-600 p-3 rounded-lg w-12 h-12"></div>
                    <div className="flex-1">
                      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            ))
          ) : departments.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                هیچ بخشی وجود ندارد
              </p>
            </div>
          ) : (
            departments.map((dept) => (
            <div
              key={dept.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 relative"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3 space-x-reverse flex-1">
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                    <Building2 className="text-blue-600 dark:text-blue-400" size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                        {dept.name}
                      </h3>
                      <button
                        onClick={() => openUsersModal(dept)}
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-1.5"
                        title="مشاهده لیست پرسنل"
                      >
                        <Users size={16} />
                        ({dept._count?.users || 0})
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(dept)}
                    className="text-blue-600 hover:text-blue-800 p-2"
                  >
                    <Pencil size={18} />
                  </button>
                  {session?.user.role === "ADMIN" && (
                    <button
                      onClick={() => openDeleteModal(dept)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>

              {dept.description && (
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {dept.description}
                </p>
              )}

              {dept.keywords && dept.keywords.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">کلیدواژه‌ها:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {Array.isArray(dept.keywords) ? dept.keywords.join(', ') : dept.keywords}
                  </p>
                </div>
              )}

              {session?.user.role === "ADMIN" && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={dept.allowDirectFeedback || false}
                      disabled
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label className="text-sm text-gray-600 dark:text-gray-300">
                      ارسال مستقیم فیدبک به مدیر
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={dept.canCreateAnnouncement || false}
                      disabled
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label className="text-sm text-gray-600 dark:text-gray-300">
                      اجازه ایجاد اعلان برای مدیر
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={dept.canCreatePoll || false}
                      disabled
                      className="h-4 w-4 text-purple-600 border-gray-300 rounded"
                    />
                    <label className="text-sm text-gray-600 dark:text-gray-300">
                      اجازه ایجاد نظرسنجی برای مدیر
                    </label>
                  </div>
                </div>
              )}
            </div>
            ))
          )}
        </div>

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                افزودن بخش جدید
              </h2>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نام بخش *
                  </label>
                  <input
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    توضیحات
                  </label>
                  <textarea
                    value={formData.description || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    کلیدواژه‌ها (با ویرگول جدا شوند)
                  </label>
                  <input
                    type="text"
                    value={formData.keywords || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, keywords: e.target.value })
                    }
                    placeholder="مثال: آشپزخانه، غذا، نهار"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    برای روتینگ خودکار فیدبک‌ها استفاده می‌شود
                  </p>
                </div>
                {session?.user.role === "ADMIN" && (
                  <>
                    <div className="flex items-center">
                      <input
                        id="allowDirectFeedback"
                        type="checkbox"
                        checked={formData.allowDirectFeedback}
                        onChange={(e) =>
                          setFormData({ ...formData, allowDirectFeedback: e.target.checked })
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="allowDirectFeedback"
                        className="mr-1.5 block text-sm text-gray-700 dark:text-gray-300"
                      >
                        ارسال مستقیم فیدبک به مدیر بخش
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="canCreateAnnouncement"
                        type="checkbox"
                        checked={formData.canCreateAnnouncement}
                        onChange={(e) =>
                          setFormData({ ...formData, canCreateAnnouncement: e.target.checked })
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="canCreateAnnouncement"
                        className="mr-1.5 block text-sm text-gray-700 dark:text-gray-300"
                      >
                        اجازه ایجاد اعلان برای مدیر بخش
                      </label>
                    </div>
                    {formData.canCreateAnnouncement && (
                      <div className="mr-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          بخش‌های مجاز برای ایجاد اعلان
                        </label>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {departments.map((dept) => (
                            <div key={dept.id} className="flex items-center">
                              <input
                                id={`dept-create-${dept.id}`}
                                type="checkbox"
                                checked={formData.allowedAnnouncementDepartments.includes(dept.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({
                                      ...formData,
                                      allowedAnnouncementDepartments: [...formData.allowedAnnouncementDepartments, dept.id]
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      allowedAnnouncementDepartments: formData.allowedAnnouncementDepartments.filter(id => id !== dept.id)
                                    });
                                  }
                                }}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label
                                htmlFor={`dept-create-${dept.id}`}
                                className="mr-1.5 block text-sm text-gray-700 dark:text-gray-300"
                              >
                                {dept.name}
                              </label>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          مدیر می‌تواند برای بخش‌های انتخاب شده اعلان ایجاد کند
                        </p>
                      </div>
                    )}
                    <div className="flex items-center">
                      <input
                        id="canCreatePoll"
                        type="checkbox"
                        checked={formData.canCreatePoll}
                        onChange={(e) =>
                          setFormData({ ...formData, canCreatePoll: e.target.checked })
                        }
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="canCreatePoll"
                        className="mr-1.5 block text-sm text-gray-700 dark:text-gray-300"
                      >
                        اجازه ایجاد نظرسنجی برای مدیر بخش
                      </label>
                    </div>
                    {formData.canCreatePoll && (
                      <div className="mr-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          بخش‌های مجاز برای ایجاد نظرسنجی
                        </label>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {departments.map((dept) => (
                            <div key={dept.id} className="flex items-center">
                              <input
                                id={`dept-poll-create-${dept.id}`}
                                type="checkbox"
                                checked={formData.allowedPollDepartments.includes(dept.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({
                                      ...formData,
                                      allowedPollDepartments: [...formData.allowedPollDepartments, dept.id]
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      allowedPollDepartments: formData.allowedPollDepartments.filter(id => id !== dept.id)
                                    });
                                  }
                                }}
                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                              />
                              <label
                                htmlFor={`dept-poll-create-${dept.id}`}
                                className="mr-1.5 block text-sm text-gray-700 dark:text-gray-300"
                              >
                                {dept.name}
                              </label>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          مدیر می‌تواند برای بخش‌های انتخاب شده نظرسنجی ایجاد کند
                        </p>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-end space-x-4 space-x-reverse pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setFormData({ name: "", description: "", keywords: "", allowDirectFeedback: false, canCreateAnnouncement: false, allowedAnnouncementDepartments: [], canCreatePoll: false, allowedPollDepartments: [] });
                      setError("");
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "در حال ایجاد..." : "ایجاد"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedDepartment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                ویرایش بخش
              </h2>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                  {error}
                </div>
              )}
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نام بخش *
                  </label>
                  <input
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    توضیحات
                  </label>
                  <textarea
                    value={formData.description || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    کلیدواژه‌ها (با ویرگول جدا شوند)
                  </label>
                  <input
                    type="text"
                    value={formData.keywords || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, keywords: e.target.value })
                    }
                    placeholder="مثال: آشپزخانه، غذا، نهار"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                {session?.user.role === "ADMIN" && (
                  <>
                    <div className="flex items-center">
                      <input
                        id="editAllowDirectFeedback"
                        type="checkbox"
                        checked={formData.allowDirectFeedback}
                        onChange={(e) =>
                          setFormData({ ...formData, allowDirectFeedback: e.target.checked })
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="editAllowDirectFeedback"
                        className="mr-1.5 block text-sm text-gray-700 dark:text-gray-300"
                      >
                        ارسال مستقیم فیدبک به مدیر بخش
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="editCanCreateAnnouncement"
                        type="checkbox"
                        checked={formData.canCreateAnnouncement}
                        onChange={(e) =>
                          setFormData({ ...formData, canCreateAnnouncement: e.target.checked })
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="editCanCreateAnnouncement"
                        className="mr-1.5 block text-sm text-gray-700 dark:text-gray-300"
                      >
                        اجازه ایجاد اعلان برای مدیر بخش
                      </label>
                    </div>
                    {formData.canCreateAnnouncement && (
                      <div className="mr-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          بخش‌های مجاز برای ایجاد اعلان
                        </label>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {departments.filter(d => d.id !== selectedDepartment?.id).map((dept) => (
                            <div key={dept.id} className="flex items-center">
                              <input
                                id={`dept-edit-${dept.id}`}
                                type="checkbox"
                                checked={formData.allowedAnnouncementDepartments.includes(dept.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({
                                      ...formData,
                                      allowedAnnouncementDepartments: [...formData.allowedAnnouncementDepartments, dept.id]
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      allowedAnnouncementDepartments: formData.allowedAnnouncementDepartments.filter(id => id !== dept.id)
                                    });
                                  }
                                }}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label
                                htmlFor={`dept-edit-${dept.id}`}
                                className="mr-1.5 block text-sm text-gray-700 dark:text-gray-300"
                              >
                                {dept.name}
                              </label>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          مدیر می‌تواند برای بخش‌های انتخاب شده اعلان ایجاد کند
                        </p>
                      </div>
                    )}
                    <div className="flex items-center">
                      <input
                        id="editCanCreatePoll"
                        type="checkbox"
                        checked={formData.canCreatePoll}
                        onChange={(e) =>
                          setFormData({ ...formData, canCreatePoll: e.target.checked })
                        }
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="editCanCreatePoll"
                        className="mr-1.5 block text-sm text-gray-700 dark:text-gray-300"
                      >
                        اجازه ایجاد نظرسنجی برای مدیر بخش
                      </label>
                    </div>
                    {formData.canCreatePoll && (
                      <div className="mr-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          بخش‌های مجاز برای ایجاد نظرسنجی
                        </label>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {departments.filter(d => d.id !== selectedDepartment?.id).map((dept) => (
                            <div key={dept.id} className="flex items-center">
                              <input
                                id={`dept-poll-edit-${dept.id}`}
                                type="checkbox"
                                checked={formData.allowedPollDepartments.includes(dept.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({
                                      ...formData,
                                      allowedPollDepartments: [...formData.allowedPollDepartments, dept.id]
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      allowedPollDepartments: formData.allowedPollDepartments.filter(id => id !== dept.id)
                                    });
                                  }
                                }}
                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                              />
                              <label
                                htmlFor={`dept-poll-edit-${dept.id}`}
                                className="mr-1.5 block text-sm text-gray-700 dark:text-gray-300"
                              >
                                {dept.name}
                              </label>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          مدیر می‌تواند برای بخش‌های انتخاب شده نظرسنجی ایجاد کند
                        </p>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-end space-x-4 space-x-reverse pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedDepartment(null);
                      setFormData({ name: "", description: "", keywords: "", allowDirectFeedback: false, canCreateAnnouncement: false, allowedAnnouncementDepartments: [], canCreatePoll: false, allowedPollDepartments: [] });
                      setError("");
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "در حال بروزرسانی..." : "بروزرسانی"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedDepartment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
              <h2 className="text-2xl font-bold text-red-600 mb-4">
                حذف بخش
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                آیا از حذف بخش <strong>{selectedDepartment.name}</strong> اطمینان دارید؟
                <br />
                <span className="text-sm text-gray-500">
                  توجه: اگر بخش دارای کاربر، فیدبک یا تسک باشد، امکان حذف وجود ندارد.
                </span>
              </p>
              <div className="flex justify-end space-x-4 space-x-reverse">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedDepartment(null);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  انصراف
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "در حال حذف..." : "حذف بخش"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users List Modal */}
        {showUsersModal && selectedDepartment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-2xl max-h-[80vh] flex flex-col">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                پرسنل بخش {selectedDepartment.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                تعداد کل: {departmentUsers.length} نفر
              </p>

              {loadingUsers ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : departmentUsers.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  این بخش هنوز هیچ کاربری ندارد
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto mb-6">
                  <div className="space-y-3">
                    {departmentUsers.map((user) => (
                      <div
                        key={user.id}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                            <Users className="text-blue-600 dark:text-blue-400" size={20} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 dark:text-white">
                              {user.name}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {user.mobile}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              user.role === "MANAGER"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            }`}
                          >
                            {user.role === "MANAGER" ? "مدیر" : "کارمند"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowUsersModal(false);
                    setSelectedDepartment(null);
                    setDepartmentUsers([]);
                  }}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  بستن
                </button>
                <Link
                  href="/users"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Edit size={18} />
                  ویرایش کاربران
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
