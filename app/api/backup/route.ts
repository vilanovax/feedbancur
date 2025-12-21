import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import { prisma } from "@/lib/prisma";

const execAsync = promisify(exec);

// تعریف بخش‌های قابل بک‌آپ
interface BackupSections {
  settings?: boolean;
  departments?: boolean;
  users?: boolean;
  userStatuses?: boolean;
  feedbacks?: boolean;
  polls?: boolean;
  assessments?: boolean;
  announcements?: boolean;
  tasks?: boolean;
  analytics?: boolean;
}

// بررسی وجود pg_dump
async function checkPgDumpAvailable(): Promise<boolean> {
  try {
    await execAsync('which pg_dump');
    return true;
  } catch {
    // Try with docker
    try {
      await execAsync('which docker');
      return true;
    } catch {
      return false;
    }
  }
}

// بک‌آپ با استفاده از Prisma - با قابلیت انتخاب بخش‌ها
async function createPrismaBackup(sections?: BackupSections): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0];
  const backupFileName = `backup-prisma-${timestamp}.json`;
  const backupDir = path.join(process.cwd(), "backups");
  const backupPath = path.join(backupDir, backupFileName);

  // ایجاد دایرکتوری
  try {
    await fs.access(backupDir);
  } catch {
    await fs.mkdir(backupDir, { recursive: true });
  }

  // اگر sections تعریف نشده، همه را بک‌آپ بگیر
  const backupAll = !sections || Object.keys(sections).length === 0;
  const shouldBackup = (section: keyof BackupSections) => backupAll || sections?.[section];

  // استخراج داده‌ها از تمام جداول
  const data: any = {
    version: "2.0",
    timestamp: new Date().toISOString(),
    sections: sections || { all: true },
    data: {}
  };

  // تنظیمات
  if (shouldBackup('settings')) {
    data.data.settings = await prisma.settings.findMany();
  }

  // بخش‌ها
  if (shouldBackup('departments')) {
    data.data.departments = await prisma.departments.findMany();
  }

  // وضعیت کاربران
  if (shouldBackup('userStatuses')) {
    data.data.userStatuses = await prisma.user_statuses.findMany();
  }

  // کاربران
  if (shouldBackup('users')) {
    data.data.users = await prisma.users.findMany();
    data.data.employees = await prisma.employees.findMany();
  }

  // فیدبک‌ها و داده‌های مرتبط
  if (shouldBackup('feedbacks')) {
    data.data.feedbacks = await prisma.feedbacks.findMany();
    data.data.checklistItems = await prisma.checklist_items.findMany();
    data.data.messages = await prisma.messages.findMany();
    data.data.notifications = await prisma.notifications.findMany();
  }

  // نظرسنجی‌ها
  if (shouldBackup('polls')) {
    data.data.polls = await prisma.polls.findMany();
    data.data.pollOptions = await prisma.poll_options.findMany();
    data.data.pollResponses = await prisma.poll_responses.findMany();
  }

  // آزمون‌ها
  if (shouldBackup('assessments')) {
    data.data.assessments = await prisma.assessments.findMany();
    data.data.assessmentQuestions = await prisma.assessment_questions.findMany();
    data.data.assessmentAssignments = await prisma.assessment_assignments.findMany();
    data.data.assessmentResults = await prisma.assessment_results.findMany();
    data.data.assessmentProgress = await prisma.assessment_progress.findMany();
  }

  // اعلانات
  if (shouldBackup('announcements')) {
    data.data.announcements = await prisma.announcements.findMany();
    data.data.announcementMessages = await prisma.announcement_messages.findMany();
    data.data.announcementViews = await prisma.announcement_views.findMany();
  }

  // وظایف
  if (shouldBackup('tasks')) {
    data.data.tasks = await prisma.tasks.findMany();
    data.data.taskAssignments = await prisma.task_assignments.findMany();
    data.data.taskComments = await prisma.task_comments.findMany();
  }

  // تحلیل کلمات کلیدی
  if (shouldBackup('analytics')) {
    data.data.analyticsKeywords = await prisma.analytics_keywords.findMany();
  }

  // OTPs (همیشه بک‌آپ بگیر برای سازگاری)
  data.data.otps = await prisma.otps.findMany();

  // ذخیره به فایل JSON
  await fs.writeFile(backupPath, JSON.stringify(data, null, 2));

  return backupFileName;
}

