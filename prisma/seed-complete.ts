import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { seedMBTI } from "./seed-mbti";
import { seedDISC } from "./seed-disc";
import { seedHolland } from "./seed-holland";
import { seedMSQ } from "./seed-msq";

const prisma = new PrismaClient();

// توابع seed برای کلمات کلیدی
async function seedKeywords(prismaInstance: PrismaClient) {
  console.log("🌱 Seeding analytics keywords...");

  // کلمات کلیدی حساس
  const sensitiveKeywords = [
    { keyword: "شکایت", description: "فیدبک‌های حاوی شکایت" },
    { keyword: "مشکل", description: "فیدبک‌های دارای مشکل" },
    { keyword: "اعتراض", description: "فیدبک‌های اعتراضی" },
    { keyword: "ناراحتی", description: "ابراز ناراحتی" },
    { keyword: "خطر", description: "موارد خطرناک" },
    { keyword: "فوری", description: "موارد فوری" },
  ];

  // کلمات کلیدی مثبت
  const positiveKeywords = [
    { keyword: "عالی", description: "بازخورد عالی" },
    { keyword: "خوب", description: "بازخورد خوب" },
    { keyword: "ممنون", description: "تشکر و قدردانی" },
    { keyword: "راضی", description: "رضایت" },
    { keyword: "مفید", description: "مفید بودن" },
    { keyword: "کامل", description: "کامل بودن" },
  ];

  // کلمات کلیدی منفی
  const negativeKeywords = [
    { keyword: "ضعیف", description: "عملکرد ضعیف" },
    { keyword: "بد", description: "بازخورد منفی" },
    { keyword: "نامناسب", description: "نامناسب بودن" },
    { keyword: "کم", description: "کمبود" },
    { keyword: "کند", description: "کندی و تاخیر" },
    { keyword: "نارضایتی", description: "عدم رضایت" },
  ];

  // کلمات کلیدی موضوعی
  const topicKeywords = [
    { keyword: "نظافت", description: "موضوعات نظافت" },
    { keyword: "بهداشت", description: "موضوعات بهداشتی" },
    { keyword: "امنیت", description: "موضوعات امنیتی" },
    { keyword: "آموزش", description: "موضوعات آموزشی" },
    { keyword: "تجهیزات", description: "موضوعات مربوط به تجهیزات" },
    { keyword: "خدمات", description: "موضوعات خدماتی" },
    { keyword: "غذا", description: "موضوعات غذایی" },
    { keyword: "حقوق", description: "موضوعات مالی و حقوق" },
    { keyword: "مرخصی", description: "موضوعات مرخصی" },
    { keyword: "ساعت کاری", description: "موضوعات ساعت کاری" },
  ];

  let createdCount = 0;

  // ایجاد کلمات کلیدی حساس
  for (const kw of sensitiveKeywords) {
    try {
      await prismaInstance.analytics_keywords.create({
        data: {
          id: `seed-sensitive-${kw.keyword.toLowerCase().replace(/\s+/g, '-')}`,
          keyword: kw.keyword,
          type: "SENSITIVE",
          priority: "HIGH",
          description: kw.description,
          isActive: true,
          updatedAt: new Date(),
        },
      });
      createdCount++;
    } catch (error: any) {
      if (error.code !== "P2002") {
        console.error(`❌ Error adding ${kw.keyword}:`, error.message);
      }
    }
  }

  // ایجاد کلمات کلیدی مثبت
  for (const kw of positiveKeywords) {
    try {
      await prismaInstance.analytics_keywords.create({
        data: {
          id: `seed-positive-${kw.keyword.toLowerCase().replace(/\s+/g, '-')}`,
          keyword: kw.keyword,
          type: "POSITIVE",
          priority: "MEDIUM",
          description: kw.description,
          isActive: true,
          updatedAt: new Date(),
        },
      });
      createdCount++;
    } catch (error: any) {
      if (error.code !== "P2002") {
        console.error(`❌ Error adding ${kw.keyword}:`, error.message);
      }
    }
  }

  // ایجاد کلمات کلیدی منفی
  for (const kw of negativeKeywords) {
    try {
      await prismaInstance.analytics_keywords.create({
        data: {
          id: `seed-negative-${kw.keyword.toLowerCase().replace(/\s+/g, '-')}`,
          keyword: kw.keyword,
          type: "NEGATIVE",
          priority: "HIGH",
          description: kw.description,
          isActive: true,
          updatedAt: new Date(),
        },
      });
      createdCount++;
    } catch (error: any) {
      if (error.code !== "P2002") {
        console.error(`❌ Error adding ${kw.keyword}:`, error.message);
      }
    }
  }

  // ایجاد کلمات کلیدی موضوعی
  for (const kw of topicKeywords) {
    try {
      await prismaInstance.analytics_keywords.create({
        data: {
          id: `seed-topic-${kw.keyword.toLowerCase().replace(/\s+/g, '-')}`,
          keyword: kw.keyword,
          type: "TOPIC",
          priority: "MEDIUM",
          description: kw.description,
          isActive: true,
          updatedAt: new Date(),
        },
      });
      createdCount++;
    } catch (error: any) {
      if (error.code !== "P2002") {
        console.error(`❌ Error adding ${kw.keyword}:`, error.message);
      }
    }
  }

  console.log(`✅ Successfully seeded ${createdCount} analytics keywords!`);
}

async function seedITKeywords(prismaInstance: PrismaClient, departments: any[]) {
  console.log("🌱 Seeding IT department keywords...");

  // ابتدا بخش IT را پیدا می‌کنیم
  const itDepartment = departments.find((d) =>
    d.name.toLowerCase().includes("it") ||
    d.name.includes("فناوری") ||
    d.name.includes("اطلاعات")
  );

  const departmentId = itDepartment?.id || null;
  const departmentName = itDepartment?.name || "عمومی";

  console.log(`📌 Adding keywords for: ${departmentName}`);

  // کلمات کلیدی حساس برای IT
  const sensitiveKeywords = [
    { keyword: "هک", description: "موارد امنیتی و هک" },
    { keyword: "ویروس", description: "ویروس و بدافزار" },
    { keyword: "حمله", description: "حملات سایبری" },
    { keyword: "نفوذ", description: "نفوذ به سیستم" },
    { keyword: "از کار افتاده", description: "خرابی سیستم" },
    { keyword: "خراب", description: "خرابی تجهیزات" },
    { keyword: "قطع", description: "قطعی شبکه یا سرویس" },
    { keyword: "فیلتر", description: "مشکلات فیلترینگ" },
    { keyword: "کند", description: "کندی سیستم" },
    { keyword: "داغ", description: "گرمای بیش از حد سیستم" },
  ];

  // کلمات کلیدی منفی برای IT
  const negativeKeywords = [
    { keyword: "اینترنت", description: "مشکلات اینترنت" },
    { keyword: "شبکه", description: "مشکلات شبکه" },
    { keyword: "سرعت", description: "کندی سرعت" },
    { keyword: "وصل نمیشه", description: "مشکل اتصال" },
    { keyword: "کار نمیکنه", description: "عدم کارکرد" },
    { keyword: "باگ", description: "باگ نرم‌افزاری" },
    { keyword: "ارور", description: "خطای سیستمی" },
    { keyword: "پسورد", description: "مشکلات رمز عبور" },
  ];

  // کلمات کلیدی موضوعی برای IT
  const topicKeywords = [
    { keyword: "سرور", description: "موضوعات سرور" },
    { keyword: "دیتابیس", description: "موضوعات پایگاه داده" },
    { keyword: "بکاپ", description: "موضوعات پشتیبان‌گیری" },
    { keyword: "پرینتر", description: "موضوعات چاپگر" },
    { keyword: "کامپیوتر", description: "موضوعات رایانه" },
    { keyword: "لپتاپ", description: "موضوعات لپتاپ" },
    { keyword: "مانیتور", description: "موضوعات نمایشگر" },
    { keyword: "کیبورد", description: "موضوعات صفحه کلید" },
    { keyword: "موس", description: "موضوعات ماوس" },
    { keyword: "وایفای", description: "موضوعات WiFi" },
    { keyword: "Wi-Fi", description: "موضوعات WiFi" },
    { keyword: "VPN", description: "موضوعات شبکه خصوصی" },
    { keyword: "ایمیل", description: "موضوعات ایمیل" },
    { keyword: "نرم افزار", description: "موضوعات نرم‌افزار" },
    { keyword: "آپدیت", description: "موضوعات به‌روزرسانی" },
    { keyword: "لایسنس", description: "موضوعات مجوز نرم‌افزاری" },
    { keyword: "آنتی ویروس", description: "موضوعات آنتی‌ویروس" },
    { keyword: "فایروال", description: "موضوعات فایروال" },
    { keyword: "IP", description: "موضوعات آدرس IP" },
    { keyword: "DNS", description: "موضوعات DNS" },
    { keyword: "سوئیچ", description: "موضوعات سوئیچ شبکه" },
    { keyword: "روتر", description: "موضوعات روتر" },
    { keyword: "کابل", description: "موضوعات کابل‌کشی" },
    { keyword: "هارد", description: "موضوعات هارد دیسک" },
    { keyword: "رم", description: "موضوعات RAM" },
    { keyword: "CPU", description: "موضوعات پردازنده" },
    { keyword: "GPU", description: "موضوعات کارت گرافیک" },
    { keyword: "پاور", description: "موضوعات منبع تغذیه" },
    { keyword: "UPS", description: "موضوعات UPS" },
    { keyword: "کیس", description: "موضوعات کیس کامپیوتر" },
  ];

  // کلمات کلیدی مثبت برای IT
  const positiveKeywords = [
    { keyword: "سریع", description: "سرعت خوب" },
    { keyword: "پایدار", description: "پایداری سیستم" },
    { keyword: "امن", description: "امنیت بالا" },
    { keyword: "راحت", description: "سهولت استفاده" },
  ];

  let createdCount = 0;

  // ایجاد کلمات کلیدی حساس
  for (const kw of sensitiveKeywords) {
    try {
      await prismaInstance.analytics_keywords.create({
        data: {
          id: `seed-it-sensitive-${kw.keyword.toLowerCase().replace(/\s+/g, '-')}`,
          keyword: kw.keyword,
          type: "SENSITIVE",
          priority: "HIGH",
          description: kw.description,
          isActive: true,
          departmentId,
          updatedAt: new Date(),
        },
      });
      createdCount++;
    } catch (error: any) {
      if (error.code !== "P2002") {
        console.error(`❌ Error adding ${kw.keyword}:`, error.message);
      }
    }
  }

  // ایجاد کلمات کلیدی منفی
  for (const kw of negativeKeywords) {
    try {
      await prismaInstance.analytics_keywords.create({
        data: {
          id: `seed-it-negative-${kw.keyword.toLowerCase().replace(/\s+/g, '-')}`,
          keyword: kw.keyword,
          type: "NEGATIVE",
          priority: "HIGH",
          description: kw.description,
          isActive: true,
          departmentId,
          updatedAt: new Date(),
        },
      });
      createdCount++;
    } catch (error: any) {
      if (error.code !== "P2002") {
        console.error(`❌ Error adding ${kw.keyword}:`, error.message);
      }
    }
  }

  // ایجاد کلمات کلیدی موضوعی
  for (const kw of topicKeywords) {
    try {
      await prismaInstance.analytics_keywords.create({
        data: {
          id: `seed-it-topic-${kw.keyword.toLowerCase().replace(/\s+/g, '-')}`,
          keyword: kw.keyword,
          type: "TOPIC",
          priority: "MEDIUM",
          description: kw.description,
          isActive: true,
          departmentId,
          updatedAt: new Date(),
        },
      });
      createdCount++;
    } catch (error: any) {
      if (error.code !== "P2002") {
        console.error(`❌ Error adding ${kw.keyword}:`, error.message);
      }
    }
  }

  // ایجاد کلمات کلیدی مثبت
  for (const kw of positiveKeywords) {
    try {
      await prismaInstance.analytics_keywords.create({
        data: {
          id: `seed-it-positive-${kw.keyword.toLowerCase().replace(/\s+/g, '-')}`,
          keyword: kw.keyword,
          type: "POSITIVE",
          priority: "MEDIUM",
          description: kw.description,
          isActive: true,
          departmentId,
          updatedAt: new Date(),
        },
      });
      createdCount++;
    } catch (error: any) {
      if (error.code !== "P2002") {
        console.error(`❌ Error adding ${kw.keyword}:`, error.message);
      }
    }
  }

  console.log(`✅ Successfully added ${createdCount} IT keywords!`);
}

