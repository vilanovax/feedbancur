import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 شروع seed کردن دیتابیس...');

  // پاک کردن داده‌های قبلی
  console.log('🗑️  پاک کردن داده‌های قبلی...');
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.announcementMessage.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.taskAssignment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.assessmentQuestion.deleteMany();
  await prisma.assessmentAssignment.deleteMany();
  await prisma.assessmentResult.deleteMany();
  await prisma.assessmentProgress.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.pollResponse.deleteMany();
  await prisma.pollOption.deleteMany();
  await prisma.poll.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.oTP.deleteMany();

  // حفظ تنظیمات Object Storage موجود قبل از پاک کردن
  console.log('💾 حفظ تنظیمات Object Storage...');
  const existingSettings = await prisma.settings.findFirst();
  const preservedObjectStorage = existingSettings?.objectStorageSettings
    ? (typeof existingSettings.objectStorageSettings === 'string'
        ? JSON.parse(existingSettings.objectStorageSettings)
        : existingSettings.objectStorageSettings)
    : null;

  // پاک کردن تنظیمات (بعد از حفظ Object Storage)
  await prisma.settings.deleteMany();

  // ایجاد تنظیمات
  console.log('⚙️  ایجاد تنظیمات...');
  
  // استفاده از تنظیمات Object Storage حفظ شده یا مقادیر پیش‌فرض
  const objectStorageSettings = preservedObjectStorage && 
    preservedObjectStorage.accessKeyId && 
    preservedObjectStorage.secretAccessKey
    ? preservedObjectStorage // استفاده از تنظیمات حفظ شده
    : {
        enabled: false, // به صورت پیش‌فرض غیرفعال - باید در تنظیمات فعال شود
        endpoint: 'https://storage.iran.liara.space',
        bucket: 'feedban-uploads',
        region: 'us-east-1',
        accessKeyId: '', // باید در تنظیمات وارد شود
        secretAccessKey: '' // باید در تنظیمات وارد شود
      };

  if (preservedObjectStorage && preservedObjectStorage.accessKeyId) {
    console.log('✅ تنظیمات Object Storage حفظ شد');
  } else {
    console.log('ℹ️  استفاده از تنظیمات پیش‌فرض Object Storage');
  }

  const settings = await prisma.settings.create({
    data: {
      siteName: 'سیستم مدیریت فیدبک',
      siteDescription: 'سیستم جمع‌آوری و مدیریت بازخوردها و پیشنهادات کارکنان',
      language: 'fa',
      timezone: 'Asia/Tehran',
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      requirePasswordChange: false,
      sessionTimeout: 30,
      twoFactorAuth: false,
      allowAnonymous: true,
      autoArchiveDays: 90,
      maxFeedbackLength: 5000,
      itemsPerPage: 20,
      theme: 'light',
      statusTexts: {
        PENDING: 'در انتظار بررسی',
        REVIEWED: 'بررسی شده',
        ARCHIVED: 'بایگانی شده',
        DEFERRED: 'رسیدگی آینده',
        COMPLETED: 'انجام شد'
      },
      feedbackTypes: [
        { key: 'SUGGESTION', label: 'پیشنهاد' },
        { key: 'COMPLAINT', label: 'شکایت' },
        { key: 'QUESTION', label: 'سوال' },
        { key: 'PRAISE', label: 'تشکر و قدردانی' },
        { key: 'BUG', label: 'گزارش مشکل' },
        { key: 'OTHER', label: 'سایر' }
      ],
      notificationSettings: {
        directFeedbackToManager: true,
        feedbackCompletedByManager: true,
        feedbackForwardedToYou: true,
        feedbackStatusChanged: true,
        newAnnouncementCreated: true,
        taskAssignedToYou: true
      },
      chatSettings: {
        maxFileSize: 10,
        allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
      },
      objectStorageSettings: objectStorageSettings
    }
  });

  // ایجاد بخش‌ها
  console.log('🏢 ایجاد بخش‌ها...');
  const departments = await Promise.all([
    prisma.department.create({
      data: {
        name: 'فناوری اطلاعات',
        description: 'بخش توسعه و پشتیبانی سیستم‌های نرم‌افزاری',
        keywords: ['نرم‌افزار', 'برنامه‌نویسی', 'شبکه', 'سرور', 'دیتابیس', 'امنیت'],
        allowDirectFeedback: true,
        canCreateAnnouncement: true,
        allowedAnnouncementDepartments: []
      }
    }),
    prisma.department.create({
      data: {
        name: 'منابع انسانی',
        description: 'مدیریت امور کارکنان و استخدام',
        keywords: ['استخدام', 'حقوق', 'مرخصی', 'بیمه', 'آموزش'],
        allowDirectFeedback: true,
        canCreateAnnouncement: true,
        allowedAnnouncementDepartments: []
      }
    }),
    prisma.department.create({
      data: {
        name: 'فروش و بازاریابی',
        description: 'فروش محصولات و خدمات و بازاریابی',
        keywords: ['فروش', 'بازاریابی', 'مشتری', 'تبلیغات', 'کمپین'],
        allowDirectFeedback: false,
        canCreateAnnouncement: false,
        allowedAnnouncementDepartments: []
      }
    }),
    prisma.department.create({
      data: {
        name: 'مالی و حسابداری',
        description: 'مدیریت امور مالی و حسابداری شرکت',
        keywords: ['مالی', 'حسابداری', 'حقوق', 'هزینه', 'درآمد', 'صورتحساب'],
        allowDirectFeedback: true,
        canCreateAnnouncement: false,
        allowedAnnouncementDepartments: []
      }
    })
  ]);

  // به‌روزرسانی allowedAnnouncementDepartments برای IT department
  await prisma.department.update({
    where: { id: departments[0].id },
    data: {
      allowedAnnouncementDepartments: [departments[0].id, departments[1].id, departments[2].id, departments[3].id]
    }
  });

  // به‌روزرسانی allowedAnnouncementDepartments برای HR department
  await prisma.department.update({
    where: { id: departments[1].id },
    data: {
      allowedAnnouncementDepartments: [departments[1].id, departments[2].id, departments[3].id]
    }
  });

  console.log(`✅ ${departments.length} بخش ایجاد شد`);

  // ایجاد کاربران
  console.log('👥 ایجاد کاربران...');

  // رمز عبور پیش‌فرض: 123456
  const defaultPassword = await bcrypt.hash('123456', 10);

  // ایجاد ادمین اصلی
  const admin = await prisma.user.create({
    data: {
      mobile: '09123456789',
      email: 'admin@company.com',
      name: 'مدیر سیستم',
      password: defaultPassword,
      role: 'ADMIN',
      isActive: true,
      mustChangePassword: false,
      departmentId: null
    }
  });

  // ایجاد ادمین دوم
  const admin2 = await prisma.user.create({
    data: {
      mobile: '09123456788',
      email: 'admin2@company.com',
      name: 'ادمین دوم',
      password: defaultPassword,
      role: 'ADMIN',
      isActive: true,
      mustChangePassword: false,
      departmentId: null
    }
  });

  // ایجاد مدیران بخش‌ها
  const managers = await Promise.all([
    prisma.user.create({
      data: {
        mobile: '09121111111',
        email: 'it.manager@company.com',
        name: 'علی محمدی',
        password: defaultPassword,
        role: 'MANAGER',
        departmentId: departments[0].id,
        isActive: true,
        mustChangePassword: false
      }
    }),
    prisma.user.create({
      data: {
        mobile: '09122222222',
        email: 'hr.manager@company.com',
        name: 'زهرا احمدی',
        password: defaultPassword,
        role: 'MANAGER',
        departmentId: departments[1].id,
        isActive: true,
        mustChangePassword: false
      }
    }),
    prisma.user.create({
      data: {
        mobile: '09123333333',
        email: 'sales.manager@company.com',
        name: 'فرزاد زارع',
        password: defaultPassword,
        role: 'MANAGER',
        departmentId: departments[2].id,
        isActive: true,
        mustChangePassword: false
      }
    }),
    prisma.user.create({
      data: {
        mobile: '09124444444',
        email: 'finance.manager@company.com',
        name: 'مریم کریمی',
        password: defaultPassword,
        role: 'MANAGER',
        departmentId: departments[3].id,
        isActive: true,
        mustChangePassword: false
      }
    })
  ]);

  // ایجاد کارمندان
  const employees = await Promise.all([
    // کارمندان IT
    prisma.user.create({
      data: {
        mobile: '09131111111',
        email: 'dev1@company.com',
        name: 'حسین رضایی',
        password: defaultPassword,
        role: 'EMPLOYEE',
        departmentId: departments[0].id,
        isActive: true,
        mustChangePassword: false
      }
    }),
    prisma.user.create({
      data: {
        mobile: '09131111112',
        email: 'dev2@company.com',
        name: 'سارا نوری',
        password: defaultPassword,
        role: 'EMPLOYEE',
        departmentId: departments[0].id,
        isActive: true,
        mustChangePassword: false
      }
    }),
    // کارمندان HR
    prisma.user.create({
      data: {
        mobile: '09132222221',
        email: 'hr1@company.com',
        name: 'مهدی اکبری',
        password: defaultPassword,
        role: 'EMPLOYEE',
        departmentId: departments[1].id,
        isActive: true,
        mustChangePassword: false
      }
    }),
    prisma.user.create({
      data: {
        mobile: '09132222222',
        email: 'hr2@company.com',
        name: 'نرگس حسینی',
        password: defaultPassword,
        role: 'EMPLOYEE',
        departmentId: departments[1].id,
        isActive: true,
        mustChangePassword: false
      }
    }),
    // کارمندان فروش
    prisma.user.create({
      data: {
        mobile: '09133333331',
        email: 'sales1@company.com',
        name: 'امیر صادقی',
        password: defaultPassword,
        role: 'EMPLOYEE',
        departmentId: departments[2].id,
        isActive: true,
        mustChangePassword: false
      }
    }),
    prisma.user.create({
      data: {
        mobile: '09133333332',
        email: 'sales2@company.com',
        name: 'لیلا جعفری',
        password: defaultPassword,
        role: 'EMPLOYEE',
        departmentId: departments[2].id,
        isActive: true,
        mustChangePassword: false
      }
    }),
    // کارمندان مالی
    prisma.user.create({
      data: {
        mobile: '09134444441',
        email: 'finance1@company.com',
        name: 'رضا مهدوی',
        password: defaultPassword,
        role: 'EMPLOYEE',
        departmentId: departments[3].id,
        isActive: true,
        mustChangePassword: false
      }
    }),
    prisma.user.create({
      data: {
        mobile: '09134444442',
        email: 'finance2@company.com',
        name: 'فاطمه موسوی',
        password: defaultPassword,
        role: 'EMPLOYEE',
        departmentId: departments[3].id,
        isActive: true,
        mustChangePassword: false
      }
    })
  ]);

  console.log(`✅ ${1 + 1 + managers.length + employees.length} کاربر ایجاد شد`);

  // ایجاد اعلانات
  console.log('📢 ایجاد اعلانات...');
  const announcements = await Promise.all([
    prisma.announcement.create({
      data: {
        title: 'به‌روزرسانی سیستم',
        content: 'سیستم فیدبک به نسخه 2.0 به‌روزرسانی شد. امکانات جدید شامل چت آنلاین، سیستم تسک و اعلانات هوشمند است.',
        priority: 'HIGH',
        isActive: true,
        publishedAt: new Date(),
        departmentId: null, // برای همه
        createdById: admin.id
      }
    }),
    prisma.announcement.create({
      data: {
        title: 'جلسه هفتگی تیم IT',
        content: 'جلسه هفتگی تیم IT روز شنبه ساعت 10 صبح برگزار می‌شود. حضور همه اعضا الزامی است.',
        priority: 'MEDIUM',
        isActive: true,
        publishedAt: new Date(),
        departmentId: departments[0].id,
        createdById: managers[0].id
      }
    }),
    prisma.announcement.create({
      data: {
        title: 'فراخوان استخدام',
        content: 'بخش فروش به دنبال استخدام نیروی جدید است. علاقه‌مندان می‌توانند رزومه خود را ارسال کنند.',
        priority: 'LOW',
        isActive: true,
        publishedAt: new Date(),
        departmentId: departments[2].id,
        createdById: managers[1].id
      }
    })
  ]);

  console.log(`✅ ${announcements.length} اعلان ایجاد شد`);

  // ایجاد فیدبک‌ها
  console.log('💬 ایجاد فیدبک‌ها...');

  // فیدبک 1: در انتظار بررسی
  const feedback1 = await prisma.feedback.create({
    data: {
      title: 'پیشنهاد بهبود سیستم ورود',
      content: 'پیشنهاد می‌کنم سیستم ورود با احراز هویت دو مرحله‌ای امن‌تر شود.',
      type: 'SUGGESTION',
      status: 'PENDING',
      isAnonymous: false,
      userId: employees[0].id,
      departmentId: departments[0].id
    }
  });

  // فیدبک 2: ارجاع شده به مدیر
  const feedback2 = await prisma.feedback.create({
    data: {
      title: 'مشکل در سیستم حقوق',
      content: 'فیش حقوقی این ماه اشتباه محاسبه شده است. لطفاً بررسی شود.',
      type: 'COMPLAINT',
      status: 'PENDING',
      isAnonymous: false,
      userId: employees[4].id,
      departmentId: departments[3].id,
      forwardedToId: managers[3].id,
      forwardedAt: new Date()
    }
  });

  // فیدبک 3: تکمیل شده
  const feedback3 = await prisma.feedback.create({
    data: {
      title: 'درخواست آموزش',
      content: 'لطفاً دوره آموزشی در مورد تکنیک‌های فروش برگزار شود.',
      type: 'QUESTION',
      status: 'COMPLETED',
      isAnonymous: false,
      userId: employees[5].id,
      departmentId: departments[2].id,
      forwardedToId: managers[2].id,
      forwardedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      completedById: managers[2].id,
      completedAt: new Date(),
      userResponse: 'دوره آموزشی روز پنجشنبه برگزار خواهد شد. از مشارکت شما سپاسگزاریم.'
    }
  });

  // فیدبک 4: ناشناس
  const feedback4 = await prisma.feedback.create({
    data: {
      title: 'تشکر از تیم IT',
      content: 'از تیم IT به خاطر پشتیبانی سریع و کارآمد تشکر می‌کنم.',
      type: 'PRAISE',
      status: 'REVIEWED',
      isAnonymous: true,
      userId: employees[6].id,
      departmentId: departments[0].id
    }
  });

  console.log(`✅ 4 فیدبک ایجاد شد`);

  // ایجاد پیام‌ها برای فیدبک ارجاع شده
  console.log('💬 ایجاد پیام‌ها...');
  await Promise.all([
    prisma.message.create({
      data: {
        feedbackId: feedback2.id,
        senderId: managers[3].id,
        content: 'موضوع در حال بررسی است. تا پایان هفته پاسخ خواهید گرفت.',
        isRead: true,
        readAt: new Date()
      }
    }),
    prisma.message.create({
      data: {
        feedbackId: feedback2.id,
        senderId: employees[4].id,
        content: 'ممنون از پیگیری',
        isRead: true,
        readAt: new Date()
      }
    })
  ]);

  console.log('✅ پیام‌ها ایجاد شد');

  // ایجاد چک لیست برای فیدبک
  console.log('✅ ایجاد چک لیست...');
  await Promise.all([
    prisma.checklistItem.create({
      data: {
        feedbackId: feedback2.id,
        title: 'بررسی فیش حقوقی',
        isCompleted: true,
        order: 0
      }
    }),
    prisma.checklistItem.create({
      data: {
        feedbackId: feedback2.id,
        title: 'تماس با بخش مالی',
        isCompleted: true,
        order: 1
      }
    }),
    prisma.checklistItem.create({
      data: {
        feedbackId: feedback2.id,
        title: 'اصلاح و ارسال فیش جدید',
        isCompleted: false,
        order: 2
      }
    })
  ]);

  console.log('✅ چک لیست ایجاد شد');

  // ایجاد تسک
  console.log('📋 ایجاد تسک‌ها...');
  const task1 = await prisma.task.create({
    data: {
      title: 'پیاده‌سازی احراز هویت دو مرحله‌ای',
      description: 'بر اساس فیدبک دریافتی، باید سیستم احراز هویت دو مرحله‌ای پیاده‌سازی شود.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      isPublic: true,
      feedbackId: feedback1.id,
      departmentId: departments[0].id,
      createdById: managers[0].id
    }
  });

  await prisma.taskAssignment.create({
    data: {
      taskId: task1.id,
      userId: employees[0].id
    }
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'برگزاری دوره آموزشی فروش',
      description: 'برنامه‌ریزی و برگزاری دوره آموزشی تکنیک‌های فروش',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      isPublic: false,
      feedbackId: feedback3.id,
      departmentId: departments[2].id,
      createdById: managers[2].id,
      completedAt: new Date()
    }
  });

  await prisma.taskAssignment.create({
    data: {
      taskId: task2.id,
      userId: managers[2].id
    }
  });

  console.log('✅ تسک‌ها ایجاد شد');

  // ایجاد نوتیفیکیشن‌ها
  console.log('🔔 ایجاد نوتیفیکیشن‌ها...');
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: employees[4].id,
        feedbackId: feedback2.id,
        title: 'پاسخ جدید',
        content: 'مدیر مالی به فیدبک شما پاسخ داده است',
        type: 'INFO',
        isRead: true,
        readAt: new Date()
      }
    }),
    prisma.notification.create({
      data: {
        userId: employees[0].id,
        feedbackId: null,
        title: 'تسک جدید',
        content: 'یک تسک جدید به شما اختصاص داده شد: پیاده‌سازی احراز هویت دو مرحله‌ای',
        type: 'SUCCESS',
        isRead: false
      }
    }),
    prisma.notification.create({
      data: {
        userId: managers[2].id,
        feedbackId: feedback3.id,
        title: 'فیدبک جدید',
        content: 'یک فیدبک جدید به شما ارجاع شده است',
        type: 'INFO',
        isRead: true,
        readAt: new Date()
      }
    })
  ]);

  console.log('✅ نوتیفیکیشن‌ها ایجاد شد');

  console.log('\n🎉 Seed کامل شد!');
  console.log('\n📊 خلاصه:');
  console.log(`   - ${departments.length} بخش`);
  console.log(`   - ${1 + 1 + managers.length + employees.length} کاربر (2 ادمین، ${managers.length} مدیر، ${employees.length} کارمند)`);
  console.log(`   - ${announcements.length} اعلان`);
  console.log(`   - 4 فیدبک`);
  console.log(`   - 2 تسک`);
  console.log(`   - 3 نوتیفیکیشن`);
  console.log('\n💡 برای اضافه کردن آزمون‌ها، از فایل seed-assessments.ts استفاده کنید:');
  console.log('   npx tsx prisma/seed-assessments.ts');
  console.log('\n🔑 اطلاعات ورود:');
  console.log('   رمز عبور همه کاربران: 123456');
  console.log(`   ادمین: 09123456789`);
  console.log(`   مدیر IT: 09121111111`);
  console.log(`   کارمند نمونه: 09131111111`);
}

main()
  .catch((e) => {
    console.error('❌ خطا در seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
