import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzeFeedbacksByKeywords, getKeywordTrends, compareKeywordsByDepartment } from "@/lib/analytics-utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");
    const reportType = searchParams.get("type") || "summary"; // summary, trends, comparison
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const days = searchParams.get("days");

    let result;

    switch (reportType) {
      case "summary":
        // گزارش خلاصه کلمات کلیدی
        result = await analyzeFeedbacksByKeywords(
          departmentId || undefined,
          startDate ? new Date(startDate) : undefined,
          endDate ? new Date(endDate) : undefined
        );
        break;

      case "trends":
        // گزارش روند کلمات کلیدی در طول زمان
        result = await getKeywordTrends(
          departmentId || undefined,
          days ? parseInt(days) : 30
        );
        break;

      case "comparison":
        // مقایسه بخش‌ها
        result = await compareKeywordsByDepartment();
        break;

      default:
        return NextResponse.json(
          { error: "Invalid report type" },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating analytics report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