async function seedKitchenKeywords(prismaInstance: PrismaClient, departments: any[]) {
  console.log("🌱 Seeding Kitchen/Cleaning department keywords...");

  // ابتدا بخش آشپزخانه را پیدا می‌کنیم
  const kitchenDepartment = departments.find((d) =>
    d.name.includes("آشپزخانه") ||
    d.name.includes("نظافت") ||
    d.name.includes("خدمات")
  );

  const departmentId = kitchenDepartment?.id || null;
  const departmentName = kitchenDepartment?.name || "عمومی";

  console.log(`📌 Adding keywords for: ${departmentName}`);

  // کلمات کلیدی حساس برای آشپزخانه و نظافت
  const sensitiveKeywords = [
    { keyword: "مسمومیت", description: "مسمومیت غذایی" },
    { keyword: "کثیف", description: "کثافت و آلودگی" },
    { keyword: "بوی بد", description: "بوی نامطبوع" },
    { keyword: "حشره", description: "وجود حشرات" },
    { keyword: "موش", description: "وجود موش و جوندگان" },
    { keyword: "سوسک", description: "وجود سوسک" },
    { keyword: "عفونت", description: "عفونت و آلودگی" },
    { keyword: "سم", description: "مسائل سمی" },
    { keyword: "فاسد", description: "فساد مواد غذایی" },
    { keyword: "تاریخ مصرف", description: "گذشتن تاریخ مصرف" },
    { keyword: "لیز", description: "سطح لیز و خطرناک" },
    { keyword: "سقوط", description: "خطر سقوط" },
  ];

  // کلمات کلیدی منفی برای آشپزخانه و نظافت
  const negativeKeywords = [
    { keyword: "سرد", description: "سرد بودن غذا" },
    { keyword: "بی‌کیفیت", description: "کیفیت پایین" },
    { keyword: "کم", description: "کمبود مقدار" },
    { keyword: "طعم بد", description: "مزه نامطبوع" },
    { keyword: "سوخته", description: "غذای سوخته" },
    { keyword: "نامرتب", description: "بی‌نظمی و نامرتبی" },
    { keyword: "خیس", description: "خیس بودن کف" },
    { keyword: "چرب", description: "چربی و کثیفی" },
    { keyword: "لکه", description: "وجود لکه" },
    { keyword: "زنگ زده", description: "زنگ زدگی وسایل" },
    { keyword: "شکسته", description: "شکستگی وسایل" },
    { keyword: "نشتی", description: "نشت آب" },
  ];

  // کلمات کلیدی موضوعی برای آشپزخانه و نظافت
  const topicKeywords = [
    { keyword: "غذا", description: "موضوعات غذایی" },
    { keyword: "ناهار", description: "وعده ناهار" },
    { keyword: "صبحانه", description: "وعده صبحانه" },
    { keyword: "شام", description: "وعده شام" },
    { keyword: "میان‌وعده", description: "میان‌وعده" },
    { keyword: "چای", description: "موضوعات چای" },
    { keyword: "قهوه", description: "موضوعات قهوه" },
    { keyword: "آب", description: "موضوعات آب" },
    { keyword: "نوشیدنی", description: "نوشیدنی‌ها" },
    { keyword: "یخچال", description: "موضوعات یخچال" },
    { keyword: "فریزر", description: "موضوعات فریزر" },
    { keyword: "گاز", description: "موضوعات اجاق گاز" },
    { keyword: "ماکروویو", description: "موضوعات ماکروویو" },
    { keyword: "سینک", description: "موضوعات سینک ظرفشویی" },
    { keyword: "ظرف", description: "موضوعات ظرف و لیوان" },
    { keyword: "قاشق", description: "موضوعات قاشق و چنگال" },
    { keyword: "بشقاب", description: "موضوعات بشقاب" },
    { keyword: "لیوان", description: "موضوعات لیوان" },
    { keyword: "نظافت", description: "موضوعات نظافت" },
    { keyword: "جارو", description: "جاروکشی" },
    { keyword: "رختشویی", description: "موضوعات رختشویی" },
    { keyword: "دستمال", description: "موضوعات دستمال" },
    { keyword: "مایع", description: "مایع ظرفشویی و شوینده" },
    { keyword: "سطل", description: "سطل زباله" },
    { keyword: "زباله", description: "موضوعات زباله" },
    { keyword: "راه پله", description: "موضوعات راه پله" },
    { keyword: "پله", description: "موضوعات پله‌ها" },
    { keyword: "نرده", description: "نرده راه پله" },
    { keyword: "آسانسور", description: "موضوعات آسانسور" },
    { keyword: "سرویس", description: "سرویس بهداشتی" },
    { keyword: "دستشویی", description: "موضوعات دستشویی" },
    { keyword: "توالت", description: "موضوعات توالت" },
    { keyword: "صابون", description: "موضوعات صابون" },
    { keyword: "حوله", description: "موضوعات حوله" },
    { keyword: "پذیرایی", description: "موضوعات پذیرایی" },
    { keyword: "میهمان", description: "پذیرایی از میهمان" },
    { keyword: "سالن", description: "موضوعات سالن غذاخوری" },
    { keyword: "میز", description: "موضوعات میز" },
    { keyword: "صندلی", description: "موضوعات صندلی" },
    { keyword: "رومیزی", description: "موضوعات رومیزی" },
    { keyword: "کولر", description: "موضوعات کولر و تهویه" },
    { keyword: "بخاری", description: "موضوعات گرمایش" },
    { keyword: "نور", description: "موضوعات روشنایی" },
    { keyword: "لامپ", description: "موضوعات لامپ" },
  ];

  // کلمات کلیدی مثبت برای آشپزخانه و نظافت
  const positiveKeywords = [
    { keyword: "تمیز", description: "تمیزی عالی" },
    { keyword: "خوشمزه", description: "غذای خوشمزه" },
    { keyword: "تازه", description: "تازگی مواد" },
    { keyword: "گرم", description: "گرمی مناسب غذا" },
    { keyword: "بهداشتی", description: "بهداشت عالی" },
    { keyword: "مرتب", description: "مرتب و منظم" },
    { keyword: "خوشبو", description: "بوی خوش" },
    { keyword: "باکیفیت", description: "کیفیت بالا" },
    { keyword: "سریع", description: "سرعت مناسب سرویس‌دهی" },
  ];

  let createdCount = 0;

  // ایجاد کلمات کلیدی حساس
  for (const kw of sensitiveKeywords) {
    try {
      await prismaInstance.analytics_keywords.create({
        data: {
          id: `seed-kitchen-sensitive-${kw.keyword.toLowerCase().replace(/\s+/g, '-')}`,
          keyword: kw.keyword,
          type: "SENSITIVE",
          priority: "HIGH",
          description: kw.description,
          isActive: true,
          departmentId,
          updatedAt: new Date(),
        },
      });
      createdCount++;
    } catch (error: any) {
      if (error.code !== "P2002") {
        console.error(`❌ Error adding ${kw.keyword}:`, error.message);
      }
    }
  }

  // ایجاد کلمات کلیدی منفی
  for (const kw of negativeKeywords) {
    try {
      await prismaInstance.analytics_keywords.create({
        data: {
          id: `seed-kitchen-negative-${kw.keyword.toLowerCase().replace(/\s+/g, '-')}`,
          keyword: kw.keyword,
          type: "NEGATIVE",
          priority: "HIGH",
          description: kw.description,
          isActive: true,
          departmentId,
          updatedAt: new Date(),
        },
      });
      createdCount++;
    } catch (error: any) {
      if (error.code !== "P2002") {
        console.error(`❌ Error adding ${kw.keyword}:`, error.message);
      }
    }
  }

  // ایجاد کلمات کلیدی موضوعی
  for (const kw of topicKeywords) {
    try {
      await prismaInstance.analytics_keywords.create({
        data: {
          id: `seed-kitchen-topic-${kw.keyword.toLowerCase().replace(/\s+/g, '-')}`,
          keyword: kw.keyword,
          type: "TOPIC",
          priority: "MEDIUM",
          description: kw.description,
          isActive: true,
          departmentId,
          updatedAt: new Date(),
        },
      });
      createdCount++;
    } catch (error: any) {
      if (error.code !== "P2002") {
        console.error(`❌ Error adding ${kw.keyword}:`, error.message);
      }
    }
  }

  // ایجاد کلمات کلیدی مثبت
  for (const kw of positiveKeywords) {
    try {
      await prismaInstance.analytics_keywords.create({
        data: {
          id: `seed-kitchen-positive-${kw.keyword.toLowerCase().replace(/\s+/g, '-')}`,
          keyword: kw.keyword,
          type: "POSITIVE",
          priority: "MEDIUM",
          description: kw.description,
          isActive: true,
          departmentId,
          updatedAt: new Date(),
        },
      });
      createdCount++;
    } catch (error: any) {
      if (error.code !== "P2002") {
        console.error(`❌ Error adding ${kw.keyword}:`, error.message);
      }
    }
  }

  console.log(`✅ Successfully added ${createdCount} Kitchen/Cleaning keywords!`);
}

