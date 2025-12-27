"use client";

import { memo, useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";

interface QuestionOption {
  text: string;
  value: string;
  score?: any;
}

interface QuestionRendererProps {
  question: {
    id: string;
    questionText: string;
    questionType: "MULTIPLE_CHOICE" | "RATING_SCALE" | "TRUE_FALSE" | "TEXT";
    isRequired: boolean;
    options: QuestionOption[] | any;
    image?: string | null;
  };
  value?: string;
  onChange: (value: string) => void;
  onAutoNext?: () => void;
}

function QuestionRendererComponent({
  question,
  value,
  onChange,
  onAutoNext,
}: QuestionRendererProps) {
  const [rating, setRating] = useState<number>(
    value ? parseInt(value) : 0
  );

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
    onChange(newRating.toString());
  };

  const renderMultipleChoice = () => {
    // Parse options - handle different formats
    let options: QuestionOption[] = [];

    if (!question.options) {
      return (
        <div className="text-sm text-gray-500 dark:text-gray-400 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          گزینه‌ای برای این سوال تعریف نشده است
        </div>
      );
    }

    // If options is already an array
    if (Array.isArray(question.options)) {
      options = question.options;
    }
    // If options is a string (JSON), parse it
    else if (typeof question.options === 'string') {
      try {
        const parsed = JSON.parse(question.options);
        options = Array.isArray(parsed) ? parsed : [];
      } catch {
        options = [];
      }
    }
    // If options is an object, try to convert to array
    else if (typeof question.options === 'object') {
      // Check if it's an object with array-like structure
      if (question.options && typeof question.options === 'object' && !Array.isArray(question.options)) {
        // Try to extract array from object
        const keys = Object.keys(question.options);
        if (keys.length > 0 && Array.isArray(question.options[keys[0]])) {
          options = question.options[keys[0]];
        } else {
          // Convert object to array if it has numeric keys
          options = Object.values(question.options) as QuestionOption[];
        }
      }
    }

    // Normalize options - ensure each has text and value
    const normalizedOptions = options.map((option: any, index: number) => {
      // If option is a string, convert to object
      if (typeof option === 'string') {
        return {
          text: option,
          value: String(index),
        };
      }
      // If option is an object but missing value, use index
      if (option && typeof option === 'object') {
        return {
          text: option.text || option.label || option.content || String(option),
          value: option.value || option.id || String(index),
          score: option.score,
        };
      }
      return {
        text: String(option),
        value: String(index),
      };
    });

    if (normalizedOptions.length === 0) {
      return (
        <div className="text-sm text-gray-500 dark:text-gray-400 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          گزینه‌ای برای این سوال تعریف نشده است. لطفاً با مدیر سیستم تماس بگیرید.
        </div>
      );
    }

    const handleValueChange = (newValue: string) => {
      onChange(newValue);
      // Auto navigate to next question after a short delay
      if (onAutoNext) {
        setTimeout(() => {
          onAutoNext();
        }, 300); // 300ms delay for better UX
      }
    };

    return (
      <RadioGroup value={value} onValueChange={handleValueChange}>
        <div className="space-y-3">
          {normalizedOptions.map((option: QuestionOption, index: number) => (
            <div
              key={index}
              className="flex items-center gap-[5px] p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <RadioGroupItem
                value={option.value}
                id={`${question.id}-${option.value}-${index}`}
                className="flex-shrink-0"
              />
              <Label
                htmlFor={`${question.id}-${option.value}-${index}`}
                className="flex-1 cursor-pointer text-gray-900 dark:text-white font-medium"
              >
                {option.text}
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>
    );
  };

  const renderRatingScale = () => {
    return (
      <div className="flex items-center justify-center gap-2 py-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingChange(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                star <= rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
        <span className="mr-4 text-sm text-muted-foreground">
          {rating > 0 ? `${rating} از 5` : "انتخاب نشده"}
        </span>
      </div>
    );
  };

  const renderTrueFalse = () => {
    return (
      <RadioGroup value={value} onValueChange={onChange}>
        <div className="flex gap-4">
          <div className="flex items-center space-x-2 space-x-reverse p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex-1">
            <RadioGroupItem value="true" id={`${question.id}-true`} />
            <Label htmlFor={`${question.id}-true`} className="cursor-pointer text-gray-900 dark:text-white font-medium">
              بله
            </Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex-1">
            <RadioGroupItem value="false" id={`${question.id}-false`} />
            <Label htmlFor={`${question.id}-false`} className="cursor-pointer text-gray-900 dark:text-white font-medium">
              خیر
            </Label>
          </div>
        </div>
      </RadioGroup>
    );
  };

  const renderTextInput = () => {
    return (
      <Textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="پاسخ خود را وارد کنید..."
        rows={4}
        className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500"
      />
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-relaxed">
          {question.questionText}
          {question.isRequired && (
            <span className="text-red-500 mr-1">*</span>
          )}
        </h3>

        {question.image && (
          <div className="my-4">
            <OptimizedImage
              src={question.image}
              alt="تصویر سوال"
              className="max-w-full h-auto rounded-lg shadow-sm"
              width={600}
              height={400}
            />
          </div>
        )}
      </div>

      <div className="mt-6">
        {question.questionType === "MULTIPLE_CHOICE" && renderMultipleChoice()}
        {question.questionType === "RATING_SCALE" && renderRatingScale()}
        {question.questionType === "TRUE_FALSE" && renderTrueFalse()}
        {question.questionType === "TEXT" && renderTextInput()}
      </div>
    </div>
  );
}

export const QuestionRenderer = memo(QuestionRendererComponent);
