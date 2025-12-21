import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📋 ایجاد استتوس‌های نمونه...');

  // بررسی وجود استتوس‌ها
  const existingStatuses = await prisma.userStatus.findMany();
  if (existingStatuses.length > 0) {
    console.log(`⚠️  ${existingStatuses.length} استتوس از قبل وجود دارد. آیا می‌خواهید ادامه دهید؟ (y/n)`);
    // برای اسکریپت، ادامه می‌دهیم
  }

  const statuses = [
    {
      name: 'در دسترس',
      color: '#10B981', // سبز
      allowedRoles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] as const,
      isActive: true,
      order: 1,
    },
    {
      name: 'مشغول',
      color: '#F59E0B', // نارنجی
      allowedRoles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] as const,
      isActive: true,
      order: 2,
    },
    {
      name: 'غیرفعال',
      color: '#6B7280', // خاکستری
      allowedRoles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] as const,
      isActive: true,
      order: 3,
    },
    {
      name: 'در مرخصی',
      color: '#3B82F6', // آبی
      allowedRoles: ['MANAGER', 'EMPLOYEE'] as const,
      isActive: true,
      order: 4,
    },
    {
      name: 'در جلسه',
      color: '#8B5CF6', // بنفش
      allowedRoles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] as const,
      isActive: true,
      order: 5,
    },
  ];

  for (const statusData of statuses) {
    try {
      // بررسی وجود استتوس با همین نام
      const existing = await prisma.userStatus.findFirst({
        where: { name: statusData.name },
      });

      if (existing) {
        console.log(`⚠️  استتوس "${statusData.name}" از قبل وجود دارد. به‌روزرسانی...`);
        await prisma.userStatus.update({
          where: { id: existing.id },
          data: {
            color: statusData.color,
            allowedRoles: statusData.allowedRoles,
            isActive: statusData.isActive,
            order: statusData.order,
          },
        });
        console.log(`✅ استتوس "${statusData.name}" به‌روزرسانی شد`);
      } else {
        await prisma.userStatus.create({
          data: statusData,
        });
        console.log(`✅ استتوس "${statusData.name}" ایجاد شد`);
      }
    } catch (error: any) {
      console.error(`❌ خطا در ایجاد استتوس "${statusData.name}":`, error.message);
    }
  }

  console.log('\n🎉 استتوس‌های نمونه با موفقیت اضافه شدند!');
}

main()
  .catch((e) => {
    console.error('❌ خطا:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

