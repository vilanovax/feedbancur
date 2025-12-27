"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DynamicSidebar, DynamicHeader } from "@/components/layout";
import {
  Users,
  Circle,
  Search,
  Building2,
  RefreshCw,
  Clock,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { UserListSkeleton, StatCardSkeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";

interface TeamUser {
  id: string;
  name: string;
  avatar: string | null;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
  isOnline: boolean;
  lastSeen: string | null;
  department: {
    id: string;
    name: string;
  } | null;
  status: {
    id: string;
    name: string;
    color: string;
  } | null;
}

interface Department {
  id: string;
  name: string;
  userCount: number;
}

interface TeamStats {
  total: number;
  online: number;
  offline: number;
}

export default function TeamStatusPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<TeamStats>({ total: 0, online: 0, offline: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline">("all");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [onlineThreshold, setOnlineThreshold] = useState(5);

  const fetchTeamStatus = useCallback(async () => {
    try {
      const url = selectedDepartment
        ? `/api/team-status?departmentId=${selectedDepartment}`
        : "/api/team-status";

      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 403) {
          const data = await res.json();
          toast.error(data.error || "دسترسی غیرمجاز");
          return;
        }
        throw new Error("خطا در دریافت وضعیت تیم");
      }

      const data = await res.json();
      setUsers(data.users || []);
      setDepartments(data.departments || []);
      setStats(data.stats || { total: 0, online: 0, offline: 0 });
      setOnlineThreshold(data.settings?.onlineThresholdMinutes || 5);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error fetching team status:", error);
      toast.error("خطا در دریافت وضعیت تیم");
    } finally {
      setLoading(false);
    }
  }, [selectedDepartment]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchTeamStatus();
    }
  }, [status, router, fetchTeamStatus]);

  // Auto refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTeamStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchTeamStatus]);

  // Heartbeat - update lastSeen every 30 seconds
  useEffect(() => {
    const sendHeartbeat = async () => {
      try {
        await fetch("/api/users/heartbeat", { method: "POST" });
      } catch (error) {
        console.error("Error sending heartbeat:", error);
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000);

    return () => clearInterval(interval);
  }, []);

  const formatLastSeen = (lastSeen: string | null): string => {
    if (!lastSeen) return "هرگز";

    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "همین الان";
    if (diffMinutes < 60) return `${diffMinutes} دقیقه پیش`;
    if (diffHours < 24) return `${diffHours} ساعت پیش`;
    if (diffDays < 7) return `${diffDays} روز پیش`;

    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const getRoleLabel = (role: string): string => {
    switch (role) {
      case "ADMIN":
        return "ادمین";
      case "MANAGER":
        return "مدیر";
      case "EMPLOYEE":
        return "کارمند";
      default:
        return role;
    }
  };

  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300";
      case "MANAGER":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300";
      case "EMPLOYEE":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
    }
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = !selectedDepartment || user.department?.id === selectedDepartment;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "online" && user.isOnline) ||
      (statusFilter === "offline" && !user.isOnline);

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl text-gray-800 dark:text-white">در حال بارگذاری...</div>
      </div>
    );
  }

  const renderSkeleton = () => (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <DynamicSidebar />
      <div className="flex-1 lg:mr-64">
        <DynamicHeader />
        <main className="mt-16 p-4 md:p-6 lg:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
          <UserListSkeleton count={8} />
        </main>
      </div>
    </div>
  );

  if (loading) {
    return renderSkeleton();
  }

  if (session?.user?.role !== "ADMIN") {
    router.push("/");
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <DynamicSidebar />

      <div className="flex-1 lg:mr-64">
        <DynamicHeader />

        <main className="mt-16 p-4 md:p-6 lg:p-8">
          {/* Stats Cards - Clickable for filtering */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <button
              onClick={() => setStatusFilter("all")}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 transition-all text-right ${
                statusFilter === "all"
                  ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800"
                  : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">کل کاربران</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setStatusFilter("online")}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 transition-all text-right ${
                statusFilter === "online"
                  ? "border-green-500 ring-2 ring-green-200 dark:ring-green-800"
                  : "border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <Circle className="w-6 h-6 text-green-600 dark:text-green-400 fill-current" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">آنلاین</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.online}</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setStatusFilter("offline")}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 transition-all text-right ${
                statusFilter === "offline"
                  ? "border-gray-500 ring-2 ring-gray-200 dark:ring-gray-700"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <Circle className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">آفلاین</p>
                  <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.offline}</p>
                </div>
              </div>
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col md:flex-row gap-3 flex-1 w-full">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="جستجوی نام..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Department Filter */}
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">همه بخش‌ها</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.userCount})
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "all" | "online" | "offline")}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">همه وضعیت‌ها</option>
                  <option value="online">آنلاین</option>
                  <option value="offline">آفلاین</option>
                </select>
              </div>

              {/* Refresh Button */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  آخرین بروزرسانی: {formatLastSeen(lastRefresh.toISOString())}
                </span>
                <button
                  onClick={() => {
                    setLoading(true);
                    fetchTeamStatus();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  بروزرسانی
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              کاربرانی که در {onlineThreshold} دقیقه اخیر فعالیت داشته‌اند به عنوان آنلاین نمایش داده می‌شوند.
            </p>
          </div>

          {/* Users Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <Avatar
                    src={user.avatar}
                    alt={user.name}
                    size="lg"
                    showOnlineIndicator
                    isOnline={user.isOnline}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 dark:text-white truncate">{user.name}</h3>

                    {/* Role Badge */}
                    <span
                      className={`inline-block px-2 py-0.5 text-xs rounded-full mt-1 ${getRoleBadgeColor(
                        user.role
                      )} dark:opacity-90`}
                    >
                      {getRoleLabel(user.role)}
                    </span>

                    {/* Department */}
                    {user.department && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-600 dark:text-gray-400">
                        <Building2 className="w-3 h-3" />
                        <span className="truncate">{user.department.name}</span>
                      </div>
                    )}

                    {/* Status */}
                    {user.status && (
                      <div className="flex items-center gap-1 mt-1">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: user.status.color }}
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400">{user.status.name}</span>
                      </div>
                    )}

                    {/* Last Seen */}
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>
                        {user.isOnline ? "آنلاین" : formatLastSeen(user.lastSeen)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center border border-gray-200 dark:border-gray-700">
              <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">کاربری یافت نشد</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
