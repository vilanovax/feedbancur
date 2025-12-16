// Holland Career Assessment Calculator
// محاسبه‌گر آزمون استعدادیابی هالند

export interface HollandScores {
  R: number; // Realistic (واقع‌گرا)
  I: number; // Investigative (جستجوگر)
  A: number; // Artistic (هنری)
  S: number; // Social (اجتماعی)
  E: number; // Enterprising (متهور)
  C: number; // Conventional (قراردادی)
}

export interface HollandResult {
  type: string; // e.g., "R", "I", "RI", "ASE"
  scores: HollandScores;
  percentages: {
    [key: string]: number; // e.g., { "R": 25, "I": 30, "A": 15, "S": 20, "E": 5, "C": 5 }
  };
  description: string;
  strengths: string[];
  careers: string[];
  workEnvironment: string[];
  skills: string[];
}

export interface HollandOption {
  text: string;
  value: string;
  score: Partial<HollandScores>;
}

/**
 * توضیحات کامل برای هر تیپ هالند
 */
const HOLLAND_DESCRIPTIONS: {
  [key: string]: {
    description: string;
    strengths: string[];
    careers: string[];
    workEnvironment: string[];
    skills: string[];
  };
} = {
  R: {
    description:
      "واقع‌گرا - عملی و فنی. افراد با تیپ R به کارهای عملی و فنی علاقه دارند. آنها از کار با ابزار، ماشین‌آلات و مواد فیزیکی لذت می‌برند.",
    strengths: [
      "مهارت‌های عملی و فنی",
      "کار با دست",
      "حل مسائل عملی",
      "استقلال در کار",
      "دقت و توجه به جزئیات",
    ],
    careers: [
      "مهندس مکانیک",
      "برقکار",
      "نجار",
      "مکانیک خودرو",
      "کشاورز",
      "معمار",
      "مهندس عمران",
      "خلبان",
      "نقاش ساختمان",
      "جوشکار",
    ],
    workEnvironment: [
      "محیط کار عملی و فنی",
      "کار با ابزار و ماشین‌آلات",
      "فضای باز یا کارگاه",
      "کار مستقل",
    ],
    skills: [
      "کار با دست",
      "مهارت‌های فنی",
      "حل مسائل عملی",
      "استفاده از ابزار",
      "دقت و توجه به جزئیات",
    ],
  },
  I: {
    description:
      "جستجوگر - تحلیلگر و علمی. افراد با تیپ I به تحقیق، تحلیل و حل مسائل علمی علاقه دارند. آنها از کار با ایده‌ها و نظریه‌ها لذت می‌برند.",
    strengths: [
      "تفکر تحلیلی",
      "تحقیق و پژوهش",
      "حل مسائل پیچیده",
      "تفکر منطقی",
      "کنجکاوی علمی",
    ],
    careers: [
      "دانشمند",
      "پزشک",
      "مهندس نرم‌افزار",
      "تحلیلگر داده",
      "شیمیدان",
      "فیزیکدان",
      "ریاضیدان",
      "پژوهشگر",
      "دندانپزشک",
      "دامپزشک",
    ],
    workEnvironment: [
      "محیط علمی و تحقیقاتی",
      "آزمایشگاه",
      "دفتر کار آرام",
      "فرصت برای تحقیق و تحلیل",
    ],
    skills: [
      "تحلیل داده",
      "تحقیق",
      "تفکر منطقی",
      "حل مسائل پیچیده",
      "مهارت‌های ریاضی و علمی",
    ],
  },
  A: {
    description:
      "هنری - خلاق و بیانگر. افراد با تیپ A به کارهای خلاقانه و هنری علاقه دارند. آنها از بیان خود از طریق هنر، موسیقی، نوشتن و طراحی لذت می‌برند.",
    strengths: [
      "خلاقیت",
      "بیان هنری",
      "تفکر نوآورانه",
      "حساسیت زیبایی‌شناختی",
      "استقلال در کار",
    ],
    careers: [
      "هنرمند",
      "موسیقیدان",
      "نویسنده",
      "طراح گرافیک",
      "عکاس",
      "معمار",
      "طراح مد",
      "کارگردان",
      "بازیگر",
      "شاعر",
    ],
    workEnvironment: [
      "محیط خلاق و آزاد",
      "فضای استودیو یا کارگاه هنری",
      "فرصت برای بیان خلاقانه",
      "کار مستقل",
    ],
    skills: [
      "خلاقیت",
      "مهارت‌های هنری",
      "بیان بصری",
      "حساسیت زیبایی‌شناختی",
      "نوآوری",
    ],
  },
  S: {
    description:
      "اجتماعی - کمک‌کننده و همدل. افراد با تیپ S به کمک به دیگران و کار با مردم علاقه دارند. آنها از آموزش، مشاوره و مراقبت از دیگران لذت می‌برند.",
    strengths: [
      "مهارت‌های ارتباطی",
      "همدلی",
      "کمک به دیگران",
      "آموزش و راهنمایی",
      "کار تیمی",
    ],
    careers: [
      "معلم",
      "مشاور",
      "روانشناس",
      "پرستار",
      "مددکار اجتماعی",
      "مربی",
      "مربی ورزشی",
      "کتابدار",
      "مشاور شغلی",
      "مشاور خانواده",
    ],
    workEnvironment: [
      "محیط کار با مردم",
      "فضای حمایتی",
      "فرصت برای کمک به دیگران",
      "کار تیمی",
    ],
    skills: [
      "مهارت‌های ارتباطی",
      "همدلی",
      "آموزش",
      "مشاوره",
      "کار تیمی",
    ],
  },
  E: {
    description:
      "متهور - رهبر و متقاعدکننده. افراد با تیپ E به رهبری، فروش و کارآفرینی علاقه دارند. آنها از متقاعد کردن دیگران و دستیابی به اهداف لذت می‌برند.",
    strengths: [
      "مهارت‌های رهبری",
      "متقاعدسازی",
      "فروش",
      "کارآفرینی",
      "انگیزه‌بخشی",
    ],
    careers: [
      "مدیر فروش",
      "کارآفرین",
      "بازاریاب",
      "مدیر ارشد",
      "وکیل",
      "سیاستمدار",
      "مشاور مدیریت",
      "مدیر روابط عمومی",
      "نماینده فروش",
      "مدیر پروژه",
    ],
    workEnvironment: [
      "محیط رقابتی",
      "فرصت برای رهبری",
      "تعامل با مشتریان",
      "فضای پویا و چالش‌برانگیز",
    ],
    skills: [
      "رهبری",
      "متقاعدسازی",
      "فروش",
      "مذاکره",
      "مدیریت",
    ],
  },
  C: {
    description:
      "قراردادی - سازمان‌یافته و دقیق. افراد با تیپ C به کارهای منظم، سازمان‌یافته و دقیق علاقه دارند. آنها از کار با داده‌ها و سیستم‌ها لذت می‌برند.",
    strengths: [
      "سازماندهی",
      "دقت",
      "توجه به جزئیات",
      "قابلیت اطمینان",
      "کار با داده‌ها",
    ],
    careers: [
      "حسابدار",
      "منشی",
      "تحلیلگر مالی",
      "کتابدار",
      "مدیر دفتر",
      "تحلیلگر داده",
      "مدیر پایگاه داده",
      "تحلیلگر بودجه",
      "مدیر انبار",
      "تحلیلگر بیمه",
    ],
    workEnvironment: [
      "محیط منظم و ساختارمند",
      "دفتر کار",
      "کار با داده‌ها و سیستم‌ها",
      "فضای آرام و قابل پیش‌بینی",
    ],
    skills: [
      "سازماندهی",
      "دقت",
      "کار با داده‌ها",
      "مدیریت اطلاعات",
      "توجه به جزئیات",
    ],
  },
};

