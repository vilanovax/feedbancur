import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 شروع ایجاد داده‌های اولیه از backup...\n");

  // ایجاد بخش‌ها
  const departments = [
    {
      name: "IT",
      description: "بخش فناوری اطلاعات",
      keywords: ["کامپیوتر","سیستم","شبکه","اینترنت","نرم‌افزار","IT"],
      allowDirectFeedback: false,
    },
    {
      name: "مالی",
      description: "بخش مالی و حسابداری",
      keywords: ["مالی","حقوق","پرداخت","حساب","فیش","پول"],
      allowDirectFeedback: false,
    },
    {
      name: "اداری",
      description: "امور اداری",
      keywords: ["اداری","مدارک","نامه","چراغ","برق","تعمیرات"],
      allowDirectFeedback: false,
    },
    {
      name: "آشپزخانه",
      description: "مدیریت امور آشپزخانه و غذا",
      keywords: ["آشپزخانه","غذا","نهار","صبحانه","ناهار","شام"],
      allowDirectFeedback: false,
    },
  ];

  const createdDepartments = [];
  for (const dept of departments) {
    const department = await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: dept,
    });
    createdDepartments.push(department);
    console.log(`✅ بخش "${dept.name}" ایجاد شد`);
  }

  // ایجاد کاربران
  const createdUsers = [];
  {
    const user = await prisma.user.upsert({
      where: { mobile: "09123456789" },
      update: {},
      create: {
        mobile: "09123456789",
        email: "admin@company.com",
        name: "مدیر سیستم",
        password: "$2a$10$k5zCKA4K0YFeu.eE.4WpduRjdtDLm26cGkhryhACzj1Su94DEGJvu",
        role: "ADMIN",
        isActive: true,
        mustChangePassword: false,
      },
    });
    createdUsers.push(user);
    console.log(`✅ کاربر "${user.name}" ایجاد شد`);
  }

  {
    const user = await prisma.user.upsert({
      where: { mobile: "09123322111" },
      update: {},
      create: {
        mobile: "09123322111",
        email: "farzad@company.com",
        name: "فرزاد زارع",
        password: "$2a$10$1wGkI6PMaLUAMzIebhuxhufVTEnzsvYtog2CsnWoaJ/fvHVJ7W.06",
        role: "MANAGER",
        isActive: true,
        mustChangePassword: false,
        departmentId: createdDepartments.find((d) => d.name === "IT")?.id,
      },
    });
    createdUsers.push(user);
    console.log(`✅ کاربر "${user.name}" ایجاد شد`);
  }

  {
    const user = await prisma.user.upsert({
      where: { mobile: "09123322112" },
      update: {},
      create: {
        mobile: "09123322112",
        email: "employee1@company.com",
        name: "حدیث نعمتی",
        password: "$2a$10$4OibIk1Gx9wO7XXJhcfCQeHTVYsvdQSM3494LoIUHFupDAB.GZM1a",
        role: "MANAGER",
        isActive: true,
        mustChangePassword: false,
        departmentId: createdDepartments.find((d) => d.name === "اداری")?.id,
      },
    });
    createdUsers.push(user);
    console.log(`✅ کاربر "${user.name}" ایجاد شد`);
  }

  {
    const user = await prisma.user.upsert({
      where: { mobile: "09123322114" },
      update: {},
      create: {
        mobile: "09123322114",
        email: "employee2@company.com",
        name: "میلاد برهانی",
        password: "$2a$10$0dO5G9pbJGiDBsLeqa18su5FS1ss/D0Rj1RWEHcVGZK1amIg0b8AO",
        role: "EMPLOYEE",
        isActive: true,
        mustChangePassword: false,
        departmentId: createdDepartments.find((d) => d.name === "مالی")?.id,
      },
    });
    createdUsers.push(user);
    console.log(`✅ کاربر "${user.name}" ایجاد شد`);
  }

  {
    const user = await prisma.user.upsert({
      where: { mobile: "09121941532" },
      update: {},
      create: {
        mobile: "09121941532",
        email: "admin@company.com",
        name: "مدیر سیستم",
        password: "$2a$10$nzhyZ9EaOR4UXoankZr7P..LaW5tpAGcbRUUfGGfRyphjR5e1S/N.",
        role: "ADMIN",
        isActive: true,
        mustChangePassword: false,
      },
    });
    createdUsers.push(user);
    console.log(`✅ کاربر "${user.name}" ایجاد شد`);
  }

  {
    const user = await prisma.user.upsert({
      where: { mobile: "09123150594" },
      update: {},
      create: {
        mobile: "09123150594",
        email: "",
        name: "عسل بختیاری",
        password: "$2a$10$bt3YYJzN5FM6AKiLcNpL8u8AUKWGL9EVuQflbozeLYRIYkTzY6tgC",
        role: "MANAGER",
        isActive: true,
        mustChangePassword: false,
        departmentId: createdDepartments.find((d) => d.name === "مالی")?.id,
      },
    });
    createdUsers.push(user);
    console.log(`✅ کاربر "${user.name}" ایجاد شد`);
  }

  {
    const user = await prisma.user.upsert({
      where: { mobile: "09123322113" },
      update: {},
      create: {
        mobile: "09123322113",
        email: "",
        name: "سعید مترجمی",
        password: "$2a$10$C2/ZQGl2qlcuq9yE51/6vuJm1YKQmOndDNIENOZOVCRqw/5FqA7WC",
        role: "MANAGER",
        isActive: true,
        mustChangePassword: false,
        departmentId: createdDepartments.find((d) => d.name === "آشپزخانه")?.id,
      },
    });
    createdUsers.push(user);
    console.log(`✅ کاربر "${user.name}" ایجاد شد`);
  }

  // اختصاص مدیران به بخش‌ها
  {
    const manager = createdUsers.find((u) => u.mobile === "09123322111");
    const department = createdDepartments.find((d) => d.name === "IT");
    if (manager && department) {
      await prisma.department.update({
        where: { id: department.id },
        data: { managerId: manager.id },
      });
      console.log(`✅ مدیر به بخش "${dept.name}" اختصاص داده شد`);
    }
  }

  // ایجاد فیدبک‌ها
  {
    const user = createdUsers.find((u) => u.mobile === "09123322112");
    const department = createdDepartments.find((d) => d.name === "IT");
    if (user && department) {
      const forwardedTo = null;
      const completedBy = null;
      await prisma.feedback.create({
        data: {
          title: "مشکل در سیستم شبکه",
          content: "سیستم شبکه شرکت کند کار می‌کند و نیاز به بررسی دارد.",
          rating: 2,
          type: "CRITICAL",
          status: "PENDING",
          isAnonymous: false,
          departmentId: department.id,
          userId: user.id,
          deletedAt: new Date("2025-11-26T10:42:04.703Z"),
          createdAt: new Date("2025-11-25T08:16:52.872Z"),
        },
      });
      console.log(`✅ فیدبک "مشکل در سیستم شبکه" ایجاد شد`);
    }
  }

  {
    const user = createdUsers.find((u) => u.mobile === "09123322112");
    const department = createdDepartments.find((d) => d.name === "IT");
    if (user && department) {
      const forwardedTo = null;
      const completedBy = null;
      await prisma.feedback.create({
        data: {
          title: "پیشنهاد بهبود سیستم",
          content: "پیشنهاد می‌کنم سیستم فیدبک را بهبود دهیم.",
          rating: 4,
          type: "SUGGESTION",
          status: "PENDING",
          isAnonymous: false,
          departmentId: department.id,
          userId: user.id,
          createdAt: new Date("2025-11-25T08:16:52.926Z"),
        },
      });
      console.log(`✅ فیدبک "پیشنهاد بهبود سیستم" ایجاد شد`);
    }
  }

  {
    const user = createdUsers.find((u) => u.mobile === "09123322112");
    const department = createdDepartments.find((d) => d.name === "IT");
    if (user && department) {
      const forwardedTo = createdUsers.find((u) => u.mobile === "09123322111");
      const completedBy = null;
      await prisma.feedback.create({
        data: {
          title: "فیدبک ارجاع شده",
          content: "این فیدبک برای بررسی به مدیر ارجاع شده است.",
          rating: 5,
          type: "SUGGESTION",
          status: "REVIEWED",
          isAnonymous: false,
          departmentId: department.id,
          userId: user.id,
          forwardedToId: forwardedTo?.id,
          forwardedAt: new Date("2025-11-25T08:16:52.871Z"),
          createdAt: new Date("2025-11-25T08:16:52.963Z"),
        },
      });
      console.log(`✅ فیدبک "فیدبک ارجاع شده" ایجاد شد`);
    }
  }

  {
    const user = createdUsers.find((u) => u.mobile === "09123322112");
    const department = createdDepartments.find((d) => d.name === "IT");
    if (user && department) {
      const forwardedTo = null;
      const completedBy = null;
      await prisma.feedback.create({
        data: {
          title: "مشکل در سیستم شبکه",
          content: "سیستم شبکه شرکت کند کار می‌کند و نیاز به بررسی دارد.",
          rating: 2,
          type: "CRITICAL",
          status: "PENDING",
          isAnonymous: false,
          departmentId: department.id,
          userId: user.id,
          createdAt: new Date("2025-11-25T08:20:16.310Z"),
        },
      });
      console.log(`✅ فیدبک "مشکل در سیستم شبکه" ایجاد شد`);
    }
  }

  {
    const user = createdUsers.find((u) => u.mobile === "09123322112");
    const department = createdDepartments.find((d) => d.name === "IT");
    if (user && department) {
      const forwardedTo = null;
      const completedBy = null;
      await prisma.feedback.create({
        data: {
          title: "پیشنهاد بهبود سیستم",
          content: "پیشنهاد می‌کنم سیستم فیدبک را بهبود دهیم.",
          rating: 4,
          type: "SUGGESTION",
          status: "PENDING",
          isAnonymous: false,
          departmentId: department.id,
          userId: user.id,
          createdAt: new Date("2025-11-25T08:20:16.374Z"),
        },
      });
      console.log(`✅ فیدبک "پیشنهاد بهبود سیستم" ایجاد شد`);
    }
  }

  {
    const user = createdUsers.find((u) => u.mobile === "09123322112");
    const department = createdDepartments.find((d) => d.name === "IT");
    if (user && department) {
      const forwardedTo = createdUsers.find((u) => u.mobile === "09123322111");
      const completedBy = null;
      await prisma.feedback.create({
        data: {
          title: "فیدبک ارجاع شده",
          content: "این فیدبک برای بررسی به مدیر ارجاع شده است.",
          rating: 5,
          type: "SUGGESTION",
          status: "REVIEWED",
          isAnonymous: false,
          departmentId: department.id,
          userId: user.id,
          forwardedToId: forwardedTo?.id,
          forwardedAt: new Date("2025-11-25T08:20:16.308Z"),
          deletedAt: new Date("2025-11-26T10:41:38.185Z"),
          createdAt: new Date("2025-11-25T08:20:16.417Z"),
        },
      });
      console.log(`✅ فیدبک "فیدبک ارجاع شده" ایجاد شد`);
    }
  }

  {
    const user = createdUsers.find((u) => u.mobile === "09121941532");
    const department = createdDepartments.find((d) => d.name === "آشپزخانه");
    if (user && department) {
      const forwardedTo = null;
      const completedBy = null;
      await prisma.feedback.create({
        data: {
          title: "ادمین آشپزخانه ۱",
          content: "محتوا ادمین آشپزخانه ",
          image: "/uploads/feedback/feedback-1764151391212-2e9ejq.jpg",
          type: "SUGGESTION",
          status: "PENDING",
          isAnonymous: false,
          departmentId: department.id,
          userId: user.id,
          createdAt: new Date("2025-11-26T10:03:13.073Z"),
        },
      });
      console.log(`✅ فیدبک "ادمین آشپزخانه ۱" ایجاد شد`);
    }
  }

  {
    const user = createdUsers.find((u) => u.mobile === "09121941532");
    const department = createdDepartments.find((d) => d.name === "اداری");
    if (user && department) {
      const forwardedTo = createdUsers.find((u) => u.mobile === "09123322112");
      const completedBy = null;
      await prisma.feedback.create({
        data: {
          title: "عنوان ادمین اداری ۲",
          content: "متن انتقادی ۲ ادمین ",
          image: "[\"/uploads/feedback/feedback-1764157014321-0-nwjmqx.jpg\",\"/uploads/feedback/feedback-1764157014323-1-rl1gci.jpg\"]",
          type: "CRITICAL",
          status: "REVIEWED",
          isAnonymous: false,
          departmentId: department.id,
          userId: user.id,
          forwardedToId: forwardedTo?.id,
          forwardedAt: new Date("2025-11-29T12:31:19.672Z"),
          createdAt: new Date("2025-11-26T11:36:56.177Z"),
        },
      });
      console.log(`✅ فیدبک "عنوان ادمین اداری ۲" ایجاد شد`);
    }
  }

  {
    const user = createdUsers.find((u) => u.mobile === "09123322111");
    const department = createdDepartments.find((d) => d.name === "اداری");
    if (user && department) {
      const forwardedTo = null;
      const completedBy = null;
      await prisma.feedback.create({
        data: {
          title: "مدیر به اداری",
          content: "محتوا مدیر به اداری",
          image: "[\"/uploads/feedback/feedback-1764163773243-0-0p8px.jpg\"]",
          type: "SUGGESTION",
          status: "PENDING",
          isAnonymous: false,
          departmentId: department.id,
          userId: user.id,
          createdAt: new Date("2025-11-26T13:29:33.391Z"),
        },
      });
      console.log(`✅ فیدبک "مدیر به اداری" ایجاد شد`);
    }
  }

  {
    const user = createdUsers.find((u) => u.mobile === "09121941532");
    const department = createdDepartments.find((d) => d.name === "آشپزخانه");
    if (user && department) {
      const forwardedTo = createdUsers.find((u) => u.mobile === "09123322111");
      const completedBy = null;
      await prisma.feedback.create({
        data: {
          title: "شکایت آشپزخانه ",
          content: "این متن شکایت آشپزخانه به صورت انتقادی است ",
          type: "CRITICAL",
          status: "REVIEWED",
          isAnonymous: false,
          departmentId: department.id,
          userId: user.id,
          forwardedToId: forwardedTo?.id,
          forwardedAt: new Date("2025-11-29T13:40:44.454Z"),
          createdAt: new Date("2025-11-29T12:49:32.025Z"),
        },
      });
      console.log(`✅ فیدبک "شکایت آشپزخانه " ایجاد شد`);
    }
  }

  {
    const user = createdUsers.find((u) => u.mobile === "09123322111");
    const department = createdDepartments.find((d) => d.name === "اداری");
    if (user && department) {
      const forwardedTo = null;
      const completedBy = null;
      await prisma.feedback.create({
        data: {
          title: "حقوق من فرزاد چی شد ؟",
          content: "متن حثقوق مدیر فرزاد چی شذ با تصویز . انتقادی",
          image: "[\"/uploads/feedback/feedback-1764422936935-0-ylthei.jpg\"]",
          type: "CRITICAL",
          status: "PENDING",
          isAnonymous: false,
          departmentId: department.id,
          userId: user.id,
          createdAt: new Date("2025-11-29T13:28:57.096Z"),
        },
      });
      console.log(`✅ فیدبک "حقوق من فرزاد چی شد ؟" ایجاد شد`);
    }
  }

  // ایجاد وظایف
  {
    const department = createdDepartments.find((d) => d.name === "اداری");
    const createdBy = createdUsers.find((u) => u.mobile === "09121941532");
    if (department && createdBy) {
      const feedback = await prisma.feedback.findFirst({
        where: { title: "عنوان ادمین اداری ۲" },
      });
      const createdTask = await prisma.task.create({
        data: {
          title: "ارجاع: عنوان ادمین اداری ۲",
          description: "متن انتقادی ۲ ادمین \n\n---\nیادداشت ارجاع‌دهنده: این موضوغ را رسیدگی کنید . ",
          status: "PENDING",
          priority: "HIGH",
          isPublic: false,
          departmentId: department.id,
          createdById: createdBy.id,
          feedbackId: feedback?.id,
        },
      });
      console.log(`✅ وظیفه "ارجاع: عنوان ادمین اداری ۲" ایجاد شد`);
      // اختصاص وظایف
      {
        const user = createdUsers.find((u) => u.mobile === "09123322112");
        if (user) {
          await prisma.taskAssignment.create({
            data: {
              taskId: createdTask.id,
              userId: user.id,
            },
          });
        }
      }
    }
  }

  {
    const department = createdDepartments.find((d) => d.name === "IT");
    const createdBy = createdUsers.find((u) => u.mobile === "09121941532");
    if (department && createdBy) {
      const feedback = await prisma.feedback.findFirst({
        where: { title: "شکایت آشپزخانه " },
      });
      const createdTask = await prisma.task.create({
        data: {
          title: "ارجاع: شکایت آشپزخانه ",
          description: "این متن شکایت آشپزخانه به صورت انتقادی است \n\n---\nیادداشت ارجاع‌دهنده: موضوع آشپزخانه را تو حل کن ",
          status: "PENDING",
          priority: "HIGH",
          isPublic: false,
          departmentId: department.id,
          createdById: createdBy.id,
          feedbackId: feedback?.id,
        },
      });
      console.log(`✅ وظیفه "ارجاع: شکایت آشپزخانه " ایجاد شد`);
      // اختصاص وظایف
      {
        const user = createdUsers.find((u) => u.mobile === "09123322111");
        if (user) {
          await prisma.taskAssignment.create({
            data: {
              taskId: createdTask.id,
              userId: user.id,
            },
          });
        }
      }
    }
  }

  // ایجاد اعلان‌ها
  {
    const createdBy = createdUsers.find((u) => u.mobile === "09123456789");
    if (createdBy) {
      await prisma.announcement.create({
        data: {
          title: "خوش آمدید",
          content: "به سیستم فیدبک خوش آمدید. لطفاً فیدبک‌های خود را ثبت کنید.",
          priority: "HIGH",
          isActive: true,
          publishedAt: new Date("2025-11-25T08:16:53.006Z"),
          createdById: createdBy.id,
        },
      });
      console.log(`✅ اعلان "خوش آمدید" ایجاد شد`);
    }
  }

  {
    const createdBy = createdUsers.find((u) => u.mobile === "09123456789");
    if (createdBy) {
      await prisma.announcement.create({
        data: {
          title: "اعلان ۱",
          content: "به سیستم فیدبک خوش آمدید. لطفاً فیدبک‌های خود را ثبت کنید.",
          priority: "HIGH",
          isActive: true,
          publishedAt: new Date("2025-11-25T08:20:16.483Z"),
          createdById: createdBy.id,
        },
      });
      console.log(`✅ اعلان "اعلان ۱" ایجاد شد`);
    }
  }

  {
    const createdBy = createdUsers.find((u) => u.mobile === "09123456789");
    if (createdBy) {
      await prisma.announcement.create({
        data: {
          title: "اعلان بخش IT",
          content: "این اعلان مخصوص بخش IT است.",
          priority: "MEDIUM",
          isActive: true,
          publishedAt: new Date("2025-11-25T08:20:16.561Z"),
          departmentId: createdDepartments.find((d) => d.name === "IT")?.id,
          createdById: createdBy.id,
        },
      });
      console.log(`✅ اعلان "اعلان بخش IT" ایجاد شد`);
    }
  }

  console.log("\n🎉 تمام داده‌ها با موفقیت ایجاد شدند!");
}

main()
  .catch((e) => {
    console.error("❌ خطا در ایجاد داده‌ها:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
