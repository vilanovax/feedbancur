import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCachedAnalytics, getCachedSettings } from "@/lib/cache";
import type { WorkingHoursSettings } from "@/lib/working-hours-utils";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // دریافت تنظیمات ساعت کاری (cached)
    const settings = await getCachedSettings();
    const workingHoursSettings: WorkingHoursSettings = settings?.workingHoursSettings
      ? typeof settings.workingHoursSettings === 'string'
        ? JSON.parse(settings.workingHoursSettings)
        : settings.workingHoursSettings
      : { enabled: false, startHour: 8, endHour: 17, workingDays: [6, 0, 1, 2, 3], holidays: [] };

    // استفاده از کش برای داده‌های آنالیز
    const analyticsData = await getCachedAnalytics(workingHoursSettings);

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

