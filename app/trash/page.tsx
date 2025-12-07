"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Trash2, RotateCcw, X, AlertTriangle, Calendar, Building2, User, Star } from "lucide-react";
import { format } from "date-fns";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";

export default function TrashPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEmptyModal, setShowEmptyModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [emptying, setEmptying] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/");
    } else if (status === "authenticated") {
      fetchTrash();
    }
  }, [status, router, session]);

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/feedback/trash");
      if (res.ok) {
        const data = await res.json();
        console.log("Trash fetched:", data.length, "items");
        setFeedbacks(data);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Error fetching trash:", res.status, errorData);
        setFeedbacks([]);
      }
    } catch (error) {
      console.error("Error fetching trash:", error);
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (feedbackId: string) => {
    try {
      const res = await fetch(`/api/feedback/${feedbackId}/restore`, {
        method: "POST",
      });

      if (res.ok) {
        fetchTrash();
      } else {
        const data = await res.json();
        alert(data.error || "خطا در بازگرداندن فیدبک");
      }
    } catch (error) {
      console.error("Error restoring feedback:", error);
      alert("خطا در بازگرداندن فیدبک");
    }
  };

  const openDeleteModal = (feedback: any) => {
    setSelectedFeedback(feedback);
    setShowDeleteModal(true);
  };

  const handlePermanentDelete = async () => {
    if (!selectedFeedback) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/feedback/${selectedFeedback.id}/permanent-delete`, {
        method: "DELETE",
      });

      if (res.ok) {
        setShowDeleteModal(false);
        setSelectedFeedback(null);
        fetchTrash();
      } else {
        const data = await res.json();
        alert(data.error || "خطا در حذف فیدبک");
      }
    } catch (error) {
      console.error("Error deleting feedback:", error);
      alert("خطا در حذف فیدبک");
    } finally {
      setDeleting(false);
    }
  };

  const handleEmptyTrash = async () => {
    setEmptying(true);
    try {
      const res = await fetch("/api/feedback/trash", {
        method: "DELETE",
      });

      if (res.ok) {
        const data = await res.json();
        setShowEmptyModal(false);
        setFeedbacks([]);
        alert(`${data.count} فیدبک با موفقیت حذف شد`);
      } else {
        const data = await res.json();
        alert(data.error || "خطا در خالی کردن سطل آشغال");
      }
    } catch (error) {
      console.error("Error emptying trash:", error);
      alert("خطا در خالی کردن سطل آشغال");
    } finally {
      setEmptying(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "REVIEWED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "ARCHIVED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      case "DEFERRED":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "COMPLETED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "در انتظار";
      case "REVIEWED":
        return "بررسی شده";
      case "ARCHIVED":
        return "آرشیو شده";
      case "DEFERRED":
        return "رسیدگی آینده";
      case "COMPLETED":
        return "انجام شد";
      default:
        return status;
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
              <Trash2 size={32} />
              سطل آشغال
            </h1>
            {feedbacks.length > 0 && (
              <button
                onClick={() => setShowEmptyModal(true)}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                <Trash2 size={20} />
                خالی کردن سطل آشغال
              </button>
            )}
          </div>

          {feedbacks.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <Trash2 size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                سطل آشغال خالی است
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {feedbacks.map((feedback) => (
                <div
                  key={feedback.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white line-clamp-2 flex-1">
                      {feedback.title}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse mb-3 flex-wrap gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        feedback.status
                      )}`}
                    >
                      {getStatusText(feedback.status)}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <Building2 size={14} />
                      <span>{feedback.department?.name}</span>
                    </div>
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <User size={14} />
                      <span>{feedback.user?.name || "ناشناس"}</span>
                    </div>
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <Calendar size={14} />
                      <span>
                        {feedback.deletedAt
                          ? format(new Date(feedback.deletedAt), "yyyy/MM/dd")
                          : "-"}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3 mb-4 flex-grow">
                    {feedback.content}
                  </p>

                  <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleRestore(feedback.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                    >
                      <RotateCcw size={16} />
                      بازگرداندن
                    </button>
                    <button
                      onClick={() => openDeleteModal(feedback)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                    >
                      <X size={16} />
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal حذف کامل */}
        {showDeleteModal && selectedFeedback && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="text-red-500" size={24} />
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  حذف کامل فیدبک
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                آیا مطمئن هستید که می‌خواهید این فیدبک را به طور کامل حذف کنید؟
                این عمل غیرقابل بازگشت است.
              </p>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded mb-4">
                <p className="text-sm font-medium text-gray-800 dark:text-white">
                  {selectedFeedback.title}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedFeedback(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  انصراف
                </button>
                <button
                  onClick={handlePermanentDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  {deleting ? "در حال حذف..." : "حذف کامل"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal خالی کردن سطل آشغال */}
        {showEmptyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="text-red-500" size={24} />
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  خالی کردن سطل آشغال
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                آیا مطمئن هستید که می‌خواهید همه فیدبک‌های موجود در سطل آشغال را
                به طور کامل حذف کنید؟ این عمل غیرقابل بازگشت است.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                تعداد فیدبک‌های موجود: {feedbacks.length}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEmptyModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  انصراف
                </button>
                <button
                  onClick={handleEmptyTrash}
                  disabled={emptying}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  {emptying ? "در حال حذف..." : "خالی کردن"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

