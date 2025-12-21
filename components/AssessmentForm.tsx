"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

interface AssessmentFormData {
  title: string;
  description?: string;
  type: "MBTI" | "DISC" | "HOLLAND" | "MSQ" | "CUSTOM";
  instructions?: string;
  isActive: boolean;
  allowRetake: boolean;
  timeLimit?: number;
  passingScore?: number;
  showResults: boolean;
}

interface AssessmentFormProps {
  initialData?: Partial<AssessmentFormData>;
  onSubmit: (data: AssessmentFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export function AssessmentForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "ذخیره",
}: AssessmentFormProps) {
  const [formData, setFormData] = useState<AssessmentFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    type: initialData?.type || "CUSTOM",
    instructions: initialData?.instructions || "",
    isActive: initialData?.isActive ?? true,
    allowRetake: initialData?.allowRetake ?? false,
    timeLimit: initialData?.timeLimit || undefined,
    passingScore: initialData?.passingScore || undefined,
    showResults: initialData?.showResults ?? true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* بخش اطلاعات اصلی */}
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-base font-semibold text-gray-800 flex items-center gap-1">
            عنوان آزمون <span className="text-red-500 text-lg">*</span>
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="مثال: آزمون شخصیت‌سنجی MBTI"
            className="text-base h-12 bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type" className="text-base font-semibold text-gray-800 flex items-center gap-1">
            نوع آزمون <span className="text-red-500 text-lg">*</span>
          </Label>
            <Select
            value={formData.type}
            onValueChange={(value: "MBTI" | "DISC" | "HOLLAND" | "MSQ" | "CUSTOM") =>
              setFormData({ ...formData, type: value })
            }
          >
            <SelectTrigger className="text-base h-12 bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg">
              <SelectValue placeholder="نوع آزمون را انتخاب کنید">
                {formData.type === "MBTI" && "MBTI - مایرز بریگز"}
                {formData.type === "DISC" && "DISC - رفتارشناسی"}
                {formData.type === "HOLLAND" && "هالند - استعدادیابی شغلی"}
                {formData.type === "MSQ" && "MSQ - رضایت شغلی مینه‌سوتا"}
                {formData.type === "CUSTOM" && "سفارشی"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              <SelectItem value="MBTI" className="hover:bg-blue-50">MBTI - مایرز بریگز</SelectItem>
              <SelectItem value="DISC" className="hover:bg-blue-50">DISC - رفتارشناسی</SelectItem>
              <SelectItem value="HOLLAND" className="hover:bg-blue-50">هالند - استعدادیابی شغلی</SelectItem>
              <SelectItem value="MSQ" className="hover:bg-blue-50">MSQ - رضایت شغلی مینه‌سوتا</SelectItem>
              <SelectItem value="CUSTOM" className="hover:bg-blue-50">سفارشی</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500 mt-1">
            نوع آزمون تعیین می‌کند که نتایج چگونه محاسبه شوند
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-base font-semibold text-gray-800">
            توضیحات
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="توضیحات کوتاه درباره آزمون..."
            rows={3}
            className="text-base resize-none bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="instructions" className="text-base font-semibold text-gray-800">
            دستورالعمل
          </Label>
          <Textarea
            id="instructions"
            value={formData.instructions}
            onChange={(e) =>
              setFormData({ ...formData, instructions: e.target.value })
            }
            placeholder="راهنمای انجام آزمون برای کاربران..."
            rows={4}
            className="text-base resize-none bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all"
          />
          <p className="text-sm text-gray-500 mt-1">
            این متن قبل از شروع آزمون به کاربران نمایش داده می‌شود
          </p>
        </div>
      </div>

      {/* بخش تنظیمات زمان و نمره */}
      <div className="space-y-5 border-t border-gray-200 pt-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-1 w-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"></div>
          <h3 className="text-xl font-bold text-gray-800">تنظیمات زمان و نمره</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="timeLimit" className="text-base font-semibold text-gray-800">
              محدودیت زمانی (دقیقه)
            </Label>
            <Input
              id="timeLimit"
              type="number"
              min="0"
              value={formData.timeLimit || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  timeLimit: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              placeholder="بدون محدودیت"
              className="text-base h-12 bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">
              خالی بگذارید برای بدون محدودیت
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="passingScore" className="text-base font-semibold text-gray-800">
              نمره قبولی (درصد)
            </Label>
            <Input
              id="passingScore"
              type="number"
              min="0"
              max="100"
              value={formData.passingScore || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  passingScore: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                })
              }
              placeholder="بدون نمره قبولی"
              className="text-base h-12 bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">
              برای آزمون‌های شخصیت‌سنجی معمولاً نیازی نیست
            </p>
          </div>
        </div>
      </div>

      {/* بخش تنظیمات */}
      <div className="space-y-5 border-t border-gray-200 pt-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-1 w-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"></div>
          <h3 className="text-xl font-bold text-gray-800">تنظیمات دسترسی</h3>
        </div>

        <div className="space-y-4 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-white/50 transition-colors">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor="isActive" className="text-base font-semibold text-gray-800 cursor-pointer">
                فعال بودن آزمون
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                آزمون برای کاربران قابل دسترسی باشد
              </p>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isActive: checked })
              }
            />
          </div>

          <div className="border-t border-gray-200" />

          <div className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-white/50 transition-colors">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor="allowRetake" className="text-base font-semibold text-gray-800 cursor-pointer">
                امکان تکرار آزمون
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                کاربران می‌توانند آزمون را دوباره انجام دهند
              </p>
            </div>
            <Switch
              id="allowRetake"
              checked={formData.allowRetake}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, allowRetake: checked })
              }
            />
          </div>

          <div className="border-t border-gray-200" />

          <div className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-white/50 transition-colors">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor="showResults" className="text-base font-semibold text-gray-800 cursor-pointer">
                نمایش نتایج
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                نتایج به کاربران نمایش داده شود
              </p>
            </div>
            <Switch
              id="showResults"
              checked={formData.showResults}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, showResults: checked })
              }
            />
          </div>
        </div>
      </div>

      {/* دکمه‌های عملیات */}
      <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 mt-8">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="min-w-[120px] h-11 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
          >
            انصراف
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-w-[140px] h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
