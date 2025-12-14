// MBTI Assessment Calculator
// محاسبه‌گر آزمون شخصیت‌سنجی MBTI

export interface MBTIScores {
  E: number; // Extraversion (برون‌گرایی)
  I: number; // Introversion (درون‌گرایی)
  S: number; // Sensing (حسی)
  N: number; // Intuition (شهودی)
  T: number; // Thinking (تفکر)
  F: number; // Feeling (احساس)
  J: number; // Judging (قضاوت)
  P: number; // Perceiving (ادراک)
}

export interface MBTIResult {
  type: string; // e.g., "INTJ"
  scores: MBTIScores;
  percentages: {
    [key: string]: number; // e.g., { "E": 40, "I": 60, "S": 30, "N": 70, ... }
  };
  description: string;
  strengths: string[];
  weaknesses: string[];
  careers: string[];
}

export interface MBTIOption {
  text: string;
  value: string;
  score: Partial<MBTIScores>;
}

export interface MBTIAnswer {
  questionId: string;
  selectedOption: MBTIOption;
}

/**
 * توضیحات کامل برای هر 16 تیپ شخصیتی MBTI
 */
const MBTI_DESCRIPTIONS: { [key: string]: { description: string; strengths: string[]; weaknesses: string[]; careers: string[] } } = {
  INTJ: {
    description:
      "معمار - استراتژیست خلاق و با اعتماد به نفس. افراد INTJ تحلیلگر، مستقل و راهبردی هستند. آنها به دنبال بهبود سیستم‌ها و فرآیندها هستند و از برنامه‌ریزی بلندمدت لذت می‌برند.",
    strengths: [
      "تفکر استراتژیک و برنامه‌ریزی بلندمدت",
      "استقلال و خودکفایی",
      "تحلیلگری قوی",
      "قاطعیت در تصمیم‌گیری",
      "خلاقیت در حل مسائل پیچیده",
    ],
    weaknesses: [
      "ممکن است خیلی انتقادی باشند",
      "مشکل در ابراز احساسات",
      "بی‌صبری نسبت به جزئیات",
      "ممکن است بیش از حد مستقل باشند",
    ],
    careers: ["مهندس", "دانشمند", "برنامه‌نویس", "معمار", "استراتژیست کسب‌وکار", "محقق"],
  },
  INTP: {
    description:
      "منطق‌دان - نوآور و تحلیلگر. افراد INTP کنجکاو و خلاق هستند و علاقه زیادی به درک نظریه‌ها و اصول دارند. آنها به دنبال راه‌حل‌های نوآورانه برای مسائل پیچیده هستند.",
    strengths: ["تفکر منطقی و تحلیلی", "خلاقیت در حل مسائل", "استقلال فکری", "انعطاف‌پذیری", "کنجکاوی علمی"],
    weaknesses: [
      "ممکن است در جزئیات عملی ضعیف باشند",
      "مشکل در ابراز احساسات",
      "ممکن است بیش از حد نظری باشند",
      "تعلل در تصمیم‌گیری",
    ],
    careers: ["برنامه‌نویس", "دانشمند", "فیلسوف", "مهندس", "محقق", "تحلیلگر"],
  },
  ENTJ: {
    description:
      "فرمانده - رهبر جسور و با قدرت تصمیم‌گیری. افراد ENTJ طبیعتاً رهبر هستند و به دنبال سازماندهی افراد و منابع برای رسیدن به اهداف هستند.",
    strengths: ["مهارت‌های رهبری قوی", "قاطعیت", "برنامه‌ریزی استراتژیک", "اعتماد به نفس", "کارآمدی"],
    weaknesses: [
      "ممکن است خیلی سختگیر باشند",
      "بی‌صبری نسبت به ناکارآمدی",
      "ممکن است احساسات دیگران را نادیده بگیرند",
      "تمایل به کنترل بیش از حد",
    ],
    careers: ["مدیر ارشد", "کارآفرین", "وکیل", "مشاور مدیریت", "مدیر پروژه"],
  },
  ENTP: {
    description:
      "مناظره‌کننده - متفکر هوشمند و کنجکاو. افراد ENTP از چالش‌های فکری لذت می‌برند و به دنبال راه‌حل‌های نوآورانه هستند.",
    strengths: ["خلاقیت و نوآوری", "مهارت‌های ارتباطی", "انعطاف‌پذیری", "تفکر سریع", "انگیزه برای یادگیری"],
    weaknesses: [
      "ممکن است پروژه‌ها را ناتمام بگذارند",
      "بی‌حوصلگی نسبت به جزئیات",
      "ممکن است بحث‌انگیز باشند",
      "تعلل در تکالیف روتین",
    ],
    careers: ["کارآفرین", "مشاور", "بازاریاب", "وکیل", "مخترع", "روزنامه‌نگار"],
  },
  INFJ: {
    description:
      "وکیل مدافع - ایده‌آلیست با اصول محکم. افراد INFJ به دنبال معنا و هدف در زندگی هستند و می‌خواهند به دیگران کمک کنند.",
    strengths: ["همدلی عمیق", "بینش قوی", "تعهد به ارزش‌ها", "خلاقیت", "تفکر استراتژیک"],
    weaknesses: [
      "حساسیت بیش از حد",
      "تمایل به کمال‌گرایی",
      "ممکن است خیلی خصوصی باشند",
      "فرسودگی از کمک به دیگران",
    ],
    careers: ["مشاور", "روانشناس", "نویسنده", "مربی", "معلم", "مددکار اجتماعی"],
  },
  INFP: {
    description:
      "میانجی - ایده‌آلیست و وفادار به ارزش‌ها. افراد INFP به دنبال هماهنگی بین ارزش‌ها و زندگی واقعی‌شان هستند.",
    strengths: ["خلاقیت", "همدلی", "وفاداری", "انعطاف‌پذیری", "ایده‌آلیسم"],
    weaknesses: [
      "حساسیت بیش از حد به انتقاد",
      "مشکل در عملی کردن ایده‌ها",
      "تمایل به ایده‌آل‌گرایی بیش از حد",
      "گرفتار شدن در احساسات",
    ],
    careers: ["نویسنده", "هنرمند", "مشاور", "روانشناس", "معلم", "مترجم"],
  },
  ENFJ: {
    description:
      "قهرمان - رهبر کاریزماتیک و الهام‌بخش. افراد ENFJ به دنبال کمک به دیگران برای رسیدن به پتانسیل‌شان هستند.",
    strengths: ["مهارت‌های رهبری", "همدلی", "کاریزما", "سازماندهی", "انگیزه بخشیدن به دیگران"],
    weaknesses: [
      "حساسیت بیش از حد به انتقاد",
      "تمایل به مسئولیت‌پذیری بیش از حد",
      "ممکن است نیازهای خود را نادیده بگیرند",
      "مشکل در تصمیم‌گیری‌های سخت",
    ],
    careers: ["معلم", "مشاور", "مربی", "مدیر منابع انسانی", "مددکار اجتماعی"],
  },
  ENFP: {
    description:
      "کمپین‌گر - مشتاق و خلاق. افراد ENFP پرانرژی و با روحیه هستند و به دنبال ارتباطات معنادار با دیگران هستند.",
    strengths: ["خلاقیت", "مهارت‌های ارتباطی", "اشتیاق", "انعطاف‌پذیری", "خوش‌بینی"],
    weaknesses: [
      "بی‌حوصلگی نسبت به جزئیات",
      "مشکل در تمرکز",
      "تمایل به تعهدات بیش از حد",
      "حساسیت به تنش و تعارض",
    ],
    careers: ["مشاور", "روزنامه‌نگار", "بازاریاب", "معلم", "روانشناس", "هنرمند"],
  },
  ISTJ: {
    description:
      "بازرس - قابل اعتماد و عملی. افراد ISTJ مسئولیت‌پذیر و سازمان‌یافته هستند و به دنبال حفظ نظم و قانون هستند.",
    strengths: ["قابلیت اطمینان", "سازماندهی", "وظیفه‌شناسی", "دقت", "منطقی بودن"],
    weaknesses: [
      "سختگیری بیش از حد",
      "مقاومت در برابر تغییر",
      "مشکل در ابراز احساسات",
      "تمایل به سنت‌گرایی بیش از حد",
    ],
    careers: ["حسابدار", "مهندس", "مدیر", "قاضی", "پلیس", "تحلیلگر مالی"],
  },
  ISFJ: {
    description:
      "مدافع - مراقب و وفادار. افراد ISFJ به دنبال حمایت از دیگران و حفظ هماهنگی هستند.",
    strengths: ["وفاداری", "توجه به جزئیات", "همدلی", "مسئولیت‌پذیری", "صبر"],
    weaknesses: [
      "مشکل در گفتن نه",
      "حساسیت بیش از حد",
      "مقاومت در برابر تغییر",
      "تمایل به فداکاری بیش از حد",
    ],
    careers: ["پرستار", "معلم", "مشاور", "منشی", "مددکار اجتماعی", "دندانپزشک"],
  },
  ESTJ: {
    description:
      "اجرایی - سازمان‌دهنده و مدیر. افراد ESTJ به دنبال نظم و کارایی هستند و از قوانین و ساختارها پیروی می‌کنند.",
    strengths: ["مهارت‌های مدیریت", "سازماندهی", "قاطعیت", "عملی بودن", "قابلیت اطمینان"],
    weaknesses: [
      "سختگیری",
      "بی‌انعطافی",
      "مشکل در درک احساسات",
      "تمایل به کنترل بیش از حد",
    ],
    careers: ["مدیر", "قاضی", "افسر نظامی", "مدیر پروژه", "مدیر ارشد اجرایی"],
  },
  ESFJ: {
    description:
      "کنسول - مراقب و دوستانه. افراد ESFJ به دنبال کمک به دیگران و ایجاد هماهنگی هستند.",
    strengths: ["مهارت‌های اجتماعی", "همدلی", "سازماندهی", "وفاداری", "کمک به دیگران"],
    weaknesses: [
      "حساسیت بیش از حد به انتقاد",
      "مشکل در تفویض اختیار",
      "تمایل به خوشایند دیگران",
      "مقاومت در برابر تغییر",
    ],
    careers: ["معلم", "پرستار", "مدیر دفتر", "مشاور", "مددکار اجتماعی"],
  },
  ISTP: {
    description:
      "استاد - تحلیلگر و عملی. افراد ISTP به دنبال درک چگونگی کار کردن چیزها هستند و از حل مسائل لذت می‌برند.",
    strengths: ["مهارت‌های عملی", "تحلیل منطقی", "انعطاف‌پذیری", "آرامش در بحران", "خلاقیت در حل مسائل"],
    weaknesses: [
      "مشکل در ابراز احساسات",
      "تمایل به تنها بودن",
      "بی‌حوصلگی نسبت به تعهدات بلندمدت",
      "ریسک‌پذیری بیش از حد",
    ],
    careers: ["مهندس", "مکانیک", "پلیس", "ورزشکار", "برنامه‌نویس"],
  },
  ISFP: {
    description:
      "ماجراجو - هنرمند و حساس. افراد ISFP به دنبال تجربیات زیبایی‌شناختی و معنادار هستند.",
    strengths: ["خلاقیت", "همدلی", "انعطاف‌پذیری", "حس زیبایی‌شناسی", "آرامش"],
    weaknesses: [
      "حساسیت بیش از حد",
      "مشکل در برنامه‌ریزی بلندمدت",
      "تمایل به اجتناب از تعارض",
      "مشکل در تصمیم‌گیری‌های سخت",
    ],
    careers: ["هنرمند", "طراح", "موسیقیدان", "معلم", "مشاور", "دکوراتور داخلی"],
  },
  ESTP: {
    description:
      "کارآفرین - پرانرژی و عملی. افراد ESTP به دنبال اقدام فوری و نتایج ملموس هستند.",
    strengths: ["عمل‌گرایی", "انرژی بالا", "مهارت‌های اجتماعی", "انعطاف‌پذیری", "آرامش در بحران"],
    weaknesses: [
      "بی‌صبری",
      "ریسک‌پذیری بیش از حد",
      "مشکل در برنامه‌ریزی بلندمدت",
      "بی‌حوصلگی نسبت به نظریه",
    ],
    careers: ["فروشنده", "کارآفرین", "پلیس", "ورزشکار", "آتش‌نشان"],
  },
  ESFP: {
    description:
      "سرگرم‌کننده - پرانرژی و دوستانه. افراد ESFP به دنبال لذت بردن از لحظه و ایجاد شادی برای دیگران هستند.",
    strengths: ["مهارت‌های اجتماعی", "اشتیاق", "انعطاف‌پذیری", "خوش‌بینی", "عملی بودن"],
    weaknesses: [
      "مشکل در برنامه‌ریزی بلندمدت",
      "حساسیت به انتقاد",
      "بی‌حوصلگی نسبت به جزئیات",
      "تمایل به اجتناب از تعارض",
    ],
    careers: ["معلم", "فروشنده", "سرگرم‌کننده", "مشاور", "طراح", "مددکار اجتماعی"],
  },
};

