import { PrismaClient } from "@prisma/client";

const defaultPrisma = new PrismaClient();

async function seedDISC(prismaInstance?: PrismaClient) {
  const prisma = prismaInstance || defaultPrisma;
  console.log("Starting DISC assessment seed...");

  // Find or create admin user
  let adminUser = await prisma.users.findFirst({
    where: { role: "ADMIN" },
  });

  if (!adminUser) {
    console.error("❌ No admin user found. Please create an admin user first.");
    return;
  }

  // Create DISC Assessment
  const discAssessment = await prisma.assessments.upsert({
    where: { id: "disc-standard-assessment" },
    update: {},
    create: {
      id: "disc-standard-assessment",
      title: "آزمون شخصیت‌سنجی DISC",
      description:
        "آزمون DISC یک ابزار ارزیابی رفتاری است که افراد را بر اساس چهار ویژگی اصلی طبقه‌بندی می‌کند: سلطه‌گری (D)، تأثیرگذاری (I)، پایداری (S)، و وظیفه‌شناسی (C).",
      type: "DISC",
      instructions:
        "لطفاً هر سوال را با دقت بخوانید و گزینه‌ای را انتخاب کنید که بیشتر شما را توصیف می‌کند. هیچ پاسخ درست یا غلطی وجود ندارد. صادقانه پاسخ دهید.",
      isActive: true,
      allowRetake: true,
      timeLimit: 20,
      showResults: true,
      createdById: adminUser.id,
      updatedAt: new Date(),
    },
  });

  console.log(`DISC Assessment created: ${discAssessment.id}`);

  // DISC Questions (24 questions)
  const questions = [
    // Section 1: Dominance (D) vs Influence (I) - Questions 1-6
    {
      id: "disc-q-1",
      questionText: "کدام جمله شما را بهتر توصیف می‌کند؟",
      order: 1,
      options: [
        {
          text: "من تصمیم‌گیرنده قاطع و مستقیمی هستم",
          value: "D",
          score: { D: 3, I: 0, S: 0, C: 0 },
        },
        {
          text: "من فردی اجتماعی و پرانرژی هستم",
          value: "I",
          score: { D: 0, I: 3, S: 0, C: 0 },
        },
        {
          text: "من صبور و قابل اعتماد هستم",
          value: "S",
          score: { D: 0, I: 0, S: 3, C: 0 },
        },
        {
          text: "من دقیق و تحلیلگر هستم",
          value: "C",
          score: { D: 0, I: 0, S: 0, C: 3 },
        },
      ],
    },
    {
      id: "disc-q-2",
      questionText: "در محیط کاری، من بیشتر:",
      order: 2,
      options: [
        {
          text: "روی نتایج و دستاوردها تمرکز دارم",
          value: "D",
          score: { D: 3, I: 0, S: 0, C: 0 },
        },
        {
          text: "روی ایجاد روابط و تعاملات تمرکز دارم",
          value: "I",
          score: { D: 0, I: 3, S: 0, C: 0 },
        },
        {
          text: "روی ثبات و همکاری تمرکز دارم",
          value: "S",
          score: { D: 0, I: 0, S: 3, C: 0 },
        },
        {
          text: "روی کیفیت و دقت تمرکز دارم",
          value: "C",
          score: { D: 0, I: 0, S: 0, C: 3 },
        },
      ],
    },
    {
      id: "disc-q-3",
      questionText: "وقتی با چالش مواجه می‌شوم:",
      order: 3,
      options: [
        {
          text: "فوراً اقدام می‌کنم و آن را حل می‌کنم",
          value: "D",
          score: { D: 3, I: 0, S: 0, C: 0 },
        },
        {
          text: "دیگران را درگیر می‌کنم و از آن‌ها کمک می‌گیرم",
          value: "I",
          score: { D: 0, I: 3, S: 0, C: 0 },
        },
        {
          text: "آرام می‌مانم و راه‌حل‌های مختلف را بررسی می‌کنم",
          value: "S",
          score: { D: 0, I: 0, S: 3, C: 0 },
        },
        {
          text: "داده‌ها را جمع‌آوری و تحلیل می‌کنم",
          value: "C",
          score: { D: 0, I: 0, S: 0, C: 3 },
        },
      ],
    },
    {
      id: "disc-q-4",
      questionText: "در کار تیمی، من معمولاً:",
      order: 4,
      options: [
        {
          text: "رهبری تیم را بر عهده می‌گیرم",
          value: "D",
          score: { D: 3, I: 0, S: 0, C: 0 },
        },
        {
          text: "انرژی مثبت به تیم تزریق می‌کنم",
          value: "I",
          score: { D: 0, I: 3, S: 0, C: 0 },
        },
        {
          text: "از اعضای تیم حمایت می‌کنم",
          value: "S",
          score: { D: 0, I: 0, S: 3, C: 0 },
        },
        {
          text: "جزئیات و کیفیت کار را بررسی می‌کنم",
          value: "C",
          score: { D: 0, I: 0, S: 0, C: 3 },
        },
      ],
    },
    {
      id: "disc-q-5",
      questionText: "تصمیم‌گیری من بیشتر بر اساس:",
      order: 5,
      options: [
        {
          text: "سرعت و کارایی است",
          value: "D",
          score: { D: 3, I: 0, S: 0, C: 0 },
        },
        {
          text: "احساسات و روابط است",
          value: "I",
          score: { D: 0, I: 3, S: 0, C: 0 },
        },
        {
          text: "ثبات و امنیت است",
          value: "S",
          score: { D: 0, I: 0, S: 3, C: 0 },
        },
        {
          text: "منطق و تحلیل است",
          value: "C",
          score: { D: 0, I: 0, S: 0, C: 3 },
        },
      ],
    },
    {
      id: "disc-q-6",
      questionText: "در برخورد با مشکلات:",
      order: 6,
      options: [
        {
          text: "مستقیم و بی‌پرده صحبت می‌کنم",
          value: "D",
          score: { D: 3, I: 0, S: 0, C: 0 },
        },
        {
          text: "سعی می‌کنم فضا را شاد نگه دارم",
          value: "I",
          score: { D: 0, I: 3, S: 0, C: 0 },
        },
        {
          text: "با صبر و بردباری برخورد می‌کنم",
          value: "S",
          score: { D: 0, I: 0, S: 3, C: 0 },
        },
        {
          text: "به دنبال راه‌حل منطقی هستم",
          value: "C",
          score: { D: 0, I: 0, S: 0, C: 3 },
        },
      ],
    },

    // Section 2: Communication and Work Style - Questions 7-12
    {
      id: "disc-q-7",
      questionText: "در ارتباطات، من ترجیح می‌دهم:",
      order: 7,
      options: [
        {
          text: "مختصر و مفید باشم",
          value: "D",
          score: { D: 3, I: 0, S: 0, C: 0 },
        },
        {
          text: "صمیمی و دوستانه باشم",
          value: "I",
          score: { D: 0, I: 3, S: 0, C: 0 },
        },
        {
          text: "آرام و دلسوزانه باشم",
          value: "S",
          score: { D: 0, I: 0, S: 3, C: 0 },
        },
        {
          text: "دقیق و واضح باشم",
          value: "C",
          score: { D: 0, I: 0, S: 0, C: 3 },
        },
      ],
    },
    {
      id: "disc-q-8",
      questionText: "محیط کاری ایده‌آل من:",
      order: 8,
      options: [
        {
          text: "چالش‌برانگیز و رقابتی است",
          value: "D",
          score: { D: 3, I: 0, S: 0, C: 0 },
        },
        {
          text: "پویا و اجتماعی است",
          value: "I",
          score: { D: 0, I: 3, S: 0, C: 0 },
        },
        {
          text: "باثبات و حمایتی است",
          value: "S",
          score: { D: 0, I: 0, S: 3, C: 0 },
        },
        {
          text: "منظم و ساختاریافته است",
          value: "C",
          score: { D: 0, I: 0, S: 0, C: 3 },
        },
      ],
    },
    {
      id: "disc-q-9",
      questionText: "در مورد تغییرات:",
      order: 9,
      options: [
        {
          text: "آن‌ها را می‌پذیرم اگر به نتیجه برسند",
          value: "D",
          score: { D: 3, I: 0, S: 0, C: 0 },
        },
        {
          text: "به آن‌ها به عنوان فرصت نگاه می‌کنم",
          value: "I",
          score: { D: 0, I: 3, S: 0, C: 0 },
        },
        {
          text: "به زمان نیاز دارم تا با آن‌ها کنار بیایم",
          value: "S",
          score: { D: 0, I: 0, S: 3, C: 0 },
        },
        {
          text: "ابتدا باید آن‌ها را تحلیل کنم",
          value: "C",
          score: { D: 0, I: 0, S: 0, C: 3 },
        },
      ],
    },
    {
      id: "disc-q-10",
      questionText: "من بهترین عملکرد را دارم وقتی که:",
      order: 10,
      options: [
        {
          text: "کنترل و اختیار داشته باشم",
          value: "D",
          score: { D: 3, I: 0, S: 0, C: 0 },
        },
        {
          text: "با دیگران تعامل داشته باشم",
          value: "I",
          score: { D: 0, I: 3, S: 0, C: 0 },
        },
        {
          text: "محیط آرام و قابل پیش‌بینی باشد",
          value: "S",
          score: { D: 0, I: 0, S: 3, C: 0 },
        },
        {
          text: "استانداردهای واضح داشته باشم",
          value: "C",
          score: { D: 0, I: 0, S: 0, C: 3 },
        },
      ],
    },
    {
      id: "disc-q-11",
      questionText: "ترس اصلی من از:",
      order: 11,
      options: [
        {
          text: "از دست دادن کنترل است",
          value: "D",
          score: { D: 3, I: 0, S: 0, C: 0 },
        },
        {
          text: "طرد شدن است",
          value: "I",
          score: { D: 0, I: 3, S: 0, C: 0 },
        },
        {
          text: "تغییرات ناگهانی است",
          value: "S",
          score: { D: 0, I: 0, S: 3, C: 0 },
        },
        {
          text: "اشتباه کردن است",
          value: "C",
          score: { D: 0, I: 0, S: 0, C: 3 },
        },
      ],
    },
    {
      id: "disc-q-12",
      questionText: "انگیزه اصلی من:",
      order: 12,
      options: [
        {
          text: "رسیدن به اهداف و برنده شدن است",
          value: "D",
          score: { D: 3, I: 0, S: 0, C: 0 },
        },
        {
          text: "شناخته شدن و تحسین شدن است",
          value: "I",
          score: { D: 0, I: 3, S: 0, C: 0 },
        },
        {
          text: "کمک به دیگران و ثبات است",
          value: "S",
          score: { D: 0, I: 0, S: 3, C: 0 },
        },
        {
          text: "دقت و کیفیت کار است",
          value: "C",
          score: { D: 0, I: 0, S: 0, C: 3 },
        },
      ],
    },

    // Section 3: Behavioral Patterns - Questions 13-18
    {
      id: "disc-q-13",
      questionText: "تحت فشار، من معمولاً:",
      order: 13,
      options: [
        {
          text: "قاطع‌تر و مستقیم‌تر می‌شوم",
          value: "D",
          score: { D: 3, I: 0, S: 0, C: 0 },
        },
        {
          text: "بی‌نظم‌تر می‌شوم",
          value: "I",
          score: { D: 0, I: 3, S: 0, C: 0 },
        },
        {
          text: "منزوی‌تر می‌شوم",
          value: "S",
          score: { D: 0, I: 0, S: 3, C: 0 },
        },
        {
          text: "بیش از حد تحلیلی می‌شوم",
          value: "C",
          score: { D: 0, I: 0, S: 0, C: 3 },
        },
      ],
    },
    {
      id: "disc-q-14",
      questionText: "در جلسات، من بیشتر:",
      order: 14,
      options: [
        {
          text: "جلسه را هدایت می‌کنم",
          value: "D",
          score: { D: 3, I: 0, S: 0, C: 0 },
        },
        {
          text: "ایده‌های خلاقانه ارائه می‌دهم",
          value: "I",
          score: { D: 0, I: 3, S: 0, C: 0 },
        },
        {
          text: "گوش می‌دهم و حمایت می‌کنم",
          value: "S",
          score: { D: 0, I: 0, S: 3, C: 0 },
        },
        {
          text: "سوالات دقیق می‌پرسم",
          value: "C",
          score: { D: 0, I: 0, S: 0, C: 3 },
        },
      ],
    },
    {
      id: "disc-q-15",
      questionText: "سبک یادگیری من:",
      order: 15,
      options: [
        {
          text: "با انجام دادن یاد می‌گیرم",
          value: "D",
          score: { D: 3, I: 0, S: 0, C: 0 },
        },
        {
          text: "با تعامل با دیگران یاد می‌گیرم",
          value: "I",
          score: { D: 0, I: 3, S: 0, C: 0 },
        },
        {
          text: "با مشاهده و تمرین یاد می‌گیرم",
          value: "S",
          score: { D: 0, I: 0, S: 3, C: 0 },
        },
        {
          text: "با مطالعه و تحقیق یاد می‌گیرم",
          value: "C",
          score: { D: 0, I: 0, S: 0, C: 3 },
        },
      ],
    },
    {
      id: "disc-q-16",
      questionText: "در مورد قوانین و مقررات:",
      order: 16,
      options: [
        {
          text: "اگر منطقی نباشند، آن‌ها را زیر سوال می‌برم",
          value: "D",
          score: { D: 3, I: 0, S: 0, C: 0 },
        },
        {
          text: "سعی می‌کنم انعطاف‌پذیر باشم",
          value: "I",
          score: { D: 0, I: 3, S: 0, C: 0 },
        },
        {
          text: "آن‌ها را به خوبی دنبال می‌کنم",
          value: "S",
          score: { D: 0, I: 0, S: 3, C: 0 },
        },
        {
          text: "دقیقاً طبق آن‌ها عمل می‌کنم",
          value: "C",
          score: { D: 0, I: 0, S: 0, C: 3 },
        },
      ],
    },
    {
      id: "disc-q-17",
      questionText: "نقطه قوت اصلی من:",
      order: 17,
      options: [
        {
          text: "قاطعیت و تصمیم‌گیری سریع",
          value: "D",
          score: { D: 3, I: 0, S: 0, C: 0 },
        },
        {
          text: "خوش‌بینی و الهام‌بخشی",
          value: "I",
          score: { D: 0, I: 3, S: 0, C: 0 },
        },
        {
          text: "صبر و وفاداری",
          value: "S",
          score: { D: 0, I: 0, S: 3, C: 0 },
        },
        {
          text: "دقت و تحلیل",
          value: "C",
          score: { D: 0, I: 0, S: 0, C: 3 },
        },
      ],
    },
    {
      id: "disc-q-18",
      questionText: "در برنامه‌ریزی:",
      order: 18,
      options: [
        {
          text: "روی نتیجه نهایی تمرکز می‌کنم",
          value: "D",
          score: { D: 3, I: 0, S: 0, C: 0 },
        },
        {
          text: "ایده کلی را می‌بینم اما جزئیات را نه",
          value: "I",
          score: { D: 0, I: 3, S: 0, C: 0 },
        },
        {
          text: "گام به گام پیش می‌روم",
          value: "S",
          score: { D: 0, I: 0, S: 3, C: 0 },
        },
        {
          text: "برنامه‌های جامع و دقیق می‌سازم",
          value: "C",
          score: { D: 0, I: 0, S: 0, C: 3 },
        },
      ],
    },

    // Section 4: Interpersonal Skills - Questions 19-24
    {
      id: "disc-q-19",
      questionText: "در حل تعارض:",
      order: 19,
      options: [
        {
          text: "مستقیم و صریح برخورد می‌کنم",
          value: "D",
          score: { D: 3, I: 0, S: 0, C: 0 },
        },
        {
          text: "سعی می‌کنم همه را راضی نگه دارم",
          value: "I",
          score: { D: 0, I: 3, S: 0, C: 0 },
        },
        {
          text: "از تعارض اجتناب می‌کنم",
          value: "S",
          score: { D: 0, I: 0, S: 3, C: 0 },
        },
        {
          text: "منطقی و عینی برخورد می‌کنم",
          value: "C",
          score: { D: 0, I: 0, S: 0, C: 3 },
        },
      ],
    },
    {
      id: "disc-q-20",
      questionText: "ریسک‌پذیری من:",
      order: 20,
      options: [
        {
          text: "ریسک‌های محاسبه‌شده می‌پذیرم",
          value: "D",
          score: { D: 3, I: 0, S: 0, C: 0 },
        },
        {
          text: "از ریسک‌های هیجان‌انگیز لذت می‌برم",
          value: "I",
          score: { D: 0, I: 3, S: 0, C: 0 },
        },
        {
          text: "از ریسک اجتناب می‌کنم",
          value: "S",
          score: { D: 0, I: 0, S: 3, C: 0 },
        },
        {
          text: "فقط بعد از تحلیل کامل ریسک می‌پذیرم",
          value: "C",
          score: { D: 0, I: 0, S: 0, C: 3 },
        },
      ],
    },
    {
      id: "disc-q-21",
      questionText: "در ارائه کار:",
      order: 21,
      options: [
        {
          text: "روی نتایج تمرکز می‌کنم",
          value: "D",
          score: { D: 3, I: 0, S: 0, C: 0 },
        },
        {
          text: "جذاب و الهام‌بخش ارائه می‌دهم",
          value: "I",
          score: { D: 0, I: 3, S: 0, C: 0 },
        },
        {
          text: "با آرامش و اطمینان ارائه می‌دهم",
          value: "S",
          score: { D: 0, I: 0, S: 3, C: 0 },
        },
        {
          text: "با داده و مدرک ارائه می‌دهم",
          value: "C",
          score: { D: 0, I: 0, S: 0, C: 3 },
        },
      ],
    },
    {
      id: "disc-q-22",
      questionText: "وقت آزاد خود را:",
      order: 22,
      options: [
        {
          text: "به فعالیت‌های چالش‌برانگیز اختصاص می‌دهم",
          value: "D",
          score: { D: 3, I: 0, S: 0, C: 0 },
        },
        {
          text: "با دوستان و خانواده می‌گذرانم",
          value: "I",
          score: { D: 0, I: 3, S: 0, C: 0 },
        },
        {
          text: "به استراحت و آرامش اختصاص می‌دهم",
          value: "S",
          score: { D: 0, I: 0, S: 3, C: 0 },
        },
        {
          text: "به سرگرمی‌های تحلیلی می‌پردازم",
          value: "C",
          score: { D: 0, I: 0, S: 0, C: 3 },
        },
      ],
    },
    {
      id: "disc-q-23",
      questionText: "در مدیریت زمان:",
      order: 23,
      options: [
        {
          text: "روی اولویت‌های مهم تمرکز می‌کنم",
          value: "D",
          score: { D: 3, I: 0, S: 0, C: 0 },
        },
        {
          text: "انعطاف‌پذیر هستم و به موقعیت‌ها واکنش نشان می‌دهم",
          value: "I",
          score: { D: 0, I: 3, S: 0, C: 0 },
        },
        {
          text: "به روتین‌های خود پایبند هستم",
          value: "S",
          score: { D: 0, I: 0, S: 3, C: 0 },
        },
        {
          text: "برنامه‌ریزی دقیق دارم",
          value: "C",
          score: { D: 0, I: 0, S: 0, C: 3 },
        },
      ],
    },
    {
      id: "disc-q-24",
      questionText: "من موفق هستم چون:",
      order: 24,
      options: [
        {
          text: "برای رسیدن به هدف هر کاری می‌کنم",
          value: "D",
          score: { D: 3, I: 0, S: 0, C: 0 },
        },
        {
          text: "دیگران را الهام‌بخش می‌کنم",
          value: "I",
          score: { D: 0, I: 3, S: 0, C: 0 },
        },
        {
          text: "پشتکار و وفاداری دارم",
          value: "S",
          score: { D: 0, I: 0, S: 3, C: 0 },
        },
        {
          text: "دقیق و باکیفیت کار می‌کنم",
          value: "C",
          score: { D: 0, I: 0, S: 0, C: 3 },
        },
      ],
    },
  ];

  // حذف سوالات قبلی
  await prisma.assessment_questions.deleteMany({
    where: { assessmentId: discAssessment.id },
  });

  // Create all questions
  const questionsData = questions.map((q) => ({
    id: q.id,
    assessmentId: discAssessment.id,
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

  console.log(`✅ Created ${questions.length} DISC questions`);
  console.log("DISC assessment seed completed successfully!");
}

// Export for use in main seed.ts
export { seedDISC };

// Run directly if called standalone
if (require.main === module) {
  seedDISC()
    .catch((e) => {
      console.error("Error seeding DISC assessment:", e);
      process.exit(1);
    })
    .finally(async () => {
      await defaultPrisma.$disconnect();
    });
}
