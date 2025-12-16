import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 شروع پاک کردن داده‌های قدیمی seed.ts...\n');

  // بخش‌های قدیمی که باید پاک شوند
  const oldDepartmentNames = [
    'فروش و بازاریابی',
    'منابع انسانی',
    'فناوری اطلاعات',
    'مالی و حسابداری'
  ];

  // کاربران قدیمی که باید پاک شوند (به جز مدیر سیستم که ممکن است تکراری باشد)
  const oldUserEmails = [
    'admin2@company.com',
    'it.manager@company.com',
    'hr.manager@company.com',
    'sales.manager@company.com',
    'finance.manager@company.com',
    'dev1@company.com',
    'dev2@company.com',
    'hr1@company.com',
    'hr2@company.com',
    'sales1@company.com',
    'sales2@company.com',
    'finance1@company.com',
    'finance2@company.com'
  ];

  // پیدا کردن بخش‌های قدیمی
  const oldDepartments = await prisma.department.findMany({
    where: {
      name: { in: oldDepartmentNames }
    },
    include: {
      _count: {
        select: {
          users: true,
          feedbacks: true,
          tasks: true,
          announcements: true
        }
      }
    }
  });

  console.log(`📋 پیدا شد ${oldDepartments.length} بخش قدیمی:`);
  oldDepartments.forEach(dept => {
    console.log(`   - ${dept.name} (${dept._count.users} کاربر، ${dept._count.feedbacks} فیدبک، ${dept._count.tasks} تسک، ${dept._count.announcements} اعلان)`);
  });

  // پیدا کردن کاربران قدیمی
  const oldUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { in: oldUserEmails } },
        { departmentId: { in: oldDepartments.map(d => d.id) } }
      ]
    },
    include: {
      _count: {
        select: {
          feedbacks: true,
          createdTasks: true,
          assignedTasks: true,
          announcements: true,
          sentMessages: true
        }
      }
    }
  });

  // فیلتر کردن کاربرانی که واقعاً قدیمی هستند (نه کاربران اصلی)
  const usersToDelete = oldUsers.filter(user => {
    // اگر کاربر در بخش‌های اصلی است، نگه دار
    const isInOriginalDept = !oldDepartments.some(d => d.id === user.departmentId);
    // اگر ایمیل در لیست قدیمی است، پاک کن
    const isOldEmail = oldUserEmails.includes(user.email || '');
    // اگر موبایل در لیست کاربران اصلی است، نگه دار
    const originalMobiles = ['09123456789', '09123322111', '09123322112', '09123322114', '09121941532', '09123150594', '09123322113'];
    const isOriginalMobile = originalMobiles.includes(user.mobile);
    
    return (isOldEmail || (user.departmentId && !isInOriginalDept)) && !isOriginalMobile;
  });

  console.log(`\n👥 پیدا شد ${usersToDelete.length} کاربر قدیمی:`);
  usersToDelete.forEach(user => {
    console.log(`   - ${user.name} (${user.email || user.mobile}) - ${user._count.feedbacks} فیدبک، ${user._count.createdTasks + user._count.assignedTasks} تسک`);
  });

  if (oldDepartments.length === 0 && usersToDelete.length === 0) {
    console.log('\n✅ هیچ داده قدیمی پیدا نشد!');
    return;
  }

  console.log('\n🗑️  شروع پاک کردن...\n');

  // پاک کردن داده‌های مرتبط با کاربران
  for (const user of usersToDelete) {
    console.log(`   پاک کردن داده‌های مرتبط با ${user.name}...`);
    await prisma.notification.deleteMany({ where: { userId: user.id } });
    await prisma.message.deleteMany({ where: { senderId: user.id } });
    await prisma.taskAssignment.deleteMany({ where: { userId: user.id } });
    await prisma.feedback.updateMany({
      where: { forwardedToId: user.id },
      data: { forwardedToId: null }
    });
    await prisma.feedback.updateMany({
      where: { completedById: user.id },
      data: { completedById: null }
    });
    // حذف تسک‌هایی که کاربر ایجاد کرده
    await prisma.task.deleteMany({
      where: { createdById: user.id }
    });
    // حذف اعلان‌هایی که کاربر ایجاد کرده
    await prisma.announcement.deleteMany({
      where: { createdById: user.id }
    });
  }

  // پاک کردن داده‌های مرتبط با بخش‌های قدیمی
  for (const dept of oldDepartments) {
    console.log(`   پاک کردن داده‌های مرتبط با بخش ${dept.name}...`);
    await prisma.feedback.deleteMany({ where: { departmentId: dept.id } });
    await prisma.task.deleteMany({ where: { departmentId: dept.id } });
    await prisma.announcement.deleteMany({ where: { departmentId: dept.id } });
    await prisma.assessmentAssignment.deleteMany({ where: { departmentId: dept.id } });
  }

  // پاک کردن کاربران
  if (usersToDelete.length > 0) {
    console.log(`\n   پاک کردن ${usersToDelete.length} کاربر...`);
    await prisma.user.deleteMany({
      where: {
        id: { in: usersToDelete.map(u => u.id) }
      }
    });
    console.log(`   ✅ ${usersToDelete.length} کاربر پاک شد`);
  }

  // پاک کردن بخش‌ها
  if (oldDepartments.length > 0) {
    console.log(`\n   پاک کردن ${oldDepartments.length} بخش...`);
    await prisma.department.deleteMany({
      where: {
        id: { in: oldDepartments.map(d => d.id) }
      }
    });
    console.log(`   ✅ ${oldDepartments.length} بخش پاک شد`);
  }

  console.log('\n✅ پاک کردن داده‌های قدیمی کامل شد!');
}

main()
  .catch((e) => {
    console.error('❌ خطا:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

