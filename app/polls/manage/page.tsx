"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Eye,
  Copy,
  Clock,
  Lock,
  Users,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";
import { TypeBadge, VisibilityBadge, StatusBadge } from "@/components/PollBadges";

export default function ManagePollsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [canCreatePoll, setCanCreatePoll] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      if (session.user.role === "EMPLOYEE") {
        router.push("/polls");
      } else {
        fetchPolls();
        checkPollPermission();
      }
    }
  }, [status, session, router]);

  const checkPollPermission = async () => {
    // ادمین همیشه می‌تواند نظرسنجی ایجاد کند
    if (session?.user.role === "ADMIN") {
      setCanCreatePoll(true);
      return;
    }

    // برای مدیران، بررسی دسترسی بخش
    if (session?.user.role === "MANAGER" && session.user.departmentId) {
      try {
        const res = await fetch(`/api/departments/${session.user.departmentId}`);
        if (res.ok) {
          const dept = await res.json();
          setCanCreatePoll(dept.canCreatePoll || false);
        }
      } catch (error) {
        console.error("Error checking poll permission:", error);
        setCanCreatePoll(false);
      }
    }
  };

  const fetchPolls = async () => {
    try {
      const res = await fetch("/api/polls?showAll=true");
      if (res.ok) {
        const data = await res.json();
        setPolls(data);
      }
    } catch (error) {
      console.error("Error fetching polls:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (poll: any) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/polls/${poll.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !poll.isActive,
        }),
      });

      if (res.ok) {
        fetchPolls();
      } else {
        const data = await res.json();
        alert(data.error || "خطا در تغییر وضعیت");
      }
    } catch (error) {
      alert("خطایی رخ داد");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopy = async (poll: any) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/polls/${poll.id}/copy`, {
        method: "POST",
      });

      if (res.ok) {
        fetchPolls();
        alert("نظرسنجی با موفقیت کپی شد");
      } else {
        const data = await res.json();
        alert(data.error || "خطا در کپی نظرسنجی");
      }
    } catch (error) {
      alert("خطایی رخ داد");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPoll) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/polls/${selectedPoll.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setShowDeleteModal(false);
        setSelectedPoll(null);
        fetchPolls();
      } else {
        const data = await res.json();
        alert(data.error || "خطا در حذف نظرسنجی");
      }
    } catch (error) {
      alert("خطایی رخ داد");
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteModal = (poll: any) => {
    setSelectedPoll(poll);
    setShowDeleteModal(true);
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
              <BarChart3 size={32} />
              مدیریت نظرسنجی‌ها
            </h1>
            {canCreatePoll ? (
              <Link
                href="/polls/create"
                className="flex items-center space-x-2 space-x-reverse bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                <span>نظرسنجی جدید</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                <Lock size={16} />
                <span>دسترسی ایجاد نظرسنجی برای شما فعال نیست</span>
              </div>
            )}
          </div>

          {/* Polls Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      عنوان
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      نوع
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      بخش
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      وضعیت
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      پاسخ‌ها
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {polls.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">
                          هیچ نظرسنجی وجود ندارد
                        </p>
                      </td>
                    </tr>
                  ) : (
                    polls.map((poll) => (
                      <tr
                        key={poll.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {poll.title}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(poll.createdAt).toLocaleDateString("fa-IR")}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <TypeBadge type={poll.type} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {poll.department ? (
                              poll.department.name
                            ) : (
                              <span className="text-blue-600 dark:text-blue-400 font-medium">
                                همه شرکت
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge poll={poll} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                            <Users size={16} className="text-gray-400" />
                            {poll._count?.responses || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            {/* View Poll */}
                            <Link
                              href={`/polls/${poll.id}`}
                              className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
                              title="مشاهده"
                            >
                              <Eye size={18} />
                            </Link>

                            {/* View Results */}
                            <Link
                              href={`/polls/${poll.id}/results`}
                              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors"
                              title="نتایج"
                            >
                              <BarChart3 size={18} />
                            </Link>

                            {/* Toggle Active/Inactive */}
                            <button
                              onClick={() => toggleActive(poll)}
                              disabled={actionLoading}
                              className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
                              title={poll.isActive ? "غیرفعال کردن" : "فعال کردن"}
                            >
                              {poll.isActive ? (
                                <ToggleRight size={20} className="text-green-600 dark:text-green-400" />
                              ) : (
                                <ToggleLeft size={20} />
                              )}
                            </button>

                            {/* Copy */}
                            <button
                              onClick={() => handleCopy(poll)}
                              disabled={actionLoading}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors disabled:opacity-50"
                              title="کپی"
                            >
                              <Copy size={18} />
                            </button>

                            {/* Edit */}
                            <Link
                              href={`/polls/${poll.id}/edit`}
                              className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 transition-colors"
                              title="ویرایش"
                            >
                              <Pencil size={18} />
                            </Link>

                            {/* Delete */}
                            <button
                              onClick={() => openDeleteModal(poll)}
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

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedPoll && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
              <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
                حذف نظرسنجی
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                آیا از حذف نظرسنجی <strong>"{selectedPoll.title}"</strong> اطمینان دارید؟
                <br />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  این عملیات قابل بازگشت نیست و تمام پاسخ‌ها نیز حذف خواهند شد.
                </span>
              </p>
              <div className="flex justify-end space-x-4 space-x-reverse">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedPoll(null);
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
                  {actionLoading ? "در حال حذف..." : "حذف نظرسنجی"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