async function main() {
  console.log("🌱 شروع ایجاد داده‌های اولیه از backup کامل...\n");

  // ایجاد تنظیمات
  await prisma.settings.upsert({
    where: { id: "cmj8czx4c00005uzfaoatm0tr" },
    update: {},
    create: {
      id: "cmj8czx4c00005uzfaoatm0tr",
      siteName: "سیستم مدیریت فیدبک",
      siteDescription: "سیستم مدیریت و اندازه‌گیری فیدبک کارمندان",
      language: "fa",
      timezone: "Asia/Tehran",
      logoUrl: "/uploads/logo/logo-1765887635250.webp",
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      requirePasswordChange: false,
      sessionTimeout: 30,
      twoFactorAuth: false,
      allowAnonymous: true,
      autoArchiveDays: 90,
      maxFeedbackLength: 5000,
      itemsPerPage: 20,
      theme: "light",
      statusTexts: [{"key":"PENDING","label":"در انتظار بررسی"},{"key":"REVIEWED","label":"بررسی شده"},{"key":"ARCHIVED","label":"بایگانی شده"},{"key":"DEFERRED","label":"رسیدگی آینده"},{"key":"COMPLETED","label":"انجام شد"}],
      feedbackTypes: [{"key":"SUGGESTION","label":"پیشنهاد"},{"key":"COMPLAINT","label":"شکایت"},{"key":"QUESTION","label":"سوال"},{"key":"PRAISE","label":"تشکر و قدردانی"},{"key":"BUG","label":"گزارش مشکل"},{"key":"OTHER","label":"سایر"}],
      notificationSettings: {"directFeedbackToManager":true,"feedbackCompletedByManager":true},
      chatSettings: {"maxFileSize":10,"allowedFileTypes":["image/jpeg","image/png","image/gif","image/webp","application/pdf"]},
      objectStorageSettings: {"bucket":"feedban-uploads","region":"us-east-1","enabled":true,"endpoint":"https://storage.iran.liara.space","accessKeyId":"3ipqq41nabtsqsdh","secretAccessKey":"49ae07a8-d515-4700-8daa-65ef98da8cab"},
      workingHoursSettings: {"enabled":true,"endHour":17,"holidays":[],"startHour":8,"workingDays":[6,0,1,2,3]},
      openAISettings: {"model":"gpt-3.5-turbo","apiKey":"YOUR_OPENAI_API_KEY_HERE","enabled":true},
      updatedAt: new Date(),
    },
  });
  console.log(`✅ تنظیمات ایجاد شد`);

  // ایجاد بخش‌ها
  const departments = [
    {
      id: "dept-it-001",
      name: "IT",
      description: "بخش فناوری اطلاعات",
      keywords: ["کامپیوتر","سیستم","شبکه","اینترنت","نرم‌افزار","IT"],
      allowDirectFeedback: false,
      canCreateAnnouncement: true,
      allowedAnnouncementDepartments: [],
      updatedAt: new Date(),
    },
    {
      id: "dept-finance-001",
      name: "مالی",
      description: "بخش مالی و حسابداری",
      keywords: ["مالی","حقوق","پرداخت","حساب","فیش","پول"],
      allowDirectFeedback: false,
      canCreateAnnouncement: true,
      allowedAnnouncementDepartments: [],
      updatedAt: new Date(),
    },
    {
      id: "dept-admin-001",
      name: "اداری",
      description: "امور اداری",
      keywords: ["اداری","مدارک","نامه","چراغ","برق","تعمیرات"],
      allowDirectFeedback: false,
      canCreateAnnouncement: true,
      allowedAnnouncementDepartments: [],
      updatedAt: new Date(),
    },
    {
      id: "dept-kitchen-001",
      name: "آشپزخانه",
      description: "مدیریت امور آشپزخانه و غذا",
      keywords: ["آشپزخانه","غذا","نهار","صبحانه","ناهار","شام"],
      allowDirectFeedback: false,
      canCreateAnnouncement: true,
      allowedAnnouncementDepartments: [],
      updatedAt: new Date(),
    },
  ];

  const createdDepartments = [];
  for (const dept of departments) {
    const department = await prisma.departments.upsert({
      where: { name: dept.name },
      update: {},
      create: dept,
    });
    createdDepartments.push(department);
    console.log(`✅ بخش "${dept.name}" ایجاد شد`);
  }

  // ایجاد کاربران
  const createdUsers = [];
  {
    const user = await prisma.users.upsert({
      where: { mobile: "09123456789" },
      update: {},
      create: {
        id: randomUUID(),
        mobile: "09123456789",
        email: "admin@company.com",
        name: "مدیر سیستم",
        password: "$2b$10$CfNyZdaxirvw3DaFSJnDAO.YqUkti0TU.YQW6Zg4ZyT7PrhPCErIS",
        role: "ADMIN",
        isActive: true,
        mustChangePassword: false,
        updatedAt: new Date(),
      },
    });
    createdUsers.push(user);
    console.log(`✅ کاربر "${user.name}" ایجاد شد`);
  }

  {
    const user = await prisma.users.upsert({
      where: { mobile: "09123322111" },
      update: {},
      create: {
        id: randomUUID(),
        mobile: "09123322111",
        email: "farzad@company.com",
        name: "فرزاد زارع",
        password: "$2a$10$1wGkI6PMaLUAMzIebhuxhufVTEnzsvYtog2CsnWoaJ/fvHVJ7W.06",
        role: "MANAGER",
        isActive: true,
        mustChangePassword: false,
        departmentId: createdDepartments.find((d) => d.name === "IT")?.id,
        updatedAt: new Date(),
      },
    });
    createdUsers.push(user);
    console.log(`✅ کاربر "${user.name}" ایجاد شد`);
  }

  {
    const user = await prisma.users.upsert({
      where: { mobile: "09123322112" },
      update: {},
      create: {
        id: randomUUID(),
        mobile: "09123322112",
        email: "employee1@company.com",
        name: "حدیث نعمتی",
        password: "$2a$10$4OibIk1Gx9wO7XXJhcfCQeHTVYsvdQSM3494LoIUHFupDAB.GZM1a",
        role: "MANAGER",
        isActive: true,
        mustChangePassword: false,
        departmentId: createdDepartments.find((d) => d.name === "اداری")?.id,
        updatedAt: new Date(),
      },
    });
    createdUsers.push(user);
    console.log(`✅ کاربر "${user.name}" ایجاد شد`);
  }

  {
    const user = await prisma.users.upsert({
      where: { mobile: "09123322114" },
      update: {},
      create: {
        id: randomUUID(),
        mobile: "09123322114",
        email: "employee2@company.com",
        name: "میلاد برهانی",
        password: "$2a$10$0dO5G9pbJGiDBsLeqa18su5FS1ss/D0Rj1RWEHcVGZK1amIg0b8AO",
        role: "EMPLOYEE",
        isActive: true,
        mustChangePassword: false,
        departmentId: createdDepartments.find((d) => d.name === "مالی")?.id,
        updatedAt: new Date(),
      },
    });
    createdUsers.push(user);
    console.log(`✅ کاربر "${user.name}" ایجاد شد`);
  }

  {
    const user = await prisma.users.upsert({
      where: { mobile: "09121941532" },
      update: {},
      create: {
        id: randomUUID(),
        mobile: "09121941532",
        email: "admin@company.com",
        name: "مدیر سیستم",
        password: "$2a$10$nzhyZ9EaOR4UXoankZr7P..LaW5tpAGcbRUUfGGfRyphjR5e1S/N.",
        role: "ADMIN",
        isActive: true,
        mustChangePassword: false,
        updatedAt: new Date(),
      },
    });
    createdUsers.push(user);
    console.log(`✅ کاربر "${user.name}" ایجاد شد`);
  }

  {
    const user = await prisma.users.upsert({
      where: { mobile: "09123150594" },
      update: {},
      create: {
        id: randomUUID(),
        mobile: "09123150594",
        email: "",
        name: "عسل بختیاری",
        password: "$2a$10$bt3YYJzN5FM6AKiLcNpL8u8AUKWGL9EVuQflbozeLYRIYkTzY6tgC",
        role: "MANAGER",
        isActive: true,
        mustChangePassword: false,
        departmentId: createdDepartments.find((d) => d.name === "مالی")?.id,
        updatedAt: new Date(),
      },
    });
    createdUsers.push(user);
    console.log(`✅ کاربر "${user.name}" ایجاد شد`);
  }

  {
    const user = await prisma.users.upsert({
      where: { mobile: "09123322113" },
      update: {},
      create: {
        id: randomUUID(),
        mobile: "09123322113",
        email: "",
        name: "سعید مترجمی",
        password: "$2a$10$C2/ZQGl2qlcuq9yE51/6vuJm1YKQmOndDNIENOZOVCRqw/5FqA7WC",
        role: "MANAGER",
        isActive: true,
        mustChangePassword: false,
        departmentId: createdDepartments.find((d) => d.name === "آشپزخانه")?.id,
        updatedAt: new Date(),
      },
    });
    createdUsers.push(user);
    console.log(`✅ کاربر "${user.name}" ایجاد شد`);
  }

  // اختصاص مدیران به بخش‌ها
  {
    const manager = createdUsers.find((u) => u.mobile === "09123322111");
    const department = createdDepartments.find((d) => d.name === "IT");
    if (manager && department) {
      await prisma.departments.update({
        where: { id: department.id },
        data: { managerId: manager.id },
      });
      console.log(`✅ مدیر به بخش "${department.name}" اختصاص داده شد`);
    }
  }

  // ایجاد آزمون‌ها - این بخش حذف شد چون seed functions این کار را انجام می‌دهند
  // آزمون‌ها توسط seedMBTI, seedDISC, seedHolland, seedMSQ ایجاد می‌شوند
  /*
  {
    const createdBy = createdUsers.find((u) => u.mobile === "09123456789");
    if (createdBy) {
      const assessment = await prisma.assessments.upsert({
        where: { id: "mbti-standard-assessment" },
        update: {},
        create: {
          id: "mbti-standard-assessment",
          title: "آزمون شخصیت‌سنجی MBTI",
          description: "آزمون شخصیت‌سنجی مایرز-بریگز (MBTI) یکی از معتبرترین و پرکاربردترین ابزارهای شخصیت‌سنجی در جهان است. این آزمون شما را در یکی از 16 تیپ شخصیتی طبقه‌بندی می‌کند و به شما کمک می‌کند تا خود را بهتر بشناسید.",
          type: "MBTI",
          isActive: true,
          createdById: createdBy.id,
          updatedAt: new Date(),
          assessment_questions: {
            create: [{"id":"mbti-q-1","order":1,"options":[{"text":"با افراد زیادی صحبت می‌کنم","score":{"E":2,"F":0,"I":0,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"A"},{"text":"فقط با چند نفر خاص صحبت عمیق دارم","score":{"E":0,"F":0,"I":2,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-2","order":2,"options":[{"text":"با دوستان بیرون بروم","score":{"E":2,"F":0,"I":0,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"A"},{"text":"به تنهایی استراحت کنم","score":{"E":0,"F":0,"I":2,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-3","order":3,"options":[{"text":"سریع با افراد جدید آشنا می‌شوم","score":{"E":2,"F":0,"I":0,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"A"},{"text":"زمان می‌برد تا با افراد جدید راحت شوم","score":{"E":0,"F":0,"I":2,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-4","order":4,"options":[{"text":"از تعامل با دیگران می‌گیرم","score":{"E":2,"F":0,"I":0,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"A"},{"text":"از زمان خلوت خودم می‌گیرم","score":{"E":0,"F":0,"I":2,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-5","order":5,"options":[{"text":"با دیگران درباره آن صحبت می‌کنم","score":{"E":2,"F":0,"I":0,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"A"},{"text":"ترجیح می‌دهم خودم درباره‌اش فکر کنم","score":{"E":0,"F":0,"I":2,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-6","order":6,"options":[{"text":"فعال و پرانرژی هستم","score":{"E":2,"F":0,"I":0,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"A"},{"text":"آرام و متفکر هستم","score":{"E":0,"F":0,"I":2,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-7","order":7,"options":[{"text":"معمولاً مرکز توجه هستم","score":{"E":2,"F":0,"I":0,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"A"},{"text":"ترجیح می‌دهم کنار بایستم","score":{"E":0,"F":0,"I":2,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-8","order":8,"options":[{"text":"من اجتماعی و باز هستم","score":{"E":2,"F":0,"I":0,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"A"},{"text":"من خصوصی و محفوظ هستم","score":{"E":0,"F":0,"I":2,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-9","order":9,"options":[{"text":"با گروه‌های بزرگ کار کنم","score":{"E":2,"F":0,"I":0,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"A"},{"text":"تنها یا با یک نفر کار کنم","score":{"E":0,"F":0,"I":2,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-10","order":10,"options":[{"text":"سریع جواب می‌دهم","score":{"E":2,"F":0,"I":0,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"A"},{"text":"امیدوارم پیغام بگذارند","score":{"E":0,"F":0,"I":2,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-11","order":11,"options":[{"text":"دوست دارم با همکارانم تعامل داشته باشم","score":{"E":2,"F":0,"I":0,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"A"},{"text":"ترجیح می‌دهم روی کار خودم تمرکز کنم","score":{"E":0,"F":0,"I":2,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-12","order":12,"options":[{"text":"با صدای بلند حرف می‌زنم","score":{"E":2,"F":0,"I":0,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"A"},{"text":"در ذهنم فکر می‌کنم","score":{"E":0,"F":0,"I":2,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-13","order":13,"options":[{"text":"دوست‌های زیادی دارم","score":{"E":2,"F":0,"I":0,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"A"},{"text":"چند دوست نزدیک دارم","score":{"E":0,"F":0,"I":2,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-14","order":14,"options":[{"text":"برنامه‌های اجتماعی داشته باشم","score":{"E":2,"F":0,"I":0,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"A"},{"text":"وقت خودم را به تنهایی بگذرانم","score":{"E":0,"F":0,"I":2,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-15","order":15,"options":[{"text":"همه مرا می‌شناسند","score":{"E":2,"F":0,"I":0,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"A"},{"text":"فقط عده کمی مرا واقعاً می‌شناسند","score":{"E":0,"F":0,"I":2,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-16","order":16,"options":[{"text":"واقعیت‌ها و جزئیات توجه می‌کنم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":0,"S":2,"T":0},"value":"A"},{"text":"الگوها و معانی توجه می‌کنم","score":{"E":0,"F":0,"I":0,"J":0,"N":2,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-17","order":17,"options":[{"text":"از تجربه‌های گذشته یاد بگیرم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":0,"S":2,"T":0},"value":"A"},{"text":"تصور کنم آینده چگونه خواهد بود","score":{"E":0,"F":0,"I":0,"J":0,"N":2,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-18","order":18,"options":[{"text":"عملی و واقع‌بین هستم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":0,"S":2,"T":0},"value":"A"},{"text":"خیال‌پرداز و نوآور هستم","score":{"E":0,"F":0,"I":0,"J":0,"N":2,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-19","order":19,"options":[{"text":"تجربه عملی دارم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":0,"S":2,"T":0},"value":"A"},{"text":"شهود و احساسم دارم","score":{"E":0,"F":0,"I":0,"J":0,"N":2,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-20","order":20,"options":[{"text":"به جزئیات دقیق توجه می‌کنم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":0,"S":2,"T":0},"value":"A"},{"text":"به تصویر کلی فکر می‌کنم","score":{"E":0,"F":0,"I":0,"J":0,"N":2,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-21","order":21,"options":[{"text":"دقیق و جزئی‌نگر هستم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":0,"S":2,"T":0},"value":"A"},{"text":"کلی‌نگر و مفهومی فکر می‌کنم","score":{"E":0,"F":0,"I":0,"J":0,"N":2,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-22","order":22,"options":[{"text":"ترجیح می‌دهم گام به گام پیش بروم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":0,"S":2,"T":0},"value":"A"},{"text":"ترجیح می‌دهم کل موضوع را ببینم","score":{"E":0,"F":0,"I":0,"J":0,"N":2,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-23","order":23,"options":[{"text":"چیزهایی که هستند اهمیت می‌دهم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":0,"S":2,"T":0},"value":"A"},{"text":"چیزهایی که می‌توانند باشند اهمیت می‌دهم","score":{"E":0,"F":0,"I":0,"J":0,"N":2,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-24","order":24,"options":[{"text":"به حال فکر می‌کنم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":0,"S":2,"T":0},"value":"A"},{"text":"به آینده فکر می‌کنم","score":{"E":0,"F":0,"I":0,"J":0,"N":2,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-25","order":25,"options":[{"text":"واقعیت‌های ملموس کار کنم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":0,"S":2,"T":0},"value":"A"},{"text":"ایده‌ها و نظریه‌ها کار کنم","score":{"E":0,"F":0,"I":0,"J":0,"N":2,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-26","order":26,"options":[{"text":"سنتی و محافظه‌کار هستم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":0,"S":2,"T":0},"value":"A"},{"text":"نوآور و خلاق هستم","score":{"E":0,"F":0,"I":0,"J":0,"N":2,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-27","order":27,"options":[{"text":"چیزهای آزموده شده را انجام دهم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":0,"S":2,"T":0},"value":"A"},{"text":"روش‌های جدید را امتحان کنم","score":{"E":0,"F":0,"I":0,"J":0,"N":2,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-28","order":28,"options":[{"text":"تجربه بهترین معلم است","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":0,"S":2,"T":0},"value":"A"},{"text":"تخیل مهم‌تر از دانش است","score":{"E":0,"F":0,"I":0,"J":0,"N":2,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-29","order":29,"options":[{"text":"دقیق و منظم هستم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":0,"S":2,"T":0},"value":"A"},{"text":"خلاق و انعطاف‌پذیر هستم","score":{"E":0,"F":0,"I":0,"J":0,"N":2,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-30","order":30,"options":[{"text":"روش‌های استاندارد را دنبال کنم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":0,"S":2,"T":0},"value":"A"},{"text":"راه‌های جدید ابداع کنم","score":{"E":0,"F":0,"I":0,"J":0,"N":2,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-31","order":31,"options":[{"text":"منطق و تحلیل است","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":0,"S":0,"T":2},"value":"A"},{"text":"احساسات و ارزش‌هاست","score":{"E":0,"F":2,"I":0,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-32","order":32,"options":[{"text":"عینی و بی‌طرف هستم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":0,"S":0,"T":2},"value":"A"},{"text":"همدل و مهربان هستم","score":{"E":0,"F":2,"I":0,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-33","order":33,"options":[{"text":"سعی می‌کنم راه‌حل پیدا کنم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":0,"S":0,"T":2},"value":"A"},{"text":"سعی می‌کنم حمایت عاطفی کنم","score":{"E":0,"F":2,"I":0,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-34","order":34,"options":[{"text":"عدالت و انصاف","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":0,"S":0,"T":2},"value":"A"},{"text":"رحم و مهربانی","score":{"E":0,"F":2,"I":0,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-35","order":35,"options":[{"text":"راس و بی‌پرده حرف می‌زنم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":0,"S":0,"T":2},"value":"A"},{"text":"دیپلماتیک و محتاطانه حرف می‌زنم","score":{"E":0,"F":2,"I":0,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-36","order":36,"options":[{"text":"روی استدلال منطقی تمرکز می‌کنم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":0,"S":0,"T":2},"value":"A"},{"text":"به احساسات افراد توجه می‌کنم","score":{"E":0,"F":2,"I":0,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-37","order":37,"options":[{"text":"سرد و تحلیل‌گر هستم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":0,"S":0,"T":2},"value":"A"},{"text":"گرم و صمیمی هستم","score":{"E":0,"F":2,"I":0,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-38","order":38,"options":[{"text":"به داده‌ها و حقایق نگاه می‌کنم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":0,"S":0,"T":2},"value":"A"},{"text":"به تأثیر آن روی افراد فکر می‌کنم","score":{"E":0,"F":2,"I":0,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-39","order":39,"options":[{"text":"قوانین را رعایت کنم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":0,"S":0,"T":2},"value":"A"},{"text":"شرایط خاص را در نظر بگیرم","score":{"E":0,"F":2,"I":0,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-40","order":40,"options":[{"text":"انتقادی و تحلیل‌گر هستم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":0,"S":0,"T":2},"value":"A"},{"text":"حمایت‌گر و قدردان هستم","score":{"E":0,"F":2,"I":0,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-41","order":41,"options":[{"text":"کارایی مهم‌تر از روابط است","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":0,"S":0,"T":2},"value":"A"},{"text":"روابط مهم‌تر از کارایی است","score":{"E":0,"F":2,"I":0,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-42","order":42,"options":[{"text":"سر و صدا را نادیده می‌گیرم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":0,"S":0,"T":2},"value":"A"},{"text":"به احساسات حساس هستم","score":{"E":0,"F":2,"I":0,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-43","order":43,"options":[{"text":"درست بودن کارها مهم است","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":0,"S":0,"T":2},"value":"A"},{"text":"خوب بودن روابط مهم است","score":{"E":0,"F":2,"I":0,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-44","order":44,"options":[{"text":"اصول و قوانین اهمیت می‌دهم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":0,"S":0,"T":2},"value":"A"},{"text":"افراد و احساساتشان اهمیت می‌دهم","score":{"E":0,"F":2,"I":0,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-45","order":45,"options":[{"text":"سر عقل بودن مهم‌تر از دلسوز بودن است","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":0,"S":0,"T":2},"value":"A"},{"text":"دلسوز بودن مهم‌تر از سر عقل بودن است","score":{"E":0,"F":2,"I":0,"J":0,"N":0,"P":0,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-46","order":46,"options":[{"text":"برنامه‌ریزی کنم و طبق آن عمل کنم","score":{"E":0,"F":0,"I":0,"J":2,"N":0,"P":0,"S":0,"T":0},"value":"A"},{"text":"انعطاف‌پذیر باشم و بداهه عمل کنم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":2,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-47","order":47,"options":[{"text":"منظم و سازمان‌یافته هستم","score":{"E":0,"F":0,"I":0,"J":2,"N":0,"P":0,"S":0,"T":0},"value":"A"},{"text":"آزاد و بی‌قید هستم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":2,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-48","order":48,"options":[{"text":"مرتب و منظم است","score":{"E":0,"F":0,"I":0,"J":2,"N":0,"P":0,"S":0,"T":0},"value":"A"},{"text":"شلوغ و پراکنده است","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":2,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-49","order":49,"options":[{"text":"کارها را سر وقت تمام کنم","score":{"E":0,"F":0,"I":0,"J":2,"N":0,"P":0,"S":0,"T":0},"value":"A"},{"text":"تا آخرین لحظه صبر کنم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":2,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-50","order":50,"options":[{"text":"برنامه‌ریز و منضبط هستم","score":{"E":0,"F":0,"I":0,"J":2,"N":0,"P":0,"S":0,"T":0},"value":"A"},{"text":"خودجوش و آزاد هستم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":2,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-51","order":51,"options":[{"text":"تصمیم بگیرم و به آن پایبند باشم","score":{"E":0,"F":0,"I":0,"J":2,"N":0,"P":0,"S":0,"T":0},"value":"A"},{"text":"گزینه‌های خود را باز نگه دارم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":2,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-52","order":52,"options":[{"text":"زود شروع می‌کنم و منظم پیش می‌روم","score":{"E":0,"F":0,"I":0,"J":2,"N":0,"P":0,"S":0,"T":0},"value":"A"},{"text":"نزدیک ددلاین شروع می‌کنم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":2,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-53","order":53,"options":[{"text":"برنامه روزانه دارم","score":{"E":0,"F":0,"I":0,"J":2,"N":0,"P":0,"S":0,"T":0},"value":"A"},{"text":"بر اساس حس و حال عمل می‌کنم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":2,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-54","order":54,"options":[{"text":"کارها را تمام کنم","score":{"E":0,"F":0,"I":0,"J":2,"N":0,"P":0,"S":0,"T":0},"value":"A"},{"text":"کارهای جدید شروع کنم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":2,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-55","order":55,"options":[{"text":"همه چیز مشخص و قطعی است","score":{"E":0,"F":0,"I":0,"J":2,"N":0,"P":0,"S":0,"T":0},"value":"A"},{"text":"همه چیز باز و انعطاف‌پذیر است","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":2,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-56","order":56,"options":[{"text":"برنامه دقیق دارم","score":{"E":0,"F":0,"I":0,"J":2,"N":0,"P":0,"S":0,"T":0},"value":"A"},{"text":"بدون برنامه می‌روم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":2,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-57","order":57,"options":[{"text":"دقیق و به موقع هستم","score":{"E":0,"F":0,"I":0,"J":2,"N":0,"P":0,"S":0,"T":0},"value":"A"},{"text":"راحت و بی‌خیال هستم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":2,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-58","order":58,"options":[{"text":"طبق لیست کارهایم عمل کنم","score":{"E":0,"F":0,"I":0,"J":2,"N":0,"P":0,"S":0,"T":0},"value":"A"},{"text":"بر اساس شرایط تصمیم بگیرم","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":2,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-59","order":59,"options":[{"text":"نظم و ترتیب مهم است","score":{"E":0,"F":0,"I":0,"J":2,"N":0,"P":0,"S":0,"T":0},"value":"A"},{"text":"انعطاف و آزادی مهم است","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":2,"S":0,"T":0},"value":"B"}]},{"id":"mbti-q-60","order":60,"options":[{"text":"احساس رضایت و آرامش می‌کنم","score":{"E":0,"F":0,"I":0,"J":2,"N":0,"P":0,"S":0,"T":0},"value":"A"},{"text":"احساس می‌کنم چیزی از دست رفته","score":{"E":0,"F":0,"I":0,"J":0,"N":0,"P":2,"S":0,"T":0},"value":"B"}]}],
          },
        },
      });
      console.log(`✅ آزمون "آزمون شخصیت‌سنجی MBTI" ایجاد شد`);
      // اختصاص آزمون به بخش‌ها
      {
        const department = createdDepartments.find((d) => d.name === "IT");
        if (department) {
          await prisma.assessment_assignments.upsert({
            where: { id: "cmj8jvtwg000h5unndeanecsz" },
            update: {},
            create: {
              id: "cmj8jvtwg000h5unndeanecsz",
              assessmentId: assessment.id,
              departmentId: department.id,
            },
          });
        }
      }
    }
  }

  {
    const createdBy = createdUsers.find((u) => u.mobile === "09123456789");
    if (createdBy) {
      const assessment = await prisma.assessments.upsert({
        where: { id: "disc-standard-assessment" },
        update: {},
        create: {
          id: "disc-standard-assessment",
          title: "آزمون شخصیت‌سنجی DISC",
          description: "آزمون DISC یک ابزار ارزیابی رفتاری است که افراد را بر اساس چهار ویژگی اصلی طبقه‌بندی می‌کند: سلطه‌گری (D)، تأثیرگذاری (I)، پایداری (S)، و وظیفه‌شناسی (C).",
          type: "DISC",
          isActive: true,
          createdById: createdBy.id,
          updatedAt: new Date(),
          assessment_questions: {
            create: [{"id":"disc-q-1","order":1,"options":[{"text":"من تصمیم‌گیرنده قاطع و مستقیمی هستم","score":{"C":0,"D":3,"I":0,"S":0},"value":"D"},{"text":"من فردی اجتماعی و پرانرژی هستم","score":{"C":0,"D":0,"I":3,"S":0},"value":"I"},{"text":"من صبور و قابل اعتماد هستم","score":{"C":0,"D":0,"I":0,"S":3},"value":"S"},{"text":"من دقیق و تحلیلگر هستم","score":{"C":3,"D":0,"I":0,"S":0},"value":"C"}]},{"id":"disc-q-2","order":2,"options":[{"text":"روی نتایج و دستاوردها تمرکز دارم","score":{"C":0,"D":3,"I":0,"S":0},"value":"D"},{"text":"روی ایجاد روابط و تعاملات تمرکز دارم","score":{"C":0,"D":0,"I":3,"S":0},"value":"I"},{"text":"روی ثبات و همکاری تمرکز دارم","score":{"C":0,"D":0,"I":0,"S":3},"value":"S"},{"text":"روی کیفیت و دقت تمرکز دارم","score":{"C":3,"D":0,"I":0,"S":0},"value":"C"}]},{"id":"disc-q-3","order":3,"options":[{"text":"فوراً اقدام می‌کنم و آن را حل می‌کنم","score":{"C":0,"D":3,"I":0,"S":0},"value":"D"},{"text":"دیگران را درگیر می‌کنم و از آن‌ها کمک می‌گیرم","score":{"C":0,"D":0,"I":3,"S":0},"value":"I"},{"text":"آرام می‌مانم و راه‌حل‌های مختلف را بررسی می‌کنم","score":{"C":0,"D":0,"I":0,"S":3},"value":"S"},{"text":"داده‌ها را جمع‌آوری و تحلیل می‌کنم","score":{"C":3,"D":0,"I":0,"S":0},"value":"C"}]},{"id":"disc-q-4","order":4,"options":[{"text":"رهبری تیم را بر عهده می‌گیرم","score":{"C":0,"D":3,"I":0,"S":0},"value":"D"},{"text":"انرژی مثبت به تیم تزریق می‌کنم","score":{"C":0,"D":0,"I":3,"S":0},"value":"I"},{"text":"از اعضای تیم حمایت می‌کنم","score":{"C":0,"D":0,"I":0,"S":3},"value":"S"},{"text":"جزئیات و کیفیت کار را بررسی می‌کنم","score":{"C":3,"D":0,"I":0,"S":0},"value":"C"}]},{"id":"disc-q-5","order":5,"options":[{"text":"سرعت و کارایی است","score":{"C":0,"D":3,"I":0,"S":0},"value":"D"},{"text":"احساسات و روابط است","score":{"C":0,"D":0,"I":3,"S":0},"value":"I"},{"text":"ثبات و امنیت است","score":{"C":0,"D":0,"I":0,"S":3},"value":"S"},{"text":"منطق و تحلیل است","score":{"C":3,"D":0,"I":0,"S":0},"value":"C"}]},{"id":"disc-q-6","order":6,"options":[{"text":"مستقیم و بی‌پرده صحبت می‌کنم","score":{"C":0,"D":3,"I":0,"S":0},"value":"D"},{"text":"سعی می‌کنم فضا را شاد نگه دارم","score":{"C":0,"D":0,"I":3,"S":0},"value":"I"},{"text":"با صبر و بردباری برخورد می‌کنم","score":{"C":0,"D":0,"I":0,"S":3},"value":"S"},{"text":"به دنبال راه‌حل منطقی هستم","score":{"C":3,"D":0,"I":0,"S":0},"value":"C"}]},{"id":"disc-q-7","order":7,"options":[{"text":"مختصر و مفید باشم","score":{"C":0,"D":3,"I":0,"S":0},"value":"D"},{"text":"صمیمی و دوستانه باشم","score":{"C":0,"D":0,"I":3,"S":0},"value":"I"},{"text":"آرام و دلسوزانه باشم","score":{"C":0,"D":0,"I":0,"S":3},"value":"S"},{"text":"دقیق و واضح باشم","score":{"C":3,"D":0,"I":0,"S":0},"value":"C"}]},{"id":"disc-q-8","order":8,"options":[{"text":"چالش‌برانگیز و رقابتی است","score":{"C":0,"D":3,"I":0,"S":0},"value":"D"},{"text":"پویا و اجتماعی است","score":{"C":0,"D":0,"I":3,"S":0},"value":"I"},{"text":"باثبات و حمایتی است","score":{"C":0,"D":0,"I":0,"S":3},"value":"S"},{"text":"منظم و ساختاریافته است","score":{"C":3,"D":0,"I":0,"S":0},"value":"C"}]},{"id":"disc-q-9","order":9,"options":[{"text":"آن‌ها را می‌پذیرم اگر به نتیجه برسند","score":{"C":0,"D":3,"I":0,"S":0},"value":"D"},{"text":"به آن‌ها به عنوان فرصت نگاه می‌کنم","score":{"C":0,"D":0,"I":3,"S":0},"value":"I"},{"text":"به زمان نیاز دارم تا با آن‌ها کنار بیایم","score":{"C":0,"D":0,"I":0,"S":3},"value":"S"},{"text":"ابتدا باید آن‌ها را تحلیل کنم","score":{"C":3,"D":0,"I":0,"S":0},"value":"C"}]},{"id":"disc-q-10","order":10,"options":[{"text":"کنترل و اختیار داشته باشم","score":{"C":0,"D":3,"I":0,"S":0},"value":"D"},{"text":"با دیگران تعامل داشته باشم","score":{"C":0,"D":0,"I":3,"S":0},"value":"I"},{"text":"محیط آرام و قابل پیش‌بینی باشد","score":{"C":0,"D":0,"I":0,"S":3},"value":"S"},{"text":"استانداردهای واضح داشته باشم","score":{"C":3,"D":0,"I":0,"S":0},"value":"C"}]},{"id":"disc-q-11","order":11,"options":[{"text":"از دست دادن کنترل است","score":{"C":0,"D":3,"I":0,"S":0},"value":"D"},{"text":"طرد شدن است","score":{"C":0,"D":0,"I":3,"S":0},"value":"I"},{"text":"تغییرات ناگهانی است","score":{"C":0,"D":0,"I":0,"S":3},"value":"S"},{"text":"اشتباه کردن است","score":{"C":3,"D":0,"I":0,"S":0},"value":"C"}]},{"id":"disc-q-12","order":12,"options":[{"text":"رسیدن به اهداف و برنده شدن است","score":{"C":0,"D":3,"I":0,"S":0},"value":"D"},{"text":"شناخته شدن و تحسین شدن است","score":{"C":0,"D":0,"I":3,"S":0},"value":"I"},{"text":"کمک به دیگران و ثبات است","score":{"C":0,"D":0,"I":0,"S":3},"value":"S"},{"text":"دقت و کیفیت کار است","score":{"C":3,"D":0,"I":0,"S":0},"value":"C"}]},{"id":"disc-q-13","order":13,"options":[{"text":"قاطع‌تر و مستقیم‌تر می‌شوم","score":{"C":0,"D":3,"I":0,"S":0},"value":"D"},{"text":"بی‌نظم‌تر می‌شوم","score":{"C":0,"D":0,"I":3,"S":0},"value":"I"},{"text":"منزوی‌تر می‌شوم","score":{"C":0,"D":0,"I":0,"S":3},"value":"S"},{"text":"بیش از حد تحلیلی می‌شوم","score":{"C":3,"D":0,"I":0,"S":0},"value":"C"}]},{"id":"disc-q-14","order":14,"options":[{"text":"جلسه را هدایت می‌کنم","score":{"C":0,"D":3,"I":0,"S":0},"value":"D"},{"text":"ایده‌های خلاقانه ارائه می‌دهم","score":{"C":0,"D":0,"I":3,"S":0},"value":"I"},{"text":"گوش می‌دهم و حمایت می‌کنم","score":{"C":0,"D":0,"I":0,"S":3},"value":"S"},{"text":"سوالات دقیق می‌پرسم","score":{"C":3,"D":0,"I":0,"S":0},"value":"C"}]},{"id":"disc-q-15","order":15,"options":[{"text":"با انجام دادن یاد می‌گیرم","score":{"C":0,"D":3,"I":0,"S":0},"value":"D"},{"text":"با تعامل با دیگران یاد می‌گیرم","score":{"C":0,"D":0,"I":3,"S":0},"value":"I"},{"text":"با مشاهده و تمرین یاد می‌گیرم","score":{"C":0,"D":0,"I":0,"S":3},"value":"S"},{"text":"با مطالعه و تحقیق یاد می‌گیرم","score":{"C":3,"D":0,"I":0,"S":0},"value":"C"}]},{"id":"disc-q-16","order":16,"options":[{"text":"اگر منطقی نباشند، آن‌ها را زیر سوال می‌برم","score":{"C":0,"D":3,"I":0,"S":0},"value":"D"},{"text":"سعی می‌کنم انعطاف‌پذیر باشم","score":{"C":0,"D":0,"I":3,"S":0},"value":"I"},{"text":"آن‌ها را به خوبی دنبال می‌کنم","score":{"C":0,"D":0,"I":0,"S":3},"value":"S"},{"text":"دقیقاً طبق آن‌ها عمل می‌کنم","score":{"C":3,"D":0,"I":0,"S":0},"value":"C"}]},{"id":"disc-q-17","order":17,"options":[{"text":"قاطعیت و تصمیم‌گیری سریع","score":{"C":0,"D":3,"I":0,"S":0},"value":"D"},{"text":"خوش‌بینی و الهام‌بخشی","score":{"C":0,"D":0,"I":3,"S":0},"value":"I"},{"text":"صبر و وفاداری","score":{"C":0,"D":0,"I":0,"S":3},"value":"S"},{"text":"دقت و تحلیل","score":{"C":3,"D":0,"I":0,"S":0},"value":"C"}]},{"id":"disc-q-18","order":18,"options":[{"text":"روی نتیجه نهایی تمرکز می‌کنم","score":{"C":0,"D":3,"I":0,"S":0},"value":"D"},{"text":"ایده کلی را می‌بینم اما جزئیات را نه","score":{"C":0,"D":0,"I":3,"S":0},"value":"I"},{"text":"گام به گام پیش می‌روم","score":{"C":0,"D":0,"I":0,"S":3},"value":"S"},{"text":"برنامه‌های جامع و دقیق می‌سازم","score":{"C":3,"D":0,"I":0,"S":0},"value":"C"}]},{"id":"disc-q-19","order":19,"options":[{"text":"مستقیم و صریح برخورد می‌کنم","score":{"C":0,"D":3,"I":0,"S":0},"value":"D"},{"text":"سعی می‌کنم همه را راضی نگه دارم","score":{"C":0,"D":0,"I":3,"S":0},"value":"I"},{"text":"از تعارض اجتناب می‌کنم","score":{"C":0,"D":0,"I":0,"S":3},"value":"S"},{"text":"منطقی و عینی برخورد می‌کنم","score":{"C":3,"D":0,"I":0,"S":0},"value":"C"}]},{"id":"disc-q-20","order":20,"options":[{"text":"ریسک‌های محاسبه‌شده می‌پذیرم","score":{"C":0,"D":3,"I":0,"S":0},"value":"D"},{"text":"از ریسک‌های هیجان‌انگیز لذت می‌برم","score":{"C":0,"D":0,"I":3,"S":0},"value":"I"},{"text":"از ریسک اجتناب می‌کنم","score":{"C":0,"D":0,"I":0,"S":3},"value":"S"},{"text":"فقط بعد از تحلیل کامل ریسک می‌پذیرم","score":{"C":3,"D":0,"I":0,"S":0},"value":"C"}]},{"id":"disc-q-21","order":21,"options":[{"text":"روی نتایج تمرکز می‌کنم","score":{"C":0,"D":3,"I":0,"S":0},"value":"D"},{"text":"جذاب و الهام‌بخش ارائه می‌دهم","score":{"C":0,"D":0,"I":3,"S":0},"value":"I"},{"text":"با آرامش و اطمینان ارائه می‌دهم","score":{"C":0,"D":0,"I":0,"S":3},"value":"S"},{"text":"با داده و مدرک ارائه می‌دهم","score":{"C":3,"D":0,"I":0,"S":0},"value":"C"}]},{"id":"disc-q-22","order":22,"options":[{"text":"به فعالیت‌های چالش‌برانگیز اختصاص می‌دهم","score":{"C":0,"D":3,"I":0,"S":0},"value":"D"},{"text":"با دوستان و خانواده می‌گذرانم","score":{"C":0,"D":0,"I":3,"S":0},"value":"I"},{"text":"به استراحت و آرامش اختصاص می‌دهم","score":{"C":0,"D":0,"I":0,"S":3},"value":"S"},{"text":"به سرگرمی‌های تحلیلی می‌پردازم","score":{"C":3,"D":0,"I":0,"S":0},"value":"C"}]},{"id":"disc-q-23","order":23,"options":[{"text":"روی اولویت‌های مهم تمرکز می‌کنم","score":{"C":0,"D":3,"I":0,"S":0},"value":"D"},{"text":"انعطاف‌پذیر هستم و به موقعیت‌ها واکنش نشان می‌دهم","score":{"C":0,"D":0,"I":3,"S":0},"value":"I"},{"text":"به روتین‌های خود پایبند هستم","score":{"C":0,"D":0,"I":0,"S":3},"value":"S"},{"text":"برنامه‌ریزی دقیق دارم","score":{"C":3,"D":0,"I":0,"S":0},"value":"C"}]},{"id":"disc-q-24","order":24,"options":[{"text":"برای رسیدن به هدف هر کاری می‌کنم","score":{"C":0,"D":3,"I":0,"S":0},"value":"D"},{"text":"دیگران را الهام‌بخش می‌کنم","score":{"C":0,"D":0,"I":3,"S":0},"value":"I"},{"text":"پشتکار و وفاداری دارم","score":{"C":0,"D":0,"I":0,"S":3},"value":"S"},{"text":"دقیق و باکیفیت کار می‌کنم","score":{"C":3,"D":0,"I":0,"S":0},"value":"C"}]}],
          },
        },
      });
      console.log(`✅ آزمون "آزمون شخصیت‌سنجی DISC" ایجاد شد`);
      // اختصاص آزمون به بخش‌ها
      {
        const department = createdDepartments.find((d) => d.name === "IT");
        if (department) {
          await prisma.assessment_assignments.upsert({
            where: { id: "cmj8jvk29000f5unnosnmm9qz" },
            update: {},
            create: {
              id: "cmj8jvk29000f5unnosnmm9qz",
              assessmentId: assessment.id,
              departmentId: department.id,
            },
          });
        }
      }
    }
  }

  // آزمون‌های Holland و MSQ توسط seedHolland() و seedMSQ() ایجاد می‌شوند
  */

  // اضافه کردن آزمون‌ها اگر وجود ندارند (باید قبل از ایجاد نتایج آزمون انجام شود)
  console.log("\n📝 شروع اضافه کردن آزمون‌ها...\n");
  
  try {
    await seedMBTI(prisma);
    console.log('');
    
    await seedDISC(prisma);
    console.log('');
    
    await seedHolland(prisma);
    console.log('');
    
    await seedMSQ(prisma);
    console.log('');
    
    console.log("✅ همه آزمون‌ها با موفقیت ایجاد شدند!\n");
  } catch (error: any) {
    console.error("❌ خطا در ایجاد آزمون‌ها:", error?.message || error);
    // ادامه می‌دهیم حتی اگر خطا رخ دهد
  }

  // ایجاد نتایج آزمون‌ها
  {
    const user = createdUsers.find((u) => u.mobile === "09123322111");
    const assessment = await prisma.assessments.findUnique({ where: { id: "disc-standard-assessment" } });
    if (user && assessment) {
      await prisma.assessment_results.upsert({
        where: { id: "cmj8jz451000p5unnyk27a6ab" },
        update: {},
        create: {
          id: "cmj8jz451000p5unnyk27a6ab",
          assessmentId: assessment.id,
          userId: user.id,
          score: 100,
          answers: {"disc-q-1":"D","disc-q-2":"I","disc-q-3":"C","disc-q-4":"S","disc-q-5":"I","disc-q-6":"C","disc-q-7":"I","disc-q-8":"S","disc-q-9":"C","disc-q-10":"D","disc-q-11":"I","disc-q-12":"D","disc-q-13":"S","disc-q-14":"I","disc-q-15":"S","disc-q-16":"I","disc-q-17":"S","disc-q-18":"C","disc-q-19":"D","disc-q-20":"S","disc-q-21":"I","disc-q-22":"S","disc-q-23":"I","disc-q-24":"C"},
          result: {"type":"IS","scores":{"C":15,"D":12,"I":24,"S":21},"careers":["مشاور","معلم","منابع انسانی","روانشناس"],"strengths":["کار تیمی","ایجاد رابطه","حمایت از دیگران","ایجاد هماهنگی"],"workStyle":["کار تیمی","پشتیبانی از اعضای تیم","ایجاد روابط","حل تعارضات"],"weaknesses":["مشکل در تصمیم‌گیری‌های سخت","اجتناب از تعارض","مقاومت در برابر تغییر","تمایل به خوشایند دیگران"],"description":"تأثیرگذار-پایدار - تیم‌ساز دوستانه. ترکیبی از مهارت‌های اجتماعی و پایداری. این افراد تیم‌سازان خوبی هستند که محیط کار را دوستانه می‌کنند.","percentages":{"C":21,"D":17,"I":33,"S":29}},
          startedAt: new Date("2025-12-16T12:20:00.000Z"),
          completedAt: new Date("2025-12-16T12:22:34.932Z"),
        },
      });
      console.log(`✅ نتیجه آزمون برای کاربر "${user.name}" ایجاد شد`);
    }
  }

  {
    const user = createdUsers.find((u) => u.mobile === "09123322111");
    const assessment = await prisma.assessments.findUnique({ where: { id: "msq-standard-assessment" } });
    if (user && assessment) {
      await prisma.assessment_results.upsert({
        where: { id: "cmj8k1f23000v5unnt9mxhxry" },
        update: {},
        create: {
          id: "cmj8k1f23000v5unnt9mxhxry",
          assessmentId: assessment.id,
          userId: user.id,
          score: 57,
          answers: {"cmj8hv4iy00005uet2assbwse":"A","cmj8hv4iy00015uet9ed1nw61":"C","cmj8hv4iy00025uetf261o224":"E","cmj8hv4iy00035uete7glluq9":"C","cmj8hv4iy00045uetml16djr3":"A","cmj8hv4iy00055uet59254i23":"C","cmj8hv4iy00065uetztw3upb8":"B","cmj8hv4iy00075ueti0peo8p5":"D","cmj8hv4iy00085uetsc2w9rqe":"A","cmj8hv4iy00095uetvv1ed6jg":"D","cmj8hv4iz000a5uetbsbxc4vx":"D","cmj8hv4iz000b5uet351smfa5":"E","cmj8hv4iz000c5uet7pea3xt6":"B","cmj8hv4iz000d5uet723pwbd5":"D","cmj8hv4iz000e5uetjuo5hjfn":"E","cmj8hv4iz000f5uet42bze6ij":"C","cmj8hv4iz000g5uetb1uw768p":"B","cmj8hv4iz000h5uetbvcwzy3d":"D","cmj8hv4iz000i5uetlaunf9vt":"B","cmj8hv4iz000j5uet94w5yr91":"E"},
          result: {"level":"متوسط","scores":{"total":57,"extrinsic":21,"intrinsic":36},"description":"رضایت شغلی شما در سطح متوسط قرار دارد. برخی جنبه‌های کار شما رضایت‌بخش است، اما برخی دیگر نیاز به توجه دارند.","percentages":{"total":57,"extrinsic":53,"intrinsic":60},"recommendations":[],"extrinsicDescription":"رضایت بیرونی شما در سطح متوسط است. برخی جنبه‌های بیرونی کار شما رضایت‌بخش است.","intrinsicDescription":"رضایت درونی شما در سطح خوبی قرار دارد. شما عموماً از جنبه‌های درونی کار خود راضی هستید."},
          startedAt: new Date("2025-12-16T12:22:00.000Z"),
          completedAt: new Date("2025-12-16T12:24:22.394Z"),
        },
      });
      console.log(`✅ نتیجه آزمون برای کاربر "${user.name}" ایجاد شد`);
    }
  }

  // ایجاد فیدبک‌ها
  {
    const user = createdUsers.find((u) => u.mobile === "09123322112");
    const department = createdDepartments.find((d) => d.name === "IT");
    if (user && department) {
      const forwardedTo = null;
      const completedBy = null;
      await prisma.feedbacks.create({
        data: {
          id: randomUUID(),
          title: "مشکل در سیستم شبکه",
          content: "سیستم شبکه شرکت کند کار می‌کند و نیاز به بررسی دارد.",
          rating: 2,
          type: "CRITICAL",
          status: "PENDING",
          isAnonymous: false,
          departmentId: department.id,
          userId: user.id,
          deletedAt: new Date("2025-11-26T10:42:04.703Z"),
          updatedAt: new Date(),
          createdAt: new Date("2025-11-25T08:16:52.872Z"),
          updatedAt: new Date(),
        },
      });
      console.log(`✅ فیدبک "مشکل در سیستم شبکه" ایجاد شد`);
    }
  }

  {
    const user = createdUsers.find((u) => u.mobile === "09123322112");
    const department = createdDepartments.find((d) => d.name === "IT");
    if (user && department) {
      const forwardedTo = null;
      const completedBy = null;
      await prisma.feedbacks.create({
        data: {
          id: randomUUID(),
          title: "پیشنهاد بهبود سیستم",
          content: "پیشنهاد می‌کنم سیستم فیدبک را بهبود دهیم.",
          rating: 4,
          type: "SUGGESTION",
          status: "PENDING",
          isAnonymous: false,
          departmentId: department.id,
          userId: user.id,
          createdAt: new Date("2025-11-25T08:16:52.926Z"),
          updatedAt: new Date(),
        },
      });
      console.log(`✅ فیدبک "پیشنهاد بهبود سیستم" ایجاد شد`);
    }
  }

  {
    const user = createdUsers.find((u) => u.mobile === "09123322112");
    const department = createdDepartments.find((d) => d.name === "IT");
    if (user && department) {
      const forwardedTo = createdUsers.find((u) => u.mobile === "09123322111");
      const completedBy = null;
      await prisma.feedbacks.create({
        data: {
          id: randomUUID(),
          title: "فیدبک ارجاع شده",
          content: "این فیدبک برای بررسی به مدیر ارجاع شده است.",
          rating: 5,
          type: "SUGGESTION",
          status: "REVIEWED",
          isAnonymous: false,
          departmentId: department.id,
          userId: user.id,
          forwardedToId: forwardedTo?.id,
          forwardedAt: new Date("2025-11-25T08:16:52.871Z"),
          createdAt: new Date("2025-11-25T08:16:52.963Z"),
          updatedAt: new Date(),
        },
      });
      console.log(`✅ فیدبک "فیدبک ارجاع شده" ایجاد شد`);
    }
  }

  {
    const user = createdUsers.find((u) => u.mobile === "09123322112");
    const department = createdDepartments.find((d) => d.name === "IT");
    if (user && department) {
      const forwardedTo = null;
      const completedBy = null;
      await prisma.feedbacks.create({
        data: {
          id: randomUUID(),
          title: "مشکل در سیستم شبکه",
          content: "سیستم شبکه شرکت کند کار می‌کند و نیاز به بررسی دارد.",
          rating: 2,
          type: "CRITICAL",
          status: "PENDING",
          isAnonymous: false,
          departmentId: department.id,
          userId: user.id,
          createdAt: new Date("2025-11-25T08:20:16.310Z"),
          updatedAt: new Date(),
        },
      });
      console.log(`✅ فیدبک "مشکل در سیستم شبکه" ایجاد شد`);
    }
  }

  {
    const user = createdUsers.find((u) => u.mobile === "09123322112");
    const department = createdDepartments.find((d) => d.name === "IT");
    if (user && department) {
      const forwardedTo = null;
      const completedBy = null;
      await prisma.feedbacks.create({
        data: {
          id: randomUUID(),
          title: "پیشنهاد بهبود سیستم",
          content: "پیشنهاد می‌کنم سیستم فیدبک را بهبود دهیم.",
          rating: 4,
          type: "SUGGESTION",
          status: "PENDING",
          isAnonymous: false,
          departmentId: department.id,
          userId: user.id,
          createdAt: new Date("2025-11-25T08:20:16.374Z"),
          updatedAt: new Date(),
        },
      });
      console.log(`✅ فیدبک "پیشنهاد بهبود سیستم" ایجاد شد`);
    }
  }

  {
    const user = createdUsers.find((u) => u.mobile === "09123322112");
    const department = createdDepartments.find((d) => d.name === "IT");
    if (user && department) {
      const forwardedTo = createdUsers.find((u) => u.mobile === "09123322111");
      const completedBy = null;
      await prisma.feedbacks.create({
        data: {
          id: randomUUID(),
          title: "فیدبک ارجاع شده",
          content: "این فیدبک برای بررسی به مدیر ارجاع شده است.",
          rating: 5,
          type: "SUGGESTION",
          status: "REVIEWED",
          isAnonymous: false,
          departmentId: department.id,
          userId: user.id,
          forwardedToId: forwardedTo?.id,
          forwardedAt: new Date("2025-11-25T08:20:16.308Z"),
          deletedAt: new Date("2025-11-26T10:41:38.185Z"),
          createdAt: new Date("2025-11-25T08:20:16.417Z"),
          updatedAt: new Date(),
        },
      });
      console.log(`✅ فیدبک "فیدبک ارجاع شده" ایجاد شد`);
    }
  }

  {
    const user = createdUsers.find((u) => u.mobile === "09121941532");
    const department = createdDepartments.find((d) => d.name === "آشپزخانه");
    if (user && department) {
      const forwardedTo = null;
      const completedBy = null;
      await prisma.feedbacks.create({
        data: {
          id: randomUUID(),
          title: "ادمین آشپزخانه ۱",
          content: "محتوا ادمین آشپزخانه ",
          image: "/uploads/feedback/feedback-1764151391212-2e9ejq.jpg",
          type: "SUGGESTION",
          status: "PENDING",
          isAnonymous: false,
          departmentId: department.id,
          userId: user.id,
          createdAt: new Date("2025-11-26T10:03:13.073Z"),
          updatedAt: new Date(),
        },
      });
      console.log(`✅ فیدبک "ادمین آشپزخانه ۱" ایجاد شد`);
    }
  }

  {
    const user = createdUsers.find((u) => u.mobile === "09121941532");
    const department = createdDepartments.find((d) => d.name === "اداری");
    if (user && department) {
      const forwardedTo = createdUsers.find((u) => u.mobile === "09123322112");
      const completedBy = null;
      await prisma.feedbacks.create({
        data: {
          id: randomUUID(),
          title: "عنوان ادمین اداری ۲",
          content: "متن انتقادی ۲ ادمین ",
          image: "[\"/uploads/feedback/feedback-1764157014321-0-nwjmqx.jpg\",\"/uploads/feedback/feedback-1764157014323-1-rl1gci.jpg\"]",
          type: "CRITICAL",
          status: "REVIEWED",
          isAnonymous: false,
          departmentId: department.id,
          userId: user.id,
          forwardedToId: forwardedTo?.id,
          forwardedAt: new Date("2025-11-29T12:31:19.672Z"),
          createdAt: new Date("2025-11-26T11:36:56.177Z"),
          updatedAt: new Date(),
        },
      });
      console.log(`✅ فیدبک "عنوان ادمین اداری ۲" ایجاد شد`);
    }
  }

  {
    const user = createdUsers.find((u) => u.mobile === "09123322111");
    const department = createdDepartments.find((d) => d.name === "اداری");
    if (user && department) {
      const forwardedTo = null;
      const completedBy = null;
      await prisma.feedbacks.create({
        data: {
          id: randomUUID(),
          title: "مدیر به اداری",
          content: "محتوا مدیر به اداری",
          image: "[\"/uploads/feedback/feedback-1764163773243-0-0p8px.jpg\"]",
          type: "SUGGESTION",
          status: "PENDING",
          isAnonymous: false,
          departmentId: department.id,
          userId: user.id,
          createdAt: new Date("2025-11-26T13:29:33.391Z"),
          updatedAt: new Date(),
        },
      });
      console.log(`✅ فیدبک "مدیر به اداری" ایجاد شد`);
    }
  }

  {
    const user = createdUsers.find((u) => u.mobile === "09121941532");
    const department = createdDepartments.find((d) => d.name === "آشپزخانه");
    if (user && department) {
      const forwardedTo = createdUsers.find((u) => u.mobile === "09123322111");
      const completedBy = null;
      await prisma.feedbacks.create({
        data: {
          id: randomUUID(),
          title: "شکایت آشپزخانه ",
          content: "این متن شکایت آشپزخانه به صورت انتقادی است ",
          type: "CRITICAL",
          status: "REVIEWED",
          isAnonymous: false,
          departmentId: department.id,
          userId: user.id,
          forwardedToId: forwardedTo?.id,
          forwardedAt: new Date("2025-11-29T13:40:44.454Z"),
          createdAt: new Date("2025-11-29T12:49:32.025Z"),
          updatedAt: new Date(),
        },
      });
      console.log(`✅ فیدبک "شکایت آشپزخانه " ایجاد شد`);
    }
  }

  {
    const user = createdUsers.find((u) => u.mobile === "09123322111");
    const department = createdDepartments.find((d) => d.name === "اداری");
    if (user && department) {
      const forwardedTo = null;
      const completedBy = null;
      await prisma.feedbacks.create({
        data: {
          id: randomUUID(),
          title: "حقوق من فرزاد چی شد ؟",
          content: "متن حثقوق مدیر فرزاد چی شذ با تصویز . انتقادی",
          image: "[\"/uploads/feedback/feedback-1764422936935-0-ylthei.jpg\"]",
          type: "CRITICAL",
          status: "PENDING",
          isAnonymous: false,
          departmentId: department.id,
          userId: user.id,
          createdAt: new Date("2025-11-29T13:28:57.096Z"),
          updatedAt: new Date(),
        },
      });
      console.log(`✅ فیدبک "حقوق من فرزاد چی شد ؟" ایجاد شد`);
    }
  }

  // ایجاد وظایف
  {
    const department = createdDepartments.find((d) => d.name === "اداری");
    const createdBy = createdUsers.find((u) => u.mobile === "09121941532");
    if (department && createdBy) {
      const feedback = await prisma.feedbacks.findFirst({
        where: { title: "عنوان ادمین اداری ۲" },
      });
      if (feedback && !feedback.deletedAt) {
        const existingTask = await prisma.tasks.findUnique({
          where: { feedbackId: feedback.id },
        });
        if (!existingTask) {
          const createdTask = await prisma.tasks.create({
            data: {
              id: randomUUID(),
              title: "ارجاع: عنوان ادمین اداری ۲",
              description: "متن انتقادی ۲ ادمین \n\n---\nیادداشت ارجاع‌دهنده: این موضوغ را رسیدگی کنید . ",
              status: "PENDING",
              priority: "HIGH",
              isPublic: false,
              departmentId: department.id,
              createdById: createdBy.id,
              feedbackId: feedback.id,
              updatedAt: new Date(),
            },
          });
          console.log(`✅ وظیفه "ارجاع: عنوان ادمین اداری ۲" ایجاد شد`);
          // اختصاص وظایف
          {
            const user = createdUsers.find((u) => u.mobile === "09123322112");
            if (user) {
              await prisma.task_assignments.create({
                data: {
                  id: randomUUID(),
                  taskId: createdTask.id,
                  userId: user.id,
                },
              });
            }
          }
        } else {
          console.log(`⚠️ وظیفه برای فیدبک "عنوان ادمین اداری ۲" قبلاً ایجاد شده است`);
          // اختصاص وظایف
          {
            const user = createdUsers.find((u) => u.mobile === "09123322112");
            if (user && existingTask) {
              const existingAssignment = await prisma.task_assignments.findFirst({
                where: { taskId: existingTask.id, userId: user.id },
              });
              if (!existingAssignment) {
                await prisma.task_assignments.create({
                  data: {
                    id: randomUUID(),
                    taskId: existingTask.id,
                    userId: user.id,
                  },
                });
              }
            }
          }
        }
      }
    }
  }

  {
    const department = createdDepartments.find((d) => d.name === "IT");
    const createdBy = createdUsers.find((u) => u.mobile === "09121941532");
    if (department && createdBy) {
      const feedback = await prisma.feedbacks.findFirst({
        where: { title: "شکایت آشپزخانه " },
      });
      if (feedback && !feedback.deletedAt) {
        const existingTask = await prisma.tasks.findUnique({
          where: { feedbackId: feedback.id },
        });
        if (!existingTask) {
          const createdTask = await prisma.tasks.create({
            data: {
              id: randomUUID(),
              title: "ارجاع: شکایت آشپزخانه ",
              description: "این متن شکایت آشپزخانه به صورت انتقادی است \n\n---\nیادداشت ارجاع‌دهنده: موضوع آشپزخانه را تو حل کن ",
              status: "PENDING",
              priority: "HIGH",
              isPublic: false,
              departmentId: department.id,
              createdById: createdBy.id,
              feedbackId: feedback.id,
              updatedAt: new Date(),
            },
          });
          console.log(`✅ وظیفه "ارجاع: شکایت آشپزخانه " ایجاد شد`);
          // اختصاص وظایف
          {
            const user = createdUsers.find((u) => u.mobile === "09123322111");
            if (user) {
              await prisma.task_assignments.create({
                data: {
                  id: randomUUID(),
                  taskId: createdTask.id,
                  userId: user.id,
                },
              });
            }
          }
        } else {
          console.log(`⚠️ وظیفه برای فیدبک "شکایت آشپزخانه " قبلاً ایجاد شده است`);
          // اختصاص وظایف
          {
            const user = createdUsers.find((u) => u.mobile === "09123322111");
            if (user && existingTask) {
              const existingAssignment = await prisma.task_assignments.findFirst({
                where: { taskId: existingTask.id, userId: user.id },
              });
              if (!existingAssignment) {
                await prisma.task_assignments.create({
                  data: {
                    id: randomUUID(),
                    taskId: existingTask.id,
                    userId: user.id,
                  },
                });
              }
            }
          }
        }
      }
    }
  }

  // ایجاد اعلان‌ها
  {
    const createdBy = createdUsers.find((u) => u.mobile === "09123456789");
    if (createdBy) {
      await prisma.announcements.create({
        data: {
          id: randomUUID(),
          title: "به‌روزرسانی سیستم",
          content: "سیستم فیدبک به نسخه 2.0 به‌روزرسانی شد. امکانات جدید شامل چت آنلاین، سیستم تسک و اعلانات هوشمند است.",
          priority: "HIGH",
          isActive: true,
          publishedAt: new Date("2025-12-16T09:07:20.296Z"),
          createdById: createdBy.id,
          updatedAt: new Date(),
        },
      });
      console.log(`✅ اعلان "به‌روزرسانی سیستم" ایجاد شد`);
    }
  }

  {
    const createdBy = createdUsers.find((u) => u.mobile === "09123456789");
    if (createdBy) {
      await prisma.announcements.create({
        data: {
          id: randomUUID(),
          title: "خوش آمدید",
          content: "به سیستم فیدبک خوش آمدید. لطفاً فیدبک‌های خود را ثبت کنید.",
          priority: "HIGH",
          isActive: true,
          publishedAt: new Date("2025-11-25T08:16:53.006Z"),
          createdById: createdBy.id,
          updatedAt: new Date(),
        },
      });
      console.log(`✅ اعلان "خوش آمدید" ایجاد شد`);
    }
  }

  {
    const createdBy = createdUsers.find((u) => u.mobile === "09123456789");
    if (createdBy) {
      await prisma.announcements.create({
        data: {
          id: randomUUID(),
          title: "اعلان ۱",
          content: "به سیستم فیدبک خوش آمدید. لطفاً فیدبک‌های خود را ثبت کنید.",
          priority: "HIGH",
          isActive: true,
          publishedAt: new Date("2025-11-25T08:20:16.483Z"),
          createdById: createdBy.id,
          updatedAt: new Date(),
        },
      });
      console.log(`✅ اعلان "اعلان ۱" ایجاد شد`);
    }
  }

  {
    const createdBy = createdUsers.find((u) => u.mobile === "09123456789");
    if (createdBy) {
      await prisma.announcements.create({
        data: {
          id: randomUUID(),
          title: "اعلان بخش IT",
          content: "این اعلان مخصوص بخش IT است.",
          priority: "MEDIUM",
          isActive: true,
          publishedAt: new Date("2025-11-25T08:20:16.561Z"),
          departmentId: createdDepartments.find((d) => d.name === "IT")?.id,
          createdById: createdBy.id,
          updatedAt: new Date(),
        },
      });
      console.log(`✅ اعلان "اعلان بخش IT" ایجاد شد`);
    }
  }

  // اضافه کردن کلمات کلیدی اگر وجود ندارند
  console.log("\n🔑 شروع اضافه کردن کلمات کلیدی...\n");
  
  await seedKeywords(prisma);
  await seedITKeywords(prisma, createdDepartments);
  await seedKitchenKeywords(prisma, createdDepartments);

  // اضافه کردن آزمون‌ها اگر وجود ندارند (باید قبل از ایجاد نتایج آزمون انجام شود)
  console.log("\n📝 شروع اضافه کردن آزمون‌ها...\n");
  
  try {
    await seedMBTI(prisma);
    console.log('');
    
    await seedDISC(prisma);
    console.log('');
    
    await seedHolland(prisma);
    console.log('');
    
    await seedMSQ(prisma);
    console.log('');
    
    console.log("✅ همه آزمون‌ها با موفقیت ایجاد شدند!\n");
  } catch (error: any) {
    console.error("❌ خطا در ایجاد آزمون‌ها:", error?.message || error);
    // ادامه می‌دهیم حتی اگر خطا رخ دهد
  }

  console.log("\n🎉 تمام داده‌ها با موفقیت ایجاد شدند!");
}

main()
  .catch((e) => {
    console.error("❌ خطا در ایجاد داده‌ها:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
