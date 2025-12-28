"use client";

import { useState, memo } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Bug,
  TrendingUp,
  Newspaper,
  CheckCircle,
  Wand2,
  Loader2,
  Save,
  Send,
  X,
  MessageSquare,
  ImagePlus,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { CompletedFeedbackModal } from "./CompletedFeedbackModal";
import { UpdateCategory } from "@prisma/client";
import { toast } from "sonner";

interface UpdateFormProps {
  initialData?: {
    id?: string;
    title?: string;
    content?: string;
    summary?: string;
    category?: UpdateCategory;
    tags?: string[];
    isDraft?: boolean;
    imageUrl?: string | null;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

const categoryOptions: {
  value: UpdateCategory;
  label: string;
  icon: typeof Sparkles;
  color: string;
}[] = [
  { value: "FEATURE", label: "قابلیت جدید", icon: Sparkles, color: "text-purple-500" },
  { value: "BUG_FIX", label: "رفع مشکل", icon: Bug, color: "text-red-500" },
  { value: "IMPROVEMENT", label: "بهبود", icon: TrendingUp, color: "text-blue-500" },
  { value: "NEWS", label: "خبر", icon: Newspaper, color: "text-yellow-500" },
  {
    value: "FEEDBACK_COMPLETED",
    label: "فیدبک تکمیل شده",
    icon: CheckCircle,
    color: "text-green-500",
  },
];

function UpdateFormComponent({ initialData, onSuccess, onCancel }: UpdateFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [summary, setSummary] = useState(initialData?.summary || "");
  const [category, setCategory] = useState<UpdateCategory>(
    initialData?.category || "NEWS"
  );
  const [tagsInput, setTagsInput] = useState(
    (initialData?.tags || []).join(", ")
  );
  const [imageUrl, setImageUrl] = useState<string | null>(initialData?.imageUrl || null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFeedbackTitle, setSelectedFeedbackTitle] = useState<string | null>(null);

  const isEdit = !!initialData?.id;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // بررسی نوع فایل
    if (!file.type.startsWith("image/")) {
      toast.error("فقط فایل‌های تصویری مجاز هستند");
      return;
    }

    // بررسی اندازه (حداکثر 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("حجم فایل نباید بیشتر از 10 مگابایت باشد");
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/updates/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "خطا در آپلود تصویر");
      }

      setImageUrl(data.url);
      toast.success("تصویر با موفقیت آپلود شد");
    } catch (error: any) {
      toast.error(error.message || "خطا در آپلود تصویر");
    } finally {
      setUploadingImage(false);
      // Reset input
      e.target.value = "";
    }
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
    toast.success("تصویر حذف شد");
  };

  const handleFeedbackSelect = (feedback: any) => {
    // تنظیم دسته‌بندی به "فیدبک تکمیل شده"
    setCategory("FEEDBACK_COMPLETED");

    // تنظیم عنوان از فیدبک
    setTitle(feedback.title);

    // محتوا خالی باشد تا ادمین خودش بنویسد
    setContent("");

    // ذخیره عنوان فیدبک برای نمایش
    setSelectedFeedbackTitle(feedback.title);

    toast.success("فیدبک انتخاب شد. محتوا را بنویسید.");
  };

  const handleGenerateSummary = async () => {
    if (!content.trim()) {
      toast.error("لطفاً ابتدا محتوا را وارد کنید");
      return;
    }

    setGeneratingSummary(true);
    try {
      const res = await fetch("/api/updates/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "خطا در تولید خلاصه");
      }

      setSummary(data.summary);
      toast.success("خلاصه با موفقیت تولید شد");
    } catch (error: any) {
      toast.error(error.message || "خطا در تولید خلاصه");
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleSubmit = async (asDraft: boolean) => {
    if (!title.trim()) {
      toast.error("عنوان الزامی است");
      return;
    }
    if (!content.trim()) {
      toast.error("محتوا الزامی است");
      return;
    }

    setLoading(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);

      const payload = {
        title: title.trim(),
        content: content.trim(),
        summary: summary.trim() || null,
        category,
        tags,
        imageUrl: imageUrl || null,
        isDraft: asDraft,
      };

      const url = isEdit ? `/api/updates/${initialData.id}` : "/api/updates";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "خطا در ذخیره اطلاع‌رسانی");
      }

      toast.success(
        asDraft
          ? "پیش‌نویس با موفقیت ذخیره شد"
          : isEdit
          ? "اطلاع‌رسانی با موفقیت به‌روزرسانی شد"
          : "اطلاع‌رسانی با موفقیت منتشر شد"
      );

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/updates/manage");
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.message || "خطا در ذخیره اطلاع‌رسانی");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* عنوان */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          عنوان <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="عنوان اطلاع‌رسانی..."
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* دسته‌بندی */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          دسته‌بندی <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {categoryOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = category === opt.value;
            const isFeedbackCompleted = opt.value === "FEEDBACK_COMPLETED";

            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  if (isFeedbackCompleted) {
                    setShowFeedbackModal(true);
                  } else {
                    setCategory(opt.value);
                    setSelectedFeedbackTitle(null);
                  }
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                }`}
              >
                <Icon className={`w-4 h-4 ${opt.color}`} />
                <span className="text-sm">{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* نمایش فیدبک انتخاب شده */}
        {selectedFeedbackTitle && category === "FEEDBACK_COMPLETED" && (
          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm font-medium">فیدبک انتخاب شده:</span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              {selectedFeedbackTitle}
            </p>
          </div>
        )}
      </div>

      {/* محتوا */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          محتوا <span className="text-red-500">*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="متن کامل اطلاع‌رسانی..."
          rows={6}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
        />
      </div>

      {/* خلاصه */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            خلاصه (برای نمایش در ویجت)
          </label>
          <button
            type="button"
            onClick={handleGenerateSummary}
            disabled={generatingSummary || !content.trim()}
            className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingSummary ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            تولید با AI
          </button>
        </div>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="خلاصه کوتاه (اختیاری)..."
          rows={3}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
        />
      </div>

      {/* تگ‌ها */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          تگ‌ها (با کاما جدا کنید)
        </label>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="مثال: بهبود, داشبورد, گزارش"
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* تصویر */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          تصویر (اختیاری)
        </label>

        {imageUrl ? (
          <div className="relative inline-block">
            <div className="relative w-full max-w-md h-48 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
              <Image
                src={imageUrl}
                alt="تصویر اطلاع‌رسانی"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 left-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg transition-colors"
              title="حذف تصویر"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-gray-50 dark:bg-gray-800/50">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {uploadingImage ? (
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              ) : (
                <>
                  <ImagePlus className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    کلیک کنید یا فایل را بکشید
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    PNG, JPG یا WebP (حداکثر 10MB)
                  </p>
                </>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImage}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* دکمه‌ها */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            انصراف
          </button>
        )}
        <button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          ذخیره پیش‌نویس
        </button>
        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {isEdit ? "به‌روزرسانی و انتشار" : "انتشار"}
        </button>
      </div>

      {/* مودال انتخاب فیدبک تکمیل شده */}
      <CompletedFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSelect={handleFeedbackSelect}
      />
    </div>
  );
}

export const UpdateForm = memo(UpdateFormComponent);
