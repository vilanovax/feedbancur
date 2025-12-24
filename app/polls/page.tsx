"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { BarChart3, Plus, Search } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";
import PollCard from "@/components/PollCard";

// Lazy load modal component
const PollResultsModal = dynamic(() => import("@/components/PollResultsModal"), {
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-48" />,
});

export default function PollsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [canCreatePoll, setCanCreatePoll] = useState(false);
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchPolls();
      checkPollPermission();
    }
  }, [status, router]);

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

  const filteredPolls = polls.filter((poll) =>
    poll.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePollClick = (poll: any) => {
    if (poll.hasVoted) {
      // اگر قبلاً شرکت کرده، مودال نتایج را نمایش بده
      setSelectedPollId(poll.id);
      setIsModalOpen(true);
    } else {
      // اگر شرکت نکرده، به صفحه نظرسنجی برو
      router.push(`/polls/${poll.id}`);
    }
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
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
              <BarChart3 size={32} />
              نظرسنجی‌ها
            </h1>
            {canCreatePoll && (
              <Link
                href="/polls/create"
                className="flex items-center space-x-2 space-x-reverse bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                <span>نظرسنجی جدید</span>
              </Link>
            )}
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="جستجو در نظرسنجی‌ها..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Polls Grid */}
          {filteredPolls.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {searchQuery ? "نظرسنجی یافت نشد" : "هیچ نظرسنجی فعالی وجود ندارد"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPolls.map((poll) => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                  hasVoted={poll.hasVoted}
                  onClick={() => handlePollClick(poll)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Results Modal */}
      {selectedPollId && (
        <PollResultsModal
          pollId={selectedPollId}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPollId(null);
          }}
        />
      )}
    </div>
  );
}