/**
 * محاسبه نتیجه آزمون هالند بر اساس پاسخ‌های کاربر
 */
export function calculateHolland(answers: Record<string, any>, questions: any[]): HollandResult {
  // مقداردهی اولیه امتیازات
  const scores: HollandScores = {
    R: 0,
    I: 0,
    A: 0,
    S: 0,
    E: 0,
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
          scores[dimension as keyof HollandScores] += Number(score);
        }
      });
    }
  });

  // محاسبه مجموع کل امتیازات
  const totalScore = scores.R + scores.I + scores.A + scores.S + scores.E + scores.C;

  // محاسبه درصدها
  const percentages: { [key: string]: number } = {
    R: calculatePercentage(scores.R, totalScore),
    I: calculatePercentage(scores.I, totalScore),
    A: calculatePercentage(scores.A, totalScore),
    S: calculatePercentage(scores.S, totalScore),
    E: calculatePercentage(scores.E, totalScore),
    C: calculatePercentage(scores.C, totalScore),
  };

  // تعیین تیپ شخصیتی
  // پیدا کردن بالاترین امتیازات (سه تیپ برتر)
  const sortedScores = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // ساخت کد تیپ از سه تیپ برتر
  let type: string;
  if (sortedScores.length >= 3) {
    // اگر سه تیپ برتر وجود دارند، کد سه حرفی می‌سازیم
    type = sortedScores
      .map(([dimension]) => dimension)
      .sort()
      .join("");
  } else if (sortedScores.length === 2) {
    // اگر دو تیپ برتر وجود دارند، کد دو حرفی می‌سازیم
    type = sortedScores
      .map(([dimension]) => dimension)
      .sort()
      .join("");
  } else {
    // فقط یک تیپ برتر
    type = sortedScores[0][0];
  }

  // دریافت توضیحات تیپ شخصیتی
  // اگر کد ترکیبی وجود نداشت، از تیپ اول استفاده می‌کنیم
  const primaryType = sortedScores[0][0];
  const typeInfo = HOLLAND_DESCRIPTIONS[type] || HOLLAND_DESCRIPTIONS[primaryType] || {
    description: `تیپ شخصیتی ${type}`,
    strengths: [],
    careers: [],
    workEnvironment: [],
    skills: [],
  };

  return {
    type,
    scores,
    percentages,
    description: typeInfo.description,
    strengths: typeInfo.strengths,
    careers: typeInfo.careers,
    workEnvironment: typeInfo.workEnvironment,
    skills: typeInfo.skills,
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
 * اعتبارسنجی پاسخ‌های هالند
 */
export function validateHollandAnswers(
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

