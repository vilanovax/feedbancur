import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function backupToSeed() {
  console.log("📦 شروع استخراج کامل داده‌های دیتابیس و ذخیره در فایل seed...\n");

  try {
    // استخراج تمام داده‌ها
    console.log("📥 در حال خواندن داده‌ها از دیتابیس...\n");

    const settings = await prisma.settings.findMany({
      orderBy: { createdAt: "asc" },
    });

    const departments = await prisma.department.findMany({
      orderBy: { createdAt: "asc" },
    });

    const users = await prisma.user.findMany({
      include: {
        department: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const assessments = await prisma.assessment.findMany({
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
        assignments: {
          include: {
            department: true,
          },
        },
        createdBy: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const assessmentResults = await prisma.assessmentResult.findMany({
      include: {
        user: true,
        assessment: true,
      },
      orderBy: { completedAt: "asc" },
    });

    const assessmentProgress = await prisma.assessmentProgress.findMany({
      include: {
        user: true,
        assessment: true,
      },
      orderBy: { startedAt: "asc" },
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

    const polls = await prisma.poll.findMany({
      include: {
        createdBy: true,
        options: {
          orderBy: { order: "asc" },
        },
        responses: {
          include: {
            user: true,
            option: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const notifications = await prisma.notification.findMany({
      include: {
        user: true,
        feedback: true,
      },
      orderBy: { createdAt: "asc" },
    });

    console.log(`📊 داده‌های یافت شده:`);
    console.log(`   - تنظیمات: ${settings.length}`);
    console.log(`   - بخش‌ها: ${departments.length}`);
    console.log(`   - کاربران: ${users.length}`);
    console.log(`   - آزمون‌ها: ${assessments.length}`);
    console.log(`   - نتایج آزمون‌ها: ${assessmentResults.length}`);
    console.log(`   - پیشرفت آزمون‌ها: ${assessmentProgress.length}`);
    console.log(`   - کارمندان: ${employees.length}`);
    console.log(`   - فیدبک‌ها: ${feedbacks.length}`);
    console.log(`   - وظایف: ${tasks.length}`);
    console.log(`   - اعلان‌ها: ${announcements.length}`);
    console.log(`   - پیام‌ها: ${messages.length}`);
    console.log(`   - نظرسنجی‌ها: ${polls.length}`);
    console.log(`   - نوتیفیکیشن‌ها: ${notifications.length}\n`);

    // تولید کد seed
    let seedCode = `import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 شروع ایجاد داده‌های اولیه از backup کامل...\\n");

`;

    // ایجاد تنظیمات
    if (settings.length > 0) {
      seedCode += `  // ایجاد تنظیمات\n`;
      for (const setting of settings) {
        seedCode += `  await prisma.settings.upsert({\n`;
        seedCode += `    where: { id: ${JSON.stringify(setting.id)} },\n`;
        seedCode += `    update: {},\n`;
        seedCode += `    create: {\n`;
        seedCode += `      id: ${JSON.stringify(setting.id)},\n`;
        seedCode += `      siteName: ${JSON.stringify(setting.siteName)},\n`;
        if (setting.siteDescription) {
          seedCode += `      siteDescription: ${JSON.stringify(setting.siteDescription)},\n`;
        }
        seedCode += `      language: ${JSON.stringify(setting.language)},\n`;
        seedCode += `      timezone: ${JSON.stringify(setting.timezone)},\n`;
        if (setting.logoUrl) {
          seedCode += `      logoUrl: ${JSON.stringify(setting.logoUrl)},\n`;
        }
        seedCode += `      emailNotifications: ${setting.emailNotifications},\n`;
        seedCode += `      smsNotifications: ${setting.smsNotifications},\n`;
        seedCode += `      pushNotifications: ${setting.pushNotifications},\n`;
        seedCode += `      requirePasswordChange: ${setting.requirePasswordChange},\n`;
        seedCode += `      sessionTimeout: ${setting.sessionTimeout},\n`;
        seedCode += `      twoFactorAuth: ${setting.twoFactorAuth},\n`;
        seedCode += `      allowAnonymous: ${setting.allowAnonymous},\n`;
        seedCode += `      autoArchiveDays: ${setting.autoArchiveDays},\n`;
        seedCode += `      maxFeedbackLength: ${setting.maxFeedbackLength},\n`;
        seedCode += `      itemsPerPage: ${setting.itemsPerPage},\n`;
        seedCode += `      theme: ${JSON.stringify(setting.theme)},\n`;
        if (setting.statusTexts) {
          seedCode += `      statusTexts: ${JSON.stringify(setting.statusTexts)},\n`;
        }
        if (setting.feedbackTypes) {
          seedCode += `      feedbackTypes: ${JSON.stringify(setting.feedbackTypes)},\n`;
        }
        if (setting.notificationSettings) {
          seedCode += `      notificationSettings: ${JSON.stringify(setting.notificationSettings)},\n`;
        }
        if (setting.chatSettings) {
          seedCode += `      chatSettings: ${JSON.stringify(setting.chatSettings)},\n`;
        }
        if (setting.objectStorageSettings) {
          seedCode += `      objectStorageSettings: ${JSON.stringify(setting.objectStorageSettings)},\n`;
        }
        if (setting.workingHoursSettings) {
          seedCode += `      workingHoursSettings: ${JSON.stringify(setting.workingHoursSettings)},\n`;
        }
        if (setting.openAISettings) {
          seedCode += `      openAISettings: ${JSON.stringify(setting.openAISettings)},\n`;
        }
        seedCode += `    },\n`;
        seedCode += `  });\n`;
        seedCode += `  console.log(\`✅ تنظیمات ایجاد شد\`);\n\n`;
      }
    }

    // ایجاد بخش‌ها
    seedCode += `  // ایجاد بخش‌ها\n`;
    seedCode += `  const departments = [\n`;
    for (const dept of departments) {
      seedCode += `    {\n`;
      seedCode += `      name: ${JSON.stringify(dept.name)},\n`;
      seedCode += `      description: ${JSON.stringify(dept.description || "")},\n`;
      seedCode += `      keywords: ${JSON.stringify(dept.keywords)},\n`;
      seedCode += `      allowDirectFeedback: ${dept.allowDirectFeedback},\n`;
      seedCode += `      canCreateAnnouncement: ${dept.canCreateAnnouncement},\n`;
      seedCode += `      allowedAnnouncementDepartments: ${JSON.stringify(dept.allowedAnnouncementDepartments)},\n`;
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

    // ایجاد آزمون‌ها
    if (assessments.length > 0) {
      seedCode += `  // ایجاد آزمون‌ها\n`;
      for (const assessment of assessments) {
        seedCode += `  {\n`;
        seedCode += `    const createdBy = createdUsers.find((u) => u.mobile === ${JSON.stringify(assessment.createdBy.mobile)});\n`;
        seedCode += `    if (createdBy) {\n`;
        seedCode += `      const assessment = await prisma.assessment.upsert({\n`;
        seedCode += `        where: { id: ${JSON.stringify(assessment.id)} },\n`;
        seedCode += `        update: {},\n`;
        seedCode += `        create: {\n`;
        seedCode += `          id: ${JSON.stringify(assessment.id)},\n`;
        seedCode += `          title: ${JSON.stringify(assessment.title)},\n`;
        seedCode += `          description: ${JSON.stringify(assessment.description || "")},\n`;
        seedCode += `          type: ${JSON.stringify(assessment.type)},\n`;
        seedCode += `          isActive: ${assessment.isActive},\n`;
        seedCode += `          createdById: createdBy.id,\n`;
        if (assessment.questions && assessment.questions.length > 0) {
          const questionsData = assessment.questions.map((q: any) => ({
            id: q.id,
            text: q.text,
            type: q.type,
            order: q.order,
            options: q.options,
            required: q.required,
          }));
          seedCode += `          questions: {\n`;
          seedCode += `            create: ${JSON.stringify(questionsData)},\n`;
          seedCode += `          },\n`;
        }
        seedCode += `        },\n`;
        seedCode += `      });\n`;
        seedCode += `      console.log(\`✅ آزمون "${assessment.title}" ایجاد شد\`);\n`;
        
        // ایجاد اختصاصات آزمون
        if (assessment.assignments && assessment.assignments.length > 0) {
          seedCode += `      // اختصاص آزمون به بخش‌ها\n`;
          for (const assignment of assessment.assignments) {
            seedCode += `      {\n`;
            seedCode += `        const department = createdDepartments.find((d) => d.name === ${JSON.stringify(assignment.department.name)});\n`;
            seedCode += `        if (department) {\n`;
            seedCode += `          await prisma.assessmentAssignment.upsert({\n`;
            seedCode += `            where: { id: ${JSON.stringify(assignment.id)} },\n`;
            seedCode += `            update: {},\n`;
            seedCode += `            create: {\n`;
            seedCode += `              id: ${JSON.stringify(assignment.id)},\n`;
            seedCode += `              assessmentId: assessment.id,\n`;
            seedCode += `              departmentId: department.id,\n`;
            if (assignment.dueDate) {
              seedCode += `              dueDate: new Date(${JSON.stringify(assignment.dueDate.toISOString())}),\n`;
            }
            seedCode += `            },\n`;
            seedCode += `          });\n`;
            seedCode += `        }\n`;
            seedCode += `      }\n`;
          }
        }
        seedCode += `    }\n`;
        seedCode += `  }\n\n`;
      }
    }

    // ایجاد نتایج آزمون‌ها
    if (assessmentResults.length > 0) {
      seedCode += `  // ایجاد نتایج آزمون‌ها\n`;
      for (const result of assessmentResults) {
        seedCode += `  {\n`;
        seedCode += `    const user = createdUsers.find((u) => u.mobile === ${JSON.stringify(result.user.mobile)});\n`;
        seedCode += `    const assessment = await prisma.assessment.findUnique({ where: { id: ${JSON.stringify(result.assessment.id)} } });\n`;
        seedCode += `    if (user && assessment) {\n`;
        seedCode += `      await prisma.assessmentResult.upsert({\n`;
        seedCode += `        where: { id: ${JSON.stringify(result.id)} },\n`;
        seedCode += `        update: {},\n`;
        seedCode += `        create: {\n`;
        seedCode += `          id: ${JSON.stringify(result.id)},\n`;
        seedCode += `          assessmentId: assessment.id,\n`;
        seedCode += `          userId: user.id,\n`;
        if (result.score !== null) {
          seedCode += `          score: ${result.score},\n`;
        }
        if (result.isPassed !== null) {
          seedCode += `          isPassed: ${result.isPassed},\n`;
        }
        if (result.answers) {
          seedCode += `          answers: ${JSON.stringify(result.answers)},\n`;
        }
        if (result.result) {
          seedCode += `          result: ${JSON.stringify(result.result)},\n`;
        }
        if (result.timeTaken !== null) {
          seedCode += `          timeTaken: ${result.timeTaken},\n`;
        }
        if (result.completedAt) {
          seedCode += `          completedAt: new Date(${JSON.stringify(result.completedAt.toISOString())}),\n`;
        }
        seedCode += `        },\n`;
        seedCode += `      });\n`;
        seedCode += `      console.log(\`✅ نتیجه آزمون برای کاربر "\${user.name}" ایجاد شد\`);\n`;
        seedCode += `    }\n`;
        seedCode += `  }\n\n`;
      }
    }

    // ایجاد پیشرفت آزمون‌ها
    if (assessmentProgress.length > 0) {
      seedCode += `  // ایجاد پیشرفت آزمون‌ها\n`;
      for (const progress of assessmentProgress) {
        seedCode += `  {\n`;
        seedCode += `    const user = createdUsers.find((u) => u.mobile === ${JSON.stringify(progress.user.mobile)});\n`;
        seedCode += `    const assessment = await prisma.assessment.findUnique({ where: { id: ${JSON.stringify(progress.assessment.id)} } });\n`;
        seedCode += `    if (user && assessment) {\n`;
        seedCode += `      await prisma.assessmentProgress.upsert({\n`;
        seedCode += `        where: { id: ${JSON.stringify(progress.id)} },\n`;
        seedCode += `        update: {},\n`;
        seedCode += `        create: {\n`;
        seedCode += `          id: ${JSON.stringify(progress.id)},\n`;
        seedCode += `          assessmentId: assessment.id,\n`;
        seedCode += `          userId: user.id,\n`;
        seedCode += `          lastQuestion: ${progress.lastQuestion},\n`;
        if (progress.answers) {
          seedCode += `          answers: ${JSON.stringify(progress.answers)},\n`;
        }
        if (progress.startedAt) {
          seedCode += `          startedAt: new Date(${JSON.stringify(progress.startedAt.toISOString())}),\n`;
        }
        // updatedAt به صورت خودکار به‌روز می‌شود
        seedCode += `        },\n`;
        seedCode += `      });\n`;
        seedCode += `      console.log(\`✅ پیشرفت آزمون برای کاربر "\${user.name}" ایجاد شد\`);\n`;
        seedCode += `    }\n`;
        seedCode += `  }\n\n`;
      }
    }

    // ایجاد کارمندان (از backup-to-seed.ts کپی شده)
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

    // ایجاد نظرسنجی‌ها
    if (polls.length > 0) {
      seedCode += `  // ایجاد نظرسنجی‌ها\n`;
      for (const poll of polls) {
        seedCode += `  {\n`;
        seedCode += `    const createdBy = createdUsers.find((u) => u.mobile === ${JSON.stringify(poll.createdBy.mobile)});\n`;
        seedCode += `    if (createdBy) {\n`;
        seedCode += `      const poll = await prisma.poll.create({\n`;
        seedCode += `        data: {\n`;
        seedCode += `          title: ${JSON.stringify(poll.title)},\n`;
        if (poll.description) {
          seedCode += `          description: ${JSON.stringify(poll.description)},\n`;
        }
        seedCode += `          type: ${JSON.stringify(poll.type)},\n`;
        seedCode += `          visibilityMode: ${JSON.stringify(poll.visibilityMode)},\n`;
        seedCode += `          isActive: ${poll.isActive},\n`;
        seedCode += `          allowMultipleVotes: ${poll.allowMultipleVotes},\n`;
        seedCode += `          isRequired: ${poll.isRequired},\n`;
        seedCode += `          showResultsMode: ${JSON.stringify(poll.showResultsMode)},\n`;
        if (poll.maxTextLength) {
          seedCode += `          maxTextLength: ${poll.maxTextLength},\n`;
        }
        if (poll.scheduledAt) {
          seedCode += `          scheduledAt: new Date(${JSON.stringify(poll.scheduledAt.toISOString())}),\n`;
        }
        if (poll.publishedAt) {
          seedCode += `          publishedAt: new Date(${JSON.stringify(poll.publishedAt.toISOString())}),\n`;
        }
        if (poll.closedAt) {
          seedCode += `          closedAt: new Date(${JSON.stringify(poll.closedAt.toISOString())}),\n`;
        }
        seedCode += `          createdById: createdBy.id,\n`;
        if (poll.options && poll.options.length > 0) {
          const optionsData = poll.options.map((opt: any) => ({
            text: opt.text,
            order: opt.order,
          }));
          seedCode += `          options: {\n`;
          seedCode += `            create: ${JSON.stringify(optionsData)},\n`;
          seedCode += `          },\n`;
        }
        seedCode += `        },\n`;
        seedCode += `      });\n`;
        seedCode += `      console.log(\`✅ نظرسنجی "${poll.title}" ایجاد شد\`);\n`;
        seedCode += `    }\n`;
        seedCode += `  }\n\n`;
      }
    }

    // ایجاد نوتیفیکیشن‌ها
    if (notifications.length > 0) {
      seedCode += `  // ایجاد نوتیفیکیشن‌ها\n`;
      for (const notif of notifications) {
        seedCode += `  {\n`;
        seedCode += `    const user = createdUsers.find((u) => u.mobile === ${JSON.stringify(notif.user.mobile)});\n`;
        seedCode += `    if (user) {\n`;
        if (notif.feedback) {
          seedCode += `      const feedback = await prisma.feedback.findFirst({\n`;
          seedCode += `        where: { title: ${JSON.stringify(notif.feedback.title)} },\n`;
          seedCode += `      });\n`;
        } else {
          seedCode += `      const feedback = null;\n`;
        }
        seedCode += `      await prisma.notification.create({\n`;
        seedCode += `        data: {\n`;
        seedCode += `          userId: user.id,\n`;
        if (notif.feedback) {
          seedCode += `          feedbackId: feedback?.id,\n`;
        }
        seedCode += `          title: ${JSON.stringify(notif.title)},\n`;
        seedCode += `          content: ${JSON.stringify(notif.content)},\n`;
        seedCode += `          type: ${JSON.stringify(notif.type)},\n`;
        if (notif.redirectUrl) {
          seedCode += `          redirectUrl: ${JSON.stringify(notif.redirectUrl)},\n`;
        }
        seedCode += `          isRead: ${notif.isRead},\n`;
        if (notif.readAt) {
          seedCode += `          readAt: new Date(${JSON.stringify(notif.readAt.toISOString())}),\n`;
        }
        seedCode += `        },\n`;
        seedCode += `      });\n`;
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
    const seedPath = path.join(process.cwd(), "prisma", "seed-complete.ts");
    fs.writeFileSync(seedPath, seedCode, "utf-8");

    console.log("✅ فایل seed کامل با موفقیت ایجاد شد!");
    console.log(`📁 فایل ذخیره شده در: ${seedPath}`);
    console.log(`\n💡 برای استفاده، دستور زیر را اجرا کنید:`);
    console.log(`   npx tsx prisma/seed-complete.ts`);
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

