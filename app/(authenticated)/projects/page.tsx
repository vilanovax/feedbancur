"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";
import {
  Plus,
  Search,
  Loader2,
  FolderKanban,
  Link as LinkIcon,
  Copy,
  Check,
  Users,
  MessageSquare,
  Settings,
  MoreVertical,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import ProjectsStatsCards from "@/components/projects/ProjectsStatsCards";
import ProjectStatusFilter from "@/components/projects/ProjectStatusFilter";
import ProjectsSkeleton from "@/components/projects/ProjectsSkeleton";

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
  createdBy: {
    id: string;
    name: string;
  };
  membersCount: number;
  feedbacksCount: number;
  createdAt: string;
}

export default function ProjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("limit", "100");

      const res = await fetch(`/api/projects?${params}`);
      if (res.ok) {
        const result = await res.json();
        // API برمی‌گرداند { data: [...], pagination: {...} }
        const fetchedProjects = result.data || [];
        setAllProjects(fetchedProjects);
        setProjects(fetchedProjects);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchProjects();
    }
  }, [status, fetchProjects]);

  // Apply filters
  useEffect(() => {
    let filtered = [...allProjects];

    // Status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((p) => p.isActive);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((p) => !p.isActive);
    }

    // Search filter
    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    setProjects(filtered);
  }, [allProjects, statusFilter, search]);

  const copyLink = async (token: string) => {
    const link = `${window.location.origin}/p/${token}`;
    await navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این پروژه اطمینان دارید؟")) return;

    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProjects(projects.filter((p) => p.id !== id));
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  // Calculate stats
  const stats = {
    totalProjects: allProjects.length,
    activeProjects: allProjects.filter((p) => p.isActive).length,
    totalMembers: allProjects.reduce((sum, p) => sum + p.membersCount, 0),
    totalFeedbacks: allProjects.reduce((sum, p) => sum + p.feedbacksCount, 0),
  };

  const counts = {
    all: allProjects.length,
    active: allProjects.filter((p) => p.isActive).length,
    inactive: allProjects.filter((p) => !p.isActive).length,
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex" dir="rtl">
        <Sidebar />
        <AppHeader />
        <main className="flex-1 lg:mr-64 mt-16 p-4 sm:p-6 lg:p-8">
          <ProjectsSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex" dir="rtl">
      <Sidebar />
      <AppHeader />
      <main className="flex-1 lg:mr-64 mt-16 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-4rem)]">
        <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <FolderKanban className="w-7 h-7 sm:w-8 sm:h-8 text-blue-500" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              پروژه‌ها
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              مدیریت پروژه‌ها و دریافت فیدبک عمومی
            </p>
          </div>
        </div>

        <Link
          href="/projects/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors touch-manipulation"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm sm:text-base">پروژه جدید</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <ProjectsStatsCards
        totalProjects={stats.totalProjects}
        activeProjects={stats.activeProjects}
        totalMembers={stats.totalMembers}
        totalFeedbacks={stats.totalFeedbacks}
      />

      {/* Status Filter */}
      <ProjectStatusFilter
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
        counts={counts}
      />

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجوی پروژه..."
          className="w-full pr-10 pl-4 py-2.5 sm:py-2 text-sm sm:text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl">
          <FolderKanban className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            پروژه‌ای وجود ندارد
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            اولین پروژه خود را ایجاد کنید
          </p>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            ایجاد پروژه
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-1"
                  >
                    {project.name}
                  </Link>
                  {project.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                      {project.description}
                    </p>
                  )}
                </div>

                {/* Menu */}
                <div className="relative">
                  <button
                    onClick={() =>
                      setOpenMenu(openMenu === project.id ? null : project.id)
                    }
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-500" />
                  </button>
                  {openMenu === project.id && (
                    <div className="absolute left-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-10 min-w-[140px]">
                      <Link
                        href={`/projects/${project.id}`}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Settings className="w-4 h-4" />
                        تنظیمات
                      </Link>
                      <a
                        href={`/p/${project.token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                        مشاهده فرم
                      </a>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
                      >
                        <Trash2 className="w-4 h-4" />
                        حذف
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Status badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    project.isActive
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400"
                  }`}
                >
                  {project.isActive ? "فعال" : "غیرفعال"}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    project.isPublic
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                  }`}
                >
                  {project.isPublic ? "عمومی" : "خصوصی"}
                </span>
                {project.requireLogin && (
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                    نیاز به ورود
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {project.membersCount} عضو
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  {project.feedbacksCount} فیدبک
                </span>
              </div>

              {/* Copy link */}
              <button
                onClick={() => copyLink(project.token)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 sm:py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors touch-manipulation"
              >
                {copiedToken === project.token ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    <span>کپی شد!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>کپی لینک اشتراک</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

          {/* Click outside to close menu */}
          {openMenu && (
            <div
              className="fixed inset-0 z-0"
              onClick={() => setOpenMenu(null)}
            />
          )}
        </div>
      </main>
    </div>
  );
}
