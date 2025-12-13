/**
 * تنظیمات ساعت کاری
 */
export interface WorkingHoursSettings {
  enabled: boolean; // آیا محاسبه بر اساس ساعت کاری فعال است؟
  startHour: number; // ساعت شروع کار (0-23)
  endHour: number; // ساعت پایان کار (0-23)
  workingDays: number[]; // روزهای کاری (0=یکشنبه، 1=دوشنبه، ..., 6=شنبه)
  holidays: string[]; // تاریخ‌های تعطیل (فرمت: YYYY-MM-DD)
}

/**
 * تنظیمات پیش‌فرض ساعت کاری
 */
export const DEFAULT_WORKING_HOURS: WorkingHoursSettings = {
  enabled: false,
  startHour: 8, // 8 صبح
  endHour: 17, // 5 عصر
  workingDays: [6, 0, 1, 2, 3], // شنبه تا چهارشنبه
  holidays: [],
};

/**
 * بررسی اینکه یک تاریخ، روز تعطیل است یا نه
 */
function isHoliday(date: Date, holidays: string[]): boolean {
  const dateStr = date.toISOString().split('T')[0];
  return holidays.includes(dateStr);
}

/**
 * بررسی اینکه یک تاریخ، روز کاری است یا نه
 */
function isWorkingDay(date: Date, workingDays: number[], holidays: string[]): boolean {
  const dayOfWeek = date.getDay();
  return workingDays.includes(dayOfWeek) && !isHoliday(date, holidays);
}

/**
 * محاسبه ساعات کاری بین دو تاریخ
 * @param startDate تاریخ شروع
 * @param endDate تاریخ پایان
 * @param settings تنظیمات ساعت کاری
 * @returns تعداد ساعات کاری
 */
export function calculateWorkingHours(
  startDate: Date,
  endDate: Date,
  settings: WorkingHoursSettings = DEFAULT_WORKING_HOURS
): number {
  // اگر محاسبه بر اساس ساعت کاری غیرفعال است، کل زمان را برگردان
  if (!settings.enabled) {
    const diffMs = endDate.getTime() - startDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60)); // تبدیل به ساعت
  }

  let totalHours = 0;
  const current = new Date(startDate);

  // تنظیم ساعت شروع و پایان کار
  const workDayHours = settings.endHour - settings.startHour;

  while (current <= endDate) {
    // بررسی کنیم که آیا روز جاری روز کاری است
    if (isWorkingDay(current, settings.workingDays, settings.holidays)) {
      const currentDate = new Date(current);
      currentDate.setHours(0, 0, 0, 0);

      const startOfWork = new Date(currentDate);
      startOfWork.setHours(settings.startHour, 0, 0, 0);

      const endOfWork = new Date(currentDate);
      endOfWork.setHours(settings.endHour, 0, 0, 0);

      // محاسبه ساعات کاری برای این روز
      const dayStart = current > startOfWork ? current : startOfWork;
      const dayEnd = endDate < endOfWork ? endDate : endOfWork;

      if (dayStart < dayEnd) {
        const hoursThisDay = (dayEnd.getTime() - dayStart.getTime()) / (1000 * 60 * 60);
        totalHours += hoursThisDay;
      }
    }

    // رفتن به روز بعد
    current.setDate(current.getDate() + 1);
    current.setHours(settings.startHour, 0, 0, 0);

    // اگر به تاریخ پایان رسیدیم، متوقف شو
    if (current > endDate) {
      break;
    }
  }

  return Math.floor(totalHours);
}

/**
 * فرمت کردن ساعات به متن قابل خواندن (فارسی)
 * @param hours تعداد ساعات
 * @returns متن فرمت شده
 */
export function formatWorkingHours(hours: number): string {
  if (hours < 1) {
    const minutes = Math.floor(hours * 60);
    return `${minutes} دقیقه`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = Math.floor(hours % 24);

  if (days > 0) {
    if (remainingHours > 0) {
      return `${days} روز و ${remainingHours} ساعت`;
    }
    return `${days} روز`;
  }

  return `${remainingHours} ساعت`;
}

/**
 * محاسبه و فرمت کردن زمان انجام کار
 * @param startDate تاریخ شروع (مثل forwardedAt)
 * @param endDate تاریخ پایان (مثل completedAt)
 * @param settings تنظیمات ساعت کاری
 * @returns متن فرمت شده زمان انجام کار
 */
export function getCompletionTime(
  startDate: Date | string | null,
  endDate: Date | string | null,
  settings: WorkingHoursSettings = DEFAULT_WORKING_HOURS
): string | null {
  if (!startDate || !endDate) {
    return null;
  }

  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  const hours = calculateWorkingHours(start, end, settings);
  return formatWorkingHours(hours);
}
