import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // دریافت آمار پیام‌ها
    const totalMessages = await prisma.messages.count();

    // تعداد پیام‌هایی که تصویر دارند
    const messagesWithImages = await prisma.messages.count({
      where: {
        image: {
          not: null,
        },
      },
    });

    // دریافت آمار فیدبک‌ها
    const feedbackStats = await prisma.feedbacks.groupBy({
      by: ['departmentId'],
      _count: {
        id: true,
      },
    });

    // دریافت آمار فایل‌های بخش‌ها (از جدول shared_files)
    const departmentFiles = await prisma.shared_files.groupBy({
      by: ['projectId'],
      _sum: {
        size: true,
      },
      _count: {
        id: true,
      },
      where: {
        deletedAt: null,
      },
    });

    // دریافت اطلاعات بخش‌ها
    const departments = await prisma.departments.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            feedbacks: true,
            users: true,
          },
        },
      },
    });

    // دریافت اطلاعات پروژه‌ها
    const projects = await prisma.projects.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            shared_files: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    // محاسبه حجم فایل‌های هر پروژه
    const projectFileSizes = await Promise.all(
      projects.map(async (project) => {
        const files = await prisma.shared_files.aggregate({
          where: {
            projectId: project.id,
            deletedAt: null,
          },
          _sum: {
            size: true,
          },
        });

        return {
          id: project.id,
          name: project.name,
          fileCount: project._count.shared_files,
          totalSize: files._sum.size || 0,
        };
      })
    );

    // ترکیب داده‌های بخش‌ها با فیدبک‌ها
    const departmentStats = departments.map((dept) => {
      const feedbackStat = feedbackStats.find((fs) => fs.departmentId === dept.id);
      return {
        id: dept.id,
        name: dept.name,
        userCount: dept._count.users,
        feedbackCount: feedbackStat?._count.id || 0,
      };
    });

    // محاسبه کل حجم فایل‌ها
    const totalFileSize = projectFileSizes.reduce((sum, p) => sum + p.totalSize, 0);
    const totalFileCount = projectFileSizes.reduce((sum, p) => sum + p.fileCount, 0);

    return NextResponse.json({
      messages: {
        total: totalMessages,
        withImages: messagesWithImages,
      },
      departments: departmentStats,
      projects: projectFileSizes.slice(0, 10), // فقط 10 پروژه برتر
      summary: {
        totalFileSize,
        totalFileCount,
        totalFeedbacks: feedbackStats.reduce((sum, fs) => sum + fs._count.id, 0),
        totalMessages,
      },
    });
  } catch (error) {
    console.error("Error fetching usage stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage statistics" },
      { status: 500 }
    );
  }
}
