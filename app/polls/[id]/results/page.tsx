"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";
import PollResults from "@/components/PollResults";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PollResultsPage({ params }: PageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pollId, setPollId] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then((resolvedParams) => {
      setPollId(resolvedParams.id);
    });
  }, [params]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && pollId) {
      fetchResults();
    }
  }, [status, router, pollId]);

  const fetchResults = async () => {
    if (!pollId) return;

    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/polls/${pollId}/results`);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "خطا در دریافت نتایج");
      }

      const data = await res.json();
      setResults(data);
    } catch (err: any) {
      console.error("Error fetching results:", err);
      setError(err.message || "خطا در دریافت نتایج نظرسنجی");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">در حال بارگذاری نتایج...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex" dir="rtl">
        <Sidebar />
        <AppHeader />
        <main className="flex-1 lg:mr-64 mt-16 p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
            >
              <ArrowRight size={20} />
              <span>بازگشت</span>
            </button>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
              <p className="text-red-600 dark:text-red-400 text-lg">{error}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex" dir="rtl">
      <Sidebar />
      <AppHeader />
      <main className="flex-1 lg:mr-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
          >
            <ArrowRight size={20} />
            <span>بازگشت</span>
          </button>

          {/* Poll Title */}
          {results?.poll && (
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {results.poll.title}
              </h1>
              {results.poll.department && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  بخش: {results.poll.department.name}
                </p>
              )}
            </div>
          )}

          {/* Results */}
          {results && (
            <PollResults
              results={results.results}
              stats={results.stats}
              pollType={results.poll.type}
            />
          )}

          {/* Voters List - Only for ADMIN or poll creator */}
          {results?.voters && results.voters.length > 0 && (
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                لیست شرکت‌کنندگان ({results.voters.length} نفر)
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {results.voters.map((voter: any, index: number) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {voter.name}
                        </p>
                        {voter.department && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {voter.department.name}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(voter.votedAt).toLocaleDateString("fa-IR", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    {voter.selectedOptions && voter.selectedOptions.length > 0 && (
                      <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                        انتخاب: {voter.selectedOptions.join("، ")}
                      </div>
                    )}
                    {voter.ratingValue !== undefined && (
                      <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                        امتیاز: {voter.ratingValue}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Department Statistics - Only for ADMIN or poll creator */}
          {results?.departmentStats && results.departmentStats.length > 0 && (
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                آمار بر اساس بخش‌ها
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <tr>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                        بخش
                      </th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                        کل افراد
                      </th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                        شرکت کردند
                      </th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                        شرکت نکردند
                      </th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                        نرخ مشارکت
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {results.departmentStats.map((dept: any) => (
                      <tr key={dept.departmentId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {dept.departmentName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {dept.totalTarget}
                        </td>
                        <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400">
                          {dept.totalResponded}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {dept.totalNotResponded}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400">
                          {dept.responseRate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
