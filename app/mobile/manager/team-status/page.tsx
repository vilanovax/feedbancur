"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MobileLayout from "@/components/MobileLayout";
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

export default function ManagerTeamStatusPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<TeamStats>({ total: 0, online: 0, offline: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline">("all");
  const [onlineThreshold, setOnlineThreshold] = useState(5);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamStatus = useCallback(async () => {
    try {
      setError(null);
      const url = selectedDepartment
        ? `/api/team-status?departmentId=${selectedDepartment}`
        : "/api/team-status";

      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 403) {
          const data = await res.json();
          setError(data.error || "شما دسترسی به این بخش را ندارید");
          return;
        }
        throw new Error("خطا در دریافت وضعیت تیم");
      }

      const data = await res.json();
      setUsers(data.users || []);
      setDepartments(data.departments || []);
      setStats(data.stats || { total: 0, online: 0, offline: 0 });
      setOnlineThreshold(data.settings?.onlineThresholdMinutes || 5);
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
      if (session?.user?.role !== "MANAGER") {
        router.push("/mobile");
        return;
      }
      fetchTeamStatus();
    }
  }, [status, router, session, fetchTeamStatus]);

  // Auto refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTeamStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchTeamStatus]);

  // Heartbeat
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

  if (status === "loading" || loading) {
    return (
      <MobileLayout role="MANAGER" title="وضعیت تیم">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">در حال بارگذاری...</div>
        </div>
      </MobileLayout>
    );
  }

  if (error) {
    return (
      <MobileLayout role="MANAGER" title="وضعیت تیم">
        <div className="flex flex-col items-center justify-center h-64 text-center px-4">
          <Users className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-gray-500">{error}</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout role="MANAGER" title="وضعیت تیم">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">کل</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-green-600">{stats.online}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">آنلاین</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-gray-500">{stats.offline}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">آفلاین</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 mb-4 shadow-sm space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="جستجوی نام..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
          />
        </div>

        {/* Filters Row */}
        <div className="flex gap-2">
          {departments.length > 1 && (
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
            >
              <option value="">همه بخش‌ها</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "online" | "offline")}
            className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
          >
            <option value="all">همه</option>
            <option value="online">آنلاین</option>
            <option value="offline">آفلاین</option>
          </select>

          <button
            onClick={() => {
              setLoading(true);
              fetchTeamStatus();
            }}
            className="p-2 bg-blue-600 text-white rounded-lg"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="relative">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-500" />
                  </div>
                )}
                <span
                  className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-800 ${
                    user.isOnline ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800 dark:text-white truncate">
                    {user.name}
                  </h3>
                  <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                    {getRoleLabel(user.role)}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {user.department && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {user.department.name}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {user.isOnline ? "آنلاین" : formatLastSeen(user.lastSeen)}
                  </span>
                </div>

                {user.status && (
                  <div className="flex items-center gap-1 mt-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: user.status.color }}
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {user.status.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center shadow-sm">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">کاربری یافت نشد</p>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center mt-4">
        کاربرانی که در {onlineThreshold} دقیقه اخیر فعالیت داشته‌اند آنلاین هستند
      </p>
    </MobileLayout>
  );
}
