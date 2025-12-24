"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Bell,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  AlertCircle,
  Info,
  Eye,
  BarChart3,
  CheckSquare,
  Square,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";
import { useToast } from "@/contexts/ToastContext";

// Lazy load modal components
const AnnouncementModal = dynamic(() => import("@/components/AnnouncementModal"), {
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-64" />,
});
const AnnouncementViewersModal = dynamic(() => import("@/components/AnnouncementViewersModal"), {
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-64" />,
});

export default function ManageAnnouncementsPage() {
  const toast = useToast();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showViewersModal, setShowViewersModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  // Bulk selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showBulkDeactivateModal, setShowBulkDeactivateModal] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      if (session.user.role === "EMPLOYEE") {
        router.push("/announcements");
      } else {
        fetchAnnouncements();
      }
    }
  }, [status, session, router]);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/announcements?showAll=true");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (announcement: any) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/announcements/${announcement.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !announcement.isActive,
        }),
      });

      if (res.ok) {
        fetchAnnouncements();
      } else {
        const data = await res.json();
        toast.error(data.error || "خطا در تغییر وضعیت");
      }
    } catch (error) {
      toast.error("خطایی رخ داد");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAnnouncement) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/announcements/${selectedAnnouncement.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setShowDeleteModal(false);
        setSelectedAnnouncement(null);
        fetchAnnouncements();
      } else {
        const data = await res.json();
        toast.error(data.error || "خطا در حذف اعلان");
      }
    } catch (error) {
      toast.error("خطایی رخ داد");
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteModal = (announcement: any) => {
    setSelectedAnnouncement(announcement);
    setShowDeleteModal(true);
  };

  const openViewModal = (announcement: any) => {
    setSelectedAnnouncement(announcement);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedAnnouncement(null);
  };

  const openViewersModal = (announcement: any) => {
    setSelectedAnnouncement(announcement);
    setShowViewersModal(true);
  };

  const closeViewersModal = () => {
    setShowViewersModal(false);
    setSelectedAnnouncement(null);
  };

  // Bulk selection functions
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === announcements.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(announcements.map(a => a.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);

    try {
      const res = await fetch("/api/announcements/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`${data.count} اعلان با موفقیت حذف شد`);
        setShowBulkDeleteModal(false);
        clearSelection();
        // پاک کردن cache
        if (typeof window !== "undefined") {
          localStorage.removeItem("announcements_cache");
          localStorage.removeItem("announcements_cache_time");
        }
        fetchAnnouncements();
      } else {
        const error = await res.json();
        toast.error(error.error || "خطا در حذف گروهی اعلانات");
      }
    } catch (error) {
      console.error("Error bulk deleting announcements:", error);
      toast.error("خطا در حذف گروهی اعلانات");
    } finally {
      setBulkLoading(false);
    }
  };

  // Bulk deactivate handler
  const handleBulkDeactivate = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);

    try {
      const res = await fetch("/api/announcements/bulk-deactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`${data.count} اعلان با موفقیت غیرفعال شد`);
        setShowBulkDeactivateModal(false);
        clearSelection();
        // پاک کردن cache
        if (typeof window !== "undefined") {
          localStorage.removeItem("announcements_cache");
          localStorage.removeItem("announcements_cache_time");
        }
        fetchAnnouncements();
      } else {
        const error = await res.json();
        toast.error(error.error || "خطا در غیرفعال کردن گروهی اعلانات");
      }
    } catch (error) {
      console.error("Error bulk deactivating announcements:", error);
      toast.error("خطا در غیرفعال کردن گروهی اعلانات");
    } finally {
      setBulkLoading(false);
    }
  };

  const getStatusBadge = (announcement: any) => {
    if (announcement.scheduledAt && new Date(announcement.scheduledAt) > new Date()) {
      return (
        <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
          زمان‌بندی شده برای {new Date(announcement.scheduledAt).toLocaleDateString("fa-IR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      );
    }

    if (announcement.isActive) {
      return (
        <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800">
          فعال
        </span>
      );
    }

    return (
      <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
        غیرفعال
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return (
          <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
            <AlertTriangle size={16} />
            <span className="text-sm">بالا</span>
          </span>
        );
      case "MEDIUM":
        return (
          <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
            <AlertCircle size={16} />
            <span className="text-sm">متوسط</span>
          </span>
        );
      case "LOW":
        return (
          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
            <Info size={16} />
            <span className="text-sm">کم</span>
          </span>
        );
      default:
        return null;
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex" dir="rtl">
      <Sidebar />
      <AppHeader />
      <main className="flex-1 lg:mr-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
              <Bell size={32} />
              مدیریت اعلانات
            </h1>
            <Link
              href="/announcements/create"
              className="flex items-center space-x-2 space-x-reverse bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              <span>اعلان جدید</span>
            </Link>
          </div>

          {/* Bulk Actions Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {selectedIds.size === announcements.length && announcements.length > 0 ? (
                    <CheckSquare size={18} className="text-blue-600" />
                  ) : (
                    <Square size={18} />
                  )}
                  {selectedIds.size === announcements.length && announcements.length > 0
                    ? "لغو انتخاب همه"
                    : "انتخاب همه"}
                </button>
                {selectedIds.size > 0 && (
                  <>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedIds.size} مورد انتخاب شده
                    </span>
                    <button
                      onClick={clearSelection}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      پاک کردن
                    </button>
                  </>
                )}
              </div>

              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowBulkDeactivateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    <ToggleLeft size={16} />
                    غیرفعال کردن گروهی ({selectedIds.size})
                  </button>
                  <button
                    onClick={() => setShowBulkDeleteModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    <Trash2 size={16} />
                    حذف گروهی ({selectedIds.size})
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Announcements Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-12">
                      <button onClick={toggleSelectAll} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                        {selectedIds.size === announcements.length && announcements.length > 0 ? (
                          <CheckSquare size={18} className="text-blue-600" />
                        ) : (
                          <Square size={18} />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      عنوان
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      بخش
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      اولویت
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      وضعیت
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      ایجاد شده توسط
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {announcements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <Bell size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">
                          هیچ اعلانی وجود ندارد
                        </p>
                      </td>
                    </tr>
                  ) : (
                    announcements.map((announcement) => (
                      <tr
                        key={announcement.id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                          selectedIds.has(announcement.id) ? "bg-blue-50 dark:bg-blue-900/20" : ""
                        }`}
                      >
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => toggleSelection(announcement.id)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          >
                            {selectedIds.has(announcement.id) ? (
                              <CheckSquare size={18} className="text-blue-600" />
                            ) : (
                              <Square size={18} className="text-gray-400" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {announcement.title}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(announcement.createdAt).toLocaleDateString("fa-IR")}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {announcement.department ? (
                              announcement.department.name
                            ) : (
                              <span className="text-blue-600 dark:text-blue-400 font-medium">
                                همه شرکت
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPriorityBadge(announcement.priority)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(announcement)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {announcement.createdBy?.name || "نامشخص"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            {/* View Details */}
                            <button
                              onClick={() => openViewModal(announcement)}
                              className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
                              title="مشاهده جزئیات"
                            >
                              <Eye size={18} />
                            </button>

                            {/* View Statistics */}
                            <button
                              onClick={() => openViewersModal(announcement)}
                              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors"
                              title="آمار بازدید"
                            >
                              <BarChart3 size={18} />
                            </button>

                            {/* Toggle Active/Inactive */}
                            <button
                              onClick={() => toggleActive(announcement)}
                              disabled={actionLoading}
                              className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
                              title={announcement.isActive ? "غیرفعال کردن" : "فعال کردن"}
                            >
                              {announcement.isActive ? (
                                <ToggleRight size={20} className="text-green-600 dark:text-green-400" />
                              ) : (
                                <ToggleLeft size={20} />
                              )}
                            </button>

                            {/* Edit */}
                            <Link
                              href={`/announcements/${announcement.id}/edit`}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                              title="ویرایش"
                            >
                              <Pencil size={18} />
                            </Link>

                            {/* Delete */}
                            <button
                              onClick={() => openDeleteModal(announcement)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                              title="حذف"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* View Details Modal */}
        {showViewModal && selectedAnnouncement && (
          <AnnouncementModal
            announcement={selectedAnnouncement}
            onClose={closeViewModal}
          />
        )}

        {/* Viewers Statistics Modal */}
        {showViewersModal && selectedAnnouncement && (
          <AnnouncementViewersModal
            announcementId={selectedAnnouncement.id}
            onClose={closeViewersModal}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedAnnouncement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
              <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
                حذف اعلان
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                آیا از حذف اعلان <strong>"{selectedAnnouncement.title}"</strong> اطمینان دارید؟
                <br />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  این عملیات قابل بازگشت نیست.
                </span>
              </p>
              <div className="flex justify-end space-x-4 space-x-reverse">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedAnnouncement(null);
                  }}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {actionLoading ? "در حال حذف..." : "حذف اعلان"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Delete Modal */}
        {showBulkDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="text-red-500" size={24} />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  حذف گروهی اعلانات
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                آیا مطمئن هستید که می‌خواهید <span className="font-bold text-red-600">{selectedIds.size}</span> اعلان را حذف کنید؟
                <br />
                <span className="text-sm text-gray-500 dark:text-gray-400 mt-2 block">
                  این عملیات قابل بازگشت نیست.
                </span>
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowBulkDeleteModal(false)}
                  disabled={bulkLoading}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  انصراف
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkLoading}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      در حال حذف...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      حذف {selectedIds.size} اعلان
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Deactivate Modal */}
        {showBulkDeactivateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <ToggleLeft className="text-gray-600 dark:text-gray-400" size={24} />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  غیرفعال کردن گروهی اعلانات
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                آیا مطمئن هستید که می‌خواهید <span className="font-bold text-gray-700 dark:text-gray-200">{selectedIds.size}</span> اعلان را غیرفعال کنید؟
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowBulkDeactivateModal(false)}
                  disabled={bulkLoading}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  انصراف
                </button>
                <button
                  onClick={handleBulkDeactivate}
                  disabled={bulkLoading}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      در حال غیرفعال کردن...
                    </>
                  ) : (
                    <>
                      <ToggleLeft size={18} />
                      غیرفعال کردن {selectedIds.size} اعلان
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
