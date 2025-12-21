import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

// POST - Import تمام کلمات کلیدی از seed data
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // دریافت لیست بخش‌ها
    const departments = await prisma.departments.findMany();
    const itDepartment = departments.find((d) =>
      d.name.toLowerCase().includes("it") ||
      d.name.includes("فناوری") ||
      d.name.includes("اطلاعات")
    );
    const kitchenDepartment = departments.find((d) =>
      d.name.includes("آشپزخانه") ||
      d.name.includes("نظافت") ||
      d.name.includes("خدمات")
    );

    const results = {
      general: { created: 0, skipped: 0 },
      it: { created: 0, skipped: 0 },
      kitchen: { created: 0, skipped: 0 },
    };

    // کلمات کلیدی عمومی
    const generalKeywords = {
      sensitive: [
        { keyword: "شکایت", description: "فیدبک‌های حاوی شکایت" },
        { keyword: "مشکل", description: "فیدبک‌های دارای مشکل" },
        { keyword: "اعتراض", description: "فیدبک‌های اعتراضی" },
        { keyword: "ناراحتی", description: "ابراز ناراحتی" },
        { keyword: "خطر", description: "موارد خطرناک" },
        { keyword: "فوری", description: "موارد فوری" },
      ],
      positive: [
        { keyword: "عالی", description: "بازخورد عالی" },
        { keyword: "خوب", description: "بازخورد خوب" },
        { keyword: "ممنون", description: "تشکر و قدردانی" },
        { keyword: "راضی", description: "رضایت" },
        { keyword: "مفید", description: "مفید بودن" },
        { keyword: "کامل", description: "کامل بودن" },
      ],
      negative: [
        { keyword: "ضعیف", description: "عملکرد ضعیف" },
        { keyword: "بد", description: "بازخورد منفی" },
        { keyword: "نامناسب", description: "نامناسب بودن" },
        { keyword: "کم", description: "کمبود" },
        { keyword: "کند", description: "کندی و تاخیر" },
        { keyword: "نارضایتی", description: "عدم رضایت" },
      ],
      topic: [
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
      ],
    };

    // کلمات کلیدی IT
    const itKeywords = {
      sensitive: [
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
      ],
      negative: [
        { keyword: "اینترنت", description: "مشکلات اینترنت" },
        { keyword: "شبکه", description: "مشکلات شبکه" },
        { keyword: "سرعت", description: "کندی سرعت" },
        { keyword: "وصل نمیشه", description: "مشکل اتصال" },
        { keyword: "کار نمیکنه", description: "عدم کارکرد" },
        { keyword: "باگ", description: "باگ نرم‌افزاری" },
        { keyword: "ارور", description: "خطای سیستمی" },
        { keyword: "پسورد", description: "مشکلات رمز عبور" },
      ],
      topic: [
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
      ],
      positive: [
        { keyword: "سریع", description: "سرعت خوب" },
        { keyword: "پایدار", description: "پایداری سیستم" },
        { keyword: "امن", description: "امنیت بالا" },
        { keyword: "راحت", description: "سهولت استفاده" },
      ],
    };

    // کلمات کلیدی آشپزخانه
    const kitchenKeywords = {
      sensitive: [
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
      ],
      negative: [
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
      ],
      topic: [
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
      ],
      positive: [
        { keyword: "تمیز", description: "تمیزی عالی" },
        { keyword: "خوشمزه", description: "غذای خوشمزه" },
        { keyword: "تازه", description: "تازگی مواد" },
        { keyword: "گرم", description: "گرمی مناسب غذا" },
        { keyword: "بهداشتی", description: "بهداشت عالی" },
        { keyword: "مرتب", description: "مرتب و منظم" },
        { keyword: "خوشبو", description: "بوی خوش" },
        { keyword: "باکیفیت", description: "کیفیت بالا" },
        { keyword: "سریع", description: "سرعت مناسب سرویس‌دهی" },
      ],
    };

    // تابع helper برای ایجاد کلمات کلیدی
    const createKeywords = async (
      keywords: { keyword: string; description: string }[],
      type: "SENSITIVE" | "POSITIVE" | "NEGATIVE" | "TOPIC",
      priority: "LOW" | "MEDIUM" | "HIGH",
      departmentId: string | null,
      category: "general" | "it" | "kitchen"
    ) => {
      for (const kw of keywords) {
        try {
          await prisma.analytics_keywords.create({
            data: {
              id: `${category}-${type.toLowerCase()}-${kw.keyword.toLowerCase().replace(/\s+/g, '-')}`,
              keyword: kw.keyword,
              type,
              priority,
              description: kw.description,
              isActive: true,
              departmentId,
              updatedAt: new Date(),
            },
          });
          results[category].created++;
        } catch (error: any) {
          if (error.code === "P2002") {
            // کلمه از قبل وجود دارد
            results[category].skipped++;
          } else {
            console.error(`Error creating keyword ${kw.keyword}:`, error);
          }
        }
      }
    };

    // ایجاد کلمات کلیدی عمومی
    await createKeywords(generalKeywords.sensitive, "SENSITIVE", "HIGH", null, "general");
    await createKeywords(generalKeywords.positive, "POSITIVE", "MEDIUM", null, "general");
    await createKeywords(generalKeywords.negative, "NEGATIVE", "HIGH", null, "general");
    await createKeywords(generalKeywords.topic, "TOPIC", "MEDIUM", null, "general");

    // ایجاد کلمات کلیدی IT
    if (itDepartment) {
      await createKeywords(itKeywords.sensitive, "SENSITIVE", "HIGH", itDepartment.id, "it");
      await createKeywords(itKeywords.negative, "NEGATIVE", "HIGH", itDepartment.id, "it");
      await createKeywords(itKeywords.topic, "TOPIC", "MEDIUM", itDepartment.id, "it");
      await createKeywords(itKeywords.positive, "POSITIVE", "MEDIUM", itDepartment.id, "it");
    }

    // ایجاد کلمات کلیدی آشپزخانه
    if (kitchenDepartment) {
      await createKeywords(kitchenKeywords.sensitive, "SENSITIVE", "HIGH", kitchenDepartment.id, "kitchen");
      await createKeywords(kitchenKeywords.negative, "NEGATIVE", "HIGH", kitchenDepartment.id, "kitchen");
      await createKeywords(kitchenKeywords.topic, "TOPIC", "MEDIUM", kitchenDepartment.id, "kitchen");
      await createKeywords(kitchenKeywords.positive, "POSITIVE", "MEDIUM", kitchenDepartment.id, "kitchen");
    }

    const totalCreated =
      results.general.created + results.it.created + results.kitchen.created;
    const totalSkipped =
      results.general.skipped + results.it.skipped + results.kitchen.skipped;

    return NextResponse.json({
      success: true,
      message: `کلمات کلیدی با موفقیت import شدند`,
      results: {
        general: results.general,
        it: results.it,
        kitchen: results.kitchen,
        total: {
          created: totalCreated,
          skipped: totalSkipped,
        },
      },
    });
  } catch (error: any) {
    console.error("Error seeding keywords:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}

