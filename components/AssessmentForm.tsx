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
  type: "MBTI" | "DISC" | "CUSTOM";
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">عنوان آزمون *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          placeholder="مثال: آزمون شخصیت‌سنجی MBTI"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">نوع آزمون *</Label>
        <Select
          value={formData.type}
          onValueChange={(value: "MBTI" | "DISC" | "CUSTOM") =>
            setFormData({ ...formData, type: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MBTI">MBTI - مایرز بریگز</SelectItem>
            <SelectItem value="DISC">DISC - رفتارشناسی</SelectItem>
            <SelectItem value="CUSTOM">سفارشی</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">توضیحات</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="توضیحات کوتاه درباره آزمون..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructions">دستورالعمل</Label>
        <Textarea
          id="instructions"
          value={formData.instructions}
          onChange={(e) =>
            setFormData({ ...formData, instructions: e.target.value })
          }
          placeholder="راهنمای انجام آزمون برای کاربران..."
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="timeLimit">محدودیت زمانی (دقیقه)</Label>
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
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="passingScore">نمره قبولی (درصد)</Label>
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
          />
        </div>
      </div>

      <div className="space-y-4 rounded-lg border p-4">
        <h3 className="font-medium">تنظیمات</h3>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="isActive">فعال</Label>
            <p className="text-sm text-muted-foreground">
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

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="allowRetake">امکان تکرار</Label>
            <p className="text-sm text-muted-foreground">
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

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="showResults">نمایش نتایج</Label>
            <p className="text-sm text-muted-foreground">
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

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            انصراف
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
