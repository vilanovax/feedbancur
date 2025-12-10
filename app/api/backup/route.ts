import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import { prisma } from "@/lib/prisma";

const execAsync = promisify(exec);

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

// بک‌آپ با استفاده از Prisma (روش جایگزین)
async function createPrismaBackup(): Promise<string> {
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

  // استخراج داده‌ها از تمام جداول
  const data: any = {
    version: "1.0",
    timestamp: new Date().toISOString(),
    data: {}
  };

  // گرفتن داده‌ها از تمام مدل‌ها
  data.data.settings = await prisma.settings.findMany();
  data.data.departments = await prisma.department.findMany();
  data.data.users = await prisma.user.findMany();
  data.data.feedbacks = await prisma.feedback.findMany();
  data.data.checklistItems = await prisma.checklistItem.findMany();
  data.data.employees = await prisma.employee.findMany();
  data.data.tasks = await prisma.task.findMany();
  data.data.taskAssignments = await prisma.taskAssignment.findMany();
  data.data.taskComments = await prisma.taskComment.findMany();
  data.data.announcements = await prisma.announcement.findMany();
  data.data.announcementMessages = await prisma.announcementMessage.findMany();
  data.data.messages = await prisma.message.findMany();
  data.data.notifications = await prisma.notification.findMany();
  data.data.otps = await prisma.oTP.findMany();

  // ذخیره به فایل JSON
  await fs.writeFile(backupPath, JSON.stringify(data, null, 2));

  return backupFileName;
}

// ریستور با استفاده از Prisma (JSON backup)
async function restorePrismaBackup(jsonData: any): Promise<void> {
  // پاک کردن داده‌های قبلی به ترتیب صحیح (به دلیل foreign keys)
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
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.oTP.deleteMany();

  // بازگردانی داده‌ها به ترتیب صحیح
  if (jsonData.data.settings?.length > 0) {
    for (const item of jsonData.data.settings) {
      await prisma.settings.create({ data: item });
    }
  }

  if (jsonData.data.departments?.length > 0) {
    for (const item of jsonData.data.departments) {
      await prisma.department.create({ data: item });
    }
  }

  if (jsonData.data.users?.length > 0) {
    for (const item of jsonData.data.users) {
      await prisma.user.create({ data: item });
    }
  }

  if (jsonData.data.employees?.length > 0) {
    for (const item of jsonData.data.employees) {
      await prisma.employee.create({ data: item });
    }
  }

  if (jsonData.data.feedbacks?.length > 0) {
    for (const item of jsonData.data.feedbacks) {
      await prisma.feedback.create({ data: item });
    }
  }

  if (jsonData.data.checklistItems?.length > 0) {
    for (const item of jsonData.data.checklistItems) {
      await prisma.checklistItem.create({ data: item });
    }
  }

  if (jsonData.data.tasks?.length > 0) {
    for (const item of jsonData.data.tasks) {
      await prisma.task.create({ data: item });
    }
  }

  if (jsonData.data.taskAssignments?.length > 0) {
    for (const item of jsonData.data.taskAssignments) {
      await prisma.taskAssignment.create({ data: item });
    }
  }

  if (jsonData.data.taskComments?.length > 0) {
    for (const item of jsonData.data.taskComments) {
      await prisma.taskComment.create({ data: item });
    }
  }

  if (jsonData.data.announcements?.length > 0) {
    for (const item of jsonData.data.announcements) {
      await prisma.announcement.create({ data: item });
    }
  }

  if (jsonData.data.announcementMessages?.length > 0) {
    for (const item of jsonData.data.announcementMessages) {
      await prisma.announcementMessage.create({ data: item });
    }
  }

  if (jsonData.data.messages?.length > 0) {
    for (const item of jsonData.data.messages) {
      await prisma.message.create({ data: item });
    }
  }

  if (jsonData.data.notifications?.length > 0) {
    for (const item of jsonData.data.notifications) {
      await prisma.notification.create({ data: item });
    }
  }

  if (jsonData.data.otps?.length > 0) {
    for (const item of jsonData.data.otps) {
      await prisma.oTP.create({ data: item });
    }
  }
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

    // بررسی دسترسی به pg_dump
    const hasPgDump = await checkPgDumpAvailable();

    if (!hasPgDump) {
      // استفاده از روش Prisma (JSON backup)
      console.log('pg_dump not available, using Prisma JSON backup method');
      const backupFileName = await createPrismaBackup();
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
    // حذف query parameters از نام دیتابیس (مثل ?schema=public)
    const dbName = dbNameWithParams.split('?')[0];

    // ایجاد نام فایل بک‌آپ با تاریخ و زمان
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .split("T")[0];
    const backupFileName = `backup-${dbName}-${timestamp}.sql`;
    const backupDir = path.join(process.cwd(), "backups");
    const backupPath = path.join(backupDir, backupFileName);

    // ایجاد دایرکتوری backups اگر وجود نداشته باشد
    try {
      await fs.access(backupDir);
    } catch {
      await fs.mkdir(backupDir, { recursive: true });
    }

    // اجرای دستور pg_dump
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

    // خواندن فایل بک‌آپ
    const backupData = await fs.readFile(backupPath);

    // حذف فایل موقت
    await fs.unlink(backupPath);

    // ارسال فایل به عنوان دانلود
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

    if (!file) {
      return NextResponse.json(
        { error: "فایل بک‌آپ ارسال نشده است" },
        { status: 400 }
      );
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
        await restorePrismaBackup(jsonData);

        return NextResponse.json({
          success: true,
          message: "دیتابیس با موفقیت از فایل JSON ریستور شد",
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
    // حذف query parameters از نام دیتابیس (مثل ?schema=public)
    const dbName = dbNameWithParams.split('?')[0];

    // ذخیره فایل موقت
    const backupDir = path.join(process.cwd(), "backups");
    const restoreFileName = `restore-${Date.now()}.sql`;
    const restorePath = path.join(backupDir, restoreFileName);

    // ایجاد دایرکتوری backups اگر وجود نداشته باشد
    try {
      await fs.access(backupDir);
    } catch {
      await fs.mkdir(backupDir, { recursive: true });
    }

    // ذخیره فایل
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(restorePath, buffer);

    try {
      // پاک کردن دیتابیس فعلی
      const dropCommand = `PGPASSWORD="${dbPassword}" psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d postgres -c "DROP DATABASE IF EXISTS ${dbName};"`;
      await execAsync(dropCommand);

      // ایجاد دیتابیس جدید
      const createCommand = `PGPASSWORD="${dbPassword}" psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d postgres -c "CREATE DATABASE ${dbName};"`;
      await execAsync(createCommand);

      // ریستور از بک‌آپ
      const restoreCommand = `PGPASSWORD="${dbPassword}" pg_restore -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -c "${restorePath}"`;
      await execAsync(restoreCommand);

      // حذف فایل موقت
      await fs.unlink(restorePath);

      return NextResponse.json({
        success: true,
        message: "دیتابیس با موفقیت ریستور شد",
      });
    } catch (error: any) {
      // حذف فایل موقت در صورت خطا
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
