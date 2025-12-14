"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, Search, Filter } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";

interface Department {
  id: string;
  name: string;
}

interface AnalyticsKeyword {
  id: string;
  keyword: string;
  type: string;
  priority: number;
  description?: string;
  isActive: boolean;
  departmentId?: string;
  department?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

const KEYWORD_TYPES = {
  SENSITIVE: "حساس",
  POSITIVE: "مثبت",
  NEGATIVE: "منفی",
  TOPIC: "موضوعی",
  CUSTOM: "دلخواه",
};

const KEYWORD_PRIORITIES = {
  LOW: "کم",
  MEDIUM: "متوسط",
  HIGH: "زیاد",
};

const TYPE_COLORS = {
  SENSITIVE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  POSITIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  NEGATIVE: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  TOPIC: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  CUSTOM: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
};

export default function AnalyticsKeywordsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [keywords, setKeywords] = useState<AnalyticsKeyword[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<AnalyticsKeyword | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");

  const [formData, setFormData] = useState({
    keyword: "",
    type: "CUSTOM",
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH",
    description: "",
    isActive: true,
    departmentId: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session.user.role !== "ADMIN") {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchKeywords();
      fetchDepartments();
    }
  }, [status]);

  const fetchKeywords = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics-keywords");
      if (res.ok) {
        const data = await res.json();
        setKeywords(data);
      }
    } catch (error) {
      console.error("Error fetching keywords:", error);
    } finally {
      setLoading(false);
    }
  };

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

    try {
      const url = editingKeyword
        ? `/api/analytics-keywords/${editingKeyword.id}`
        : "/api/analytics-keywords";

      const method = editingKeyword ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          departmentId: formData.departmentId || null,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setEditingKeyword(null);
        resetForm();
        fetchKeywords();
      }
    } catch (error) {
      console.error("Error saving keyword:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این کلمه کلیدی اطمینان دارید؟")) {
      return;
    }

    try {
      const res = await fetch(`/api/analytics-keywords/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchKeywords();
      }
    } catch (error) {
      console.error("Error deleting keyword:", error);
    }
  };

  const handleEdit = (keyword: AnalyticsKeyword) => {
    setEditingKeyword(keyword);
    setFormData({
      keyword: keyword.keyword,
      type: keyword.type,
      priority: keyword.priority,
      description: keyword.description || "",
      isActive: keyword.isActive,
      departmentId: keyword.departmentId || "",
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      keyword: "",
      type: "CUSTOM",
      priority: "MEDIUM",
      description: "",
      isActive: true,
      departmentId: "",
    });
  };

  const filteredKeywords = keywords.filter((kw) => {
    const matchesSearch = kw.keyword.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || kw.type === filterType;
    const matchesDepartment =
      filterDepartment === "all" ||
      (filterDepartment === "null" && !kw.departmentId) ||
      kw.departmentId === filterDepartment;

    return matchesSearch && matchesType && matchesDepartment;
  });

  if (status === "loading" || loading) {
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
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              مدیریت کلمات کلیدی تحلیلی
            </h1>
            <button
              onClick={() => {
                setEditingKeyword(null);
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              افزودن کلمه کلیدی
            </button>
          </div>

          {/* فیلترها */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Search className="inline ml-2" size={16} />
                  جستجو
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="جستجوی کلمه کلیدی..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Filter className="inline ml-2" size={16} />
                  نوع
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">همه</option>
                  {Object.entries(KEYWORD_TYPES).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  بخش
                </label>
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">همه</option>
                  <option value="null">عمومی (همه بخش‌ها)</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* لیست کلمات کلیدی */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    کلمه کلیدی
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    نوع
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
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredKeywords.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                    >
                      کلمه کلیدی یافت نشد
                    </td>
                  </tr>
                ) : (
                  filteredKeywords.map((keyword) => (
                    <tr key={keyword.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {keyword.keyword}
                        </div>
                        {keyword.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {keyword.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            TYPE_COLORS[keyword.type as keyof typeof TYPE_COLORS]
                          }`}
                        >
                          {KEYWORD_TYPES[keyword.type as keyof typeof KEYWORD_TYPES]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {keyword.department ? keyword.department.name : "عمومی"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {KEYWORD_PRIORITIES[keyword.priority as keyof typeof KEYWORD_PRIORITIES]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            keyword.isActive
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                          }`}
                        >
                          {keyword.isActive ? "فعال" : "غیرفعال"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(keyword)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 ml-3"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(keyword.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              {editingKeyword ? "ویرایش کلمه کلیدی" : "افزودن کلمه کلیدی جدید"}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    کلمه کلیدی *
                  </label>
                  <input
                    type="text"
                    value={formData.keyword}
                    onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                    required
                    placeholder="مثال: یخچال، آشپزخانه، نظافت"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    می‌توانید چند کلمه را با ویرگول (,) از هم جدا کنید
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نوع *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  >
                    {Object.entries(KEYWORD_TYPES).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    بخش
                  </label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">عمومی (همه بخش‌ها)</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    اولویت *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value as "LOW" | "MEDIUM" | "HIGH" })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  >
                    {Object.entries(KEYWORD_PRIORITIES).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    توضیحات
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="ml-2"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                    فعال
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingKeyword(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingKeyword ? "ویرایش" : "افزودن"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
