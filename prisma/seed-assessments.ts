import { PrismaClient } from '@prisma/client';
import { seedMBTI } from './seed-mbti';
import { seedDISC } from './seed-disc';
import { seedHolland } from './seed-holland';
import { seedMSQ } from './seed-msq';

const prisma = new PrismaClient();

/**
 * Seed فایل جداگانه برای آزمون‌ها
 * این فایل فقط آزمون‌ها را اضافه می‌کند و داده‌های موجود را پاک نمی‌کند
 */
async function main() {
  console.log('🌱 شروع seed کردن آزمون‌ها...');
  console.log('⚠️  توجه: این فایل فقط آزمون‌ها را اضافه می‌کند و داده‌های موجود را پاک نمی‌کند\n');

  // بررسی وجود کاربر ادمین
  const adminUser = await prisma.users.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!adminUser) {
    console.error('❌ هیچ کاربر ادمینی پیدا نشد. لطفاً ابتدا کاربر ادمین ایجاد کنید.');
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log(`✅ کاربر ادمین پیدا شد: ${adminUser.name} (${adminUser.email})\n`);

  // ایجاد آزمون‌ها
  console.log('📝 ایجاد آزمون‌ها...\n');
  
  try {
    await seedMBTI(prisma);
    console.log('');
    
    await seedDISC(prisma);
    console.log('');
    
    await seedHolland(prisma);
    console.log('');
    
    await seedMSQ(prisma);
    console.log('');
    
    console.log('✅ همه آزمون‌ها با موفقیت ایجاد شدند!\n');
    
    // نمایش خلاصه
    const assessments = await prisma.assessments.findMany({
      select: {
        id: true,
        title: true,
        type: true,
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log('📊 خلاصه آزمون‌ها:');
    assessments.forEach((assessment) => {
      console.log(`   - ${assessment.title} (${assessment.type}): ${assessment._count.questions} سوال`);
    });
    console.log(`\n   مجموع: ${assessments.length} آزمون`);
    
  } catch (error: any) {
    console.error('❌ خطا در ایجاد آزمون‌ها:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ خطا در seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

