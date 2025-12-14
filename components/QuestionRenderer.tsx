"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useState } from "react";

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
}

export function QuestionRenderer({
  question,
  value,
  onChange,
}: QuestionRendererProps) {
  const [rating, setRating] = useState<number>(
    value ? parseInt(value) : 0
  );

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
    onChange(newRating.toString());
  };

  const renderMultipleChoice = () => {
    const options = Array.isArray(question.options)
      ? question.options
      : [];

    return (
      <RadioGroup value={value} onValueChange={onChange}>
        <div className="space-y-3">
          {options.map((option: QuestionOption, index: number) => (
            <div
              key={index}
              className="flex items-center space-x-2 space-x-reverse"
            >
              <RadioGroupItem
                value={option.value}
                id={`${question.id}-${option.value}`}
              />
              <Label
                htmlFor={`${question.id}-${option.value}`}
                className="flex-1 cursor-pointer"
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
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="true" id={`${question.id}-true`} />
            <Label htmlFor={`${question.id}-true`} className="cursor-pointer">
              بله
            </Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="false" id={`${question.id}-false`} />
            <Label htmlFor={`${question.id}-false`} className="cursor-pointer">
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
      />
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">
          {question.questionText}
          {question.isRequired && (
            <span className="text-red-500 mr-1">*</span>
          )}
        </h3>

        {question.image && (
          <div className="my-4">
            <img
              src={question.image}
              alt="تصویر سوال"
              className="max-w-full h-auto rounded-lg"
            />
          </div>
        )}
      </div>

      <div className="mt-4">
        {question.questionType === "MULTIPLE_CHOICE" && renderMultipleChoice()}
        {question.questionType === "RATING_SCALE" && renderRatingScale()}
        {question.questionType === "TRUE_FALSE" && renderTrueFalse()}
        {question.questionType === "TEXT" && renderTextInput()}
      </div>
    </div>
  );
}
