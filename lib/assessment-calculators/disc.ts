// DISC Assessment Calculator
// محاسبه‌گر آزمون شخصیت‌سنجی DISC

export interface DISCScores {
  D: number; // Dominance (سلطه‌گری)
  I: number; // Influence (تأثیرگذاری)
  S: number; // Steadiness (پایداری)
  C: number; // Conscientiousness (وظیفه‌شناسی)
}

export interface DISCResult {
  type: string; // e.g., "D", "I", "DI", "SC"
  scores: DISCScores;
  percentages: {
    [key: string]: number; // e.g., { "D": 45, "I": 30, "S": 15, "C": 10 }
  };
  description: string;
  strengths: string[];
  weaknesses: string[];
  workStyle: string[];
  careers: string[];
}

export interface DISCOption {
  text: string;
  value: string;
  score: Partial<DISCScores>;
}

/**
 * توضیحات کامل برای هر تیپ DISC
 */
const DISC_DESCRIPTIONS: {
  [key: string]: {
    description: string;
    strengths: string[];
    weaknesses: string[];
    workStyle: string[];
    careers: string[];
  };
} = {
  D: {
    description:
      "سلطه‌گر - رهبر قاطع و نتیجه‌گرا. افراد با تیپ D مستقیم، قاطع و رقابتی هستند. آنها به دنبال چالش و کنترل محیط خود هستند.",
    strengths: [
      "تصمیم‌گیری سریع و قاطع",
      "مدیریت بحران",
      "قبول مسئولیت",
      "رهبری قوی",
      "جسارت و شجاعت",
    ],
    weaknesses: [
      "بی‌صبری",
      "عدم توجه به جزئیات",
      "ممکن است خیلی مستقیم باشند",
      "تمایل به کنترل بیش از حد",
      "مشکل در شنیدن دیگران",
    ],
    workStyle: [
      "دوست دارند کنترل داشته باشند",
      "به دنبال نتایج سریع هستند",
      "ترجیح می‌دهند به تنهایی کار کنند",
      "به چالش نیاز دارند",
    ],
    careers: ["مدیر ارشد", "کارآفرین", "مدیر پروژه", "فروشنده", "وکیل"],
  },
  I: {
    description:
      "تأثیرگذار - اجتماعی و مشتاق. افراد با تیپ I خارج‌گرا، خوش‌بین و متقاعدکننده هستند. آنها از تعامل با دیگران لذت می‌برند.",
    strengths: [
      "مهارت‌های ارتباطی قوی",
      "اشتیاق و انرژی",
      "خوش‌بینی",
      "متقاعدسازی",
      "ایجاد روابط",
    ],
    weaknesses: [
      "بی‌سازمانی",
      "بی‌حوصلگی نسبت به جزئیات",
      "صحبت بیش از حد",
      "مشکل در تمرکز",
      "تمایل به تعهدات بیش از حد",
    ],
    workStyle: [
      "به کار تیمی علاقه دارند",
      "نیاز به تعامل اجتماعی",
      "ترجیح می‌دهند محیط کار شاد باشد",
      "به تشویق نیاز دارند",
    ],
    careers: ["بازاریاب", "فروشنده", "روابط عمومی", "مشاور", "معلم"],
  },
  S: {
    description:
      "پایدار - صبور و قابل اعتماد. افراد با تیپ S آرام، صبور و وفادار هستند. آنها به دنبال ثبات و هماهنگی هستند.",
    strengths: [
      "صبر و پشتکار",
      "قابلیت اطمینان",
      "کار تیمی",
      "شنونده خوب",
      "وفاداری",
    ],
    weaknesses: [
      "مقاومت در برابر تغییر",
      "مشکل در گفتن نه",
      "اجتناب از تعارض",
      "تصمیم‌گیری کند",
      "عدم ابتکار عمل",
    ],
    workStyle: [
      "ترجیح می‌دهند در محیط ثابت کار کنند",
      "نیاز به امنیت شغلی",
      "دوست دارند بخشی از تیم باشند",
      "به تقدیر نیاز دارند",
    ],
    careers: ["پرستار", "معلم", "مشاور", "منشی", "مددکار اجتماعی"],
  },
  C: {
    description:
      "وظیفه‌شناس - دقیق و تحلیلگر. افراد با تیپ C دقیق، تحلیلی و سیستماتیک هستند. آنها به دنبال کیفیت و دقت هستند.",
    strengths: [
      "دقت بالا",
      "تحلیل دقیق",
      "کیفیت‌گرایی",
      "سازماندهی",
      "تفکر منطقی",
    ],
    weaknesses: [
      "کمال‌گرایی بیش از حد",
      "سختگیری",
      "انتقادی بودن",
      "تصمیم‌گیری کند",
      "اجتناب از ریسک",
    ],
    workStyle: [
      "نیاز به جزئیات و دقت",
      "ترجیح می‌دهند به تنهایی کار کنند",
      "دوست دارند استانداردها را رعایت کنند",
      "به زمان برای تفکر نیاز دارند",
    ],
    careers: ["حسابدار", "مهندس", "دانشمند", "برنامه‌نویس", "تحلیلگر"],
  },
  DI: {
    description:
      "سلطه‌گر-تأثیرگذار - رهبر کاریزماتیک. ترکیبی از قاطعیت و مهارت‌های اجتماعی. این افراد رهبران خوبی هستند که می‌توانند دیگران را ترغیب و هدایت کنند.",
    strengths: [
      "رهبری قوی",
      "مهارت‌های ارتباطی",
      "انگیزه‌بخشی",
      "تصمیم‌گیری سریع",
      "کاریزما",
    ],
    weaknesses: [
      "بی‌صبری",
      "ممکن است خیلی مستقیم باشند",
      "بی‌حوصلگی نسبت به جزئیات",
      "تمایل به سلطه در مکالمات",
    ],
    workStyle: ["رهبری پروژه‌ها", "تعامل با مشتریان", "ارائه‌های عمومی", "فروش و بازاریابی"],
    careers: ["مدیر فروش", "کارآفرین", "مشاور مدیریت", "مدیر ارشد"],
  },
  DC: {
    description:
      "سلطه‌گر-وظیفه‌شناس - رهبر تحلیلگر. ترکیبی از قاطعیت و دقت. این افراد رهبران استراتژیک هستند که به جزئیات توجه می‌کنند.",
    strengths: [
      "تفکر استراتژیک",
      "تحلیل دقیق",
      "تصمیم‌گیری مبتنی بر داده",
      "کنترل کیفیت",
    ],
    weaknesses: [
      "سختگیری بیش از حد",
      "کمال‌گرایی",
      "مشکل در ابراز احساسات",
      "بی‌صبری نسبت به اشتباهات",
    ],
    workStyle: ["تحلیل و برنامه‌ریزی", "کنترل کیفیت", "مدیریت پروژه", "حل مسائل پیچیده"],
    careers: ["مهندس", "مدیر پروژه", "مشاور مالی", "تحلیلگر سیستم"],
  },
  IS: {
    description:
      "تأثیرگذار-پایدار - تیم‌ساز دوستانه. ترکیبی از مهارت‌های اجتماعی و پایداری. این افراد تیم‌سازان خوبی هستند که محیط کار را دوستانه می‌کنند.",
    strengths: [
      "کار تیمی",
      "ایجاد رابطه",
      "حمایت از دیگران",
      "ایجاد هماهنگی",
    ],
    weaknesses: [
      "مشکل در تصمیم‌گیری‌های سخت",
      "اجتناب از تعارض",
      "مقاومت در برابر تغییر",
      "تمایل به خوشایند دیگران",
    ],
    workStyle: ["کار تیمی", "پشتیبانی از اعضای تیم", "ایجاد روابط", "حل تعارضات"],
    careers: ["مشاور", "معلم", "منابع انسانی", "روانشناس"],
  },
  IC: {
    description:
      "تأثیرگذار-وظیفه‌شناس - ارتباط‌دهنده دقیق. ترکیبی از مهارت‌های اجتماعی و دقت. این افراد در ارتباطات دقیق و حرفه‌ای موفق هستند.",
    strengths: [
      "ارتباط دقیق",
      "توجه به جزئیات",
      "سازماندهی رویدادها",
      "ارائه حرفه‌ای",
    ],
    weaknesses: [
      "کمال‌گرایی در ارتباطات",
      "بیش از حد تحلیلی",
      "نگرانی بیش از حد",
    ],
    workStyle: ["ارتباطات کتبی", "ارائه‌های حرفه‌ای", "سازماندهی رویدادها"],
    careers: ["نویسنده فنی", "ویراستار", "روزنامه‌نگار", "برنامه‌ریز رویداد"],
  },
  DS: {
    description:
      "سلطه‌گر-پایدار - رهبر صبور. ترکیبی از قاطعیت و پایداری. این افراد رهبران متعادلی هستند که صبور و قابل اعتماد هستند.",
    strengths: [
      "رهبری پایدار",
      "تصمیم‌گیری متعادل",
      "قابلیت اطمینان",
      "صبر و پشتکار",
    ],
    weaknesses: [
      "تصمیم‌گیری کند",
      "مقاومت در برابر تغییرات سریع",
    ],
    workStyle: ["مدیریت پایدار", "ایجاد ثبات", "رهبری بلندمدت"],
    careers: ["مدیر عملیات", "مدیر منابع انسانی", "مدیر تولید"],
  },
  SC: {
    description:
      "پایدار-وظیفه‌شناس - کارمند قابل اعتماد. ترکیبی از پایداری و دقت. این افراد کارمندان دقیق و قابل اعتمادی هستند.",
    strengths: [
      "دقت بالا",
      "قابلیت اطمینان",
      "سیستماتیک بودن",
      "وفاداری",
    ],
    weaknesses: [
      "مقاومت شدید در برابر تغییر",
      "کمال‌گرایی بیش از حد",
      "تصمیم‌گیری بسیار کند",
    ],
    workStyle: ["کارهای دقیق", "پیروی از استانداردها", "کار تکراری با کیفیت"],
    careers: ["حسابدار", "منشی", "کتابدار", "تحلیلگر داده"],
  },
};

