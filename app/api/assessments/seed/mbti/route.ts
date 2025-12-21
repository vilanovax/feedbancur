import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/assessments/seed/mbti - ایجاد آزمون MBTI استاندارد
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if MBTI assessment already exists
    const existingMBTI = await prisma.assessments.findFirst({
      where: {
        type: "MBTI",
        title: "آزمون شخصیت‌سنجی MBTI",
      },
    });

    if (existingMBTI) {
      return NextResponse.json(
        { error: "MBTI assessment already exists", assessment: existingMBTI },
        { status: 400 }
      );
    }

    // Create MBTI assessment with questions
    const assessment = await prisma.assessments.create({
      data: {
        title: "آزمون شخصیت‌سنجی MBTI",
        description:
          "آزمون شخصیت‌سنجی مایرز-بریگز (MBTI) یکی از معتبرترین ابزارهای شناخت تیپ شخصیتی است که بر اساس نظریه کارل یونگ طراحی شده و افراد را در 16 تیپ شخصیتی دسته‌بندی می‌کند.",
        type: "MBTI",
        instructions:
          "این آزمون شامل 60 سوال است. لطفاً هر سوال را با دقت بخوانید و گزینه‌ای را انتخاب کنید که بیشتر با شخصیت واقعی شما مطابقت دارد، نه آنچه فکر می‌کنید باید باشد. پاسخ‌های صادقانه به نتایج دقیق‌تری منجر می‌شود.",
        isActive: true,
        allowRetake: true,
        timeLimit: null,
        passingScore: null,
        showResults: true,
        createdById: session.user.id,
        questions: {
          create: [
            // E/I Questions (Extraversion vs Introversion) - 15 questions
            {
              questionText: "در میهمانی‌ها و گردهمایی‌های اجتماعی:",
              questionType: "MULTIPLE_CHOICE",
              order: 1,
              isRequired: true,
              options: [
                {
                  text: "با افراد زیادی صحبت می‌کنم و انرژی می‌گیرم",
                  value: "A",
                  score: { E: 2, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
                {
                  text: "با چند نفر خاص گفتگوهای عمیق دارم",
                  value: "B",
                  score: { E: 0, I: 2, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "برای شارژ مجدد انرژی خود ترجیح می‌دهم:",
              questionType: "MULTIPLE_CHOICE",
              order: 2,
              isRequired: true,
              options: [
                {
                  text: "وقت خود را با دوستان و خانواده بگذرانم",
                  value: "A",
                  score: { E: 2, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
                {
                  text: "زمانی تنها برای خودم داشته باشم",
                  value: "B",
                  score: { E: 0, I: 2, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "در محیط‌های کاری:",
              questionType: "MULTIPLE_CHOICE",
              order: 3,
              isRequired: true,
              options: [
                {
                  text: "دوست دارم در یک محیط پرجنب‌وجوش با تعاملات زیاد کار کنم",
                  value: "A",
                  score: { E: 2, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
                {
                  text: "محیط آرام و کم‌تعامل را ترجیح می‌دهم",
                  value: "B",
                  score: { E: 0, I: 2, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "وقتی با افراد جدید آشنا می‌شوم:",
              questionType: "MULTIPLE_CHOICE",
              order: 4,
              isRequired: true,
              options: [
                {
                  text: "راحت شروع به صحبت می‌کنم و خودم را معرفی می‌کنم",
                  value: "A",
                  score: { E: 2, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
                {
                  text: "منتظر می‌مانم تا دیگران شروع کنند یا زمان بیشتری نیاز دارم",
                  value: "B",
                  score: { E: 0, I: 2, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "در تعطیلات آخر هفته ترجیح می‌دهم:",
              questionType: "MULTIPLE_CHOICE",
              order: 5,
              isRequired: true,
              options: [
                {
                  text: "با دوستان بیرون بروم یا برنامه‌های اجتماعی داشته باشم",
                  value: "A",
                  score: { E: 2, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
                {
                  text: "در خانه بمانم و به فعالیت‌های شخصی بپردازم",
                  value: "B",
                  score: { E: 0, I: 2, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
              ],
            },

            // S/N Questions (Sensing vs Intuition) - 15 questions
            {
              questionText: "هنگام یادگیری چیزهای جدید:",
              questionType: "MULTIPLE_CHOICE",
              order: 6,
              isRequired: true,
              options: [
                {
                  text: "روی جزئیات و مثال‌های عملی تمرکز می‌کنم",
                  value: "A",
                  score: { E: 0, I: 0, S: 2, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
                {
                  text: "به تصویر کلی و امکانات آینده فکر می‌کنم",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 2, T: 0, F: 0, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "در حل مسائل:",
              questionType: "MULTIPLE_CHOICE",
              order: 7,
              isRequired: true,
              options: [
                {
                  text: "از تجربیات گذشته و روش‌های آزمایش شده استفاده می‌کنم",
                  value: "A",
                  score: { E: 0, I: 0, S: 2, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
                {
                  text: "دوست دارم راه‌حل‌های خلاقانه و نوآورانه پیدا کنم",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 2, T: 0, F: 0, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "وقتی یک کتاب می‌خوانم یا فیلم می‌بینم:",
              questionType: "MULTIPLE_CHOICE",
              order: 8,
              isRequired: true,
              options: [
                {
                  text: "به جزئیات داستان و اتفاقات واقعی توجه می‌کنم",
                  value: "A",
                  score: { E: 0, I: 0, S: 2, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
                {
                  text: "به معانی پنهان و پیام‌های زیربنایی فکر می‌کنم",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 2, T: 0, F: 0, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "در مورد آینده:",
              questionType: "MULTIPLE_CHOICE",
              order: 9,
              isRequired: true,
              options: [
                {
                  text: "روی برنامه‌های مشخص و قابل اجرا فکر می‌کنم",
                  value: "A",
                  score: { E: 0, I: 0, S: 2, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
                {
                  text: "به احتمالات و سناریوهای مختلف فکر می‌کنم",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 2, T: 0, F: 0, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "وقتی کسی چیزی را توضیح می‌دهد:",
              questionType: "MULTIPLE_CHOICE",
              order: 10,
              isRequired: true,
              options: [
                {
                  text: "دوست دارم مثال‌های واقعی و عملی بشنوم",
                  value: "A",
                  score: { E: 0, I: 0, S: 2, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
                {
                  text: "به مفاهیم کلی و ایده‌های انتزاعی علاقه دارم",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 2, T: 0, F: 0, J: 0, P: 0 },
                },
              ],
            },

            // T/F Questions (Thinking vs Feeling) - 15 questions
            {
              questionText: "در تصمیم‌گیری‌های مهم:",
              questionType: "MULTIPLE_CHOICE",
              order: 11,
              isRequired: true,
              options: [
                {
                  text: "بر اساس منطق و تحلیل عینی تصمیم می‌گیرم",
                  value: "A",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 2, F: 0, J: 0, P: 0 },
                },
                {
                  text: "احساسات و تأثیر آن بر دیگران را در نظر می‌گیرم",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 2, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "وقتی کسی مشکلی دارد:",
              questionType: "MULTIPLE_CHOICE",
              order: 12,
              isRequired: true,
              options: [
                {
                  text: "سعی می‌کنم راه‌حل منطقی ارائه دهم",
                  value: "A",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 2, F: 0, J: 0, P: 0 },
                },
                {
                  text: "ابتدا به احساساتش توجه می‌کنم و همدلی نشان می‌دهم",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 2, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "در بحث و گفتگو:",
              questionType: "MULTIPLE_CHOICE",
              order: 13,
              isRequired: true,
              options: [
                {
                  text: "اهمیت بیشتری به صحت و دقت منطقی می‌دهم",
                  value: "A",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 2, F: 0, J: 0, P: 0 },
                },
                {
                  text: "مهم است که حس خوبی بین طرفین وجود داشته باشد",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 2, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "وقتی باید انتقاد کنم:",
              questionType: "MULTIPLE_CHOICE",
              order: 14,
              isRequired: true,
              options: [
                {
                  text: "مستقیم و بی‌پرده نظرم را می‌گویم",
                  value: "A",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 2, F: 0, J: 0, P: 0 },
                },
                {
                  text: "سعی می‌کنم با ملایمت و در نظر گرفتن احساسات طرف مقابل صحبت کنم",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 2, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "ارزش بیشتری برای من دارد که:",
              questionType: "MULTIPLE_CHOICE",
              order: 15,
              isRequired: true,
              options: [
                {
                  text: "عادلانه و منصفانه باشم",
                  value: "A",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 2, F: 0, J: 0, P: 0 },
                },
                {
                  text: "مهربان و دلسوز باشم",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 2, J: 0, P: 0 },
                },
              ],
            },

            // J/P Questions (Judging vs Perceiving) - 15 questions
            {
              questionText: "در برنامه‌ریزی روزانه:",
              questionType: "MULTIPLE_CHOICE",
              order: 16,
              isRequired: true,
              options: [
                {
                  text: "دوست دارم برنامه مشخص و منظمی داشته باشم",
                  value: "A",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 2, P: 0 },
                },
                {
                  text: "ترجیح می‌دهم انعطاف‌پذیر باشم و به موقعیت واکنش نشان دهم",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 2 },
                },
              ],
            },
            {
              questionText: "در انجام پروژه‌ها:",
              questionType: "MULTIPLE_CHOICE",
              order: 17,
              isRequired: true,
              options: [
                {
                  text: "زودتر شروع می‌کنم تا با آرامش انجامش دهم",
                  value: "A",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 2, P: 0 },
                },
                {
                  text: "معمولاً نزدیک ضرب‌الاجل فشار می‌آورم",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 2 },
                },
              ],
            },
            {
              questionText: "فضای کاری من:",
              questionType: "MULTIPLE_CHOICE",
              order: 18,
              isRequired: true,
              options: [
                {
                  text: "معمولاً منظم و مرتب است",
                  value: "A",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 2, P: 0 },
                },
                {
                  text: "خلاقانه به هم ریخته است، اما من می‌دانم چی کجاست",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 2 },
                },
              ],
            },
            {
              questionText: "وقتی برنامه‌ام تغییر می‌کند:",
              questionType: "MULTIPLE_CHOICE",
              order: 19,
              isRequired: true,
              options: [
                {
                  text: "ناراحت می‌شوم، دوست دارم همه چیز طبق برنامه پیش برود",
                  value: "A",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 2, P: 0 },
                },
                {
                  text: "راحت با تغییرات سازگار می‌شوم",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 2 },
                },
              ],
            },
            {
              questionText: "در مورد تصمیم‌گیری:",
              questionType: "MULTIPLE_CHOICE",
              order: 20,
              isRequired: true,
              options: [
                {
                  text: "دوست دارم سریع تصمیم بگیرم و به آن پایبند بمانم",
                  value: "A",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 2, P: 0 },
                },
                {
                  text: "ترجیح می‌دهم گزینه‌هایم را باز نگه دارم",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 2 },
                },
              ],
            },

            // Additional mixed questions for balance - 40 more questions
            {
              questionText: "در جمع‌های بزرگ:",
              questionType: "MULTIPLE_CHOICE",
              order: 21,
              isRequired: true,
              options: [
                {
                  text: "احساس سرزندگی و انرژی می‌کنم",
                  value: "A",
                  score: { E: 2, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
                {
                  text: "بعد از مدتی خسته می‌شوم",
                  value: "B",
                  score: { E: 0, I: 2, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "روش کار من:",
              questionType: "MULTIPLE_CHOICE",
              order: 22,
              isRequired: true,
              options: [
                {
                  text: "گام به گام و با توجه به جزئیات",
                  value: "A",
                  score: { E: 0, I: 0, S: 2, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
                {
                  text: "کلی‌نگر و با توجه به تصویر بزرگ",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 2, T: 0, F: 0, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "هنگام گرفتن تصمیم:",
              questionType: "MULTIPLE_CHOICE",
              order: 23,
              isRequired: true,
              options: [
                {
                  text: "تحلیل منطقی مهم‌تر است",
                  value: "A",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 2, F: 0, J: 0, P: 0 },
                },
                {
                  text: "ارزش‌ها و احساسات مهم‌تر هستند",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 2, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "سبک زندگی من:",
              questionType: "MULTIPLE_CHOICE",
              order: 24,
              isRequired: true,
              options: [
                {
                  text: "منظم و برنامه‌ریزی شده",
                  value: "A",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 2, P: 0 },
                },
                {
                  text: "خودانگیخته و انعطاف‌پذیر",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 2 },
                },
              ],
            },
            {
              questionText: "ترجیح می‌دهم:",
              questionType: "MULTIPLE_CHOICE",
              order: 25,
              isRequired: true,
              options: [
                {
                  text: "در میان جمع باشم و با افراد مختلف ارتباط داشته باشم",
                  value: "A",
                  score: { E: 2, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
                {
                  text: "وقت بیشتری را به تنهایی یا با دوستان نزدیک بگذرانم",
                  value: "B",
                  score: { E: 0, I: 2, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "در کار با اطلاعات:",
              questionType: "MULTIPLE_CHOICE",
              order: 26,
              isRequired: true,
              options: [
                {
                  text: "روی حقایق و داده‌های قابل مشاهده تمرکز می‌کنم",
                  value: "A",
                  score: { E: 0, I: 0, S: 2, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
                {
                  text: "به الگوها و معانی پنهان فکر می‌کنم",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 2, T: 0, F: 0, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "در مواجهه با مشکل:",
              questionType: "MULTIPLE_CHOICE",
              order: 27,
              isRequired: true,
              options: [
                {
                  text: "به صورت عینی و بدون احساسات تحلیل می‌کنم",
                  value: "A",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 2, F: 0, J: 0, P: 0 },
                },
                {
                  text: "تأثیر آن بر افراد را در نظر می‌گیرم",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 2, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "زمانبندی کارها:",
              questionType: "MULTIPLE_CHOICE",
              order: 28,
              isRequired: true,
              options: [
                {
                  text: "دوست دارم زودتر تمام شوند",
                  value: "A",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 2, P: 0 },
                },
                {
                  text: "تحت فشار بهتر کار می‌کنم",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 2 },
                },
              ],
            },
            {
              questionText: "بعد از یک روز پرمشغله:",
              questionType: "MULTIPLE_CHOICE",
              order: 29,
              isRequired: true,
              options: [
                {
                  text: "دوست دارم با دوستانم وقت بگذرانم",
                  value: "A",
                  score: { E: 2, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
                {
                  text: "نیاز به زمان شخصی برای استراحت دارم",
                  value: "B",
                  score: { E: 0, I: 2, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "به موارد زیر اهمیت بیشتری می‌دهم:",
              questionType: "MULTIPLE_CHOICE",
              order: 30,
              isRequired: true,
              options: [
                {
                  text: "واقعیت‌های ملموس و عملی",
                  value: "A",
                  score: { E: 0, I: 0, S: 2, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
                {
                  text: "ایده‌ها و احتمالات آینده",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 2, T: 0, F: 0, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "ارزش بیشتری قائلم برای:",
              questionType: "MULTIPLE_CHOICE",
              order: 31,
              isRequired: true,
              options: [
                {
                  text: "عدالت و بی‌طرفی",
                  value: "A",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 2, F: 0, J: 0, P: 0 },
                },
                {
                  text: "هماهنگی و همدلی",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 2, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "در سازماندهی کارها:",
              questionType: "MULTIPLE_CHOICE",
              order: 32,
              isRequired: true,
              options: [
                {
                  text: "همه چیز را از قبل برنامه‌ریزی می‌کنم",
                  value: "A",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 2, P: 0 },
                },
                {
                  text: "به صورت بداهه عمل می‌کنم",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 2 },
                },
              ],
            },
            {
              questionText: "در گفتگوها:",
              questionType: "MULTIPLE_CHOICE",
              order: 33,
              isRequired: true,
              options: [
                {
                  text: "بیشتر صحبت می‌کنم",
                  value: "A",
                  score: { E: 2, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
                {
                  text: "بیشتر گوش می‌دهم",
                  value: "B",
                  score: { E: 0, I: 2, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "وقتی راهنمایی دریافت می‌کنم:",
              questionType: "MULTIPLE_CHOICE",
              order: 34,
              isRequired: true,
              options: [
                {
                  text: "دستورالعمل‌های دقیق و گام‌به‌گام می‌خواهم",
                  value: "A",
                  score: { E: 0, I: 0, S: 2, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
                {
                  text: "یک توضیح کلی کافی است",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 2, T: 0, F: 0, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "در ارزیابی موقعیت‌ها:",
              questionType: "MULTIPLE_CHOICE",
              order: 35,
              isRequired: true,
              options: [
                {
                  text: "به تحلیل منطقی اتکا می‌کنم",
                  value: "A",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 2, F: 0, J: 0, P: 0 },
                },
                {
                  text: "به احساس درونی و شهودم اعتماد دارم",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 2, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "با ضرب‌الاجل‌ها:",
              questionType: "MULTIPLE_CHOICE",
              order: 36,
              isRequired: true,
              options: [
                {
                  text: "خیلی قبل از موعد آماده می‌شوم",
                  value: "A",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 2, P: 0 },
                },
                {
                  text: "معمولاً در لحظه آخر انجام می‌دهم",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 2 },
                },
              ],
            },
            {
              questionText: "دوست دارم:",
              questionType: "MULTIPLE_CHOICE",
              order: 37,
              isRequired: true,
              options: [
                {
                  text: "در مرکز توجه باشم",
                  value: "A",
                  score: { E: 2, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
                {
                  text: "در پس‌زمینه بمانم",
                  value: "B",
                  score: { E: 0, I: 2, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "در یادگیری مهارت جدید:",
              questionType: "MULTIPLE_CHOICE",
              order: 38,
              isRequired: true,
              options: [
                {
                  text: "روش‌های استاندارد و آزموده شده را دنبال می‌کنم",
                  value: "A",
                  score: { E: 0, I: 0, S: 2, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
                {
                  text: "دوست دارم روش خودم را ابداع کنم",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 2, T: 0, F: 0, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "بیشتر به این فکر می‌کنم:",
              questionType: "MULTIPLE_CHOICE",
              order: 39,
              isRequired: true,
              options: [
                {
                  text: "آیا درست است؟",
                  value: "A",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 2, F: 0, J: 0, P: 0 },
                },
                {
                  text: "آیا به دیگران کمک می‌کند؟",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 2, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "در محیط کاری ترجیح می‌دهم:",
              questionType: "MULTIPLE_CHOICE",
              order: 40,
              isRequired: true,
              options: [
                {
                  text: "ساختار و قوانین مشخص داشته باشم",
                  value: "A",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 2, P: 0 },
                },
                {
                  text: "آزادی عمل و انعطاف داشته باشم",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 2 },
                },
              ],
            },
            {
              questionText: "گروه‌های کوچک یا بزرگ؟",
              questionType: "MULTIPLE_CHOICE",
              order: 41,
              isRequired: true,
              options: [
                {
                  text: "دوست دارم در گروه‌های بزرگ باشم",
                  value: "A",
                  score: { E: 2, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
                {
                  text: "گروه‌های کوچک یا تک‌نفره را ترجیح می‌دهم",
                  value: "B",
                  score: { E: 0, I: 2, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "به چه چیزی اهمیت می‌دهم:",
              questionType: "MULTIPLE_CHOICE",
              order: 42,
              isRequired: true,
              options: [
                {
                  text: "چیزهایی که الان وجود دارند",
                  value: "A",
                  score: { E: 0, I: 0, S: 2, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
                {
                  text: "چیزهایی که ممکن است در آینده باشند",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 2, T: 0, F: 0, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "چه چیزی بیشتر مرا آزار می‌دهد:",
              questionType: "MULTIPLE_CHOICE",
              order: 43,
              isRequired: true,
              options: [
                {
                  text: "افرادی که خیلی احساساتی هستند",
                  value: "A",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 2, F: 0, J: 0, P: 0 },
                },
                {
                  text: "افرادی که خیلی سرد و بی‌احساس هستند",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 2, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "در مسافرت:",
              questionType: "MULTIPLE_CHOICE",
              order: 44,
              isRequired: true,
              options: [
                {
                  text: "همه چیز را از قبل رزرو و برنامه‌ریزی می‌کنم",
                  value: "A",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 2, P: 0 },
                },
                {
                  text: "بداهه می‌روم و جاهای جدید را کشف می‌کنم",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 2 },
                },
              ],
            },
            {
              questionText: "در شروع مکالمه:",
              questionType: "MULTIPLE_CHOICE",
              order: 45,
              isRequired: true,
              options: [
                {
                  text: "راحت با افراد ناآشنا صحبت می‌کنم",
                  value: "A",
                  score: { E: 2, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
                {
                  text: "منتظر می‌مانم تا دیگران شروع کنند",
                  value: "B",
                  score: { E: 0, I: 2, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "اعتماد بیشتری دارم به:",
              questionType: "MULTIPLE_CHOICE",
              order: 46,
              isRequired: true,
              options: [
                {
                  text: "تجربه و واقعیت",
                  value: "A",
                  score: { E: 0, I: 0, S: 2, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
                {
                  text: "شهود و الهام",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 2, T: 0, F: 0, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "فکر می‌کنم بیشتر:",
              questionType: "MULTIPLE_CHOICE",
              order: 47,
              isRequired: true,
              options: [
                {
                  text: "با سر (منطق)",
                  value: "A",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 2, F: 0, J: 0, P: 0 },
                },
                {
                  text: "با دل (احساس)",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 2, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "دوست دارم زندگی‌ام:",
              questionType: "MULTIPLE_CHOICE",
              order: 48,
              isRequired: true,
              options: [
                {
                  text: "منظم و قابل پیش‌بینی باشد",
                  value: "A",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 2, P: 0 },
                },
                {
                  text: "خودانگیخته و پر از غافلگیری باشد",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 2 },
                },
              ],
            },
            {
              questionText: "بعد از تعامل اجتماعی طولانی:",
              questionType: "MULTIPLE_CHOICE",
              order: 49,
              isRequired: true,
              options: [
                {
                  text: "انرژی گرفته‌ام و می‌خواهم بیشتر ادامه دهم",
                  value: "A",
                  score: { E: 2, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
                {
                  text: "خسته شده‌ام و نیاز به استراحت دارم",
                  value: "B",
                  score: { E: 0, I: 2, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "در توضیح دادن:",
              questionType: "MULTIPLE_CHOICE",
              order: 50,
              isRequired: true,
              options: [
                {
                  text: "جزئیات و مثال‌های واقعی می‌آورم",
                  value: "A",
                  score: { E: 0, I: 0, S: 2, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
                {
                  text: "مفاهیم کلی و استعاره‌ها استفاده می‌کنم",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 2, T: 0, F: 0, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "بیشتر اهمیت می‌دهم به:",
              questionType: "MULTIPLE_CHOICE",
              order: 51,
              isRequired: true,
              options: [
                {
                  text: "درست بودن",
                  value: "A",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 2, F: 0, J: 0, P: 0 },
                },
                {
                  text: "صلح و هماهنگی",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 2, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "معمولاً:",
              questionType: "MULTIPLE_CHOICE",
              order: 52,
              isRequired: true,
              options: [
                {
                  text: "قبل از عمل فکر می‌کنم و برنامه‌ریزی می‌کنم",
                  value: "A",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 2, P: 0 },
                },
                {
                  text: "عمل می‌کنم و بعد فکر می‌کنم",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 2 },
                },
              ],
            },
            {
              questionText: "دوستان زیاد یا دوستان نزدیک؟",
              questionType: "MULTIPLE_CHOICE",
              order: 53,
              isRequired: true,
              options: [
                {
                  text: "دوستان زیادی دارم",
                  value: "A",
                  score: { E: 2, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
                {
                  text: "تعداد کمی دوست نزدیک دارم",
                  value: "B",
                  score: { E: 0, I: 2, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "در پروژه‌های جدید:",
              questionType: "MULTIPLE_CHOICE",
              order: 54,
              isRequired: true,
              options: [
                {
                  text: "از تجربیات قبلی استفاده می‌کنم",
                  value: "A",
                  score: { E: 0, I: 0, S: 2, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
                {
                  text: "دنبال روش‌های نوآورانه می‌گردم",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 2, T: 0, F: 0, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "وقتی می‌بینم کسی ناراحت است:",
              questionType: "MULTIPLE_CHOICE",
              order: 55,
              isRequired: true,
              options: [
                {
                  text: "سعی می‌کنم راه‌حل منطقی پیدا کنم",
                  value: "A",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 2, F: 0, J: 0, P: 0 },
                },
                {
                  text: "ابتدا به احساساتش توجه می‌کنم",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 2, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "چیزی که بیشتر دوست دارم:",
              questionType: "MULTIPLE_CHOICE",
              order: 56,
              isRequired: true,
              options: [
                {
                  text: "به پایان رساندن کارها",
                  value: "A",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 2, P: 0 },
                },
                {
                  text: "شروع کارهای جدید",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 2 },
                },
              ],
            },
            {
              questionText: "ارتباط‌های اجتماعی:",
              questionType: "MULTIPLE_CHOICE",
              order: 57,
              isRequired: true,
              options: [
                {
                  text: "به من انرژی می‌دهند",
                  value: "A",
                  score: { E: 2, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
                {
                  text: "انرژی‌ام را می‌گیرند",
                  value: "B",
                  score: { E: 0, I: 2, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "اولویت من:",
              questionType: "MULTIPLE_CHOICE",
              order: 58,
              isRequired: true,
              options: [
                {
                  text: "واقع‌بین بودن",
                  value: "A",
                  score: { E: 0, I: 0, S: 2, N: 0, T: 0, F: 0, J: 0, P: 0 },
                },
                {
                  text: "تخیلی بودن",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 2, T: 0, F: 0, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "در تصمیم‌گیری‌های گروهی:",
              questionType: "MULTIPLE_CHOICE",
              order: 59,
              isRequired: true,
              options: [
                {
                  text: "تحلیل بی‌طرفانه ارائه می‌دهم",
                  value: "A",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 2, F: 0, J: 0, P: 0 },
                },
                {
                  text: "به نظرات و احساسات همه توجه می‌کنم",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 2, J: 0, P: 0 },
                },
              ],
            },
            {
              questionText: "آخرین سوال - ترجیح می‌دهم:",
              questionType: "MULTIPLE_CHOICE",
              order: 60,
              isRequired: true,
              options: [
                {
                  text: "کارها طبق برنامه پیش بروند",
                  value: "A",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 2, P: 0 },
                },
                {
                  text: "برای شرایط پیش‌بینی نشده آماده باشم",
                  value: "B",
                  score: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 2 },
                },
              ],
            },
          ],
        },
      },
      include: {
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "MBTI assessment created successfully",
      assessment,
    });
  } catch (error) {
    console.error("Error creating MBTI assessment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
