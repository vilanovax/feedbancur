"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UserPlus, Pencil, Trash2, Search, Shield, User, CheckCircle, XCircle } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";
import { useToast } from "@/contexts/ToastContext";

interface Department {
  id: string;
  name: string;
}

interface UserType {
  id: string;
  mobile: string;
  email: string | null;
  name: string;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
  isActive: boolean;
  departmentId: string | null;
  department: Department | null;
  createdAt: string;
}

export default function UsersPage() {
  const toast = useToast();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserType[]>(() => {
    // بارگذاری از cache در صورت وجود
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("users_cache");
      const cacheTime = localStorage.getItem("users_cache_time");
      if (cached && cacheTime) {
        const timeDiff = Date.now() - parseInt(cacheTime);
        // Cache برای 5 دقیقه معتبر است
        if (timeDiff < 5 * 60 * 1000) {
          try {
            return JSON.parse(cached);
          } catch (e) {
            localStorage.removeItem("users_cache");
            localStorage.removeItem("users_cache_time");
          }
        }
      }
    }
    return [];
  });
  const [departments, setDepartments] = useState<Department[]>(() => {
    // بارگذاری بخش‌ها از cache
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("departments_cache");
      const cacheTime = localStorage.getItem("departments_cache_time");
      if (cached && cacheTime) {
        const timeDiff = Date.now() - parseInt(cacheTime);
        if (timeDiff < 10 * 60 * 1000) { // 10 دقیقه برای بخش‌ها
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [initialPassword, setInitialPassword] = useState("");

  // Form states
  const [formData, setFormData] = useState({
    mobile: "",
    name: "",
    email: "",
    role: "EMPLOYEE" as "MANAGER" | "EMPLOYEE",
    departmentId: "",
    password: "",
    isActive: true,
  });

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
      fetchUsers();
      fetchDepartments();
    }
  }, [status, roleFilter, departmentFilter, search]);

  const fetchUsers = async () => {
    // اگر cache معتبر وجود دارد و فیلترها خالی هستند، از آن استفاده کن
    if (!roleFilter && !departmentFilter && !search) {
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem("users_cache");
        const cacheTime = localStorage.getItem("users_cache_time");
        if (cached && cacheTime) {
          const timeDiff = Date.now() - parseInt(cacheTime);
          if (timeDiff < 5 * 60 * 1000) {
            try {
              const cachedData = JSON.parse(cached);
              setUsers(cachedData);
              setLoading(false);
              // در پس‌زمینه به‌روزرسانی کن
              fetchUsersFromAPI();
              return;
            } catch (e) {
              // اگر parse نشد، ادامه بده و از API بگیر
            }
          }
        }
      }
    }

    // اگر cache وجود ندارد یا فیلترها اعمال شده‌اند، از API بگیر
    await fetchUsersFromAPI();
  };

  const fetchUsersFromAPI = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (roleFilter) params.append("role", roleFilter);
      if (departmentFilter) params.append("departmentId", departmentFilter);
      if (search) params.append("search", search);

      const res = await fetch(`/api/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        // ذخیره در cache فقط اگر فیلترها خالی باشند
        if (!roleFilter && !departmentFilter && !search) {
          if (typeof window !== "undefined") {
            localStorage.setItem("users_cache", JSON.stringify(data));
            localStorage.setItem("users_cache_time", Date.now().toString());
          }
        }
      } else {
        setError("خطا در دریافت کاربران");
      }
    } catch (err) {
      setError("خطا در دریافت کاربران");
    } finally {
      setLoading(false);
    }
  };

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
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        const createdPassword = formData.password || "123456";
        setInitialPassword(createdPassword);
        setShowCreateModal(false);
        setFormData({
          mobile: "",
          name: "",
          email: "",
          role: "EMPLOYEE",
          departmentId: "",
          password: "",
          isActive: true,
        });
        setError("");
        // پاک کردن cache برای به‌روزرسانی
        if (typeof window !== "undefined") {
          localStorage.removeItem("users_cache");
          localStorage.removeItem("users_cache_time");
        }
        fetchUsers();
        if (formData.password) {
          toast.success(`کاربر با موفقیت ایجاد شد!\nرمز عبور: ${formData.password}`);
        } else {
          toast.success(`کاربر با موفقیت ایجاد شد!\nرمز عبور پیش‌فرض: 123456\nکاربر باید در اولین ورود رمز را تغییر دهد`);
        }
      } else {
        const errorMessage = data.error || "خطا در ایجاد کاربر";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      const errorMessage = "خطا در ایجاد کاربر";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setError("");

    try {
      const updateData: any = {
        mobile: formData.mobile,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        departmentId: formData.departmentId,
        isActive: formData.isActive,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();

      if (res.ok) {
        setShowEditModal(false);
        setSelectedUser(null);
        setError("");
        // پاک کردن cache برای به‌روزرسانی
        if (typeof window !== "undefined") {
          localStorage.removeItem("users_cache");
          localStorage.removeItem("users_cache_time");
        }
        fetchUsers();
        toast.success("کاربر با موفقیت بروزرسانی شد");
      } else {
        const errorMessage = data.error || "خطا در بروزرسانی کاربر";
        setError(errorMessage);
        // نمایش پیام خطا به صورت alert هم برای اطمینان
        toast.error(errorMessage);
      }
    } catch (err) {
      const errorMessage = "خطا در بروزرسانی کاربر";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setShowDeleteModal(false);
        setSelectedUser(null);
        // پاک کردن cache برای به‌روزرسانی
        if (typeof window !== "undefined") {
          localStorage.removeItem("users_cache");
          localStorage.removeItem("users_cache_time");
        }
        fetchUsers();
        toast.success("کاربر با موفقیت حذف شد");
      } else {
        const data = await res.json();
        setError(data.error || "خطا در حذف کاربر");
      }
    } catch (err) {
      setError("خطا در حذف کاربر");
    }
  };

  const openEditModal = (user: UserType) => {
    setSelectedUser(user);
    setFormData({
      mobile: user.mobile,
      name: user.name,
      email: user.email || "",
      role: user.role as "MANAGER" | "EMPLOYEE",
      departmentId: user.departmentId || "",
      password: "",
      isActive: user.isActive ?? true,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user: UserType) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      ADMIN: "bg-red-100 text-red-800",
      MANAGER: "bg-blue-100 text-blue-800",
      EMPLOYEE: "bg-green-100 text-green-800",
    };

    const labels = {
      ADMIN: "مدیرعامل",
      MANAGER: "مدیر",
      EMPLOYEE: "کارمند",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[role as keyof typeof colors]
        }`}
      >
        {labels[role as keyof typeof labels]}
      </span>
    );
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex" dir="rtl">
      <Sidebar />
      <AppHeader />
      <main className="flex-1 lg:mr-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              مدیریت کاربران
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              مدیریت مدیران و کارمندان سیستم
            </p>
          </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Filters and Create Button */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="جستجو (نام یا موبایل)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">همه نقش‌ها</option>
              <option value="MANAGER">مدیر</option>
              <option value="EMPLOYEE">کارمند</option>
            </select>

            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">همه بخش‌ها</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>

            {/* Create Button */}
            <button
              onClick={() => {
                setFormData({
                  mobile: "",
                  name: "",
                  email: "",
                  role: "EMPLOYEE",
                  departmentId: "",
                  password: "",
                  isActive: true,
                });
                setShowCreateModal(true);
              }}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <UserPlus className="w-5 h-5" />
              کاربر جدید
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    نام
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    موبایل
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    نقش
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    بخش
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    وضعیت
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاریخ ایجاد
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && users.length === 0 ? (
                  // Skeleton Loading
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                          <div className="mr-4">
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-2"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-full w-16"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-full w-12"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <div className="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
                          <div className="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      کاربری یافت نشد
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="mr-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                            {user.email && (
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.mobile}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.department?.name || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {user.isActive ? (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              <span className="text-sm text-green-600 font-medium">فعال</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-5 h-5 text-red-500" />
                              <span className="text-sm text-red-600 font-medium">غیرفعال</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString("fa-IR")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                          {session?.user.role === "ADMIN" && (
                            <button
                              onClick={() => openDeleteModal(user)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-4">ایجاد کاربر جدید</h2>
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleCreateUser}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      نام *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      شماره موبایل *
                    </label>
                    <input
                      type="text"
                      required
                      pattern="09\d{9}"
                      placeholder="09123456789"
                      value={formData.mobile}
                      onChange={(e) =>
                        setFormData({ ...formData, mobile: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ایمیل
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      نقش *
                    </label>
                    <select
                      required
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          role: e.target.value as "MANAGER" | "EMPLOYEE",
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={session?.user.role === "MANAGER"}
                    >
                      <option value="EMPLOYEE">کارمند</option>
                      {session?.user.role === "ADMIN" && (
                        <option value="MANAGER">مدیر</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      بخش *
                    </label>
                    <select
                      required
                      value={formData.departmentId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          departmentId: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      رمز عبور (اختیاری)
                    </label>
                    <input
                      type="text"
                      minLength={6}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      placeholder="خالی بگذارید برای استفاده از رمز پیش‌فرض (123456)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      اگر خالی بگذارید، رمز پیش‌فرض 123456 استفاده می‌شود و کاربر باید در اولین ورود آن را تغییر دهد
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData({ ...formData, isActive: e.target.checked })
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        کاربر فعال است
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 mr-6">
                      کاربران غیرفعال نمی‌توانند وارد سیستم شوند
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    ایجاد کاربر
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-4">ویرایش کاربر</h2>
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleUpdateUser}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      نام *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      شماره موبایل *
                    </label>
                    <input
                      type="text"
                      required
                      pattern="09\d{9}"
                      value={formData.mobile}
                      onChange={(e) =>
                        setFormData({ ...formData, mobile: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ایمیل
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {session?.user.role === "ADMIN" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        نقش *
                      </label>
                      <select
                        required
                        value={formData.role}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            role: e.target.value as "MANAGER" | "EMPLOYEE",
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="EMPLOYEE">کارمند</option>
                        <option value="MANAGER">مدیر</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      بخش *
                    </label>
                    <select
                      required
                      value={formData.departmentId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          departmentId: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={session?.user.role === "MANAGER"}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      رمز عبور جدید
                    </label>
                    <input
                      type="text"
                      minLength={6}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      placeholder="خالی بگذارید اگر نمی‌خواهید تغییر دهید"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData({ ...formData, isActive: e.target.checked })
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        کاربر فعال است
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 mr-6">
                      کاربران غیرفعال نمی‌توانند وارد سیستم شوند
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    بروزرسانی
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedUser(null);
                    }}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-4 text-red-600">
                حذف کاربر
              </h2>
              <p className="text-gray-700 mb-6">
                آیا از حذف کاربر <strong>{selectedUser.name}</strong> اطمینان
                دارید؟ این عملیات قابل بازگشت نیست.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteUser}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
                >
                  حذف کاربر
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
