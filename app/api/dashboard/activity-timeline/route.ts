import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, format, startOfDay } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // دریافت پارامتر period از query string
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";

    // محاسبه تعداد روزها بر اساس period
    let days = 30;
    switch (period) {
      case "7d":
        days = 7;
        break;
      case "30d":
        days = 30;
        break;
      case "3m":
        days = 90;
        break;
      case "1y":
        days = 365;
        break;
      default:
        days = 30;
    }

    // محاسبه تاریخ شروع
    const startDate = subDays(new Date(), days);
    startDate.setHours(0, 0, 0, 0);

    // دریافت فیدبک‌ها به تفکیک روز و وضعیت
    const feedbacks = await prisma.feedbacks.findMany({
      where: {
        deletedAt: null,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        status: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // آماده کردن labels (تاریخ‌ها)
    const labels: string[] = [];
    const newData: number[] = [];
    const completedData: number[] = [];
    const closedData: number[] = [];

    // ایجاد آرایه برای هر روز
    for (let i = 0; i < days; i++) {
      const date = subDays(new Date(), days - i - 1);
      const dateKey = format(startOfDay(date), "yyyy-MM-dd");
      labels.push(dateKey);

      // شمارش فیدبک‌های جدید در این روز
      const newCount = feedbacks.filter((f) => {
        const feedbackDate = format(startOfDay(f.createdAt), "yyyy-MM-dd");
        return feedbackDate === dateKey;
      }).length;

      // شمارش فیدبک‌های تکمیل شده در این روز
      const completedCount = feedbacks.filter((f) => {
        const feedbackDate = format(startOfDay(f.createdAt), "yyyy-MM-dd");
        return feedbackDate === dateKey && f.status === "COMPLETED";
      }).length;

      // شمارش فیدبک‌های بسته شده (COMPLETED + ARCHIVED)
      const closedCount = feedbacks.filter((f) => {
        const feedbackDate = format(startOfDay(f.createdAt), "yyyy-MM-dd");
        return (
          feedbackDate === dateKey &&
          (f.status === "COMPLETED" || f.status === "ARCHIVED")
        );
      }).length;

      newData.push(newCount);
      completedData.push(completedCount);
      closedData.push(closedCount);
    }

    return NextResponse.json(
      {
        labels,
        datasets: [
          {
            name: "جدید",
            data: newData,
            color: "#3b82f6", // blue
          },
          {
            name: "تکمیل شده",
            data: completedData,
            color: "#22c55e", // green
          },
          {
            name: "بسته شده",
            data: closedData,
            color: "#6b7280", // gray
          },
        ],
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error: any) {
    console.error("Error fetching activity timeline:", error);

    // اگر خطای اتصال به دیتابیس باشد
    if (
      error?.code === "P1001" ||
      error?.message?.includes("Can't reach database")
    ) {
      console.warn("Database connection failed, returning empty data");
      return NextResponse.json({
        labels: [],
        datasets: [
          { name: "جدید", data: [], color: "#3b82f6" },
          { name: "تکمیل شده", data: [], color: "#22c55e" },
          { name: "بسته شده", data: [], color: "#6b7280" },
        ],
      });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