/**
 * محاسبه نتیجه آزمون DISC بر اساس پاسخ‌های کاربر
 */
export function calculateDISC(answers: Record<string, any>, questions: any[]): DISCResult {
  // مقداردهی اولیه امتیازات
  const scores: DISCScores = {
    D: 0,
    I: 0,
    S: 0,
    C: 0,
  };

  // محاسبه امتیازات بر اساس پاسخ‌ها
  Object.entries(answers).forEach(([questionId, answer]) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question || !question.options) return;

    // پیدا کردن گزینه انتخاب شده
    const selectedOption = question.options.find(
      (opt: any) => opt.value === answer || opt.text === answer
    );

    if (selectedOption && selectedOption.score) {
      // اضافه کردن امتیازات
      Object.entries(selectedOption.score).forEach(([dimension, score]) => {
        if (dimension in scores) {
          scores[dimension as keyof DISCScores] += Number(score);
        }
      });
    }
  });

  // محاسبه مجموع کل امتیازات
  const totalScore = scores.D + scores.I + scores.S + scores.C;

  // محاسبه درصدها
  const percentages: { [key: string]: number } = {
    D: calculatePercentage(scores.D, totalScore),
    I: calculatePercentage(scores.I, totalScore),
    S: calculatePercentage(scores.S, totalScore),
    C: calculatePercentage(scores.C, totalScore),
  };

  // تعیین تیپ شخصیتی
  // پیدا کردن بالاترین امتیاز
  const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  let type: string;
  // اگر دو امتیاز برتر نزدیک به هم باشند (کمتر از 20% اختلاف)، ترکیب می‌شوند
  if (sortedScores[0][1] > 0 && sortedScores[1][1] > 0) {
    const diff = Math.abs(percentages[sortedScores[0][0]] - percentages[sortedScores[1][0]]);
    if (diff < 20) {
      // ترکیب دو بعد برتر
      type = [sortedScores[0][0], sortedScores[1][0]].sort().join("");
    } else {
      // فقط بعد برتر
      type = sortedScores[0][0];
    }
  } else {
    type = sortedScores[0][0];
  }

  // دریافت توضیحات تیپ شخصیتی
  const typeInfo = DISC_DESCRIPTIONS[type] || {
    description: `تیپ شخصیتی ${type}`,
    strengths: [],
    weaknesses: [],
    workStyle: [],
    careers: [],
  };

  return {
    type,
    scores,
    percentages,
    description: typeInfo.description,
    strengths: typeInfo.strengths,
    weaknesses: typeInfo.weaknesses,
    workStyle: typeInfo.workStyle,
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
 * اعتبارسنجی پاسخ‌های DISC
 */
export function validateDISCAnswers(
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
