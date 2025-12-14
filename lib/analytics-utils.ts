import { prisma } from "@/lib/prisma";
import { calculateWorkingHours, type WorkingHoursSettings } from "@/lib/working-hours-utils";

export interface KeywordMatch {
  keywordId: string;
  keyword: string;
  type: string;
  count: number;
  feedbackIds: string[];
}

export interface FeedbackAnalytics {
  totalFeedbacks: number;
  keywordMatches: KeywordMatch[];
  typeDistribution: {
    [key: string]: number;
  };
  topKeywords: {
    keyword: string;
    count: number;
    type: string;
  }[];
}

/**
 * تحلیل فیدبک‌ها بر اساس کلمات کلیدی تعریف شده
 * @param departmentId - ID بخش (اختیاری)
 * @param startDate - تاریخ شروع (اختیاری)
 * @param endDate - تاریخ پایان (اختیاری)
 * @returns آمار تحلیلی
 */
export async function analyzeFeedbacksByKeywords(
  departmentId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<FeedbackAnalytics> {
  // دریافت کلمات کلیدی فعال
  const keywords = await prisma.analyticsKeyword.findMany({
    where: {
      isActive: true,
      OR: [
        { departmentId: departmentId || null },
        { departmentId: null }, // کلمات عمومی
      ],
    },
    orderBy: {
      priority: "desc", // HIGH -> MEDIUM -> LOW
    },
  });

  // ساخت فیلتر برای فیدبک‌ها
  const feedbackWhere: any = {
    deletedAt: null,
  };

  if (departmentId) {
    feedbackWhere.departmentId = departmentId;
  }

  if (startDate || endDate) {
    feedbackWhere.createdAt = {};
    if (startDate) {
      feedbackWhere.createdAt.gte = startDate;
    }
    if (endDate) {
      feedbackWhere.createdAt.lte = endDate;
    }
  }

  // دریافت فیدبک‌ها
  const feedbacks = await prisma.feedback.findMany({
    where: feedbackWhere,
    select: {
      id: true,
      title: true,
      content: true,
      keywords: true, // کلمات کلیدی استخراج شده با AI
      createdAt: true,
    },
  });

  const totalFeedbacks = feedbacks.length;
  const keywordMatches: { [key: string]: KeywordMatch } = {};
  const typeDistribution: { [key: string]: number } = {
    SENSITIVE: 0,
    POSITIVE: 0,
    NEGATIVE: 0,
    TOPIC: 0,
    CUSTOM: 0,
  };

  // تحلیل هر فیدبک
  feedbacks.forEach((feedback) => {
    const fullText = `${feedback.title} ${feedback.content}`.toLowerCase();

    keywords.forEach((kw) => {
      const keywordLower = kw.keyword.toLowerCase();

      // جستجوی کلمه کلیدی در متن
      if (fullText.includes(keywordLower)) {
        if (!keywordMatches[kw.id]) {
          keywordMatches[kw.id] = {
            keywordId: kw.id,
            keyword: kw.keyword,
            type: kw.type,
            count: 0,
            feedbackIds: [],
          };
        }

        keywordMatches[kw.id].count++;
        keywordMatches[kw.id].feedbackIds.push(feedback.id);
        typeDistribution[kw.type]++;
      }
    });
  });

  // تبدیل به آرایه و مرتب‌سازی
  const keywordMatchesArray = Object.values(keywordMatches).sort(
    (a, b) => b.count - a.count
  );

  // برترین کلمات کلیدی
  const topKeywords = keywordMatchesArray.slice(0, 10).map((m) => ({
    keyword: m.keyword,
    count: m.count,
    type: m.type,
  }));

  return {
    totalFeedbacks,
    keywordMatches: keywordMatchesArray,
    typeDistribution,
    topKeywords,
  };
}

/**
 * دریافت آمار روند کلمات کلیدی در طول زمان
 * @param departmentId - ID بخش (اختیاری)
 * @param days - تعداد روزهای گذشته (پیش‌فرض: 30)
 * @returns آمار روندها
 */
export async function getKeywordTrends(
  departmentId?: string,
  days: number = 30
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // دریافت کلمات کلیدی فعال
  const keywords = await prisma.analyticsKeyword.findMany({
    where: {
      isActive: true,
      OR: [
        { departmentId: departmentId || null },
        { departmentId: null },
      ],
    },
    orderBy: {
      priority: "desc",
    },
    take: 10, // فقط 10 کلمه برتر
  });

  const feedbackWhere: any = {
    deletedAt: null,
    createdAt: {
      gte: startDate,
    },
  };

  if (departmentId) {
    feedbackWhere.departmentId = departmentId;
  }

  const feedbacks = await prisma.feedback.findMany({
    where: feedbackWhere,
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // گروه‌بندی بر اساس روز
  const dailyData: {
    [date: string]: {
      [keywordId: string]: number;
    };
  } = {};

  feedbacks.forEach((feedback) => {
    const date = feedback.createdAt.toISOString().split("T")[0];
    const fullText = `${feedback.title} ${feedback.content}`.toLowerCase();

    if (!dailyData[date]) {
      dailyData[date] = {};
    }

    keywords.forEach((kw) => {
      const keywordLower = kw.keyword.toLowerCase();
      if (fullText.includes(keywordLower)) {
        if (!dailyData[date][kw.id]) {
          dailyData[date][kw.id] = 0;
        }
        dailyData[date][kw.id]++;
      }
    });
  });

  // تبدیل به فرمت مناسب برای نمودار
  const dates = Object.keys(dailyData).sort();
  const series = keywords.map((kw) => ({
    name: kw.keyword,
    type: kw.type,
    data: dates.map((date) => ({
      date,
      count: dailyData[date][kw.id] || 0,
    })),
  }));

  return {
    dates,
    series,
  };
}

/**
 * مقایسه بخش‌ها بر اساس کلمات کلیدی
 */
export async function compareKeywordsByDepartment() {
  const departments = await prisma.department.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  const results = await Promise.all(
    departments.map(async (dept) => {
      const analytics = await analyzeFeedbacksByKeywords(dept.id);
      return {
        departmentId: dept.id,
        departmentName: dept.name,
        totalFeedbacks: analytics.totalFeedbacks,
        typeDistribution: analytics.typeDistribution,
        topKeywords: analytics.topKeywords.slice(0, 5),
      };
    })
  );

  return results;
}

/**
 * محاسبه سرعت انجام فیدبک‌ها بر اساس کلمات کلیدی
 * @param departmentId - ID بخش (اختیاری)
 * @param keywordId - ID کلمه کلیدی (اختیاری)
 * @returns آمار سرعت انجام
 */
export async function getFeedbackCompletionSpeedByKeywords(
  departmentId?: string,
  keywordId?: string
) {
  // دریافت تنظیمات ساعت کاری
  const settings = await prisma.settings.findFirst();
  const workingHoursSettings: WorkingHoursSettings = settings?.workingHoursSettings
    ? typeof settings.workingHoursSettings === 'string'
      ? JSON.parse(settings.workingHoursSettings)
      : settings.workingHoursSettings as WorkingHoursSettings
    : { enabled: false, startHour: 8, endHour: 17, workingDays: [6, 0, 1, 2, 3], holidays: [] };

  // دریافت کلمات کلیدی فعال
  const keywordWhere: any = {
    isActive: true,
  };

  if (keywordId) {
    keywordWhere.id = keywordId;
  } else if (departmentId) {
    keywordWhere.OR = [
      { departmentId },
      { departmentId: null },
    ];
  }

  const keywords = await prisma.analyticsKeyword.findMany({
    where: keywordWhere,
    orderBy: {
      priority: "desc",
    },
  });

  // ساخت فیلتر برای فیدبک‌های تکمیل شده
  const feedbackWhere: any = {
    deletedAt: null,
    status: "COMPLETED",
    completedAt: { not: null },
    forwardedAt: { not: null },
  };

  if (departmentId) {
    feedbackWhere.departmentId = departmentId;
  }

  const completedFeedbacks = await prisma.feedback.findMany({
    where: feedbackWhere,
    select: {
      id: true,
      title: true,
      content: true,
      forwardedAt: true,
      completedAt: true,
    },
  });

  // تحلیل سرعت برای هر کلمه کلیدی
  const keywordSpeedStats: {
    [keywordId: string]: {
      keyword: string;
      type: string;
      totalFeedbacks: number;
      totalHours: number;
      averageHours: number;
      feedbackIds: string[];
    };
  } = {};

  completedFeedbacks.forEach((feedback) => {
    const fullText = `${feedback.title} ${feedback.content}`.toLowerCase();

    keywords.forEach((kw) => {
      const keywordLower = kw.keyword.toLowerCase();

      // جستجوی کلمه کلیدی در متن
      if (fullText.includes(keywordLower)) {
        if (!keywordSpeedStats[kw.id]) {
          keywordSpeedStats[kw.id] = {
            keyword: kw.keyword,
            type: kw.type,
            totalFeedbacks: 0,
            totalHours: 0,
            averageHours: 0,
            feedbackIds: [],
          };
        }

        if (feedback.forwardedAt && feedback.completedAt) {
          const startDate = new Date(feedback.forwardedAt);
          const endDate = new Date(feedback.completedAt);
          const hours = calculateWorkingHours(startDate, endDate, workingHoursSettings);

          keywordSpeedStats[kw.id].totalFeedbacks++;
          keywordSpeedStats[kw.id].totalHours += hours;
          keywordSpeedStats[kw.id].feedbackIds.push(feedback.id);
        }
      }
    });
  });

  // محاسبه میانگین و مرتب‌سازی
  const speedData = Object.values(keywordSpeedStats)
    .filter((stat) => stat.totalFeedbacks > 0)
    .map((stat) => ({
      keyword: stat.keyword,
      type: stat.type,
      totalFeedbacks: stat.totalFeedbacks,
      averageHours: Math.round((stat.totalHours / stat.totalFeedbacks) * 10) / 10,
      feedbackIds: stat.feedbackIds,
    }))
    .sort((a, b) => a.averageHours - b.averageHours); // مرتب‌سازی بر اساس سرعت (کمترین زمان = سریع‌تر)

  return {
    totalCompletedFeedbacks: completedFeedbacks.length,
    keywordSpeedData: speedData,
    topFastestKeywords: speedData.slice(0, 10),
    topSlowestKeywords: speedData.slice(-10).reverse(),
  };
}
