import { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

/**
 * تبدیل تاریخ میلادی به شمسی
 */
export function toJalali(date: Date | string): DateObject {
  return new DateObject({ date, calendar: persian, locale: persian_fa });
}

/**
 * فرمت کردن تاریخ به صورت شمسی
 * @param date - تاریخ میلادی
 * @param formatStr - الگوی فرمت (مثال: "YYYY/MM/DD", "DD MMMM YYYY")
 */
export function formatJalali(date: Date | string, formatStr: string): string {
  try {
    const jalaliDate = toJalali(date);
    return jalaliDate.format(formatStr);
  } catch (error) {
    console.error("Error formatting Jalali date:", error);
    return "";
  }
}

/**
 * نمایش زمان نسبی به فارسی (مثل "3 روز پیش")
 */
export function formatJalaliRelative(date: Date | string): string {
  try {
    const targetDate = new Date(date);
    const now = new Date();
    const diffInMs = now.getTime() - targetDate.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);

    if (diffInSeconds < 60) {
      return "چند لحظه پیش";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} دقیقه پیش`;
    } else if (diffInHours < 24) {
      return `${diffInHours} ساعت پیش`;
    } else if (diffInDays < 30) {
      return `${diffInDays} روز پیش`;
    } else if (diffInMonths < 12) {
      return `${diffInMonths} ماه پیش`;
    } else {
      return `${diffInYears} سال پیش`;
    }
  } catch (error) {
    console.error("Error formatting relative date:", error);
    return "";
  }
}

/**
 * فرمت‌های پرکاربرد
 */
export const JalaliFormats = {
  FULL: "dddd، DD MMMM YYYY",
  LONG: "DD MMMM YYYY",
  MEDIUM: "DD MMM YYYY",
  SHORT: "YYYY/MM/DD",
  MONTH_YEAR: "MMMM YYYY",
  MONTH_SHORT: "MMM",
  MONTH_SHORT_YEAR: "MMM YY",
  DAY_MONTH: "DD MMM",
  DAY_MONTH_LONG: "DD MMMM",
  TIME: "HH:mm",
  DATETIME: "YYYY/MM/DD HH:mm",
};
