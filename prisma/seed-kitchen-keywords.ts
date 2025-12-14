import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedKitchenKeywords() {
  console.log("🌱 Seeding Kitchen/Cleaning department keywords...");

  // ابتدا بخش آشپزخانه را پیدا می‌کنیم (یا ایجاد می‌کنیم)
  let kitchenDepartment = await prisma.department.findFirst({
    where: {
      OR: [
        { name: { contains: "آشپزخانه", mode: "insensitive" } },
        { name: { contains: "نظافت", mode: "insensitive" } },
        { name: { contains: "خدمات", mode: "insensitive" } },
      ],
    },
  });

  // اگر بخش آشپزخانه وجود نداشت، null می‌گذاریم (کلمات عمومی)
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

  console.log(`\n✅ Successfully added ${createdCount} Kitchen/Cleaning keywords!`);
  console.log(`📊 Total keywords attempted: ${
    sensitiveKeywords.length +
    negativeKeywords.length +
    topicKeywords.length +
    positiveKeywords.length
  }`);
}

seedKitchenKeywords()
  .catch((e) => {
    console.error("❌ Error seeding Kitchen keywords:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
