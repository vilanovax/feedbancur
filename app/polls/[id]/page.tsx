"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Lock, Eye, AlertCircle, CheckCircle } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";
import PollVotingInterface from "@/components/PollVotingInterface";
import PollResults from "@/components/PollResults";
import { TypeBadge, VisibilityBadge, StatusBadge } from "@/components/PollBadges";
import { useToast } from "@/contexts/ToastContext";

export default function PollDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const pollId = params?.id as string;
  const toast = useToast();

  const [poll, setPoll] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userResponse, setUserResponse] = useState<any>(null);
  const [canVote, setCanVote] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && pollId) {
      fetchPoll();
    }
  }, [status, pollId, router]);

  const fetchPoll = async () => {
    try {
      const res = await fetch(`/api/polls/${pollId}`);
      if (res.ok) {
        const data = await res.json();
        setPoll(data.poll);
        setUserResponse(data.userResponse);
        setCanVote(data.canVote);

        // اگر کاربر شرکت کرده، نتایج را بارگذاری کن
        if (data.userResponse) {
          fetchResults();
        }
      } else {
        toast.error("نظرسنجی یافت نشد");
        router.push("/polls");
      }
    } catch (error) {
      console.error("Error fetching poll:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async () => {
    try {
      const res = await fetch(`/api/polls/${pollId}/results`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        setShowResults(true);
      }
    } catch (error) {
      console.error("Error fetching results:", error);
    }
  };

  const handleVote = async (voteData: any) => {
    try {
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(voteData),
      });

      if (res.ok) {
        toast.success("رای شما با موفقیت ثبت شد");
        // برگشت به لیست نظرسنجی‌ها
        router.push("/polls");
      } else {
        const data = await res.json();
        toast.error(data.error || "خطا در ثبت رای");
      }
    } catch (error) {
      console.error("Vote error:", error);
      toast.error("خطایی رخ داد");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">در حال بارگذاری...</div>
      </div>
    );
  }

  if (!poll) {
    return null;
  }

  const isClosed = poll.closedAt && new Date(poll.closedAt) < new Date();
  const isScheduled = poll.scheduledAt && new Date(poll.scheduledAt) > new Date();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex" dir="rtl">
      <Sidebar />
      <AppHeader />
      <main className="flex-1 lg:mr-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Poll Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {poll.title}
            </h1>
            {poll.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {poll.description}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <TypeBadge type={poll.type} />
              <VisibilityBadge mode={poll.visibilityMode} />
              <StatusBadge poll={poll} />
              {poll.isRequired && (
                <span className="inline-flex items-center gap-1 text-sm px-3 py-1 font-medium rounded-full border bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                  اجباری
                </span>
              )}
            </div>
          </div>

          {/* Visibility Banner */}
          {poll.visibilityMode === "ANONYMOUS" && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock size={20} className="text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-blue-900 dark:text-blue-300">
                  نظرسنجی مخفی
                </span>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                رای شما محرمانه است و هیچ‌کس نمی‌تواند ببیند چه گزینه‌ای انتخاب کرده‌اید.
              </p>
            </div>
          )}

          {poll.visibilityMode === "PUBLIC" && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye size={20} className="text-green-600 dark:text-green-400" />
                <span className="font-semibold text-green-900 dark:text-green-300">
                  نظرسنجی عمومی
                </span>
              </div>
              <p className="text-sm text-green-800 dark:text-green-300">
                نتایج و رای شما برای همه قابل مشاهده خواهد بود.
              </p>
            </div>
          )}

          {/* Scheduled Notice */}
          {isScheduled && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} className="text-yellow-600 dark:text-yellow-400" />
                <span className="font-semibold text-yellow-900 dark:text-yellow-300">
                  این نظرسنجی در تاریخ{" "}
                  {new Date(poll.scheduledAt).toLocaleDateString("fa-IR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  منتشر خواهد شد.
                </span>
              </div>
            </div>
          )}

          {/* Closed Notice */}
          {isClosed && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Lock size={20} className="text-red-600 dark:text-red-400" />
                <span className="font-semibold text-red-900 dark:text-red-300">
                  این نظرسنجی در تاریخ{" "}
                  {new Date(poll.closedAt).toLocaleDateString("fa-IR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  بسته شده است.
                </span>
              </div>
            </div>
          )}

          {/* Already Voted */}
          {userResponse && !poll.allowMultipleVotes && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                <span className="font-semibold text-green-900 dark:text-green-300">
                  شما قبلاً در این نظرسنجی شرکت کرده‌اید
                </span>
              </div>
            </div>
          )}

          {/* Voting Interface */}
          {canVote && !isScheduled && !isClosed && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                رای خود را ثبت کنید
              </h2>
              <PollVotingInterface
                poll={poll}
                onVote={handleVote}
                disabled={false}
                onValidationError={(msg) => toast.warning(msg)}
              />
            </div>
          )}

          {/* Poll Results - نمایش نتایج برای کسانی که شرکت کرده‌اند */}
          {showResults && results && (
            <PollResults
              results={results.results}
              stats={results.stats}
              pollType={poll.type}
            />
          )}

          {/* Department Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">ایجاد شده توسط: </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {poll.createdBy.name}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">بخش: </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {poll.department ? poll.department.name : "همه شرکت"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
