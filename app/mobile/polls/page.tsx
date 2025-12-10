"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MobileLayout from "@/components/MobileLayout";
import { CheckCircle, Plus } from "lucide-react";
import { TypeBadge, VisibilityBadge, StatusBadge } from "@/components/PollBadges";

export default function MobilePollsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState("newest");
  const [canCreatePoll, setCanCreatePoll] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      fetchPolls();
      checkPollPermission();
    }
  }, [status]);

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
      setLoading(true);
      const res = await fetch("/api/polls");
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

  const sortedPolls = [...polls].sort((a, b) => {
    switch (sortOption) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "mostVoted":
        return (b._count?.responses || 0) - (a._count?.responses || 0);
      case "closingSoon":
        if (!a.closedAt && !b.closedAt) return 0;
        if (!a.closedAt) return 1;
        if (!b.closedAt) return -1;
        return new Date(a.closedAt).getTime() - new Date(b.closedAt).getTime();
      default:
        return 0;
    }
  });

  if (!session) {
    return null;
  }

  const role = session.user.role === "EMPLOYEE" ? "EMPLOYEE" : "MANAGER";

  return (
    <MobileLayout role={role} title="نظرسنجی‌ها">
      <div className="space-y-4 p-4">
        {/* Sort Dropdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            مرتب‌سازی بر اساس
          </label>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="newest">جدیدترین</option>
            <option value="oldest">قدیمی‌ترین</option>
            <option value="mostVoted">پررای‌ترین</option>
            <option value="closingSoon">نزدیک به پایان</option>
          </select>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            در حال بارگذاری...
          </div>
        )}

        {/* Polls List */}
        {!loading && sortedPolls.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              نظرسنجی فعالی وجود ندارد
            </p>
          </div>
        )}

        <div className="space-y-3">
          {sortedPolls.map((poll) => (
            <button
              key={poll.id}
              onClick={() => router.push(`/mobile/polls/${poll.id}`)}
              className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-right hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white flex-1">
                  {poll.title}
                </h3>
                {poll.hasVoted && (
                  <CheckCircle size={20} className="text-green-500 flex-shrink-0 mr-2" />
                )}
              </div>

              {poll.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {poll.description}
                </p>
              )}

              <div className="flex flex-wrap gap-2 mb-3">
                <TypeBadge type={poll.type} size="sm" />
                <VisibilityBadge mode={poll.visibilityMode} size="sm" />
                <StatusBadge poll={poll} size="sm" />
              </div>

              {poll.visibilityMode === "PUBLIC" && poll._count && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {poll._count.responses} نفر شرکت کردند
                </div>
              )}

              {poll.department && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  بخش: {poll.department.name}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Float Button for Managers/Admins */}
      {canCreatePoll && (
        <button
          onClick={() => router.push("/mobile/polls/create")}
          className="fixed bottom-24 left-4 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition z-30"
          aria-label="ایجاد نظرسنجی"
        >
          <Plus size={28} />
        </button>
      )}
    </MobileLayout>
  );
}
