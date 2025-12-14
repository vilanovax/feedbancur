import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedITKeywords() {
  console.log("🌱 Seeding IT department keywords...");

  // ابتدا بخش IT را پیدا می‌کنیم (یا ایجاد می‌کنیم)
  let itDepartment = await prisma.department.findFirst({
    where: {
      OR: [
        { name: { contains: "IT", mode: "insensitive" } },
        { name: { contains: "فناوری", mode: "insensitive" } },
        { name: { contains: "اطلاعات", mode: "insensitive" } },
      ],
    },
  });

  // اگر بخش IT وجود نداشت، null می‌گذاریم (کلمات عمومی)
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
      await prisma.analyticsKeyword.create({
        data: {
          keyword: kw.keyword,
          type: "SENSITIVE",
          priority: "HIGH",
          description: kw.description,
          isActive: true,
          departmentId,
        },
      });
      createdCount++;
      console.log(`✅ Added SENSITIVE: ${kw.keyword}`);
    } catch (error: any) {
      if (error.code === "P2002") {
        console.log(`⏭️  Skipped (exists): ${kw.keyword}`);
      } else {
        console.error(`❌ Error adding ${kw.keyword}:`, error.message);
      }
    }
  }

  // ایجاد کلمات کلیدی منفی
  for (const kw of negativeKeywords) {
    try {
      await prisma.analyticsKeyword.create({
        data: {
          keyword: kw.keyword,
          type: "NEGATIVE",
          priority: "HIGH",
          description: kw.description,
          isActive: true,
          departmentId,
        },
      });
      createdCount++;
      console.log(`✅ Added NEGATIVE: ${kw.keyword}`);
    } catch (error: any) {
      if (error.code === "P2002") {
        console.log(`⏭️  Skipped (exists): ${kw.keyword}`);
      } else {
        console.error(`❌ Error adding ${kw.keyword}:`, error.message);
      }
    }
  }

  // ایجاد کلمات کلیدی موضوعی
  for (const kw of topicKeywords) {
    try {
      await prisma.analyticsKeyword.create({
        data: {
          keyword: kw.keyword,
          type: "TOPIC",
          priority: "MEDIUM",
          description: kw.description,
          isActive: true,
          departmentId,
        },
      });
      createdCount++;
      console.log(`✅ Added TOPIC: ${kw.keyword}`);
    } catch (error: any) {
      if (error.code === "P2002") {
        console.log(`⏭️  Skipped (exists): ${kw.keyword}`);
      } else {
        console.error(`❌ Error adding ${kw.keyword}:`, error.message);
      }
    }
  }

  // ایجاد کلمات کلیدی مثبت
  for (const kw of positiveKeywords) {
    try {
      await prisma.analyticsKeyword.create({
        data: {
          keyword: kw.keyword,
          type: "POSITIVE",
          priority: "MEDIUM",
          description: kw.description,
          isActive: true,
          departmentId,
        },
      });
      createdCount++;
      console.log(`✅ Added POSITIVE: ${kw.keyword}`);
    } catch (error: any) {
      if (error.code === "P2002") {
        console.log(`⏭️  Skipped (exists): ${kw.keyword}`);
      } else {
        console.error(`❌ Error adding ${kw.keyword}:`, error.message);
      }
    }
  }

  console.log(`\n✅ Successfully added ${createdCount} IT keywords!`);
  console.log(`📊 Total keywords attempted: ${
    sensitiveKeywords.length +
    negativeKeywords.length +
    topicKeywords.length +
    positiveKeywords.length
  }`);
}

seedITKeywords()
  .catch((e) => {
    console.error("❌ Error seeding IT keywords:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
