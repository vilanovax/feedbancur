import { UpdateCategory } from "@prisma/client";

export interface OpenAISettings {
  enabled: boolean;
  apiKey: string;
  model: string;
}

/**
 * تولید خلاصه برای اطلاع‌رسانی با استفاده از OpenAI
 */
export async function generateUpdateSummary(
  title: string,
  content: string,
  settings: OpenAISettings
): Promise<string> {
  // اگر OpenAI غیرفعال است یا API key نیست، خلاصه ساده برگردان
  if (!settings.enabled || !settings.apiKey) {
    return truncateText(content, 200);
  }

  try {
    const prompt = `لطفاً این متن را به صورت خلاصه و حرفه‌ای بازنویسی کن. خلاصه باید حداکثر 2-3 جمله باشد و برای اطلاع‌رسانی به کارمندان مناسب باشد. از زبان فارسی رسمی استفاده کن.

عنوان: ${title}
متن اصلی: ${content}

خلاصه:`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: settings.model || "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "شما یک دستیار حرفه‌ای برای بازنویسی متن‌های سازمانی هستید. پاسخ‌ها باید کوتاه، رسمی و حرفه‌ای باشند. فقط خلاصه را بنویسید، بدون توضیح اضافی.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 200,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", response.status, response.statusText);
      return truncateText(content, 200);
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content?.trim();

    if (!summary) {
      return truncateText(content, 200);
    }

    return summary;
  } catch (error) {
    console.error("Error generating summary with OpenAI:", error);
    return truncateText(content, 200);
  }
}

/**
 * تولید عنوان بهتر برای اطلاع‌رسانی از فیدبک با استفاده از OpenAI
 */
export async function generateUpdateTitle(
  feedbackTitle: string,
  feedbackContent: string,
  userResponse: string,
  settings: OpenAISettings
): Promise<string> {
  // اگر OpenAI غیرفعال است، عنوان پیش‌فرض برگردان
  if (!settings.enabled || !settings.apiKey) {
    return `رسیدگی به: ${feedbackTitle}`;
  }

  try {
    const prompt = `بر اساس این فیدبک و پاسخ آن، یک عنوان کوتاه و حرفه‌ای (حداکثر 10 کلمه) برای اطلاع‌رسانی به کارمندان بنویس.

فیدبک: ${feedbackTitle}
توضیحات فیدبک: ${truncateText(feedbackContent, 200)}
پاسخ مدیر: ${truncateText(userResponse, 200)}

عنوان:`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: settings.model || "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "شما یک دستیار برای نوشتن عناوین کوتاه و حرفه‌ای هستید. فقط عنوان را بنویسید، بدون توضیح اضافی.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 50,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      return `رسیدگی به: ${feedbackTitle}`;
    }

    const data = await response.json();
    const title = data.choices?.[0]?.message?.content?.trim();

    if (!title) {
      return `رسیدگی به: ${feedbackTitle}`;
    }

    return title;
  } catch (error) {
    console.error("Error generating title with OpenAI:", error);
    return `رسیدگی به: ${feedbackTitle}`;
  }
}

/**
 * تبدیل نوع فیدبک به دسته‌بندی اطلاع‌رسانی
 */
export function getCategoryFromFeedbackType(type: string): UpdateCategory {
  const mapping: Record<string, UpdateCategory> = {
    SUGGESTION: "IMPROVEMENT",
    CRITICAL: "BUG_FIX",
    BUG: "BUG_FIX",
    FEATURE_REQUEST: "FEATURE",
    SURVEY: "NEWS",
  };
  return mapping[type] || "FEEDBACK_COMPLETED";
}

/**
 * کوتاه کردن متن با اضافه کردن سه‌نقطه
 */
function truncateText(text: string, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

/**
 * دریافت آیکون برای دسته‌بندی
 */
export function getCategoryIcon(category: UpdateCategory): string {
  const icons: Record<UpdateCategory, string> = {
    FEATURE: "sparkles",
    BUG_FIX: "bug",
    IMPROVEMENT: "trending-up",
    NEWS: "newspaper",
    FEEDBACK_COMPLETED: "check-circle",
  };
  return icons[category] || "info";
}

/**
 * دریافت رنگ برای دسته‌بندی
 */
export function getCategoryColor(category: UpdateCategory): string {
  const colors: Record<UpdateCategory, string> = {
    FEATURE: "purple",
    BUG_FIX: "red",
    IMPROVEMENT: "blue",
    NEWS: "yellow",
    FEEDBACK_COMPLETED: "green",
  };
  return colors[category] || "gray";
}

/**
 * دریافت برچسب فارسی برای دسته‌بندی
 */
export function getCategoryLabel(category: UpdateCategory): string {
  const labels: Record<UpdateCategory, string> = {
    FEATURE: "قابلیت جدید",
    BUG_FIX: "رفع مشکل",
    IMPROVEMENT: "بهبود",
    NEWS: "خبر",
    FEEDBACK_COMPLETED: "فیدبک تکمیل شده",
  };
  return labels[category] || category;
}

/**
 * دریافت برچسب فارسی برای منبع
 */
export function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    AUTOMATIC: "خودکار",
    MANUAL: "دستی",
    SYSTEM: "سیستمی",
  };
  return labels[source] || source;
}
