"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MobileLayout from "@/components/MobileLayout";
import PollVotingInterface from "@/components/PollVotingInterface";
import PollResults from "@/components/PollResults";
import { CheckCircle, Lock, Eye } from "lucide-react";
import { TypeBadge, VisibilityBadge, StatusBadge } from "@/components/PollBadges";
import { useToast } from "@/contexts/ToastContext";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MobilePollDetailPage({ params }: PageProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const resolvedParams = use(params);
  const pollId = resolvedParams.id;
  const toast = useToast();

  const [poll, setPoll] = useState<any>(null);
  const [canVote, setCanVote] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (pollId) {
      fetchPoll();
    }
  }, [pollId]);

  const fetchPoll = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/polls/${pollId}`);
      if (res.ok) {
        const data = await res.json();
        setPoll(data.poll);
        setCanVote(data.canVote);
        setHasVoted(!!data.userResponse);

        // اگر کاربر شرکت کرده، نتایج را بارگذاری کن
        if (data.userResponse) {
          fetchResults();
        }
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(voteData),
      });

      if (res.ok) {
        toast.success("رای شما با موفقیت ثبت شد");
        // برگشت به لیست نظرسنجی‌ها
        router.push("/mobile/polls");
      } else {
        const error = await res.json();
        toast.error(error.error || "خطا در ثبت رای");
      }
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("خطا در ثبت رای");
    }
  };

  if (!session) {
    return null;
  }

  const role = session.user.role === "EMPLOYEE" ? "EMPLOYEE" : "MANAGER";

  if (loading) {
    return (
      <MobileLayout role={role} title="نظرسنجی">
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
          در حال بارگذاری...
        </div>
      </MobileLayout>
    );
  }

  if (!poll) {
    return (
      <MobileLayout role={role} title="نظرسنجی">
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
          نظرسنجی یافت نشد
        </div>
      </MobileLayout>
    );
  }

  const isClosed = poll.closedAt && new Date(poll.closedAt) < new Date();
  const isScheduled = poll.scheduledAt && new Date(poll.scheduledAt) > new Date();

  return (
    <MobileLayout role={role} title={poll.title}>
      <div className="space-y-4 p-4">
        {/* Poll Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
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
          </div>
          {poll.department && (
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              بخش: {poll.department.name}
            </div>
          )}
        </div>

        {/* Visibility Banner */}
        {poll.visibilityMode === "ANONYMOUS" && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
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
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-4">
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

        {/* Scheduled Warning */}
        {isScheduled && (
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              این نظرسنجی در تاریخ{" "}
              {new Date(poll.scheduledAt).toLocaleDateString("fa-IR")} منتشر خواهد شد.
            </p>
          </div>
        )}

        {/* Closed Warning */}
        {isClosed && (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center">
            <Lock size={48} className="mx-auto text-gray-400 mb-3" />
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
              نظرسنجی بسته شده
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              این نظرسنجی در تاریخ{" "}
              {new Date(poll.closedAt).toLocaleDateString("fa-IR")} بسته شد.
            </p>
          </div>
        )}

        {/* Already Voted Message */}
        {hasVoted && !poll.allowMultipleVotes && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-600 dark:text-green-400" />
              <span className="font-semibold text-green-900 dark:text-green-300">
                شما در این نظرسنجی شرکت کردید
              </span>
            </div>
          </div>
        )}

        {/* Voting Interface */}
        {canVote && !isClosed && !isScheduled && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
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

        {/* Show Results Link for Public Polls or Admins */}
        {(poll.visibilityMode === "PUBLIC" || session.user.role === "ADMIN" || poll.createdById === session.user.id) && hasVoted && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = `/polls/${poll.id}`;
                }
              }}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              مشاهده نتایج
            </button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
