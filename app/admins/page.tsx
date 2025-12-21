"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UserPlus, Shield, Trash2, Key, CheckCircle, XCircle } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";
import { useToast } from "@/contexts/ToastContext";

interface AdminUser {
  id: string;
  mobile: string;
  email: string | null;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminsPage() {
  const toast = useToast();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [initialPassword, setInitialPassword] = useState("");

  // Form states
  const [formData, setFormData] = useState({
    mobile: "",
    name: "",
    email: "",
    password: "",
    isActive: true,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session.user.role !== "ADMIN") {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated" && session.user.role === "ADMIN") {
      fetchAdmins();
    }
  }, [status, session]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users?role=ADMIN&showAdmins=true");
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
      setError("خطا در بارگذاری لیست ادمین‌ها");
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const length = 10;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // تولید رمز عبور تصادفی اگر وارد نشده
    const passwordToUse = formData.password || generatePassword();
    setInitialPassword(passwordToUse);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          role: "ADMIN",
          password: passwordToUse,
          departmentId: null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        await fetchAdmins();
        setFormData({ mobile: "", name: "", email: "", password: "", isActive: true });
        toast.success(
          `ادمین با موفقیت ایجاد شد!\n\nرمز عبور اولیه: ${passwordToUse}\n\nلطفاً این رمز را یادداشت کنید. کاربر باید در اولین ورود رمز عبور را تغییر دهد.`
        );
        setShowCreateModal(false);
        setInitialPassword("");
      } else {
        setError(data.error || "خطا در ایجاد ادمین");
      }
    } catch (err) {
      setError("خطایی رخ داد. لطفاً دوباره تلاش کنید");
    }
  };

  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return;

    try {
      const res = await fetch(`/api/users/${selectedAdmin.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchAdmins();
        setShowDeleteModal(false);
        setSelectedAdmin(null);
        toast.success("ادمین با موفقیت حذف شد");
      } else {
        const data = await res.json();
        toast.error(data.error || "خطا در حذف ادمین");
      }
    } catch (error) {
      toast.error("خطا در حذف ادمین");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">در حال بارگذاری...</div>
      </div>
    );
  }

  if (session?.user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex" dir="rtl">
      <Sidebar />
      <AppHeader />

      <main className="flex-1 lg:mr-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
              <Shield className="text-red-600" size={32} />
              مدیریت ادمین‌ها
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              مدیریت کاربران ادمین سیستم و دسترسی‌های ویژه
            </p>
          </div>
          <button
            onClick={() => {
              setFormData({ mobile: "", name: "", email: "", password: "", isActive: true });
              setError("");
              setShowCreateModal(true);
            }}
            className="flex items-center space-x-2 space-x-reverse bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition shadow-lg"
          >
            <UserPlus size={20} />
            <span>ادمین جدید</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* دسترسی‌های ویژه ادمین */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
          <div className="flex items-start space-x-3 space-x-reverse">
            <Shield className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" size={24} />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-3">
                دسترسی‌های ویژه مدیرعامل (ADMIN)
              </h3>
              <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 ml-2">•</span>
                  <span>مدیریت کامل تمام بخش‌های سیستم</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 ml-2">•</span>
                  <span>ایجاد، ویرایش و حذف ادمین‌های دیگر</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 ml-2">•</span>
                  <span>دسترسی به تنظیمات سیستم و پیکربندی</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 ml-2">•</span>
                  <span><strong>پشتیبان‌گیری و بازیابی دیتابیس</strong> - از طریق بخش تنظیمات</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 ml-2">•</span>
                  <span>مدیریت بخش‌ها، مدیران و کارمندان</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 ml-2">•</span>
                  <span>دسترسی کامل به تمام فیدبک‌ها و گزارش‌ها</span>
                </li>
              </ul>
              <div className="mt-4 pt-4 border-t border-blue-300 dark:border-blue-700">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  💡 نکته: برای پشتیبان‌گیری از دیتابیس، به بخش "تنظیمات" → "پشتیبان‌گیری" مراجعه کنید.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Admins Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  نام
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  موبایل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  ایمیل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  وضعیت
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  تاریخ ایجاد
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <Shield size={48} className="mx-auto mb-4 opacity-30" />
                    <p>هیچ ادمینی یافت نشد</p>
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Shield className="text-red-600 ml-2" size={20} />
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {admin.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {admin.mobile}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {admin.email || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {admin.isActive ? (
                        <span className="flex items-center text-green-600">
                          <CheckCircle size={16} className="ml-1" />
                          فعال
                        </span>
                      ) : (
                        <span className="flex items-center text-red-600">
                          <XCircle size={16} className="ml-1" />
                          غیرفعال
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(admin.createdAt).toLocaleDateString("fa-IR")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {admin.id !== session.user.id && (
                        <button
                          onClick={() => {
                            setSelectedAdmin(admin);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                          title="حذف ادمین"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Create Admin Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-3">
                <Shield className="text-red-600" />
                ایجاد ادمین جدید
              </h2>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نام *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    شماره موبایل *
                  </label>
                  <input
                    type="text"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="09123456789"
                    required
                    pattern="09\d{9}"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ایمیل
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    رمز عبور (اختیاری)
                  </label>
                  <div className="relative">
                    <Key className="absolute right-3 top-3 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="در صورت خالی بودن، رمز تصادفی تولید می‌شود"
                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    حداقل 6 کاراکتر. اگر خالی بگذارید، رمز تصادفی تولید می‌شود.
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="mr-1.5 block text-sm text-gray-700 dark:text-gray-300">
                    کاربر فعال
                  </label>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    <strong>توجه:</strong> کاربر در اولین ورود باید رمز عبور را تغییر دهد.
                  </p>
                </div>

                <div className="flex justify-end space-x-4 space-x-reverse pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({ mobile: "", name: "", email: "", password: "", isActive: true });
                      setError("");
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    ایجاد ادمین
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                حذف ادمین
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                آیا از حذف ادمین "{selectedAdmin.name}" اطمینان دارید؟
                <br />
                <strong className="text-red-600">این عملیات قابل بازگشت نیست!</strong>
              </p>
              <div className="flex justify-end space-x-4 space-x-reverse">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedAdmin(null);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  انصراف
                </button>
                <button
                  onClick={handleDeleteAdmin}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  حذف ادمین
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
