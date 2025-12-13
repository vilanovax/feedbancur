"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MobileLayout from "@/components/MobileLayout";
import { Trash2, Plus, Lock } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

export default function MobileCreatePollPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [canCreatePoll, setCanCreatePoll] = useState<boolean | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      checkPollPermission();
    }
  }, [status]);

  const checkPollPermission = async () => {
    // کارمندان مجاز نیستند
    if (session?.user.role === "EMPLOYEE") {
      setCanCreatePoll(false);
      return;
    }

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
        } else {
          setCanCreatePoll(false);
        }
      } catch (error) {
        console.error("Error checking poll permission:", error);
        setCanCreatePoll(false);
      }
    } else {
      setCanCreatePoll(false);
    }
  };

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "RATING_SCALE" | "TEXT_INPUT">("SINGLE_CHOICE");
  const [visibilityMode, setVisibilityMode] = useState<"ANONYMOUS" | "PUBLIC">("PUBLIC");
  const [options, setOptions] = useState<Array<{ text: string; order: number }>>([
    { text: "", order: 0 },
    { text: "", order: 1 },
  ]);
  const [minRating, setMinRating] = useState(1);
  const [maxRating, setMaxRating] = useState(5);
  const [maxTextLength, setMaxTextLength] = useState<number | undefined>(500);
  const [isRequired, setIsRequired] = useState(false);
  const [showResultsMode, setShowResultsMode] = useState<"LIVE" | "AFTER_CLOSE">("LIVE");
  const [submitting, setSubmitting] = useState(false);

  const addOption = () => {
    setOptions([...options, { text: "", order: options.length }]);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index).map((opt, i) => ({ ...opt, order: i })));
    }
  };

  const updateOption = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index].text = text;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.warning("لطفاً عنوان نظرسنجی را وارد کنید");
      return;
    }

    if ((type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE") && options.filter(opt => opt.text.trim()).length < 2) {
      toast.warning("لطفاً حداقل 2 گزینه وارد کنید");
      return;
    }

    if (type === "RATING_SCALE" && minRating >= maxRating) {
      toast.warning("حداقل امتیاز باید کمتر از حداکثر امتیاز باشد");
      return;
    }

    try {
      setSubmitting(true);

      const pollData: any = {
        title: title.trim(),
        description: description.trim() || null,
        type,
        visibilityMode,
        isRequired,
        showResultsMode,
        isActive: true,
      };

      if (type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE") {
        pollData.options = options
          .filter(opt => opt.text.trim())
          .map((opt, i) => ({ text: opt.text.trim(), order: i }));
      }

      if (type === "RATING_SCALE") {
        pollData.minRating = minRating;
        pollData.maxRating = maxRating;
      }

      if (type === "TEXT_INPUT") {
        pollData.maxTextLength = maxTextLength;
      }

      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pollData),
      });

      if (res.ok) {
        toast.success("نظرسنجی با موفقیت ایجاد شد");
        router.push("/mobile/polls");
      } else {
        const error = await res.json();
        toast.error(error.error || "خطا در ایجاد نظرسنجی");
      }
    } catch (error) {
      console.error("Error creating poll:", error);
      toast.error("خطا در ایجاد نظرسنجی");
    } finally {
      setSubmitting(false);
    }
  };

  if (!session) {
    return null;
  }

  const role = session.user.role === "EMPLOYEE" ? "EMPLOYEE" : "MANAGER";

  // در حال بررسی دسترسی
  if (canCreatePoll === null) {
    return (
      <MobileLayout role={role} title="ایجاد نظرسنجی">
        <div className="p-4">
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            در حال بررسی دسترسی...
          </div>
        </div>
      </MobileLayout>
    );
  }

  // Check permission - بررسی دسترسی برای همه (کارمند و مدیر بدون مجوز)
  if (!canCreatePoll) {
    return (
      <MobileLayout role={role} title="ایجاد نظرسنجی">
        <div className="p-4">
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
            <Lock className="w-12 h-12 mx-auto text-red-400 mb-3" />
            <p className="text-red-800 dark:text-red-300 font-medium">
              دسترسی به ایجاد نظرسنجی
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
              {session.user.role === "EMPLOYEE"
                ? "کارمندان مجاز به ایجاد نظرسنجی نیستند"
                : "بخش شما مجوز ایجاد نظرسنجی را ندارد. لطفاً با ادمین سیستم تماس بگیرید."}
            </p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout role={role} title="ایجاد نظرسنجی">
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        {/* Title */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            عنوان نظرسنجی <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="عنوان نظرسنجی را وارد کنید"
            required
          />
        </div>

        {/* Description */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            توضیحات (اختیاری)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="توضیحات نظرسنجی..."
            rows={3}
          />
        </div>

        {/* Type Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            نوع نظرسنجی <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="radio"
                name="type"
                value="SINGLE_CHOICE"
                checked={type === "SINGLE_CHOICE"}
                onChange={(e) => setType(e.target.value as any)}
                className="w-4 h-4"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">تک گزینه‌ای</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">کاربران فقط یک گزینه را انتخاب می‌کنند</div>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="radio"
                name="type"
                value="MULTIPLE_CHOICE"
                checked={type === "MULTIPLE_CHOICE"}
                onChange={(e) => setType(e.target.value as any)}
                className="w-4 h-4"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">چند گزینه‌ای</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">کاربران چند گزینه را انتخاب می‌کنند</div>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="radio"
                name="type"
                value="RATING_SCALE"
                checked={type === "RATING_SCALE"}
                onChange={(e) => setType(e.target.value as any)}
                className="w-4 h-4"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">امتیازدهی</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">کاربران امتیاز می‌دهند (مثلاً 1 تا 5)</div>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="radio"
                name="type"
                value="TEXT_INPUT"
                checked={type === "TEXT_INPUT"}
                onChange={(e) => setType(e.target.value as any)}
                className="w-4 h-4"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">متن آزاد</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">کاربران پاسخ متنی می‌نویسند</div>
              </div>
            </label>
          </div>
        </div>

        {/* Options (for SINGLE_CHOICE and MULTIPLE_CHOICE) */}
        {(type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE") && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              گزینه‌ها <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`گزینه ${i + 1}`}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addOption}
              className="w-full mt-3 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              افزودن گزینه
            </button>
          </div>
        )}

        {/* Rating Range (for RATING_SCALE) */}
        {type === "RATING_SCALE" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              محدوده امتیاز
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  حداقل
                </label>
                <input
                  type="number"
                  value={minRating}
                  onChange={(e) => setMinRating(parseInt(e.target.value))}
                  min={1}
                  max={10}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  حداکثر
                </label>
                <input
                  type="number"
                  value={maxRating}
                  onChange={(e) => setMaxRating(parseInt(e.target.value))}
                  min={2}
                  max={10}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Max Text Length (for TEXT_INPUT) */}
        {type === "TEXT_INPUT" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              حداکثر طول متن (کاراکتر)
            </label>
            <input
              type="number"
              value={maxTextLength}
              onChange={(e) => setMaxTextLength(parseInt(e.target.value) || undefined)}
              min={10}
              max={5000}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        )}

        {/* Visibility Mode */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            حالت نمایش
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="radio"
                name="visibility"
                value="PUBLIC"
                checked={visibilityMode === "PUBLIC"}
                onChange={(e) => setVisibilityMode(e.target.value as any)}
                className="w-4 h-4"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">عمومی</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">همه می‌توانند رأی‌دهندگان را ببینند</div>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="radio"
                name="visibility"
                value="ANONYMOUS"
                checked={visibilityMode === "ANONYMOUS"}
                onChange={(e) => setVisibilityMode(e.target.value as any)}
                className="w-4 h-4"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">ناشناس</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">رأی‌ها محرمانه است</div>
              </div>
            </label>
          </div>
        </div>

        {/* Results Display Mode */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            نمایش نتایج
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="radio"
                name="results"
                value="LIVE"
                checked={showResultsMode === "LIVE"}
                onChange={(e) => setShowResultsMode(e.target.value as any)}
                className="w-4 h-4"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">زنده</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">نتایج همیشه قابل مشاهده است</div>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="radio"
                name="results"
                value="AFTER_CLOSE"
                checked={showResultsMode === "AFTER_CLOSE"}
                onChange={(e) => setShowResultsMode(e.target.value as any)}
                className="w-4 h-4"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">بعد از بسته شدن</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">نتایج فقط بعد از پایان نمایش داده می‌شود</div>
              </div>
            </label>
          </div>
        </div>

        {/* Is Required */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 dark:border-gray-600"
            />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">شرکت اجباری</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                کاربران باید در این نظرسنجی شرکت کنند
              </div>
            </div>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "در حال ایجاد..." : "ایجاد نظرسنجی"}
        </button>
      </form>
    </MobileLayout>
  );
}
