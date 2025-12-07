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

    const [totalFeedbacks, pendingFeedbacks, departments, completedFeedbacks, deferredFeedbacks, archivedFeedbacks] = await Promise.all([
      prisma.feedback.count({ where: { deletedAt: null } }),
      prisma.feedback.count({ where: { status: "PENDING", deletedAt: null } }),
      prisma.department.count(),
      prisma.feedback.count({ where: { status: "COMPLETED", deletedAt: null } }),
      prisma.feedback.count({ where: { status: "DEFERRED", deletedAt: null } }),
      prisma.feedback.count({ where: { status: "ARCHIVED", deletedAt: null } }),
    ]);

    return NextResponse.json({
      totalFeedbacks,
      pendingFeedbacks,
      departments,
      completedFeedbacks,
      deferredFeedbacks,
      archivedFeedbacks,
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
        completedFeedbacks: 0,
        deferredFeedbacks: 0,
        archivedFeedbacks: 0,
      });
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

