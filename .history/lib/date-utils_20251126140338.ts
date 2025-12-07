/**
 * تبدیل تاریخ میلادی به شمسی (فارسی)
 */
export function formatPersianDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  
  // استفاده از toLocaleDateString با locale فارسی
  const persianDate = d.toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  
  return persianDate;
}

/**
 * محاسبه زمان گذشته از یک تاریخ تا الان
 * مثال: "۲ روز و ۳ ساعت پیش"
 */
export function getTimeAgo(date: Date | string): string {
  const now = new Date();
  const past = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - past.getTime();
  
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  // تبدیل اعداد به فارسی
  const toPersianNumber = (num: number): string => {
    const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return num.toString().replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
  };
  
  if (diffDays > 0) {
    const hours = diffHours % 24;
    if (hours > 0) {
      return `${toPersianNumber(diffDays)} روز و ${toPersianNumber(hours)} ساعت پیش`;
    }
    return `${toPersianNumber(diffDays)} روز پیش`;
  }
  
  if (diffHours > 0) {
    const minutes = diffMinutes % 60;
    if (minutes > 0) {
      return `${toPersianNumber(diffHours)} ساعت و ${toPersianNumber(minutes)} دقیقه پیش`;
    }
    return `${toPersianNumber(diffHours)} ساعت پیش`;
  }
  
  if (diffMinutes > 0) {
    return `${toPersianNumber(diffMinutes)} دقیقه پیش`;
  }
  
  return "همین الان";
}