// ریستور انتخابی با استفاده از Prisma
async function restorePrismaBackup(jsonData: any, selectedSections?: BackupSections): Promise<{ restored: string[], skipped: string[] }> {
  const restored: string[] = [];
  const skipped: string[] = [];

  // اگر selectedSections تعریف نشده، همه را ریستور کن
  const restoreAll = !selectedSections || Object.keys(selectedSections).length === 0;
  const shouldRestore = (section: keyof BackupSections) => restoreAll || selectedSections?.[section];

  // پاک کردن و ریستور داده‌ها به ترتیب صحیح (به دلیل foreign keys)

  // 1. OTPs (همیشه)
  if (jsonData.data.otps?.length > 0) {
    await prisma.otps.deleteMany();
    for (const item of jsonData.data.otps) {
      await prisma.otps.create({ data: item });
    }
    restored.push('otps');
  }

  // 2. تنظیمات
  if (shouldRestore('settings') && jsonData.data.settings?.length > 0) {
    await prisma.settings.deleteMany();
    for (const item of jsonData.data.settings) {
      await prisma.settings.create({ data: item });
    }
    restored.push('settings');
  } else if (jsonData.data.settings) {
    skipped.push('settings');
  }

  // 3. وضعیت کاربران (باید قبل از کاربران باشد)
  if (shouldRestore('userStatuses') && jsonData.data.userStatuses?.length > 0) {
    await prisma.user_statuses.deleteMany();
    for (const item of jsonData.data.userStatuses) {
      await prisma.user_statuses.create({ data: item });
    }
    restored.push('userStatuses');
  } else if (jsonData.data.userStatuses) {
    skipped.push('userStatuses');
  }

  // 4. بخش‌ها (باید قبل از کاربران باشد)
  if (shouldRestore('departments') && jsonData.data.departments?.length > 0) {
    // ابتدا وابستگی‌ها را پاک کن
    await prisma.analytics_keywords.deleteMany();
    await prisma.departments.deleteMany();
    for (const item of jsonData.data.departments) {
      await prisma.departments.create({ data: item });
    }
    restored.push('departments');
  } else if (jsonData.data.departments) {
    skipped.push('departments');
  }

  // 5. کاربران
  if (shouldRestore('users')) {
    if (jsonData.data.users?.length > 0) {
      // ابتدا وابستگی‌ها را پاک کن
      await prisma.notifications.deleteMany();
      await prisma.messages.deleteMany();
      await prisma.poll_responses.deleteMany();
      await prisma.assessment_results.deleteMany();
      await prisma.assessment_progress.deleteMany();
      await prisma.announcement_views.deleteMany();
      await prisma.announcement_messages.deleteMany();
      await prisma.task_assignments.deleteMany();
      await prisma.employees.deleteMany();
      await prisma.users.deleteMany();

      for (const item of jsonData.data.users) {
        await prisma.users.create({ data: item });
      }
      restored.push('users');
    }

    if (jsonData.data.employees?.length > 0) {
      for (const item of jsonData.data.employees) {
        await prisma.employees.create({ data: item });
      }
      restored.push('employees');
    }
  } else {
    if (jsonData.data.users) skipped.push('users');
    if (jsonData.data.employees) skipped.push('employees');
  }

  // 6. فیدبک‌ها
  if (shouldRestore('feedbacks')) {
    if (jsonData.data.feedbacks?.length > 0) {
      await prisma.checklist_items.deleteMany();
      await prisma.feedbacks.deleteMany();
      for (const item of jsonData.data.feedbacks) {
        await prisma.feedbacks.create({ data: item });
      }
      restored.push('feedbacks');
    }

    if (jsonData.data.checklistItems?.length > 0) {
      for (const item of jsonData.data.checklistItems) {
        await prisma.checklist_items.create({ data: item });
      }
      restored.push('checklistItems');
    }

    if (jsonData.data.messages?.length > 0) {
      for (const item of jsonData.data.messages) {
        await prisma.messages.create({ data: item });
      }
      restored.push('messages');
    }

    if (jsonData.data.notifications?.length > 0) {
      for (const item of jsonData.data.notifications) {
        await prisma.notifications.create({ data: item });
      }
      restored.push('notifications');
    }
  } else {
    if (jsonData.data.feedbacks) skipped.push('feedbacks');
  }

  // 7. نظرسنجی‌ها
  if (shouldRestore('polls')) {
    if (jsonData.data.polls?.length > 0) {
      await prisma.poll_responses.deleteMany();
      await prisma.poll_options.deleteMany();
      await prisma.polls.deleteMany();

      for (const item of jsonData.data.polls) {
        await prisma.polls.create({ data: item });
      }
      restored.push('polls');
    }

    if (jsonData.data.pollOptions?.length > 0) {
      for (const item of jsonData.data.pollOptions) {
        await prisma.poll_options.create({ data: item });
      }
      restored.push('pollOptions');
    }

    if (jsonData.data.pollResponses?.length > 0) {
      for (const item of jsonData.data.pollResponses) {
        await prisma.poll_responses.create({ data: item });
      }
      restored.push('pollResponses');
    }
  } else {
    if (jsonData.data.polls) skipped.push('polls');
  }

  // 8. آزمون‌ها
  if (shouldRestore('assessments')) {
    if (jsonData.data.assessments?.length > 0) {
      await prisma.assessment_results.deleteMany();
      await prisma.assessment_progress.deleteMany();
      await prisma.assessment_assignments.deleteMany();
      await prisma.assessment_questions.deleteMany();
      await prisma.assessments.deleteMany();

      for (const item of jsonData.data.assessments) {
        await prisma.assessments.create({ data: item });
      }
      restored.push('assessments');
    }

    if (jsonData.data.assessmentQuestions?.length > 0) {
      for (const item of jsonData.data.assessmentQuestions) {
        await prisma.assessment_questions.create({ data: item });
      }
      restored.push('assessmentQuestions');
    }

    if (jsonData.data.assessmentAssignments?.length > 0) {
      for (const item of jsonData.data.assessmentAssignments) {
        await prisma.assessment_assignments.create({ data: item });
      }
      restored.push('assessmentAssignments');
    }

    if (jsonData.data.assessmentResults?.length > 0) {
      for (const item of jsonData.data.assessmentResults) {
        await prisma.assessment_results.create({ data: item });
      }
      restored.push('assessmentResults');
    }

    if (jsonData.data.assessmentProgress?.length > 0) {
      for (const item of jsonData.data.assessmentProgress) {
        await prisma.assessment_progress.create({ data: item });
      }
      restored.push('assessmentProgress');
    }
  } else {
    if (jsonData.data.assessments) skipped.push('assessments');
  }

  // 9. اعلانات
  if (shouldRestore('announcements')) {
    if (jsonData.data.announcements?.length > 0) {
      await prisma.announcement_views.deleteMany();
      await prisma.announcement_messages.deleteMany();
      await prisma.announcements.deleteMany();

      for (const item of jsonData.data.announcements) {
        await prisma.announcements.create({ data: item });
      }
      restored.push('announcements');
    }

    if (jsonData.data.announcementMessages?.length > 0) {
      for (const item of jsonData.data.announcementMessages) {
        await prisma.announcement_messages.create({ data: item });
      }
      restored.push('announcementMessages');
    }

    if (jsonData.data.announcementViews?.length > 0) {
      for (const item of jsonData.data.announcementViews) {
        await prisma.announcement_views.create({ data: item });
      }
      restored.push('announcementViews');
    }
  } else {
    if (jsonData.data.announcements) skipped.push('announcements');
  }

  // 10. وظایف
  if (shouldRestore('tasks')) {
    if (jsonData.data.tasks?.length > 0) {
      await prisma.task_comments.deleteMany();
      await prisma.task_assignments.deleteMany();
      await prisma.tasks.deleteMany();

      for (const item of jsonData.data.tasks) {
        await prisma.tasks.create({ data: item });
      }
      restored.push('tasks');
    }

    if (jsonData.data.taskAssignments?.length > 0) {
      for (const item of jsonData.data.taskAssignments) {
        await prisma.task_assignments.create({ data: item });
      }
      restored.push('taskAssignments');
    }

    if (jsonData.data.taskComments?.length > 0) {
      for (const item of jsonData.data.taskComments) {
        await prisma.task_comments.create({ data: item });
      }
      restored.push('taskComments');
    }
  } else {
    if (jsonData.data.tasks) skipped.push('tasks');
  }

  // 11. تحلیل کلمات کلیدی
  if (shouldRestore('analytics') && jsonData.data.analyticsKeywords?.length > 0) {
    await prisma.analytics_keywords.deleteMany();
    for (const item of jsonData.data.analyticsKeywords) {
      await prisma.analytics_keywords.create({ data: item });
    }
    restored.push('analyticsKeywords');
  } else if (jsonData.data.analyticsKeywords) {
    skipped.push('analyticsKeywords');
  }

  return { restored, skipped };
}

