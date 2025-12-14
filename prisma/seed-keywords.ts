import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedKeywords() {
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
    await prisma.analyticsKeyword.upsert({
      where: { id: `seed-sensitive-${kw.keyword}` },
      update: {},
      create: {
        id: `seed-sensitive-${kw.keyword}`,
        keyword: kw.keyword,
        type: "SENSITIVE",
        priority: 100,
        description: kw.description,
        isActive: true,
      },
    });
    createdCount++;
  }

  // ایجاد کلمات کلیدی مثبت
  for (const kw of positiveKeywords) {
    await prisma.analyticsKeyword.upsert({
      where: { id: `seed-positive-${kw.keyword}` },
      update: {},
      create: {
        id: `seed-positive-${kw.keyword}`,
        keyword: kw.keyword,
        type: "POSITIVE",
        priority: 50,
        description: kw.description,
        isActive: true,
      },
    });
    createdCount++;
  }

  // ایجاد کلمات کلیدی منفی
  for (const kw of negativeKeywords) {
    await prisma.analyticsKeyword.upsert({
      where: { id: `seed-negative-${kw.keyword}` },
      update: {},
      create: {
        id: `seed-negative-${kw.keyword}`,
        keyword: kw.keyword,
        type: "NEGATIVE",
        priority: 75,
        description: kw.description,
        isActive: true,
      },
    });
    createdCount++;
  }

  // ایجاد کلمات کلیدی موضوعی
  for (const kw of topicKeywords) {
    await prisma.analyticsKeyword.upsert({
      where: { id: `seed-topic-${kw.keyword}` },
      update: {},
      create: {
        id: `seed-topic-${kw.keyword}`,
        keyword: kw.keyword,
        type: "TOPIC",
        priority: 60,
        description: kw.description,
        isActive: true,
      },
    });
    createdCount++;
  }

  console.log(`✅ Successfully seeded ${createdCount} analytics keywords!`);
}

seedKeywords()
  .catch((e) => {
    console.error("❌ Error seeding keywords:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
