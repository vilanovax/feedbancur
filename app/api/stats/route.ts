import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [totalFeedbacks, pendingFeedbacks, departments] = await Promise.all([
      prisma.feedback.count(),
      prisma.feedback.count({ where: { status: "PENDING" } }),
      prisma.department.count(),
    ]);

    return NextResponse.json({
      totalFeedbacks,
      pendingFeedbacks,
      departments,
    });
  } catch (error: any) {
    console.error("Error fetching stats:", error);
    
    // اگر خطای اتصال به دیتابیس باشد، مقادیر پیش‌فرض برگردان
    if (error?.code === "P1001" || error?.message?.includes("Can't reach database")) {
      console.warn("Database connection failed, returning default values");
      return NextResponse.json({
        totalFeedbacks: 0,
        pendingFeedbacks: 0,
        departments: 0,
      });
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

