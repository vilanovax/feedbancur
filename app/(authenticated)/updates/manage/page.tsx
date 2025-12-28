"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Newspaper,
  ArrowRight,
  Search,
  Plus,
  Loader2,
  Edit2,
  Trash2,
  Send,
  Eye,
  FileEdit,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";
import { useUpdates } from "@/lib/swr/hooks";
import { UpdateCard } from "@/components/UpdateCard";
import { UpdateModal } from "@/components/UpdateModal";
import { UpdateForm } from "@/components/UpdateForm";
import { toast } from "sonner";
import { mutate } from "swr";

export default function UpdatesManagePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showDrafts, setShowDrafts] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedUpdate, setSelectedUpdate] = useState<any>(null);
  const [editingUpdate, setEditingUpdate] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const { data, isLoading, error } = useUpdates({
    search: search || undefined,
    drafts: showDrafts || undefined,
    page,
    limit: 20,
  });

  const updates = data?.data || [];
  const pagination = data?.pagination;

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این اطلاع‌رسانی مطمئن هستید؟")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/updates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("خطا در حذف");

      toast.success("اطلاع‌رسانی با موفقیت حذف شد");
      mutate((key: any) => typeof key === "string" && key.startsWith("/api/updates"));
    } catch (error) {
      toast.error("خطا در حذف اطلاع‌رسانی");
    } finally {
      setDeletingId(null);
    }
  };

  const handlePublish = async (id: string) => {
    setPublishingId(id);
    try {
      const res = await fetch(`/api/updates/${id}/publish`, { method: "POST" });
      if (!res.ok) throw new Error("خطا در انتشار");

      toast.success("اطلاع‌رسانی با موفقیت منتشر شد");
      mutate((key: any) => typeof key === "string" && key.startsWith("/api/updates"));
    } catch (error) {
      toast.error("خطا در انتشار اطلاع‌رسانی");
    } finally {
      setPublishingId(null);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  if (session?.user?.role !== "ADMIN") {
    router.push("/updates");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex" dir="rtl">
      <Sidebar />
      <AppHeader />
      <main className="flex-1 lg:mr-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Newspaper className="text-blue-500" />
                مدیریت اطلاع‌رسانی‌ها
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                ایجاد، ویرایش و مدیریت اطلاع‌رسانی‌ها
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/updates"
                className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
              >
                <ArrowRight className="w-4 h-4" />
                بازگشت
              </Link>
              <button
                onClick={() => {
                  setShowCreateForm(true);
                  setEditingUpdate(null);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                ایجاد جدید
              </button>
            </div>
          </div>

          {/* Create/Edit Form Modal */}
          {(showCreateForm || editingUpdate) && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  {editingUpdate ? "ویرایش اطلاع‌رسانی" : "ایجاد اطلاع‌رسانی جدید"}
                </h2>
                <UpdateForm
                  initialData={editingUpdate || undefined}
                  onSuccess={() => {
                    setShowCreateForm(false);
                    setEditingUpdate(null);
                    mutate((key: any) =>
                      typeof key === "string" && key.startsWith("/api/updates")
                    );
                  }}
                  onCancel={() => {
                    setShowCreateForm(false);
                    setEditingUpdate(null);
                  }}
                />
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* جستجو */}
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="جستجو..."
                  className="w-full pr-10 pl-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Toggle Drafts */}
              <button
                onClick={() => {
                  setShowDrafts(!showDrafts);
                  setPage(1);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  showDrafts
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                    : "border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <FileEdit className="w-4 h-4" />
                {showDrafts ? "پیش‌نویس‌ها" : "منتشر شده‌ها"}
              </button>
            </div>
          </div>

          {/* Updates List */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : error ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <p className="text-red-500">خطا در بارگذاری</p>
            </div>
          ) : updates.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <Newspaper className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {showDrafts
                  ? "پیش‌نویسی وجود ندارد"
                  : "اطلاع‌رسانی‌ای وجود ندارد"}
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                ایجاد اولین اطلاع‌رسانی
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {updates.map((update: any) => (
                  <div
                    key={update.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <UpdateCard update={update} compact />
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedUpdate(update)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="مشاهده"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setEditingUpdate(update)}
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                          title="ویرایش"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {update.isDraft && (
                          <button
                            onClick={() => handlePublish(update.id)}
                            disabled={publishingId === update.id}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors disabled:opacity-50"
                            title="انتشار"
                          >
                            {publishingId === update.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(update.id)}
                          disabled={deletingId === update.id}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                          title="حذف"
                        >
                          {deletingId === update.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    قبلی
                  </button>
                  <span className="text-gray-600 dark:text-gray-400">
                    صفحه {pagination.page} از {pagination.totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(pagination.totalPages, p + 1))
                    }
                    disabled={page === pagination.totalPages}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    بعدی
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* View Modal */}
      {selectedUpdate && (
        <UpdateModal
          update={selectedUpdate}
          onClose={() => setSelectedUpdate(null)}
        />
      )}
    </div>
  );
}