// GET - دانلود بک‌آپ دیتابیس
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ADMIN می‌تواند بک‌آپ بگیرد
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "فقط مدیرعامل می‌تواند بک‌آپ دیتابیس بگیرد" },
        { status: 403 }
      );
    }

    // دریافت بخش‌های انتخابی از query params
    const { searchParams } = new URL(req.url);
    const sectionsParam = searchParams.get("sections");
    let sections: BackupSections | undefined;

    if (sectionsParam) {
      try {
        sections = JSON.parse(sectionsParam);
      } catch {
        return NextResponse.json(
          { error: "فرمت پارامتر sections نامعتبر است" },
          { status: 400 }
        );
      }
    }

    // بررسی دسترسی به pg_dump
    const hasPgDump = await checkPgDumpAvailable();

    // همیشه از روش Prisma استفاده کن (برای قابلیت انتخاب بخش‌ها)
    if (!hasPgDump || sections) {
      console.log('Using Prisma JSON backup method');
      const backupFileName = await createPrismaBackup(sections);
      const backupDir = path.join(process.cwd(), "backups");
      const backupPath = path.join(backupDir, backupFileName);

      const backupData = await fs.readFile(backupPath);
      await fs.unlink(backupPath);

      return new NextResponse(backupData, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${backupFileName}"`,
        },
      });
    }

    // خواندن اطلاعات دیتابیس از متغیرهای محیطی
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json(
        { error: "DATABASE_URL تنظیم نشده است" },
        { status: 500 }
      );
    }

    // پارس کردن URL دیتابیس
    const dbUrlMatch = databaseUrl.match(
      /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/
    );

    if (!dbUrlMatch) {
      return NextResponse.json(
        { error: "فرمت DATABASE_URL نامعتبر است" },
        { status: 500 }
      );
    }

    const [, dbUser, dbPassword, dbHost, dbPort, dbNameWithParams] = dbUrlMatch;
    const dbName = dbNameWithParams.split('?')[0];

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .split("T")[0];
    const backupFileName = `backup-${dbName}-${timestamp}.sql`;
    const backupDir = path.join(process.cwd(), "backups");
    const backupPath = path.join(backupDir, backupFileName);

    try {
      await fs.access(backupDir);
    } catch {
      await fs.mkdir(backupDir, { recursive: true });
    }

    const command = `PGPASSWORD="${dbPassword}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F c -f "${backupPath}"`;

    try {
      await execAsync(command);
    } catch (error: any) {
      console.error("Error creating backup:", error);
      return NextResponse.json(
        {
          error: "خطا در ایجاد بک‌آپ",
          details: error.message,
        },
        { status: 500 }
      );
    }

    const backupData = await fs.readFile(backupPath);
    await fs.unlink(backupPath);

    return new NextResponse(backupData, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${backupFileName}"`,
      },
    });
  } catch (error: any) {
    console.error("Error in backup:", error);
    return NextResponse.json(
      {
        error: "خطا در ایجاد بک‌آپ",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - ریستور دیتابیس از فایل بک‌آپ
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ADMIN می‌تواند ریستور کند
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "فقط مدیرعامل می‌تواند دیتابیس را ریستور کند" },
        { status: 403 }
      );
    }

    // دریافت فایل از فرم
    const formData = await req.formData();
    const file = formData.get("backup") as File;
    const sectionsStr = formData.get("sections") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "فایل بک‌آپ ارسال نشده است" },
        { status: 400 }
      );
    }

    // پارس بخش‌های انتخابی
    let selectedSections: BackupSections | undefined;
    if (sectionsStr) {
      try {
        selectedSections = JSON.parse(sectionsStr);
      } catch {
        return NextResponse.json(
          { error: "فرمت پارامتر sections نامعتبر است" },
          { status: 400 }
        );
      }
    }

    // بررسی پسوند فایل - SQL یا JSON
    const isJsonBackup = file.name.endsWith(".json");
    const isSqlBackup = file.name.endsWith(".sql");

    if (!isJsonBackup && !isSqlBackup) {
      return NextResponse.json(
        { error: "فقط فایل‌های SQL یا JSON پشتیبانی می‌شوند" },
        { status: 400 }
      );
    }

    // اگر فایل JSON است، از روش Prisma استفاده کن
    if (isJsonBackup) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const jsonData = JSON.parse(buffer.toString('utf-8'));

        // بررسی ساختار JSON
        if (!jsonData.version || !jsonData.data) {
          return NextResponse.json(
            { error: "فرمت فایل JSON نامعتبر است" },
            { status: 400 }
          );
        }

        // ریستور داده‌ها
        const result = await restorePrismaBackup(jsonData, selectedSections);

        return NextResponse.json({
          success: true,
          message: "دیتابیس با موفقیت از فایل JSON ریستور شد",
          restored: result.restored,
          skipped: result.skipped,
          backupVersion: jsonData.version,
          backupTimestamp: jsonData.timestamp,
        });
      } catch (error: any) {
        console.error("Error restoring JSON backup:", error);
        return NextResponse.json(
          {
            error: "خطا در ریستور فایل JSON",
            details: error.message,
          },
          { status: 500 }
        );
      }
    }

    // اگر فایل SQL است و بخش‌های انتخابی تعریف شده، خطا بده
    if (selectedSections) {
      return NextResponse.json(
        { error: "ریستور انتخابی فقط برای فایل‌های JSON امکان‌پذیر است" },
        { status: 400 }
      );
    }

    // اگر فایل SQL است، بررسی کن که pg_dump در دسترس باشد
    const hasPgDump = await checkPgDumpAvailable();
    if (!hasPgDump) {
      return NextResponse.json(
        {
          error: "ابزار pg_restore در دسترس نیست. لطفاً از فایل JSON برای بازیابی استفاده کنید یا PostgreSQL client tools را نصب کنید.",
        },
        { status: 400 }
      );
    }

    // خواندن اطلاعات دیتابیس
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json(
        { error: "DATABASE_URL تنظیم نشده است" },
        { status: 500 }
      );
    }

    const dbUrlMatch = databaseUrl.match(
      /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/
    );

    if (!dbUrlMatch) {
      return NextResponse.json(
        { error: "فرمت DATABASE_URL نامعتبر است" },
        { status: 500 }
      );
    }

    const [, dbUser, dbPassword, dbHost, dbPort, dbNameWithParams] = dbUrlMatch;
    const dbName = dbNameWithParams.split('?')[0];

    const backupDir = path.join(process.cwd(), "backups");
    const restoreFileName = `restore-${Date.now()}.sql`;
    const restorePath = path.join(backupDir, restoreFileName);

    try {
      await fs.access(backupDir);
    } catch {
      await fs.mkdir(backupDir, { recursive: true });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(restorePath, buffer);

    try {
      const dropCommand = `PGPASSWORD="${dbPassword}" psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d postgres -c "DROP DATABASE IF EXISTS ${dbName};"`;
      await execAsync(dropCommand);

      const createCommand = `PGPASSWORD="${dbPassword}" psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d postgres -c "CREATE DATABASE ${dbName};"`;
      await execAsync(createCommand);

      const restoreCommand = `PGPASSWORD="${dbPassword}" pg_restore -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -c "${restorePath}"`;
      await execAsync(restoreCommand);

      await fs.unlink(restorePath);

      return NextResponse.json({
        success: true,
        message: "دیتابیس با موفقیت ریستور شد",
      });
    } catch (error: any) {
      try {
        await fs.unlink(restorePath);
      } catch {}

      console.error("Error restoring backup:", error);
      return NextResponse.json(
        {
          error: "خطا در ریستور دیتابیس",
          details: error.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in restore:", error);
    return NextResponse.json(
      {
        error: "خطا در ریستور دیتابیس",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
