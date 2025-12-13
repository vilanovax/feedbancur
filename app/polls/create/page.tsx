"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BarChart3, Plus, Trash2, GripVertical, X, Check } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";

type PollType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "RATING_SCALE" | "TEXT_INPUT";
type VisibilityMode = "ANONYMOUS" | "PUBLIC";
type ShowResultsMode = "LIVE" | "AFTER_CLOSE";

interface PollOption {
  text: string;
  order: number;
}

export default function CreatePollPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<PollType>("SINGLE_CHOICE");
  const [visibilityMode, setVisibilityMode] = useState<VisibilityMode>("PUBLIC");
  const [isActive, setIsActive] = useState(true);
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(false);
  const [isRequired, setIsRequired] = useState(false);
  const [showResultsMode, setShowResultsMode] = useState<ShowResultsMode>("LIVE");
  const [maxTextLength, setMaxTextLength] = useState<number | null>(500);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [isAllCompany, setIsAllCompany] = useState(true);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [closedAt, setClosedAt] = useState<string | null>(null);
  const [options, setOptions] = useState<PollOption[]>([
    { text: "", order: 0 },
    { text: "", order: 1 },
  ]);
  const [minRating, setMinRating] = useState<number | null>(1);
  const [maxRating, setMaxRating] = useState<number | null>(5);

  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canCreatePoll, setCanCreatePoll] = useState<boolean | null>(null);
  const [allowedPollDepartments, setAllowedPollDepartments] = useState<string[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      if (session.user.role === "EMPLOYEE") {
        router.push("/polls");
      } else {
        fetchDepartments();
        checkPollPermission();
      }
    }
  }, [status, session, router]);

  const checkPollPermission = async () => {
    // ادمین همیشه می‌تواند نظرسنجی ایجاد کند
    if (session?.user.role === "ADMIN") {
      setCanCreatePoll(true);
      setAllowedPollDepartments([]); // ادمین به همه بخش‌ها دسترسی دارد
      return;
    }

    // برای مدیران، بررسی دسترسی بخش
    if (session?.user.role === "MANAGER" && session.user.departmentId) {
      try {
        const res = await fetch(`/api/departments/${session.user.departmentId}`);
        if (res.ok) {
          const dept = await res.json();
          setCanCreatePoll(dept.canCreatePoll || false);
          setAllowedPollDepartments(dept.allowedPollDepartments || []);

          // اگر دسترسی ندارد، هدایت به صفحه مدیریت نظرسنجی‌ها
          if (!dept.canCreatePoll) {
            router.push("/polls/manage");
          }
        }
      } catch (error) {
        console.error("Error checking poll permission:", error);
        setCanCreatePoll(false);
        router.push("/polls/manage");
      }
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const addOption = () => {
    setOptions([...options, { text: "", order: options.length }]);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions.map((opt, i) => ({ ...opt, order: i })));
    }
  };

  const updateOption = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index].text = text;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: any = {
        title,
        description: description || null,
        type,
        visibilityMode,
        isActive,
        allowMultipleVotes,
        isRequired,
        showResultsMode,
        departmentIds: isAllCompany ? [] : selectedDepartments,
        scheduledAt: scheduledAt || null,
        closedAt: closedAt || null,
      };

      if (type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE") {
        payload.options = options.filter(opt => opt.text.trim() !== "");
      }

      if (type === "RATING_SCALE") {
        payload.minRating = minRating;
        payload.maxRating = maxRating;
      }

      if (type === "TEXT_INPUT") {
        payload.maxTextLength = maxTextLength;
      }

      const res = await fetch("/api/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/polls/manage");
      } else {
        const data = await res.json();
        setError(data.error || "خطا در ایجاد نظرسنجی");
      }
    } catch (err) {
      setError("خطایی رخ داد");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || canCreatePoll === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">در حال بارگذاری...</div>
      </div>
    );
  }

  if (status === "authenticated" && session.user.role === "EMPLOYEE") {
    return null;
  }

  // اگر مدیر دسترسی ندارد، به صفحه مدیریت هدایت می‌شود (در useEffect)
  if (!canCreatePoll) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex" dir="rtl">
      <Sidebar />
      <AppHeader />
      <main className="flex-1 lg:mr-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8 flex items-center gap-3">
              <BarChart3 size={32} />
              ایجاد نظرسنجی جدید
            </h1>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  عنوان نظرسنجی *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="عنوان نظرسنجی را وارد کنید"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  توضیحات
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="توضیحات نظرسنجی (اختیاری)"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نوع نظرسنجی *
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as PollType)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="SINGLE_CHOICE">تک انتخابی</option>
                  <option value="MULTIPLE_CHOICE">چند انتخابی</option>
                  <option value="RATING_SCALE">مقیاس امتیاز</option>
                  <option value="TEXT_INPUT">متنی</option>
                </select>
              </div>

              {/* Options for choice types */}
              {(type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    گزینه‌ها *
                  </label>
                  <div className="space-y-3">
                    {options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <GripVertical size={20} className="text-gray-400 cursor-move" />
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => updateOption(index, e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          placeholder={`گزینه ${index + 1}`}
                        />
                        {options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addOption}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <Plus size={20} />
                      افزودن گزینه
                    </button>
                  </div>
                </div>
              )}

              {/* Rating scale options */}
              {type === "RATING_SCALE" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      حداقل امتیاز
                    </label>
                    <input
                      type="number"
                      value={minRating || ""}
                      onChange={(e) => setMinRating(Number(e.target.value))}
                      min={0}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      حداکثر امتیاز
                    </label>
                    <input
                      type="number"
                      value={maxRating || ""}
                      onChange={(e) => setMaxRating(Number(e.target.value))}
                      min={1}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              )}

              {/* Text input options */}
              {type === "TEXT_INPUT" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    حداکثر طول متن
                  </label>
                  <input
                    type="number"
                    value={maxTextLength || ""}
                    onChange={(e) => setMaxTextLength(Number(e.target.value))}
                    min={1}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="500"
                  />
                </div>
              )}

              {/* Visibility Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  حالت نمایش
                </label>
                <select
                  value={visibilityMode}
                  onChange={(e) => setVisibilityMode(e.target.value as VisibilityMode)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="PUBLIC">عمومی (هویت رای‌دهنده مشخص)</option>
                  <option value="ANONYMOUS">ناشناس (هویت رای‌دهنده مخفی)</option>
                </select>
              </div>

              {/* Show Results Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  زمان نمایش نتایج
                </label>
                <select
                  value={showResultsMode}
                  onChange={(e) => setShowResultsMode(e.target.value as ShowResultsMode)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="LIVE">آنی (نتایج به صورت زنده نمایش داده شود)</option>
                  <option value="AFTER_CLOSE">پس از بسته شدن نظرسنجی</option>
                </select>
              </div>

              {/* Department Multi-Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  بخش‌های شرکت
                </label>
                <div className="space-y-3">
                  {/* گزینه "همه شرکت" فقط برای ادمین نمایش داده می‌شود */}
                  {session?.user.role === "ADMIN" && (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAllCompany}
                        onChange={(e) => {
                          setIsAllCompany(e.target.checked);
                          if (e.target.checked) {
                            setSelectedDepartments([]);
                          }
                        }}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300 font-medium">همه شرکت</span>
                    </label>
                  )}

                  {/* برای مدیران که دسترسی "همه شرکت" ندارند */}
                  {session?.user.role === "MANAGER" && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                      شما فقط می‌توانید برای بخش‌های مجاز نظرسنجی ایجاد کنید
                    </p>
                  )}

                  {(!isAllCompany || session?.user.role === "MANAGER") && (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                      {(() => {
                        // فیلتر کردن بخش‌ها بر اساس دسترسی
                        const availableDepartments = session?.user.role === "ADMIN"
                          ? departments
                          : session?.user.role === "MANAGER" && session.user.departmentId
                            ? departments.filter(dept => dept.id === session.user.departmentId)
                            : departments.filter(dept => allowedPollDepartments.includes(dept.id));

                        if (availableDepartments.length === 0) {
                          return <p className="text-gray-500 dark:text-gray-400 text-sm">هیچ بخش مجازی یافت نشد</p>;
                        }

                        return availableDepartments.map((dept) => (
                          <label key={dept.id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded-lg transition-colors">
                            <input
                              type="checkbox"
                              checked={selectedDepartments.includes(dept.id)}
                              onChange={() => {
                                setSelectedDepartments(prev =>
                                  prev.includes(dept.id)
                                    ? prev.filter(id => id !== dept.id)
                                    : [...prev, dept.id]
                                );
                                // اگر مدیر است و بخشی انتخاب کرده، isAllCompany را غیرفعال کن
                                if (session?.user.role === "MANAGER") {
                                  setIsAllCompany(false);
                                }
                              }}
                              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-gray-700 dark:text-gray-300">{dept.name}</span>
                          </label>
                        ));
                      })()}
                    </div>
                  )}

                  {selectedDepartments.length > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedDepartments.length} بخش انتخاب شده
                    </p>
                  )}
                </div>
              </div>

              {/* Schedule */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    زمان انتشار (اختیاری)
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt || ""}
                    onChange={(e) => setScheduledAt(e.target.value || null)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    زمان پایان (اختیاری)
                  </label>
                  <input
                    type="datetime-local"
                    value={closedAt || ""}
                    onChange={(e) => setClosedAt(e.target.value || null)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">فعال باشد</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowMultipleVotes}
                    onChange={(e) => setAllowMultipleVotes(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">امکان رای مجدد</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">پاسخ اجباری</span>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => router.push("/polls/manage")}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "در حال ایجاد..." : "ایجاد نظرسنجی"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
