"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Archive,
  Star,
  Calendar,
  Building2,
  User,
  Search,
  Filter,
  X,
  RotateCcw,
  FileText,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";

export default function ArchivePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [unarchiving, setUnarchiving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchFeedbacks();
  }, [selectedDepartment, searchQuery]);

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

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("status", "ARCHIVED");
      if (selectedDepartment) params.append("departmentId", selectedDepartment);

      const res = await fetch(`/api/feedback?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data);
      }
    } catch (error) {
      console.error("Error fetching archived feedbacks:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFeedbacks = feedbacks.filter((feedback) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      feedback.title?.toLowerCase().includes(query) ||
      feedback.content?.toLowerCase().includes(query) ||
      feedback.user?.name?.toLowerCase().includes(query) ||
      feedback.department?.name?.toLowerCase().includes(query)
    );
  });

  const handleFeedbackClick = (feedback: any) => {
    setSelectedFeedback(feedback);
    setShowModal(true);
  };

  const handleUnarchive = async () => {
    if (!selectedFeedback) return;

    setUnarchiving(true);
    try {
      const res = await fetch(`/api/feedback/${selectedFeedback.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "REVIEWED", // یا می‌توانید به PENDING تغییر دهید
        }),
      });

      if (res.ok) {
        // حذف فیدبک از لیست
        setFeedbacks((prev) =>
          prev.filter((f) => f.id !== selectedFeedback.id)
        );
        setShowModal(false);
        setSelectedFeedback(null);
        // می‌توانید یک پیام موفقیت نمایش دهید
        alert("فیدبک با موفقیت از آرشیو خارج شد");
      } else {
        const data = await res.json();
        alert(data.error || "خطا در خارج کردن از آرشیو");
      }
    } catch (error) {
      console.error("Error unarchiving feedback:", error);
      alert("خطا در خارج کردن از آرشیو");
    } finally {
      setUnarchiving(false);
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
        <div className="mb-8">
          <div className="flex items-center space-x-3 space-x-reverse mb-4">
            <Archive className="text-gray-700 dark:text-gray-300" size={32} />
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              آرشیو فیدبک‌ها
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            فیدبک‌های بایگانی شده
          </p>
        </div>

        {/* فیلترها و جستجو */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Search className="inline ml-2" size={16} />
                جستجو
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در عنوان، محتوا، کاربر یا بخش..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Filter className="inline ml-2" size={16} />
                فیلتر بر اساس بخش
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">همه بخش‌ها</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* لیست فیدبک‌ها */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl text-gray-600 dark:text-gray-400">
              در حال بارگذاری...
            </div>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <Archive className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              فیدبک بایگانی شده‌ای یافت نشد
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredFeedbacks.map((feedback) => (
              <div
                key={feedback.id}
                onClick={() => handleFeedbackClick(feedback)}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 space-x-reverse mb-2">
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                        {feedback.title}
                      </h3>
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-xs font-medium">
                        بایگانی شده
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-1 space-x-reverse">
                        <Building2 size={16} />
                        <span>{feedback.department?.name || "نامشخص"}</span>
                      </div>
                      <div className="flex items-center space-x-1 space-x-reverse">
                        <User size={16} />
                        <span>{feedback.user?.name || "ناشناس"}</span>
                      </div>
                      <div className="flex items-center space-x-1 space-x-reverse">
                        <Calendar size={16} />
                        <span>
                          {format(new Date(feedback.createdAt), "yyyy/MM/dd")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-3">
                  {feedback.content}
                </p>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    برای مشاهده جزئیات کامل کلیک کنید
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* نمایش تعداد نتایج */}
        {!loading && filteredFeedbacks.length > 0 && (
          <div className="mt-6 text-center text-gray-600 dark:text-gray-400">
            نمایش {filteredFeedbacks.length} فیدبک بایگانی شده
          </div>
        )}

        {/* مودال نمایش جزئیات فیدبک */}
        {showModal && selectedFeedback && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              {/* هدر مودال */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 space-x-reverse mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                      {selectedFeedback.title}
                    </h2>
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-xs font-medium">
                      بایگانی شده
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <Building2 size={16} />
                      <span>{selectedFeedback.department?.name || "نامشخص"}</span>
                    </div>
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <User size={16} />
                      <span>{selectedFeedback.user?.name || "ناشناس"}</span>
                    </div>
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <Calendar size={16} />
                      <span>
                        {format(
                          new Date(selectedFeedback.createdAt),
                          "yyyy/MM/dd HH:mm"
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedFeedback(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X size={24} />
                </button>
              </div>

              {/* محتوای مودال */}
              <div className="p-6 space-y-6">
                {/* محتوای فیدبک */}
                <div>
                  <div className="flex items-center space-x-2 space-x-reverse mb-3">
                    <MessageSquare className="text-blue-500" size={20} />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                      محتوای فیدبک
                    </h3>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedFeedback.content}
                    </p>
                  </div>
                </div>

                {/* توضیحات ادمین */}
                {selectedFeedback.adminNotes && (
                  <div>
                    <div className="flex items-center space-x-2 space-x-reverse mb-3">
                      <FileText className="text-green-500" size={20} />
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        توضیحات ادمین
                      </h3>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {selectedFeedback.adminNotes}
                      </p>
                    </div>
                  </div>
                )}

                {/* پاسخ کاربر */}
                {selectedFeedback.userResponse && (
                  <div>
                    <div className="flex items-center space-x-2 space-x-reverse mb-3">
                      <MessageSquare className="text-purple-500" size={20} />
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        پاسخ کاربر
                      </h3>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {selectedFeedback.userResponse}
                      </p>
                    </div>
                  </div>
                )}

                {/* اطلاعات تکمیلی */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        تاریخ ایجاد:
                      </span>
                      <span className="mr-2 text-gray-800 dark:text-white">
                        {format(
                          new Date(selectedFeedback.createdAt),
                          "yyyy/MM/dd HH:mm"
                        )}
                      </span>
                    </div>
                    {selectedFeedback.updatedAt !==
                      selectedFeedback.createdAt && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          آخرین بروزرسانی:
                        </span>
                        <span className="mr-2 text-gray-800 dark:text-white">
                          {format(
                            new Date(selectedFeedback.updatedAt),
                            "yyyy/MM/dd HH:mm"
                          )}
                        </span>
                      </div>
                    )}
                    {selectedFeedback.completedBy && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          بایگانی شده توسط:
                        </span>
                        <span className="mr-2 text-gray-800 dark:text-white">
                          {selectedFeedback.completedBy?.name || "نامشخص"}
                        </span>
                      </div>
                    )}
                    {selectedFeedback.completedAt && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          تاریخ بایگانی:
                        </span>
                        <span className="mr-2 text-gray-800 dark:text-white">
                          {format(
                            new Date(selectedFeedback.completedAt),
                            "yyyy/MM/dd HH:mm"
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* دکمه‌های عملیات */}
                {(session?.user?.role === "ADMIN" ||
                  session?.user?.role === "MANAGER") && (
                  <div className="flex justify-end space-x-4 space-x-reverse pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleUnarchive}
                      disabled={unarchiving}
                      className="flex items-center space-x-2 space-x-reverse bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <RotateCcw size={20} />
                      <span>
                        {unarchiving
                          ? "در حال خارج کردن..."
                          : "خارج کردن از آرشیو"}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

