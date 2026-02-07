"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  Loader2,
  Save,
  Settings,
  Users,
  MessageSquare,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Trash2,
  Plus,
  Search,
  X,
  Eye,
  Clock,
  User,
  AlertCircle,
  Files,
} from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";

interface Project {
  id: string;
  name: string;
  description: string | null;
  token: string;
  isPublic: boolean;
  requireLogin: boolean;
  allowAnonymous: boolean;
  membersCanViewFeedbacks: boolean;
  isActive: boolean;
  createdBy: { id: string; name: string };
  members: Array<{
    id: string;
    role: string;
    joinedAt: string;
    user: {
      id: string;
      name: string;
      mobile: string;
      departments: { id: string; name: string } | null;
    };
  }>;
  feedbacksCount: number;
  createdAt: string;
}

interface Feedback {
  id: string;
  title: string;
  content: string;
  type: string;
  image: string | null;
  isAnonymous: boolean;
  senderName: string | null;
  status: string;
  createdAt: string;
  user: { id: string; name: string } | null;
}

interface UserOption {
  id: string;
  name: string;
  mobile: string;
  department: string | null;
}

interface Department {
  id: string;
  name: string;
}

const tabs = [
  { id: "settings", label: "تنظیمات", icon: Settings },
  { id: "members", label: "اعضا", icon: Users },
  { id: "feedbacks", label: "فیدبک‌ها", icon: MessageSquare },
  { id: "files", label: "فایل‌ها", icon: Files },
];

