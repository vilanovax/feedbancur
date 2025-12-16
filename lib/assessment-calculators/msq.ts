// Minnesota Satisfaction Questionnaire (MSQ) Calculator
// محاسبه‌گر آزمون رضایت شغلی مینه‌سوتا

export interface MSQScores {
  intrinsic: number; // رضایت درونی (سوالات 1-12)
  extrinsic: number; // رضایت بیرونی (سوالات 13-20)
  total: number; // امتیاز کل
}

export interface MSQResult {
  scores: MSQScores;
  percentages: {
    intrinsic: number;
    extrinsic: number;
    total: number;
  };
  level: "خیلی پایین" | "پایین" | "متوسط" | "بالا" | "خیلی بالا";
  description: string;
  intrinsicDescription: string;
  extrinsicDescription: string;
  recommendations: string[];
}

/**
 * محاسبه نتیجه آزمون MSQ بر اساس پاسخ‌های کاربر
 */
export function calculateMSQ(answers: Record<string, any>, questions: any[]): MSQResult {
  let intrinsicScore = 0; // سوالات 1-12
  let extrinsicScore = 0; // سوالات 13-20
  let totalScore = 0;

  // سوالات درونی (Intrinsic) - معمولاً سوالات 1-12
  const intrinsicQuestionIndices = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  // سوالات بیرونی (Extrinsic) - معمولاً سوالات 13-20
  const extrinsicQuestionIndices = [13, 14, 15, 16, 17, 18, 19, 20];

  Object.entries(answers).forEach(([questionId, answer]) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question || !question.options) return;

    // پیدا کردن گزینه انتخاب شده
    const selectedOption = question.options.find(
      (opt: any) => opt.value === answer || opt.text === answer
    );

    if (selectedOption && selectedOption.score) {
      // پشتیبانی از ساختارهای مختلف score
      let score = 0;
      if (typeof selectedOption.score === 'number') {
        score = selectedOption.score;
      } else if (selectedOption.score.value !== undefined) {
        score = Number(selectedOption.score.value);
      } else if (selectedOption.score.msq !== undefined) {
        score = Number(selectedOption.score.msq);
      } else {
        score = Number(selectedOption.score) || 0;
      }
      totalScore += score;

      // تعیین اینکه سوال درونی است یا بیرونی بر اساس order
      const questionOrder = question.order;
      if (intrinsicQuestionIndices.includes(questionOrder)) {
        intrinsicScore += score;
      } else if (extrinsicQuestionIndices.includes(questionOrder)) {
        extrinsicScore += score;
      }
    }
  });

  // محاسبه درصدها
  const maxIntrinsic = intrinsicQuestionIndices.length * 5; // 12 سوال × 5 امتیاز
  const maxExtrinsic = extrinsicQuestionIndices.length * 5; // 8 سوال × 5 امتیاز
  const maxTotal = questions.length * 5; // 20 سوال × 5 امتیاز

  const intrinsicPercentage = Math.round((intrinsicScore / maxIntrinsic) * 100);
  const extrinsicPercentage = Math.round((extrinsicScore / maxExtrinsic) * 100);
  const totalPercentage = Math.round((totalScore / maxTotal) * 100);

  // تعیین سطح رضایت
  let level: "خیلی پایین" | "پایین" | "متوسط" | "بالا" | "خیلی بالا";
  if (totalPercentage >= 80) {
    level = "خیلی بالا";
  } else if (totalPercentage >= 65) {
    level = "بالا";
  } else if (totalPercentage >= 50) {
    level = "متوسط";
  } else if (totalPercentage >= 35) {
    level = "پایین";
  } else {
    level = "خیلی پایین";
  }

  // توضیحات
  const description = getMSQDescription(totalPercentage, level);
  const intrinsicDescription = getIntrinsicDescription(intrinsicPercentage);
  const extrinsicDescription = getExtrinsicDescription(extrinsicPercentage);
  const recommendations = getMSQRecommendations(totalPercentage, intrinsicPercentage, extrinsicPercentage);

  return {
    scores: {
      intrinsic: intrinsicScore,
      extrinsic: extrinsicScore,
      total: totalScore,
    },
    percentages: {
      intrinsic: intrinsicPercentage,
      extrinsic: extrinsicPercentage,
      total: totalPercentage,
    },
    level,
    description,
    intrinsicDescription,
    extrinsicDescription,
    recommendations,
  };
}

