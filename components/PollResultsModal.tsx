"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import PollResults from "./PollResults";

interface PollResultsModalProps {
  pollId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function PollResultsModal({
  pollId,
  isOpen,
  onClose,
}: PollResultsModalProps) {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && pollId) {
      fetchResults();
    }
  }, [isOpen, pollId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/polls/${pollId}/results`);

      if (!res.ok) {
        throw new Error("خطا در دریافت نتایج");
      }

      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error("Error fetching results:", error);
      setError("خطا در دریافت نتایج نظرسنجی");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              نتایج نظرسنجی
            </h2>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              شما قبلاً در این نظرسنجی شرکت کرده‌اید
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="بستن"
          >
            <X size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-4">
                در حال بارگذاری نتایج...
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {!loading && !error && results && (
            <PollResults
              results={results.results}
              stats={results.stats}
              pollType={results.poll.type}
            />
          )}
        </div>
      </div>
    </div>
  );
}
