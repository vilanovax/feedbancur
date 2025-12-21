import { PrismaClient } from "@prisma/client";

const defaultPrisma = new PrismaClient();

async function seedMSQ(prismaInstance?: PrismaClient) {
  const prisma = prismaInstance || defaultPrisma;
  console.log("🌱 Seeding MSQ Assessment...");

  // پیدا کردن یا ایجاد کاربر ادمین برای creator
  const adminUser = await prisma.users.findFirst({
    where: { role: "ADMIN" },
  });

  if (!adminUser) {
    console.error("❌ No admin user found. Please create an admin user first.");
    return;
  }

  // ایجاد آزمون MSQ
  const msqAssessment = await prisma.assessments.upsert({
    where: { id: "msq-standard-assessment" },
    update: {},
    create: {
      id: "msq-standard-assessment",
      title: "آزمون رضایت شغلی مینه‌سوتا (MSQ)",
      description:
        "آزمون رضایت شغلی مینه‌سوتا (Minnesota Satisfaction Questionnaire) یک ابزار معتبر و استاندارد برای سنجش رضایت شغلی است. این آزمون رضایت شما را در دو بعد درونی (Intrinsic) و بیرونی (Extrinsic) اندازه‌گیری می‌کند.",
      type: "MSQ",
      instructions:
        "لطفاً به هر سوال با توجه به احساس خود نسبت به شغل فعلی‌تان پاسخ دهید. برای هر سوال یکی از گزینه‌های زیر را انتخاب کنید: خیلی راضی، راضی، خنثی، ناراضی، خیلی ناراضی. هیچ پاسخ درست یا غلطی وجود ندارد. صادقانه پاسخ دهید.",
      isActive: true,
      allowRetake: true,
      timeLimit: 15, // 15 دقیقه
      showResults: true,
      createdById: adminUser.id,
      updatedAt: new Date(),
    },
  });

  console.log(`✅ Created MSQ Assessment: ${msqAssessment.title}`);

  // سوالات MSQ - 20 سوال
  // سوالات 1-12: رضایت درونی (Intrinsic Satisfaction)
  // سوالات 13-20: رضایت بیرونی (Extrinsic Satisfaction)
  const questions = [
    // سوالات رضایت درونی (1-12)
    {
      questionText: "فرصت استفاده از مهارت‌ها و توانایی‌هایم در کار",
      order: 1,
      options: [
        {
          text: "خیلی راضی",
          value: "A",
          score: { value: 5 },
        },
        {
          text: "راضی",
          value: "B",
          score: { value: 4 },
        },
        {
          text: "خنثی",
          value: "C",
          score: { value: 3 },
        },
        {
          text: "ناراضی",
          value: "D",
          score: { value: 2 },
        },
        {
          text: "خیلی ناراضی",
          value: "E",
          score: { value: 1 },
        },
      ],
    },
    {
      questionText: "میزان استقلال در تصمیم‌گیری در کار",
      order: 2,
      options: [
        {
          text: "خیلی راضی",
          value: "A",
          score: { value: 5 },
        },
        {
          text: "راضی",
          value: "B",
          score: { value: 4 },
        },
        {
          text: "خنثی",
          value: "C",
          score: { value: 3 },
        },
        {
          text: "ناراضی",
          value: "D",
          score: { value: 2 },
        },
        {
          text: "خیلی ناراضی",
          value: "E",
          score: { value: 1 },
        },
      ],
    },
    {
      questionText: "فرصت انجام کارهای مختلف و متنوع",
      order: 3,
      options: [
        {
          text: "خیلی راضی",
          value: "A",
          score: { value: 5 },
        },
        {
          text: "راضی",
          value: "B",
          score: { value: 4 },
        },
        {
          text: "خنثی",
          value: "C",
          score: { value: 3 },
        },
        {
          text: "ناراضی",
          value: "D",
          score: { value: 2 },
        },
        {
          text: "خیلی ناراضی",
          value: "E",
          score: { value: 1 },
        },
      ],
    },
    {
      questionText: "فرصت کمک به دیگران در کار",
      order: 4,
      options: [
        {
          text: "خیلی راضی",
          value: "A",
          score: { value: 5 },
        },
        {
          text: "راضی",
          value: "B",
          score: { value: 4 },
        },
        {
          text: "خنثی",
          value: "C",
          score: { value: 3 },
        },
        {
          text: "ناراضی",
          value: "D",
          score: { value: 2 },
        },
        {
          text: "خیلی ناراضی",
          value: "E",
          score: { value: 1 },
        },
      ],
    },
    {
      questionText: "فرصت انجام کارهایی که از آن‌ها لذت می‌برم",
      order: 5,
      options: [
        {
          text: "خیلی راضی",
          value: "A",
          score: { value: 5 },
        },
        {
          text: "راضی",
          value: "B",
          score: { value: 4 },
        },
        {
          text: "خنثی",
          value: "C",
          score: { value: 3 },
        },
        {
          text: "ناراضی",
          value: "D",
          score: { value: 2 },
        },
        {
          text: "خیلی ناراضی",
          value: "E",
          score: { value: 1 },
        },
      ],
    },
    {
      questionText: "میزان احساس موفقیت و دستاورد در کار",
      order: 6,
      options: [
        {
          text: "خیلی راضی",
          value: "A",
          score: { value: 5 },
        },
        {
          text: "راضی",
          value: "B",
          score: { value: 4 },
        },
        {
          text: "خنثی",
          value: "C",
          score: { value: 3 },
        },
        {
          text: "ناراضی",
          value: "D",
          score: { value: 2 },
        },
        {
          text: "خیلی ناراضی",
          value: "E",
          score: { value: 1 },
        },
      ],
    },
    {
      questionText: "میزان چالش‌برانگیز بودن کار",
      order: 7,
      options: [
        {
          text: "خیلی راضی",
          value: "A",
          score: { value: 5 },
        },
        {
          text: "راضی",
          value: "B",
          score: { value: 4 },
        },
        {
          text: "خنثی",
          value: "C",
          score: { value: 3 },
        },
        {
          text: "ناراضی",
          value: "D",
          score: { value: 2 },
        },
        {
          text: "خیلی ناراضی",
          value: "E",
          score: { value: 1 },
        },
      ],
    },
    {
      questionText: "فرصت یادگیری چیزهای جدید",
      order: 8,
      options: [
        {
          text: "خیلی راضی",
          value: "A",
          score: { value: 5 },
        },
        {
          text: "راضی",
          value: "B",
          score: { value: 4 },
        },
        {
          text: "خنثی",
          value: "C",
          score: { value: 3 },
        },
        {
          text: "ناراضی",
          value: "D",
          score: { value: 2 },
        },
        {
          text: "خیلی ناراضی",
          value: "E",
          score: { value: 1 },
        },
      ],
    },
    {
      questionText: "میزان خلاقیت و نوآوری در کار",
      order: 9,
      options: [
        {
          text: "خیلی راضی",
          value: "A",
          score: { value: 5 },
        },
        {
          text: "راضی",
          value: "B",
          score: { value: 4 },
        },
        {
          text: "خنثی",
          value: "C",
          score: { value: 3 },
        },
        {
          text: "ناراضی",
          value: "D",
          score: { value: 2 },
        },
        {
          text: "خیلی ناراضی",
          value: "E",
          score: { value: 1 },
        },
      ],
    },
    {
      questionText: "میزان مسئولیت‌پذیری در کار",
      order: 10,
      options: [
        {
          text: "خیلی راضی",
          value: "A",
          score: { value: 5 },
        },
        {
          text: "راضی",
          value: "B",
          score: { value: 4 },
        },
        {
          text: "خنثی",
          value: "C",
          score: { value: 3 },
        },
        {
          text: "ناراضی",
          value: "D",
          score: { value: 2 },
        },
        {
          text: "خیلی ناراضی",
          value: "E",
          score: { value: 1 },
        },
      ],
    },
    {
      questionText: "میزان احساس ارزشمندی و اهمیت کار",
      order: 11,
      options: [
        {
          text: "خیلی راضی",
          value: "A",
          score: { value: 5 },
        },
        {
          text: "راضی",
          value: "B",
          score: { value: 4 },
        },
        {
          text: "خنثی",
          value: "C",
          score: { value: 3 },
        },
        {
          text: "ناراضی",
          value: "D",
          score: { value: 2 },
        },
        {
          text: "خیلی ناراضی",
          value: "E",
          score: { value: 1 },
        },
      ],
    },
    {
      questionText: "میزان احساس پیشرفت و رشد در کار",
      order: 12,
      options: [
        {
          text: "خیلی راضی",
          value: "A",
          score: { value: 5 },
        },
        {
          text: "راضی",
          value: "B",
          score: { value: 4 },
        },
        {
          text: "خنثی",
          value: "C",
          score: { value: 3 },
        },
        {
          text: "ناراضی",
          value: "D",
          score: { value: 2 },
        },
        {
          text: "خیلی ناراضی",
          value: "E",
          score: { value: 1 },
        },
      ],
    },
    // سوالات رضایت بیرونی (13-20)
    {
      questionText: "میزان حقوق و دستمزد",
      order: 13,
      options: [
        {
          text: "خیلی راضی",
          value: "A",
          score: { value: 5 },
        },
        {
          text: "راضی",
          value: "B",
          score: { value: 4 },
        },
        {
          text: "خنثی",
          value: "C",
          score: { value: 3 },
        },
        {
          text: "ناراضی",
          value: "D",
          score: { value: 2 },
        },
        {
          text: "خیلی ناراضی",
          value: "E",
          score: { value: 1 },
        },
      ],
    },
    {
      questionText: "میزان امنیت شغلی",
      order: 14,
      options: [
        {
          text: "خیلی راضی",
          value: "A",
          score: { value: 5 },
        },
        {
          text: "راضی",
          value: "B",
          score: { value: 4 },
        },
        {
          text: "خنثی",
          value: "C",
          score: { value: 3 },
        },
        {
          text: "ناراضی",
          value: "D",
          score: { value: 2 },
        },
        {
          text: "خیلی ناراضی",
          value: "E",
          score: { value: 1 },
        },
      ],
    },
    {
      questionText: "میزان مزایا و پاداش‌ها",
      order: 15,
      options: [
        {
          text: "خیلی راضی",
          value: "A",
          score: { value: 5 },
        },
        {
          text: "راضی",
          value: "B",
          score: { value: 4 },
        },
        {
          text: "خنثی",
          value: "C",
          score: { value: 3 },
        },
        {
          text: "ناراضی",
          value: "D",
          score: { value: 2 },
        },
        {
          text: "خیلی ناراضی",
          value: "E",
          score: { value: 1 },
        },
      ],
    },
    {
      questionText: "میزان شرایط کاری و محیط فیزیکی",
      order: 16,
      options: [
        {
          text: "خیلی راضی",
          value: "A",
          score: { value: 5 },
        },
        {
          text: "راضی",
          value: "B",
          score: { value: 4 },
        },
        {
          text: "خنثی",
          value: "C",
          score: { value: 3 },
        },
        {
          text: "ناراضی",
          value: "D",
          score: { value: 2 },
        },
        {
          text: "خیلی ناراضی",
          value: "E",
          score: { value: 1 },
        },
      ],
    },
    {
      questionText: "میزان روابط با همکاران",
      order: 17,
      options: [
        {
          text: "خیلی راضی",
          value: "A",
          score: { value: 5 },
        },
        {
          text: "راضی",
          value: "B",
          score: { value: 4 },
        },
        {
          text: "خنثی",
          value: "C",
          score: { value: 3 },
        },
        {
          text: "ناراضی",
          value: "D",
          score: { value: 2 },
        },
        {
          text: "خیلی ناراضی",
          value: "E",
          score: { value: 1 },
        },
      ],
    },
    {
      questionText: "میزان روابط با مدیر و سرپرست",
      order: 18,
      options: [
        {
          text: "خیلی راضی",
          value: "A",
          score: { value: 5 },
        },
        {
          text: "راضی",
          value: "B",
          score: { value: 4 },
        },
        {
          text: "خنثی",
          value: "C",
          score: { value: 3 },
        },
        {
          text: "ناراضی",
          value: "D",
          score: { value: 2 },
        },
        {
          text: "خیلی ناراضی",
          value: "E",
          score: { value: 1 },
        },
      ],
    },
    {
      questionText: "میزان سیاست‌ها و رویه‌های سازمان",
      order: 19,
      options: [
        {
          text: "خیلی راضی",
          value: "A",
          score: { value: 5 },
        },
        {
          text: "راضی",
          value: "B",
          score: { value: 4 },
        },
        {
          text: "خنثی",
          value: "C",
          score: { value: 3 },
        },
        {
          text: "ناراضی",
          value: "D",
          score: { value: 2 },
        },
        {
          text: "خیلی ناراضی",
          value: "E",
          score: { value: 1 },
        },
      ],
    },
    {
      questionText: "میزان فرصت‌های ارتقا و پیشرفت شغلی",
      order: 20,
      options: [
        {
          text: "خیلی راضی",
          value: "A",
          score: { value: 5 },
        },
        {
          text: "راضی",
          value: "B",
          score: { value: 4 },
        },
        {
          text: "خنثی",
          value: "C",
          score: { value: 3 },
        },
        {
          text: "ناراضی",
          value: "D",
          score: { value: 2 },
        },
        {
          text: "خیلی ناراضی",
          value: "E",
          score: { value: 1 },
        },
      ],
    },
  ];

  // حذف سوالات قبلی
  await prisma.assessment_questions.deleteMany({
    where: { assessmentId: msqAssessment.id },
  });

  // ایجاد سوالات
  const questionsData = questions.map((q) => ({
    id: `msq-q-${q.order}`,
    assessmentId: msqAssessment.id,
    questionText: q.questionText,
    questionType: "MULTIPLE_CHOICE" as const,
    order: q.order,
    isRequired: true,
    options: q.options,
  }));

  await prisma.assessment_questions.createMany({
    data: questionsData,
    skipDuplicates: true,
  });

  console.log(`✅ Created ${questions.length} questions for MSQ Assessment`);
  console.log("✅ MSQ Assessment seeding completed!");
}

// Export for use in main seed.ts
export { seedMSQ };

// Run directly if called standalone
if (require.main === module) {
  seedMSQ()
    .catch((e) => {
      console.error("❌ Error seeding MSQ assessment:", e);
      process.exit(1);
    })
    .finally(async () => {
      await defaultPrisma.$disconnect();
    });
}

