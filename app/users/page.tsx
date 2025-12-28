"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UserPlus, Pencil, Trash2, Search, Shield, User, CheckCircle, XCircle, Tag, Plus, ArrowUp, ArrowDown, Edit2, KeyRound, Users, Building2, AlertTriangle } from "lucide-react";
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
  statusId: string | null;
  status: {
    id: string;
    name: string;
    color: string;
  } | null;
  createdAt: string;
}

interface UserStatus {
  id: string;
  name: string;
  color: string;
  allowedRoles: ("ADMIN" | "MANAGER" | "EMPLOYEE")[];
  isActive: boolean;
  order: number;
  _count: {
    users: number;
  };
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
  const [activeTab, setActiveTab] = useState<"users" | "statuses" | "passwordReset">("users");
  
  // User Status states
  const [userStatuses, setUserStatuses] = useState<UserStatus[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showStatusDeleteModal, setShowStatusDeleteModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | null>(null);
  const [statusFormData, setStatusFormData] = useState({
    name: "",
    color: "#3B82F6",
    allowedRoles: [] as ("ADMIN" | "MANAGER" | "EMPLOYEE")[],
    isActive: true,
    order: 0,
  });

  // Password Reset states
  const [passwordResetScope, setPasswordResetScope] = useState<"user" | "department" | "all">("user");
  const [passwordResetUserId, setPasswordResetUserId] = useState("");
  const [passwordResetDepartmentId, setPasswordResetDepartmentId] = useState("");
  const [passwordResetNewPassword, setPasswordResetNewPassword] = useState("");
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [showPasswordResetConfirm, setShowPasswordResetConfirm] = useState(false);

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
    statusId: null as string | null,
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
      if (session?.user.role === "ADMIN") {
        fetchUserStatuses();
      }
    }
  }, [status, roleFilter, departmentFilter, search, activeTab]);

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
        statusId: formData.statusId || null,
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

  const openEditModal = async (user: UserType) => {
    setSelectedUser(user);
    // اگر استتوس‌ها هنوز لود نشده‌اند، آنها را لود کن
    if (userStatuses.length === 0 && session?.user.role === "ADMIN") {
      await fetchUserStatuses();
    }
    setFormData({
      mobile: user.mobile,
      name: user.name,
      email: user.email || "",
      role: user.role as "MANAGER" | "EMPLOYEE",
      departmentId: user.departmentId || "",
      password: "",
      isActive: user.isActive ?? true,
      statusId: user.statusId || null,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user: UserType) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const fetchUserStatuses = async () => {
    try {
      setStatusLoading(true);
      const res = await fetch("/api/user-statuses");
      if (res.ok) {
        const data = await res.json();
        setUserStatuses(data);
      }
    } catch (err) {
      console.error("Error fetching user statuses:", err);
      toast.error("خطا در بارگذاری استتوس‌ها");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleCreateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/user-statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(statusFormData),
      });

      const data = await res.json();

      if (res.ok) {
        setShowStatusModal(false);
        setStatusFormData({
          name: "",
          color: "#3B82F6",
          allowedRoles: [],
          isActive: true,
          order: 0,
        });
        fetchUserStatuses();
        toast.success("استتوس با موفقیت ایجاد شد");
      } else {
        setError(data.error || "خطا در ایجاد استتوس");
        toast.error(data.error || "خطا در ایجاد استتوس");
      }
    } catch (err) {
      setError("خطا در ایجاد استتوس");
      toast.error("خطا در ایجاد استتوس");
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus) return;
    setError("");

    try {
      const res = await fetch(`/api/user-statuses?id=${selectedStatus.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(statusFormData),
      });

      const data = await res.json();

      if (res.ok) {
        setShowStatusModal(false);
        setSelectedStatus(null);
        fetchUserStatuses();
        toast.success("استتوس با موفقیت بروزرسانی شد");
      } else {
        setError(data.error || "خطا در بروزرسانی استتوس");
        toast.error(data.error || "خطا در بروزرسانی استتوس");
      }
    } catch (err) {
      setError("خطا در بروزرسانی استتوس");
      toast.error("خطا در بروزرسانی استتوس");
    }
  };

  const handleDeleteStatus = async () => {
    if (!selectedStatus) return;

    try {
      const res = await fetch(`/api/user-statuses?id=${selectedStatus.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setShowStatusDeleteModal(false);
        setSelectedStatus(null);
        fetchUserStatuses();
        toast.success("استتوس با موفقیت حذف شد");
      } else {
        const data = await res.json();
        setError(data.error || "خطا در حذف استتوس");
        toast.error(data.error || "خطا در حذف استتوس");
      }
    } catch (err) {
      setError("خطا در حذف استتوس");
      toast.error("خطا در حذف استتوس");
    }
  };

  const openStatusEditModal = (status: UserStatus) => {
    setSelectedStatus(status);
    setStatusFormData({
      name: status.name,
      color: status.color,
      allowedRoles: [...status.allowedRoles],
      isActive: status.isActive,
      order: status.order,
    });
    setShowStatusModal(true);
  };

  const openStatusCreateModal = () => {
    setSelectedStatus(null);
    setStatusFormData({
      name: "",
      color: "#3B82F6",
      allowedRoles: [],
      isActive: true,
      order: 0,
    });
    setShowStatusModal(true);
  };

  const handleForcePasswordReset = async () => {
    setPasswordResetLoading(true);
    setError("");

    try {
      const body: any = {
        scope: passwordResetScope,
        newPassword: passwordResetNewPassword,
      };

      if (passwordResetScope === "user") {
        body.userId = passwordResetUserId;
      } else if (passwordResetScope === "department") {
        body.departmentId = passwordResetDepartmentId;
      }

      const res = await fetch("/api/users/force-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        setShowPasswordResetConfirm(false);
        setPasswordResetNewPassword("");
        setPasswordResetUserId("");
        setPasswordResetDepartmentId("");
      } else {
        setError(data.error || "خطا در ریست رمز عبور");
        toast.error(data.error || "خطا در ریست رمز عبور");
      }
    } catch (err) {
      setError("خطا در ریست رمز عبور");
      toast.error("خطا در ریست رمز عبور");
    } finally {
      setPasswordResetLoading(false);
    }
  };

  const getPasswordResetScopeLabel = () => {
    switch (passwordResetScope) {
      case "user":
        const user = users.find((u) => u.id === passwordResetUserId);
        return user ? `کاربر "${user.name}"` : "یک کاربر";
      case "department":
        const dept = departments.find((d) => d.id === passwordResetDepartmentId);
        return dept ? `تمام کاربران بخش "${dept.name}"` : "یک بخش";
      case "all":
        return "تمام کاربران (به جز ادمین‌ها)";
    }
  };

  const handleMoveStatus = async (statusId: string, direction: "up" | "down") => {
    const status = userStatuses.find((s) => s.id === statusId);
    if (!status) return;

    const currentIndex = userStatuses.findIndex((s) => s.id === statusId);
    if (direction === "up" && currentIndex === 0) return;
    if (direction === "down" && currentIndex === userStatuses.length - 1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const targetStatus = userStatuses[targetIndex];

    // Swap orders
    const newOrder = targetStatus.order;
    const oldOrder = status.order;

    try {
      // Update both statuses
      await Promise.all([
        fetch(`/api/user-statuses?id=${statusId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: newOrder }),
        }),
        fetch(`/api/user-statuses?id=${targetStatus.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: oldOrder }),
        }),
      ]);

      fetchUserStatuses();
    } catch (err) {
      toast.error("خطا در تغییر ترتیب استتوس");
    }
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
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg border border-red-300 dark:border-red-700">
            {error}
          </div>
        )}

        {/* Tabs */}
        {session?.user.role === "ADMIN" && (
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("users")}
                className={`px-4 py-2 font-medium transition ${
                  activeTab === "users"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                کاربران
              </button>
              <button
                onClick={() => setActiveTab("statuses")}
                className={`px-4 py-2 font-medium transition ${
                  activeTab === "statuses"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                استتوس‌ها
              </button>
              <button
                onClick={() => setActiveTab("passwordReset")}
                className={`px-4 py-2 font-medium transition flex items-center gap-2 ${
                  activeTab === "passwordReset"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <KeyRound className="w-4 h-4" />
                ریست رمز عبور
              </button>
            </div>
          </div>
        )}

        {/* Users Tab Content */}
        {activeTab === "users" && (
          <>
        {/* Filters and Create Button */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="text"
                placeholder="جستجو (نام یا موبایل)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">همه نقش‌ها</option>
              <option value="MANAGER">مدیر</option>
              <option value="EMPLOYEE">کارمند</option>
            </select>

            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                  statusId: null,
                });
                setShowCreateModal(true);
              }}
              className="flex items-center justify-center gap-2 bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition"
            >
              <UserPlus className="w-5 h-5" />
              کاربر جدید
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
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
                    نقش
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    بخش
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    استتوس
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
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-600 dark:text-gray-400">
                      کاربری یافت نشد
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="mr-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.name}
                            </div>
                            {user.email && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {user.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {user.mobile}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {user.department?.name || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.status ? (
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: user.status.color }}
                          >
                            {user.status.name}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {user.isActive ? (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
                              <span className="text-sm text-green-600 dark:text-green-400 font-medium">فعال</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
                              <span className="text-sm text-red-600 dark:text-red-400 font-medium">غیرفعال</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString("fa-IR")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                          {session?.user.role === "ADMIN" && (
                            <button
                              onClick={() => openDeleteModal(user)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition"
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
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">ایجاد کاربر جدید</h2>
              {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleCreateUser}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      نام *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ایمیل
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      disabled={session?.user.role === "MANAGER"}
                    >
                      <option value="EMPLOYEE">کارمند</option>
                      {session?.user.role === "ADMIN" && (
                        <option value="MANAGER">مدیر</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                        className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:bg-gray-700"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        کاربر فعال است
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mr-6">
                      کاربران غیرفعال نمی‌توانند وارد سیستم شوند
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 dark:bg-blue-700 text-white py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition"
                  >
                    ایجاد کاربر
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
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
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">ویرایش کاربر</h2>
              {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleUpdateUser}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      نام *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ایمیل
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  {session?.user.role === "ADMIN" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        <option value="EMPLOYEE">کارمند</option>
                        <option value="MANAGER">مدیر</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      استتوس
                    </label>
                    <select
                      value={formData.statusId || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          statusId: e.target.value || null,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">بدون استتوس</option>
                      {userStatuses
                        .filter((s) => s.isActive && s.allowedRoles.includes(selectedUser?.role || "EMPLOYEE"))
                        .map((status) => (
                          <option key={status.id} value={status.id}>
                            {status.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData({ ...formData, isActive: e.target.checked })
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:bg-gray-700"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        کاربر فعال است
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mr-6">
                      کاربران غیرفعال نمی‌توانند وارد سیستم شوند
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 dark:bg-blue-700 text-white py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition"
                  >
                    بروزرسانی
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedUser(null);
                    }}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
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
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-4 text-red-600 dark:text-red-400">
                حذف کاربر
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                آیا از حذف کاربر <strong>{selectedUser.name}</strong> اطمینان
                دارید؟ این عملیات قابل بازگشت نیست.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteUser}
                  className="flex-1 bg-red-600 dark:bg-red-700 text-white py-2 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition"
                >
                  حذف کاربر
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        )}
          </>
        )}

        {/* Statuses Tab Content */}
        {activeTab === "statuses" && session?.user.role === "ADMIN" && (
          <div className="space-y-6">
            {/* Header with Create Button */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 flex justify-between items-center border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                مدیریت استتوس‌های کاربران
              </h2>
              <button
                onClick={openStatusCreateModal}
                className="flex items-center gap-2 bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition"
              >
                <Plus className="w-5 h-5" />
                استتوس جدید
              </button>
            </div>

            {/* Statuses List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              {statusLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">در حال بارگذاری...</p>
                </div>
              ) : userStatuses.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  استتوسی ایجاد نشده است
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          ترتیب
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          نام
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          رنگ
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          نقش‌های مجاز
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          تعداد کاربران
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          وضعیت
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          عملیات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {userStatuses.map((status, index) => (
                        <tr key={status.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleMoveStatus(status.id, "up")}
                                disabled={index === 0}
                                className={`p-1 rounded ${index === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-200 dark:hover:bg-gray-600"}`}
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleMoveStatus(status.id, "down")}
                                disabled={index === userStatuses.length - 1}
                                className={`p-1 rounded ${index === userStatuses.length - 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-200 dark:hover:bg-gray-600"}`}
                              >
                                <ArrowDown className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {status.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600"
                                style={{ backgroundColor: status.color }}
                              />
                              <span className="text-sm text-gray-600 dark:text-gray-400">{status.color}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1">
                              {status.allowedRoles.map((role) => (
                                <span
                                  key={role}
                                  className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                >
                                  {role === "ADMIN" ? "مدیرعامل" : role === "MANAGER" ? "مدیر" : "کارمند"}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {status._count.users}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {status.isActive ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                فعال
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                غیرفعال
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openStatusEditModal(status)}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                <Edit2 className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedStatus(status);
                                  setShowStatusDeleteModal(true);
                                }}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Password Reset Tab Content */}
        {activeTab === "passwordReset" && session?.user.role === "ADMIN" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                  <KeyRound className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    ریست اجباری رمز عبور
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    با این قابلیت می‌توانید رمز عبور کاربران را ریست کنید. کاربران باید در اولین ورود رمز جدید انتخاب کنند.
                  </p>
                </div>
              </div>

              {/* Scope Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  محدوده ریست
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => setPasswordResetScope("user")}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition ${
                      passwordResetScope === "user"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <User className={`w-6 h-6 ${passwordResetScope === "user" ? "text-blue-600" : "text-gray-500"}`} />
                    <div className="text-right">
                      <div className={`font-medium ${passwordResetScope === "user" ? "text-blue-700 dark:text-blue-300" : "text-gray-900 dark:text-white"}`}>
                        یک کاربر
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">ریست رمز یک کاربر خاص</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPasswordResetScope("department")}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition ${
                      passwordResetScope === "department"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <Building2 className={`w-6 h-6 ${passwordResetScope === "department" ? "text-blue-600" : "text-gray-500"}`} />
                    <div className="text-right">
                      <div className={`font-medium ${passwordResetScope === "department" ? "text-blue-700 dark:text-blue-300" : "text-gray-900 dark:text-white"}`}>
                        یک بخش
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">ریست رمز همه کاربران یک بخش</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPasswordResetScope("all")}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition ${
                      passwordResetScope === "all"
                        ? "border-red-500 bg-red-50 dark:bg-red-900/30"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <Users className={`w-6 h-6 ${passwordResetScope === "all" ? "text-red-600" : "text-gray-500"}`} />
                    <div className="text-right">
                      <div className={`font-medium ${passwordResetScope === "all" ? "text-red-700 dark:text-red-300" : "text-gray-900 dark:text-white"}`}>
                        همه کاربران
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">ریست رمز همه (جز ادمین‌ها)</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* User Selection (for "user" scope) */}
              {passwordResetScope === "user" && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    انتخاب کاربر *
                  </label>
                  <select
                    value={passwordResetUserId}
                    onChange={(e) => setPasswordResetUserId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">انتخاب کنید...</option>
                    {users.filter(u => u.role !== "ADMIN").map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.mobile}) - {user.department?.name || "بدون بخش"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Department Selection (for "department" scope) */}
              {passwordResetScope === "department" && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    انتخاب بخش *
                  </label>
                  <select
                    value={passwordResetDepartmentId}
                    onChange={(e) => setPasswordResetDepartmentId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">انتخاب کنید...</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Warning for "all" scope */}
              {passwordResetScope === "all" && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">هشدار!</span>
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    این عملیات رمز عبور تمام کاربران (به جز ادمین‌ها) را تغییر می‌دهد. همه آنها باید در ورود بعدی رمز جدید انتخاب کنند.
                  </p>
                </div>
              )}

              {/* New Password */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  رمز عبور جدید *
                </label>
                <input
                  type="text"
                  value={passwordResetNewPassword}
                  onChange={(e) => setPasswordResetNewPassword(e.target.value)}
                  placeholder="حداقل 6 کاراکتر"
                  minLength={6}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  این رمز موقت است. کاربران باید در اولین ورود رمز جدید انتخاب کنند.
                </p>
              </div>

              {/* Submit Button */}
              <button
                onClick={() => setShowPasswordResetConfirm(true)}
                disabled={
                  passwordResetNewPassword.length < 6 ||
                  (passwordResetScope === "user" && !passwordResetUserId) ||
                  (passwordResetScope === "department" && !passwordResetDepartmentId)
                }
                className="w-full md:w-auto px-6 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
              >
                <KeyRound className="w-5 h-5" />
                ریست رمز عبور
              </button>
            </div>
          </div>
        )}

        {/* Password Reset Confirmation Modal */}
        {showPasswordResetConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  تأیید ریست رمز عبور
                </h2>
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-4">
                آیا مطمئن هستید که می‌خواهید رمز عبور {getPasswordResetScopeLabel()} را ریست کنید؟
              </p>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                کاربران مربوطه در ورود بعدی مجبور به تغییر رمز عبور خواهند بود.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleForcePasswordReset}
                  disabled={passwordResetLoading}
                  className="flex-1 bg-yellow-600 dark:bg-yellow-700 text-white py-2 rounded-lg hover:bg-yellow-700 dark:hover:bg-yellow-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {passwordResetLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      در حال انجام...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      تأیید و ریست
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowPasswordResetConfirm(false)}
                  disabled={passwordResetLoading}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Create/Edit Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                {selectedStatus ? "ویرایش استتوس" : "ایجاد استتوس جدید"}
              </h2>
              {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={selectedStatus ? handleUpdateStatus : handleCreateStatus}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      نام استتوس *
                    </label>
                    <input
                      type="text"
                      required
                      value={statusFormData.name}
                      onChange={(e) =>
                        setStatusFormData({ ...statusFormData, name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      رنگ *
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={statusFormData.color}
                        onChange={(e) =>
                          setStatusFormData({ ...statusFormData, color: e.target.value })
                        }
                        className="w-16 h-16 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                      />
                      <input
                        type="text"
                        required
                        pattern="^#[0-9A-Fa-f]{6}$"
                        value={statusFormData.color}
                        onChange={(e) =>
                          setStatusFormData({ ...statusFormData, color: e.target.value })
                        }
                        placeholder="#3B82F6"
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      رنگ را انتخاب کنید یا کد hex وارد کنید (مثال: #3B82F6)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      نقش‌های مجاز *
                    </label>
                    <div className="space-y-2">
                      {(["EMPLOYEE", "MANAGER"] as const).map((role) => (
                        <label key={role} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={statusFormData.allowedRoles.includes(role)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setStatusFormData({
                                  ...statusFormData,
                                  allowedRoles: [...statusFormData.allowedRoles, role],
                                });
                              } else {
                                setStatusFormData({
                                  ...statusFormData,
                                  allowedRoles: statusFormData.allowedRoles.filter((r) => r !== role),
                                });
                              }
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:bg-gray-700"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {role === "MANAGER" ? "مدیر" : "کارمند"}
                          </span>
                        </label>
                      ))}
                    </div>
                    {statusFormData.allowedRoles.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">حداقل یک نقش باید انتخاب شود</p>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={statusFormData.isActive}
                        onChange={(e) =>
                          setStatusFormData({ ...statusFormData, isActive: e.target.checked })
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        استتوس فعال است
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={statusFormData.allowedRoles.length === 0}
                    className="flex-1 bg-blue-600 dark:bg-blue-700 text-white py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {selectedStatus ? "بروزرسانی" : "ایجاد"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowStatusModal(false);
                      setSelectedStatus(null);
                      setError("");
                    }}
                    className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Status Delete Modal */}
        {showStatusDeleteModal && selectedStatus && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-4 text-red-600 dark:text-red-400">
                حذف استتوس
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                آیا از حذف استتوس <strong>{selectedStatus.name}</strong> اطمینان دارید؟
                {selectedStatus._count.users > 0 && (
                  <span className="block mt-2 text-red-600 dark:text-red-400">
                    این استتوس توسط {selectedStatus._count.users} کاربر استفاده می‌شود و نمی‌تواند حذف شود.
                  </span>
                )}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteStatus}
                  disabled={selectedStatus._count.users > 0}
                  className="flex-1 bg-red-600 dark:bg-red-700 text-white py-2 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  حذف استتوس
                </button>
                <button
                  onClick={() => {
                    setShowStatusDeleteModal(false);
                    setSelectedStatus(null);
                  }}
                  className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition"
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