const feedbackTypes: Record<string, { label: string; color: string }> = {
  SUGGESTION: { label: "پیشنهاد", color: "bg-yellow-100 text-yellow-700" },
  BUG: { label: "مشکل", color: "bg-red-100 text-red-700" },
  QUESTION: { label: "سوال", color: "bg-blue-100 text-blue-700" },
  PRAISE: { label: "تشکر", color: "bg-green-100 text-green-700" },
  OTHER: { label: "سایر", color: "bg-gray-100 text-gray-700" },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: "در انتظار", color: "bg-yellow-100 text-yellow-700" },
  IN_PROGRESS: { label: "در حال بررسی", color: "bg-blue-100 text-blue-700" },
  RESOLVED: { label: "حل شده", color: "bg-green-100 text-green-700" },
  REJECTED: { label: "رد شده", color: "bg-red-100 text-red-700" },
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("settings");
  const [copiedLink, setCopiedLink] = useState(false);

  // Settings form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [requireLogin, setRequireLogin] = useState(false);
  const [allowAnonymous, setAllowAnonymous] = useState(true);
  const [membersCanViewFeedbacks, setMembersCanViewFeedbacks] = useState(false);

  // Members
  const [members, setMembers] = useState<Project["members"]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<string>("asc");

  // Feedbacks
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [feedbacksLoading, setFeedbacksLoading] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error("Project not found");
      const data = await res.json();
      setProject(data);
      setName(data.name);
      setDescription(data.description || "");
      setIsActive(data.isActive);
      setRequireLogin(data.requireLogin);
      setAllowAnonymous(data.allowAnonymous);
      setMembersCanViewFeedbacks(data.membersCanViewFeedbacks);
      setMembers(data.members);
    } catch (error) {
      router.push("/projects");
    } finally {
      setLoading(false);
    }
  }, [projectId, router]);

  const fetchFeedbacks = useCallback(async () => {
    setFeedbacksLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/feedbacks?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data.feedbacks);
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
    } finally {
      setFeedbacksLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  useEffect(() => {
    if (activeTab === "feedbacks" && feedbacks.length === 0) {
      fetchFeedbacks();
    }
  }, [activeTab, feedbacks.length, fetchFeedbacks]);

  useEffect(() => {
    if (showAddMember) {
      if (departments.length === 0) {
        fetchDepartments();
      }
      // بارگذاری اولیه لیست کاربران
      searchUsers(userSearch);
    }
  }, [showAddMember]);

  useEffect(() => {
    if (showAddMember) {
      searchUsers(userSearch);
    }
  }, [selectedDepartment, sortBy, sortOrder]);

  // Redirect to files page when Files tab is clicked
  useEffect(() => {
    if (activeTab === "files") {
      router.push(`/files/project/${projectId}`);
    }
  }, [activeTab, projectId, router]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          isActive,
          requireLogin,
          allowAnonymous,
          membersCanViewFeedbacks,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      setProject((prev) => (prev ? { ...prev, ...data } : null));
      alert("تنظیمات ذخیره شد");
    } catch (error) {
      alert("خطا در ذخیره تنظیمات");
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async () => {
    if (!project) return;
    const link = `${window.location.origin}/p/${project.token}`;
    await navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const regenerateToken = async () => {
    if (!confirm("آیا مطمئن هستید؟ لینک قبلی از کار خواهد افتاد.")) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/regenerate-token`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setProject((prev) => (prev ? { ...prev, token: data.token } : null));
        alert("لینک جدید ایجاد شد");
      }
    } catch (error) {
      alert("خطا در ایجاد لینک جدید");
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.departments || data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const searchUsers = async (query: string = "") => {
    setSearchingUsers(true);
    try {
      const params = new URLSearchParams();
      if (query.length >= 2) {
        params.set("search", query);
      }
      if (selectedDepartment) {
        params.set("departmentId", selectedDepartment);
      }
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      params.set("limit", "50");

      const res = await fetch(`/api/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const existingIds = members.map((m) => m.user.id);
        setUserOptions(
          (Array.isArray(data) ? data : data.users || [])
            .filter((u: any) => !existingIds.includes(u.id))
            .map((u: any) => ({
              id: u.id,
              name: u.name,
              mobile: u.mobile,
              department: u.departments?.name || null,
            }))
        );
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setSearchingUsers(false);
    }
  };

  const addMember = async (userId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        const member = await res.json();
        setMembers([member, ...members]);
        setShowAddMember(false);
        setUserSearch("");
        setUserOptions([]);
      }
    } catch (error) {
      alert("خطا در افزودن عضو");
    }
  };

  const removeMember = async (memberId: string) => {
    if (!confirm("آیا از حذف این عضو اطمینان دارید؟")) return;

    try {
      const res = await fetch(
        `/api/projects/${projectId}/members?memberId=${memberId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        setMembers(members.filter((m) => m.id !== memberId));
      }
    } catch (error) {
      alert("خطا در حذف عضو");
    }
  };

  const updateFeedbackStatus = async (feedbackId: string, status: string) => {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/feedbacks/${feedbackId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );

      if (res.ok) {
        setFeedbacks(
          feedbacks.map((f) => (f.id === feedbackId ? { ...f, status } : f))
        );
      }
    } catch (error) {
      alert("خطا در به‌روزرسانی وضعیت");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 pt-16">
          <div className="p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/projects"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {project.name}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ایجاد شده توسط {project.createdBy.name}
          </p>
        </div>

        {/* Link actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={copyLink}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm transition-colors"
          >
            {copiedLink ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copiedLink ? "کپی شد" : "کپی لینک"}
          </button>
          <a
            href={`/p/${project.token}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            مشاهده فرم
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.id === "feedbacks" && (
                <span className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">
                  {project.feedbacksCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              نام پروژه
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              توضیحات
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              لینک اشتراک‌گذاری
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/p/${project.token}`}
                readOnly
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm"
                dir="ltr"
              />
              <button
                onClick={regenerateToken}
                className="flex items-center gap-1 px-3 py-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                لینک جدید
              </button>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                پروژه فعال باشد
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={requireLogin}
                onChange={(e) => setRequireLogin(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                نیاز به ورود به سیستم
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowAnonymous}
                onChange={(e) => setAllowAnonymous(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                اجازه ارسال ناشناس
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={membersCanViewFeedbacks}
                onChange={(e) => setMembersCanViewFeedbacks(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                اعضا فیدبک‌ها را ببینند
              </span>
            </label>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              ذخیره تغییرات
            </button>
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === "members" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              اعضای پروژه
            </h3>
            <button
              onClick={() => setShowAddMember(true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
            >
              <Plus className="w-4 h-4" />
              افزودن عضو
            </button>
          </div>

          {/* Add member modal */}
          {showAddMember && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    افزودن عضو جدید
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddMember(false);
                      setUserSearch("");
                      setUserOptions([]);
                      setSelectedDepartment("");
                      setSortBy("name");
                      setSortOrder("asc");
                    }}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      searchUsers(e.target.value);
                    }}
                    placeholder="جستجوی کاربر..."
                    className="w-full pr-10 pl-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  />
                </div>

                {/* Filters and Sort */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  {/* Department Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      بخش
                    </label>
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                    >
                      <option value="">همه بخش‌ها</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      مرتب‌سازی بر اساس
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                    >
                      <option value="name">نام</option>
                      <option value="department">بخش</option>
                      <option value="createdAt">تاریخ ایجاد</option>
                    </select>
                  </div>

                  {/* Sort Order */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ترتیب
                    </label>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                    >
                      <option value="asc">صعودی</option>
                      <option value="desc">نزولی</option>
                    </select>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {searchingUsers ? (
                    <div className="text-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                    </div>
                  ) : userOptions.length > 0 ? (
                    <div className="space-y-2">
                      {userOptions.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => addMember(user.id)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-right"
                        >
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {user.department || user.mobile}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-4 text-gray-500">
                      کاربری یافت نشد
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Members list */}
          {members.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              هنوز عضوی اضافه نشده
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {member.user.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {member.user.departments?.name || member.user.mobile}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeMember(member.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Feedbacks Tab */}
      {activeTab === "feedbacks" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            فیدبک‌های دریافتی
          </h3>

          {feedbacksLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              هنوز فیدبکی دریافت نشده
            </div>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((feedback) => (
                <div
                  key={feedback.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {feedback.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            feedbackTypes[feedback.type]?.color ||
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {feedbackTypes[feedback.type]?.label || feedback.type}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(feedback.createdAt).toLocaleDateString(
                            "fa-IR"
                          )}
                        </span>
                        {feedback.isAnonymous ? (
                          <span className="text-xs text-gray-500">ناشناس</span>
                        ) : (
                          <span className="text-xs text-gray-500">
                            {feedback.user?.name || feedback.senderName}
                          </span>
                        )}
                      </div>
                    </div>
                    <select
                      value={feedback.status}
                      onChange={(e) =>
                        updateFeedbackStatus(feedback.id, e.target.value)
                      }
                      className={`text-xs px-2 py-1 rounded-lg border-0 ${
                        statusLabels[feedback.status]?.color ||
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {Object.entries(statusLabels).map(([value, config]) => (
                        <option key={value} value={value}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {feedback.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Files Tab */}
      {activeTab === "files" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              فایل‌های پروژه
            </h3>
            <button
              onClick={() => router.push(`/files/project/${projectId}`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <ExternalLink size={18} />
              <span>مشاهده همه فایل‌ها</span>
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            برای مدیریت کامل فایل‌های پروژه، روی دکمه "مشاهده همه فایل‌ها" کلیک کنید.
          </p>
          <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
              قابلیت‌ها:
            </h4>
            <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
              <li>آپلود و مدیریت فایل‌های پروژه</li>
              <li>سازماندهی با پوشه‌ها و تگ‌ها</li>
              <li>جستجو و فیلتر پیشرفته</li>
              <li>پیش‌نمایش فایل‌ها (تصاویر، PDF، ویدیو، صوت)</li>
              <li>کنترل دسترسی بر اساس نقش</li>
            </ul>
          </div>
        </div>
      )}
          </div>
        </main>
      </div>
    </div>
  );
}
