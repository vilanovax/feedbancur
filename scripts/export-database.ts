import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function exportDatabase() {
  console.log("📦 شروع استخراج داده‌های دیتابیس...\n");

  try {
    // استخراج تمام داده‌ها
    const users = await prisma.user.findMany({
      include: {
        department: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const departments = await prisma.department.findMany({
      orderBy: { createdAt: "asc" },
    });

    const feedbacks = await prisma.feedback.findMany({
      include: {
        user: true,
        department: true,
        forwardedTo: true,
        completedBy: true,
        checklistItems: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const employees = await prisma.employee.findMany({
      include: {
        department: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const tasks = await prisma.task.findMany({
      include: {
        department: true,
        createdBy: true,
        feedback: true,
        assignedTo: {
          include: {
            employee: true,
            user: true,
          },
        },
        comments: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const announcements = await prisma.announcement.findMany({
      include: {
        department: true,
        createdBy: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const messages = await prisma.message.findMany({
      include: {
        sender: true,
        feedback: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // ساخت داده‌های خروجی
    const exportData = {
      exportedAt: new Date().toISOString(),
      users: users.map((u) => ({
        mobile: u.mobile,
        email: u.email,
        name: u.name,
        password: u.password, // نگه داشتن hash شده
        avatar: u.avatar,
        role: u.role,
        isActive: u.isActive,
        mustChangePassword: u.mustChangePassword,
        departmentName: u.department?.name || null,
      })),
      departments: departments.map((d) => {
        const manager = users.find((u) => u.id === d.managerId);
        return {
          name: d.name,
          description: d.description,
          keywords: d.keywords,
          managerMobile: manager?.mobile || null,
          allowDirectFeedback: d.allowDirectFeedback,
        };
      }),
      employees: employees.map((e) => ({
        name: e.name,
        position: e.position,
        departmentName: e.department.name,
      })),
      feedbacks: feedbacks.map((f) => ({
        title: f.title,
        content: f.content,
        image: f.image,
        rating: f.rating,
        type: f.type,
        status: f.status,
        isAnonymous: f.isAnonymous,
        departmentName: f.department.name,
        userMobile: f.user.mobile,
        forwardedToMobile: f.forwardedTo?.mobile || null,
        forwardedAt: f.forwardedAt?.toISOString() || null,
        completedById: f.completedBy?.mobile || null,
        completedAt: f.completedAt?.toISOString() || null,
        userResponse: f.userResponse,
        adminNotes: f.adminNotes,
        managerNotes: f.managerNotes,
        deletedAt: f.deletedAt?.toISOString() || null,
        createdAt: f.createdAt.toISOString(),
        checklistItems: f.checklistItems.map((item) => ({
          title: item.title,
          isCompleted: item.isCompleted,
          order: item.order,
        })),
      })),
      tasks: tasks.map((t) => ({
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        isPublic: t.isPublic,
        completedAt: t.completedAt?.toISOString() || null,
        departmentName: t.department.name,
        createdByMobile: t.createdBy.mobile,
        feedbackTitle: t.feedback?.title || null,
        assignedTo: t.assignedTo.map((a) => ({
          employeeName: a.employee?.name || null,
          userMobile: a.user?.mobile || null,
        })),
        comments: t.comments.map((c) => ({
          content: c.content,
          createdAt: c.createdAt.toISOString(),
        })),
      })),
      announcements: announcements.map((a) => ({
        title: a.title,
        content: a.content,
        priority: a.priority,
        isActive: a.isActive,
        scheduledAt: a.scheduledAt?.toISOString() || null,
        publishedAt: a.publishedAt?.toISOString() || null,
        departmentName: a.department?.name || null,
        createdByMobile: a.createdBy.mobile,
      })),
      messages: messages.map((m) => ({
        feedbackTitle: m.feedback.title,
        senderMobile: m.sender.mobile,
        content: m.content,
        isRead: m.isRead,
        readAt: m.readAt?.toISOString() || null,
        createdAt: m.createdAt.toISOString(),
      })),
    };

    // ذخیره در فایل JSON
    const exportPath = path.join(__dirname, "database-export.json");
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2), "utf-8");

    console.log("✅ داده‌ها با موفقیت استخراج شدند!");
    console.log(`📁 فایل ذخیره شده در: ${exportPath}`);
    console.log(`\n📊 آمار داده‌ها:`);
    console.log(`   - کاربران: ${users.length}`);
    console.log(`   - بخش‌ها: ${departments.length}`);
    console.log(`   - کارمندان: ${employees.length}`);
    console.log(`   - فیدبک‌ها: ${feedbacks.length}`);
    console.log(`   - وظایف: ${tasks.length}`);
    console.log(`   - اعلان‌ها: ${announcements.length}`);
    console.log(`   - پیام‌ها: ${messages.length}`);

    return exportData;
  } catch (error) {
    console.error("❌ خطا در استخراج داده‌ها:", error);
    throw error;
  }
}

exportDatabase()
  .catch((e) => {
    console.error("❌ خطا:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

