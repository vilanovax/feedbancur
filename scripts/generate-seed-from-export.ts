import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function generateSeedFromExport() {
  console.log("🌱 شروع تولید فایل seed از داده‌های دیتابیس...\n");

  try {
    // خواندن داده‌های استخراج شده
    const exportPath = path.join(__dirname, "database-export.json");
    
    if (!fs.existsSync(exportPath)) {
      console.error("❌ فایل database-export.json یافت نشد!");
      console.log("💡 ابتدا اسکریپت export-database.ts را اجرا کنید.");
      process.exit(1);
    }

    const exportData = JSON.parse(
      fs.readFileSync(exportPath, "utf-8")
    );

    // تولید کد seed
    let seedCode = `import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 شروع ایجاد داده‌های اولیه از export...\\n");

`;

    // ایجاد بخش‌ها
    seedCode += `  // ایجاد بخش‌ها\n`;
    seedCode += `  const departments = [\n`;
    for (const dept of exportData.departments) {
      seedCode += `    {\n`;
      seedCode += `      name: ${JSON.stringify(dept.name)},\n`;
      seedCode += `      description: ${JSON.stringify(dept.description || "")},\n`;
      seedCode += `      keywords: ${JSON.stringify(dept.keywords)},\n`;
      seedCode += `      allowDirectFeedback: ${dept.allowDirectFeedback},\n`;
      seedCode += `    },\n`;
    }
    seedCode += `  ];\n\n`;

    seedCode += `  const createdDepartments = [];\n`;
    seedCode += `  for (const dept of departments) {\n`;
    seedCode += `    const department = await prisma.department.upsert({\n`;
    seedCode += `      where: { name: dept.name },\n`;
    seedCode += `      update: {},\n`;
    seedCode += `      create: dept,\n`;
    seedCode += `    });\n`;
    seedCode += `    createdDepartments.push(department);\n`;
    seedCode += `    console.log(\`✅ بخش "\${dept.name}" ایجاد شد\`);\n`;
    seedCode += `  }\n\n`;

    // ایجاد کاربران
    seedCode += `  // ایجاد کاربران\n`;
    seedCode += `  const createdUsers = [];\n`;
    for (const user of exportData.users) {
      seedCode += `  {\n`;
      seedCode += `    const user = await prisma.user.upsert({\n`;
      seedCode += `      where: { mobile: ${JSON.stringify(user.mobile)} },\n`;
      seedCode += `      update: {},\n`;
      seedCode += `      create: {\n`;
      seedCode += `        mobile: ${JSON.stringify(user.mobile)},\n`;
      seedCode += `        email: ${JSON.stringify(user.email || "")},\n`;
      seedCode += `        name: ${JSON.stringify(user.name)},\n`;
      seedCode += `        password: ${JSON.stringify(user.password)},\n`;
      if (user.avatar) {
        seedCode += `        avatar: ${JSON.stringify(user.avatar)},\n`;
      }
      seedCode += `        role: ${JSON.stringify(user.role)},\n`;
      seedCode += `        isActive: ${user.isActive},\n`;
      seedCode += `        mustChangePassword: ${user.mustChangePassword},\n`;
      if (user.departmentName) {
        seedCode += `        departmentId: createdDepartments.find((d) => d.name === ${JSON.stringify(user.departmentName)})?.id,\n`;
      }
      seedCode += `      },\n`;
      seedCode += `    });\n`;
      seedCode += `    createdUsers.push(user);\n`;
      seedCode += `    console.log(\`✅ کاربر "\${user.name}" ایجاد شد\`);\n`;
      seedCode += `  }\n\n`;
    }

    // به‌روزرسانی بخش‌ها با مدیران
    seedCode += `  // اختصاص مدیران به بخش‌ها\n`;
    for (const dept of exportData.departments) {
      if (dept.managerMobile) {
        seedCode += `  {\n`;
        seedCode += `    const manager = createdUsers.find((u) => u.mobile === ${JSON.stringify(dept.managerMobile)});\n`;
        seedCode += `    const department = createdDepartments.find((d) => d.name === ${JSON.stringify(dept.name)});\n`;
        seedCode += `    if (manager && department) {\n`;
        seedCode += `      await prisma.department.update({\n`;
        seedCode += `        where: { id: department.id },\n`;
        seedCode += `        data: { managerId: manager.id },\n`;
        seedCode += `      });\n`;
        seedCode += `      console.log(\`✅ مدیر به بخش "\${dept.name}" اختصاص داده شد\`);\n`;
        seedCode += `    }\n`;
        seedCode += `  }\n\n`;
      }
    }

    // ایجاد کارمندان
    if (exportData.employees.length > 0) {
      seedCode += `  // ایجاد کارمندان\n`;
      for (const emp of exportData.employees) {
        seedCode += `  await prisma.employee.upsert({\n`;
        seedCode += `    where: { id: "temp" },\n`;
        seedCode += `    update: {},\n`;
        seedCode += `    create: {\n`;
        seedCode += `      name: ${JSON.stringify(emp.name)},\n`;
        if (emp.position) {
          seedCode += `      position: ${JSON.stringify(emp.position)},\n`;
        }
        seedCode += `      departmentId: createdDepartments.find((d) => d.name === ${JSON.stringify(emp.departmentName)})?.id!,\n`;
        seedCode += `    },\n`;
        seedCode += `  });\n`;
        seedCode += `  console.log(\`✅ کارمند "\${emp.name}" ایجاد شد\`);\n\n`;
      }
    }

    // ایجاد فیدبک‌ها
    if (exportData.feedbacks.length > 0) {
      seedCode += `  // ایجاد فیدبک‌ها\n`;
      for (const feedback of exportData.feedbacks) {
        seedCode += `  {\n`;
        seedCode += `    const user = createdUsers.find((u) => u.mobile === ${JSON.stringify(feedback.userMobile)});\n`;
        seedCode += `    const department = createdDepartments.find((d) => d.name === ${JSON.stringify(feedback.departmentName)});\n`;
        seedCode += `    if (user && department) {\n`;
        seedCode += `      const forwardedTo = feedback.forwardedToMobile ? createdUsers.find((u) => u.mobile === ${JSON.stringify(feedback.forwardedToMobile)}) : null;\n`;
        seedCode += `      const completedBy = feedback.completedById ? createdUsers.find((u) => u.mobile === ${JSON.stringify(feedback.completedById)}) : null;\n`;
        seedCode += `      const createdFeedback = await prisma.feedback.create({\n`;
        seedCode += `        data: {\n`;
        seedCode += `          title: ${JSON.stringify(feedback.title)},\n`;
        seedCode += `          content: ${JSON.stringify(feedback.content)},\n`;
        if (feedback.image) {
          seedCode += `          image: ${JSON.stringify(feedback.image)},\n`;
        }
        if (feedback.rating !== null) {
          seedCode += `          rating: ${feedback.rating},\n`;
        }
        seedCode += `          type: ${JSON.stringify(feedback.type)},\n`;
        seedCode += `          status: ${JSON.stringify(feedback.status)},\n`;
        seedCode += `          isAnonymous: ${feedback.isAnonymous},\n`;
        seedCode += `          departmentId: department.id,\n`;
        seedCode += `          userId: user.id,\n`;
        if (feedback.forwardedToMobile) {
          seedCode += `          forwardedToId: createdUsers.find((u) => u.mobile === ${JSON.stringify(feedback.forwardedToMobile)})?.id,\n`;
          if (feedback.forwardedAt) {
            seedCode += `          forwardedAt: new Date(${JSON.stringify(feedback.forwardedAt)}),\n`;
          }
        }
        if (feedback.completedById) {
          seedCode += `          completedById: createdUsers.find((u) => u.mobile === ${JSON.stringify(feedback.completedById)})?.id,\n`;
          if (feedback.completedAt) {
            seedCode += `          completedAt: new Date(${JSON.stringify(feedback.completedAt)}),\n`;
          }
        }
        if (feedback.userResponse) {
          seedCode += `          userResponse: ${JSON.stringify(feedback.userResponse)},\n`;
        }
        if (feedback.adminNotes) {
          seedCode += `          adminNotes: ${JSON.stringify(feedback.adminNotes)},\n`;
        }
        if (feedback.managerNotes) {
          seedCode += `          managerNotes: ${JSON.stringify(feedback.managerNotes)},\n`;
        }
        if (feedback.deletedAt) {
          seedCode += `          deletedAt: new Date(${JSON.stringify(feedback.deletedAt)}),\n`;
        }
        if (feedback.createdAt) {
          seedCode += `          createdAt: new Date(${JSON.stringify(feedback.createdAt)}),\n`;
        }
        if (feedback.checklistItems && feedback.checklistItems.length > 0) {
          seedCode += `          checklistItems: {\n`;
          seedCode += `            create: ${JSON.stringify(feedback.checklistItems)},\n`;
          seedCode += `          },\n`;
        }
        seedCode += `        },\n`;
        seedCode += `      });\n`;
        seedCode += `      console.log(\`✅ فیدبک "\${feedback.title}" ایجاد شد\`);\n`;
        seedCode += `    }\n`;
        seedCode += `  }\n\n`;
      }
    }

    // ایجاد وظایف
    if (exportData.tasks.length > 0) {
      seedCode += `  // ایجاد وظایف\n`;
      for (const task of exportData.tasks) {
        seedCode += `  {\n`;
        seedCode += `    const department = createdDepartments.find((d) => d.name === ${JSON.stringify(task.departmentName)});\n`;
        seedCode += `    const createdBy = createdUsers.find((u) => u.mobile === ${JSON.stringify(task.createdByMobile)});\n`;
        seedCode += `    if (department && createdBy) {\n`;
        seedCode += `      const feedback = task.feedbackTitle ? await prisma.feedback.findFirst({\n`;
        seedCode += `        where: { title: ${JSON.stringify(task.feedbackTitle)} },\n`;
        seedCode += `      }) : null;\n`;
        seedCode += `      const createdTask = await prisma.task.create({\n`;
        seedCode += `        data: {\n`;
        seedCode += `          title: ${JSON.stringify(task.title)},\n`;
        seedCode += `          description: ${JSON.stringify(task.description)},\n`;
        seedCode += `          status: ${JSON.stringify(task.status)},\n`;
        if (task.priority) {
          seedCode += `          priority: ${JSON.stringify(task.priority)},\n`;
        }
        seedCode += `          isPublic: ${task.isPublic},\n`;
        if (task.completedAt) {
          seedCode += `          completedAt: new Date(${JSON.stringify(task.completedAt)}),\n`;
        }
        seedCode += `          departmentId: department.id,\n`;
        seedCode += `          createdById: createdBy.id,\n`;
        if (task.feedbackTitle) {
          seedCode += `          feedbackId: (await prisma.feedback.findFirst({ where: { title: ${JSON.stringify(task.feedbackTitle)} } }))?.id,\n`;
        }
        if (task.comments && task.comments.length > 0) {
          seedCode += `          comments: {\n`;
          seedCode += `            create: ${JSON.stringify(task.comments.map((c: any) => ({ content: c.content })))},\n`;
          seedCode += `          },\n`;
        }
        seedCode += `        },\n`;
        seedCode += `      });\n`;
        seedCode += `      console.log(\`✅ وظیفه "\${task.title}" ایجاد شد\`);\n`;
        seedCode += `    }\n`;
        seedCode += `  }\n\n`;
      }
    }

    // ایجاد اعلان‌ها
    if (exportData.announcements.length > 0) {
      seedCode += `  // ایجاد اعلان‌ها\n`;
      for (const announcement of exportData.announcements) {
        seedCode += `  {\n`;
        seedCode += `    const createdBy = createdUsers.find((u) => u.mobile === ${JSON.stringify(announcement.createdByMobile)});\n`;
        seedCode += `    if (createdBy) {\n`;
        seedCode += `      await prisma.announcement.create({\n`;
        seedCode += `        data: {\n`;
        seedCode += `          title: ${JSON.stringify(announcement.title)},\n`;
        seedCode += `          content: ${JSON.stringify(announcement.content)},\n`;
        if (announcement.priority) {
          seedCode += `          priority: ${JSON.stringify(announcement.priority)},\n`;
        }
        seedCode += `          isActive: ${announcement.isActive},\n`;
        if (announcement.scheduledAt) {
          seedCode += `          scheduledAt: new Date(${JSON.stringify(announcement.scheduledAt)}),\n`;
        }
        if (announcement.publishedAt) {
          seedCode += `          publishedAt: new Date(${JSON.stringify(announcement.publishedAt)}),\n`;
        }
        if (announcement.departmentName) {
          seedCode += `          departmentId: createdDepartments.find((d) => d.name === ${JSON.stringify(announcement.departmentName)})?.id,\n`;
        }
        seedCode += `          createdById: createdBy.id,\n`;
        seedCode += `        },\n`;
        seedCode += `      });\n`;
        seedCode += `      console.log(\`✅ اعلان "\${announcement.title}" ایجاد شد\`);\n`;
        seedCode += `    }\n`;
        seedCode += `  }\n\n`;
      }
    }

    // ایجاد پیام‌ها
    if (exportData.messages.length > 0) {
      seedCode += `  // ایجاد پیام‌ها\n`;
      for (const message of exportData.messages) {
        seedCode += `  {\n`;
        seedCode += `    const feedback = await prisma.feedback.findFirst({\n`;
        seedCode += `      where: { title: ${JSON.stringify(message.feedbackTitle)} },\n`;
        seedCode += `    });\n`;
        seedCode += `    const sender = createdUsers.find((u) => u.mobile === ${JSON.stringify(message.senderMobile)});\n`;
        seedCode += `    if (feedback && sender) {\n`;
        seedCode += `      await prisma.message.create({\n`;
        seedCode += `        data: {\n`;
        seedCode += `          feedbackId: feedback.id,\n`;
        seedCode += `          senderId: sender.id,\n`;
        seedCode += `          content: ${JSON.stringify(message.content)},\n`;
        seedCode += `          isRead: ${message.isRead},\n`;
        if (message.readAt) {
          seedCode += `          readAt: new Date(${JSON.stringify(message.readAt)}),\n`;
        }
        if (message.createdAt) {
          seedCode += `          createdAt: new Date(${JSON.stringify(message.createdAt)}),\n`;
        }
        seedCode += `        },\n`;
        seedCode += `      });\n`;
        seedCode += `      console.log(\`✅ پیام ایجاد شد\`);\n`;
        seedCode += `    }\n`;
        seedCode += `  }\n\n`;
      }
    }

    seedCode += `  console.log("\\n🎉 تمام داده‌ها با موفقیت ایجاد شدند!");\n`;
    seedCode += `}\n\n`;

    seedCode += `main()\n`;
    seedCode += `  .catch((e) => {\n`;
    seedCode += `    console.error("❌ خطا در ایجاد داده‌ها:", e);\n`;
    seedCode += `    process.exit(1);\n`;
    seedCode += `  })\n`;
    seedCode += `  .finally(async () => {\n`;
    seedCode += `    await prisma.$disconnect();\n`;
    seedCode += `  });\n`;

    // ذخیره فایل seed
    const seedPath = path.join(__dirname, "seed-data-from-export.ts");
    fs.writeFileSync(seedPath, seedCode, "utf-8");

    console.log("✅ فایل seed با موفقیت تولید شد!");
    console.log(`📁 فایل ذخیره شده در: ${seedPath}`);
    console.log(`\n💡 برای استفاده، فایل seed-data.ts را با این فایل جایگزین کنید.`);
  } catch (error) {
    console.error("❌ خطا در تولید فایل seed:", error);
    throw error;
  }
}

generateSeedFromExport()
  .catch((e) => {
    console.error("❌ خطا:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