/**
 * محاسبه نتیجه آزمون MBTI بر اساس پاسخ‌های کاربر
 */
export function calculateMBTI(answers: Record<string, any>, questions: any[]): MBTIResult {
  // مقداردهی اولیه امتیازات
  const scores: MBTIScores = {
    E: 0,
    I: 0,
    S: 0,
    N: 0,
    T: 0,
    F: 0,
    J: 0,
    P: 0,
  };

  // محاسبه امتیازات بر اساس پاسخ‌ها
  Object.entries(answers).forEach(([questionId, answer]) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question || !question.options) return;

    // پیدا کردن گزینه انتخاب شده
    const selectedOption = question.options.find((opt: any) =>
      opt.value === answer || opt.text === answer
    );

    if (selectedOption && selectedOption.score) {
      // اضافه کردن امتیازات
      Object.entries(selectedOption.score).forEach(([dimension, score]) => {
        if (dimension in scores) {
          scores[dimension as keyof MBTIScores] += Number(score);
        }
      });
    }
  });

  // تعیین تیپ شخصیتی
  const type = [
    scores.E > scores.I ? "E" : "I",
    scores.S > scores.N ? "S" : "N",
    scores.T > scores.F ? "T" : "F",
    scores.J > scores.P ? "J" : "P",
  ].join("");

  // محاسبه درصدها
  const percentages: { [key: string]: number } = {
    E: calculatePercentage(scores.E, scores.E + scores.I),
    I: calculatePercentage(scores.I, scores.E + scores.I),
    S: calculatePercentage(scores.S, scores.S + scores.N),
    N: calculatePercentage(scores.N, scores.S + scores.N),
    T: calculatePercentage(scores.T, scores.T + scores.F),
    F: calculatePercentage(scores.F, scores.T + scores.F),
    J: calculatePercentage(scores.J, scores.J + scores.P),
    P: calculatePercentage(scores.P, scores.J + scores.P),
  };

  // دریافت توضیحات تیپ شخصیتی
  const typeInfo = MBTI_DESCRIPTIONS[type] || {
    description: `تیپ شخصیتی ${type}`,
    strengths: [],
    weaknesses: [],
    careers: [],
  };

  return {
    type,
    scores,
    percentages,
    description: typeInfo.description,
    strengths: typeInfo.strengths,
    weaknesses: typeInfo.weaknesses,
    careers: typeInfo.careers,
  };
}

/**
 * محاسبه درصد
 */
function calculatePercentage(score: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((score / total) * 100);
}

/**
 * اعتبارسنجی پاسخ‌های MBTI
 */
export function validateMBTIAnswers(
  answers: Record<string, any>,
  questions: any[]
): { isValid: boolean; missingQuestions: string[] } {
  const requiredQuestions = questions.filter((q) => q.isRequired);
  const missingQuestions: string[] = [];

  requiredQuestions.forEach((q) => {
    if (!answers[q.id]) {
      missingQuestions.push(q.id);
    }
  });

  return {
    isValid: missingQuestions.length === 0,
    missingQuestions,
  };
}