function getMSQDescription(percentage: number, level: string): string {
  if (percentage >= 80) {
    return "رضایت شغلی شما در سطح بسیار بالایی قرار دارد. شما از کار خود بسیار راضی هستید و احساس می‌کنید که شغل شما نیازهای شما را برآورده می‌کند.";
  } else if (percentage >= 65) {
    return "رضایت شغلی شما در سطح خوبی قرار دارد. شما عموماً از کار خود راضی هستید، اگرچه ممکن است برخی جنبه‌ها نیاز به بهبود داشته باشند.";
  } else if (percentage >= 50) {
    return "رضایت شغلی شما در سطح متوسط قرار دارد. برخی جنبه‌های کار شما رضایت‌بخش است، اما برخی دیگر نیاز به توجه دارند.";
  } else if (percentage >= 35) {
    return "رضایت شغلی شما در سطح پایینی قرار دارد. شما از برخی جنبه‌های کار خود ناراضی هستید و ممکن است نیاز به تغییر یا بهبود داشته باشید.";
  } else {
    return "رضایت شغلی شما در سطح بسیار پایینی قرار دارد. شما از کار خود بسیار ناراضی هستید و احتمالاً نیاز به تغییرات اساسی یا بررسی مجدد موقعیت شغلی خود دارید.";
  }
}

function getIntrinsicDescription(percentage: number): string {
  if (percentage >= 75) {
    return "رضایت درونی شما بسیار بالاست. شما از جنبه‌های درونی کار مانند استقلال، تنوع، استفاده از مهارت‌ها و احساس موفقیت بسیار راضی هستید.";
  } else if (percentage >= 60) {
    return "رضایت درونی شما در سطح خوبی قرار دارد. شما عموماً از جنبه‌های درونی کار خود راضی هستید.";
  } else if (percentage >= 45) {
    return "رضایت درونی شما در سطح متوسط است. برخی جنبه‌های درونی کار شما رضایت‌بخش است.";
  } else {
    return "رضایت درونی شما پایین است. شما از جنبه‌های درونی کار مانند استقلال، تنوع و استفاده از مهارت‌ها راضی نیستید.";
  }
}

function getExtrinsicDescription(percentage: number): string {
  if (percentage >= 75) {
    return "رضایت بیرونی شما بسیار بالاست. شما از جنبه‌های بیرونی کار مانند حقوق، امنیت شغلی، شرایط کاری و روابط با همکاران بسیار راضی هستید.";
  } else if (percentage >= 60) {
    return "رضایت بیرونی شما در سطح خوبی قرار دارد. شما عموماً از جنبه‌های بیرونی کار خود راضی هستید.";
  } else if (percentage >= 45) {
    return "رضایت بیرونی شما در سطح متوسط است. برخی جنبه‌های بیرونی کار شما رضایت‌بخش است.";
  } else {
    return "رضایت بیرونی شما پایین است. شما از جنبه‌های بیرونی کار مانند حقوق، امنیت شغلی و شرایط کاری راضی نیستید.";
  }
}

function getMSQRecommendations(
  totalPercentage: number,
  intrinsicPercentage: number,
  extrinsicPercentage: number
): string[] {
  const recommendations: string[] = [];

  if (totalPercentage < 50) {
    recommendations.push("بررسی و شناسایی عوامل اصلی نارضایتی شغلی");
    recommendations.push("مشورت با مدیر یا منابع انسانی برای بهبود شرایط");
  }

  if (intrinsicPercentage < 50) {
    recommendations.push("جستجوی فرصت‌های یادگیری و توسعه مهارت‌ها");
    recommendations.push("درخواست پروژه‌های چالش‌برانگیزتر و متنوع‌تر");
    recommendations.push("بحث درباره استقلال بیشتر در کار");
  }

  if (extrinsicPercentage < 50) {
    recommendations.push("بررسی و بحث درباره حقوق و مزایا");
    recommendations.push("بهبود روابط با همکاران و مدیر");
    recommendations.push("بررسی شرایط کاری و محیط کار");
  }

  if (totalPercentage >= 65) {
    recommendations.push("حفظ و تقویت عوامل رضایت‌بخش");
    recommendations.push("کمک به دیگران برای بهبود رضایت شغلی");
  }

  return recommendations;
}

/**
 * اعتبارسنجی پاسخ‌های MSQ
 */
export function validateMSQAnswers(
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

