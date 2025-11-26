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

    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [
      totalFeedbacks,
      allFeedbacks,
      departments,
      feedbacksByDepartment,
    ] = await Promise.all([
      prisma.feedback.count(),
      prisma.feedback.findMany({
        select: { rating: true, departmentId: true },
      }),
      prisma.department.findMany({
        include: {
          _count: {
            select: { feedbacks: true },
          },
        },
      }),
      prisma.department.findMany({
        include: {
          _count: {
            select: { feedbacks: true },
          },
        },
      }),
    ]);

    const averageRating =
      allFeedbacks.length > 0
        ? allFeedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) /
          allFeedbacks.length
        : 0;

    const activeDepartments = departments.filter(
      (d) => d._count.feedbacks > 0
    ).length;

    const ratingCounts: { [key: number]: number } = {};
    allFeedbacks.forEach((f) => {
      if (f.rating !== null) {
        ratingCounts[f.rating] = (ratingCounts[f.rating] || 0) + 1;
      }
    });

    const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => ({
      name: `${rating} ستاره`,
      value: ratingCounts[rating] || 0,
    }));

    const departmentStats = feedbacksByDepartment.map((dept) => ({
      name: dept.name,
      count: dept._count.feedbacks,
    }));

    return NextResponse.json({
      totalFeedbacks,
      averageRating,
      activeDepartments,
      ratingDistribution,
      feedbacksByDepartment: departmentStats,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

