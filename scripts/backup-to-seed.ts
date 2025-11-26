import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

async function backupToSeed() {
  console.log("📦 شروع استخراج داده‌های دیتابیس و ذخیره در فایل seed...\n");

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
        checklistItems: {
          orderBy: { order: "asc" },
        },
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
        comments: {
          orderBy: { createdAt: "asc" },
        },
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

    console.log(`📊 داده‌های یافت شده:`);
    console.log(`   - کاربران: ${users.length}`);
    console.log(`   - بخش‌ها: ${departments.length}`);
    console.log(`   - کارمندان: ${employees.length}`);
    console.log(`   - فیدبک‌ها: ${feedbacks.length}`);
    console.log(`   - وظایف: ${tasks.length}`);
    console.log(`   - اعلان‌ها: ${announcements.length}`);
    console.log(`   - پیام‌ها: ${messages.length}\n`);

    // تولید کد seed
    let seedCode = `import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 شروع ایجاد داده‌های اولیه از backup...\\n");

`;

    // ایجاد بخش‌ها
    seedCode += `  // ایجاد بخش‌ها\n`;
    seedCode += `  const departments = [\n`;
    for (const dept of departments) {
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
    for (const user of users) {
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
      if (user.department) {
        seedCode += `        departmentId: createdDepartments.find((d) => d.name === ${JSON.stringify(user.department.name)})?.id,\n`;
      }
      seedCode += `      },\n`;
      seedCode += `    });\n`;
      seedCode += `    createdUsers.push(user);\n`;
      seedCode += `    console.log(\`✅ کاربر "\${user.name}" ایجاد شد\`);\n`;
      seedCode += `  }\n\n`;
    }

    // به‌روزرسانی بخش‌ها با مدیران
    seedCode += `  // اختصاص مدیران به بخش‌ها\n`;
    for (const dept of departments) {
      if (dept.managerId) {
        const manager = users.find((u) => u.id === dept.managerId);
        if (manager) {
          seedCode += `  {\n`;
          seedCode += `    const manager = createdUsers.find((u) => u.mobile === ${JSON.stringify(manager.mobile)});\n`;
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
    }

    // ایجاد کارمندان
    if (employees.length > 0) {
      seedCode += `  // ایجاد کارمندان\n`;
      for (const emp of employees) {
        seedCode += `  {\n`;
        seedCode += `    const existingEmployee = await prisma.employee.findFirst({\n`;
        seedCode += `      where: { \n`;
        seedCode += `        name: ${JSON.stringify(emp.name)},\n`;
        seedCode += `        departmentId: createdDepartments.find((d) => d.name === ${JSON.stringify(emp.department.name)})?.id,\n`;
        seedCode += `      },\n`;
        seedCode += `    });\n`;
        seedCode += `    if (!existingEmployee) {\n`;
        seedCode += `      await prisma.employee.create({\n`;
        seedCode += `        data: {\n`;
        seedCode += `          name: ${JSON.stringify(emp.name)},\n`;
        if (emp.position) {
          seedCode += `          position: ${JSON.stringify(emp.position)},\n`;
        }
        seedCode += `          departmentId: createdDepartments.find((d) => d.name === ${JSON.stringify(emp.department.name)})?.id!,\n`;
        seedCode += `        },\n`;
        seedCode += `      });\n`;
        seedCode += `      console.log(\`✅ کارمند "${emp.name}" ایجاد شد\`);\n`;
        seedCode += `    } else {\n`;
        seedCode += `      console.log(\`ℹ️  کارمند "${emp.name}" از قبل وجود دارد\`);\n`;
        seedCode += `    }\n`;
        seedCode += `  }\n\n`;
      }
    }

    // ایجاد فیدبک‌ها
    if (feedbacks.length > 0) {
      seedCode += `  // ایجاد فیدبک‌ها\n`;
      for (const feedback of feedbacks) {
        seedCode += `  {\n`;
        seedCode += `    const user = createdUsers.find((u) => u.mobile === ${JSON.stringify(feedback.user.mobile)});\n`;
        seedCode += `    const department = createdDepartments.find((d) => d.name === ${JSON.stringify(feedback.department.name)});\n`;
        seedCode += `    if (user && department) {\n`;
        if (feedback.forwardedTo) {
          seedCode += `      const forwardedTo = createdUsers.find((u) => u.mobile === ${JSON.stringify(feedback.forwardedTo.mobile)});\n`;
        } else {
          seedCode += `      const forwardedTo = null;\n`;
        }
        if (feedback.completedBy) {
          seedCode += `      const completedBy = createdUsers.find((u) => u.mobile === ${JSON.stringify(feedback.completedBy.mobile)});\n`;
        } else {
          seedCode += `      const completedBy = null;\n`;
        }
        seedCode += `      await prisma.feedback.create({\n`;
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
        if (feedback.forwardedTo) {
          seedCode += `          forwardedToId: forwardedTo?.id,\n`;
          if (feedback.forwardedAt) {
            seedCode += `          forwardedAt: new Date(${JSON.stringify(feedback.forwardedAt.toISOString())}),\n`;
          }
        }
        if (feedback.completedBy) {
          seedCode += `          completedById: completedBy?.id,\n`;
          if (feedback.completedAt) {
            seedCode += `          completedAt: new Date(${JSON.stringify(feedback.completedAt.toISOString())}),\n`;
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
          seedCode += `          deletedAt: new Date(${JSON.stringify(feedback.deletedAt.toISOString())}),\n`;
        }
        if (feedback.createdAt) {
          seedCode += `          createdAt: new Date(${JSON.stringify(feedback.createdAt.toISOString())}),\n`;
        }
        if (feedback.checklistItems && feedback.checklistItems.length > 0) {
          const checklistData = feedback.checklistItems.map((item: any) => ({
            title: item.title,
            isCompleted: item.isCompleted,
            order: item.order,
          }));
          seedCode += `          checklistItems: {\n`;
          seedCode += `            create: ${JSON.stringify(checklistData)},\n`;
          seedCode += `          },\n`;
        }
        seedCode += `        },\n`;
        seedCode += `      });\n`;
        seedCode += `      console.log(\`✅ فیدبک "${feedback.title}" ایجاد شد\`);\n`;
        seedCode += `    }\n`;
        seedCode += `  }\n\n`;
      }
    }

    // ایجاد وظایف
    if (tasks.length > 0) {
      seedCode += `  // ایجاد وظایف\n`;
      for (const task of tasks) {
        seedCode += `  {\n`;
        seedCode += `    const department = createdDepartments.find((d) => d.name === ${JSON.stringify(task.department.name)});\n`;
        seedCode += `    const createdBy = createdUsers.find((u) => u.mobile === ${JSON.stringify(task.createdBy.mobile)});\n`;
        seedCode += `    if (department && createdBy) {\n`;
        if (task.feedback) {
          seedCode += `      const feedback = await prisma.feedback.findFirst({\n`;
          seedCode += `        where: { title: ${JSON.stringify(task.feedback.title)} },\n`;
          seedCode += `      });\n`;
        } else {
          seedCode += `      const feedback = null;\n`;
        }
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
          seedCode += `          completedAt: new Date(${JSON.stringify(task.completedAt.toISOString())}),\n`;
        }
        seedCode += `          departmentId: department.id,\n`;
        seedCode += `          createdById: createdBy.id,\n`;
        if (task.feedback) {
          seedCode += `          feedbackId: feedback?.id,\n`;
        }
        if (task.comments && task.comments.length > 0) {
          const commentsData = task.comments.map((c: any) => ({
            content: c.content,
          }));
          seedCode += `          comments: {\n`;
          seedCode += `            create: ${JSON.stringify(commentsData)},\n`;
          seedCode += `          },\n`;
        }
        seedCode += `        },\n`;
        seedCode += `      });\n`;
        seedCode += `      console.log(\`✅ وظیفه "${task.title}" ایجاد شد\`);\n`;
        // اختصاص وظایف
        if (task.assignedTo && task.assignedTo.length > 0) {
          seedCode += `      // اختصاص وظایف\n`;
          for (const assignment of task.assignedTo) {
            if (assignment.employee) {
              seedCode += `      {\n`;
              seedCode += `        const employee = await prisma.employee.findFirst({\n`;
              seedCode += `          where: { \n`;
              seedCode += `            name: ${JSON.stringify(assignment.employee.name)},\n`;
              seedCode += `            departmentId: department.id,\n`;
              seedCode += `          },\n`;
              seedCode += `        });\n`;
              seedCode += `        if (employee) {\n`;
              seedCode += `          await prisma.taskAssignment.create({\n`;
              seedCode += `            data: {\n`;
              seedCode += `              taskId: createdTask.id,\n`;
              seedCode += `              employeeId: employee.id,\n`;
              seedCode += `            },\n`;
              seedCode += `          });\n`;
              seedCode += `        }\n`;
              seedCode += `      }\n`;
            } else if (assignment.user) {
              seedCode += `      {\n`;
              seedCode += `        const user = createdUsers.find((u) => u.mobile === ${JSON.stringify(assignment.user.mobile)});\n`;
              seedCode += `        if (user) {\n`;
              seedCode += `          await prisma.taskAssignment.create({\n`;
              seedCode += `            data: {\n`;
              seedCode += `              taskId: createdTask.id,\n`;
              seedCode += `              userId: user.id,\n`;
              seedCode += `            },\n`;
              seedCode += `          });\n`;
              seedCode += `        }\n`;
              seedCode += `      }\n`;
            }
          }
        }
        seedCode += `    }\n`;
        seedCode += `  }\n\n`;
      }
    }

    // ایجاد اعلان‌ها
    if (announcements.length > 0) {
      seedCode += `  // ایجاد اعلان‌ها\n`;
      for (const announcement of announcements) {
        seedCode += `  {\n`;
        seedCode += `    const createdBy = createdUsers.find((u) => u.mobile === ${JSON.stringify(announcement.createdBy.mobile)});\n`;
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
          seedCode += `          scheduledAt: new Date(${JSON.stringify(announcement.scheduledAt.toISOString())}),\n`;
        }
        if (announcement.publishedAt) {
          seedCode += `          publishedAt: new Date(${JSON.stringify(announcement.publishedAt.toISOString())}),\n`;
        }
        if (announcement.department) {
          seedCode += `          departmentId: createdDepartments.find((d) => d.name === ${JSON.stringify(announcement.department.name)})?.id,\n`;
        }
        seedCode += `          createdById: createdBy.id,\n`;
        seedCode += `        },\n`;
        seedCode += `      });\n`;
        seedCode += `      console.log(\`✅ اعلان "${announcement.title}" ایجاد شد\`);\n`;
        seedCode += `    }\n`;
        seedCode += `  }\n\n`;
      }
    }

    // ایجاد پیام‌ها
    if (messages.length > 0) {
      seedCode += `  // ایجاد پیام‌ها\n`;
      for (const message of messages) {
        seedCode += `  {\n`;
        seedCode += `    const feedback = await prisma.feedback.findFirst({\n`;
        seedCode += `      where: { title: ${JSON.stringify(message.feedback.title)} },\n`;
        seedCode += `    });\n`;
        seedCode += `    const sender = createdUsers.find((u) => u.mobile === ${JSON.stringify(message.sender.mobile)});\n`;
        seedCode += `    if (feedback && sender) {\n`;
        seedCode += `      await prisma.message.create({\n`;
        seedCode += `        data: {\n`;
        seedCode += `          feedbackId: feedback.id,\n`;
        seedCode += `          senderId: sender.id,\n`;
        seedCode += `          content: ${JSON.stringify(message.content)},\n`;
        seedCode += `          isRead: ${message.isRead},\n`;
        if (message.readAt) {
          seedCode += `          readAt: new Date(${JSON.stringify(message.readAt.toISOString())}),\n`;
        }
        if (message.createdAt) {
          seedCode += `          createdAt: new Date(${JSON.stringify(message.createdAt.toISOString())}),\n`;
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
    const seedPath = path.join(__dirname, "..", "scripts", "seed-data.ts");
    fs.writeFileSync(seedPath, seedCode, "utf-8");

    console.log("✅ فایل seed با موفقیت به‌روزرسانی شد!");
    console.log(`📁 فایل ذخیره شده در: ${seedPath}`);
    console.log(`\n💡 برای استفاده، دستور زیر را اجرا کنید:`);
    console.log(`   npx ts-node scripts/seed-data.ts`);
  } catch (error) {
    console.error("❌ خطا در استخراج و ذخیره داده‌ها:", error);
    throw error;
  }
}

backupToSeed()
  .catch((e) => {
    console.error("❌ خطا:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

