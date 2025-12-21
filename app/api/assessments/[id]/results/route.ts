import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/assessments/[id]/results - تمام نتایج (ADMIN/MANAGER با allowManagerView)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    const isAdmin = session.user.role === "ADMIN";
    const isManager = session.user.role === "MANAGER";

    if (!isAdmin && !isManager) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // For managers, check if they have permission to view results
    if (isManager && !isAdmin) {
      const user = await prisma.users.findUnique({
        where: { id: session.user.id },
        select: { departmentId: true },
      });

      if (!user?.departmentId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const assignment = await prisma.assessment_assignments.findUnique({
        where: {
          assessmentId_departmentId: {
            assessmentId: params.id,
            departmentId: user.departmentId,
          },
        },
      });

      if (!assignment || !assignment.allowManagerView) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {
      assessmentId: params.id,
    };

    if (departmentId) {
      where.user = {
        departmentId,
      };
    }

    if (startDate) {
      where.completedAt = {
        ...where.completedAt,
        gte: new Date(startDate),
      };
    }

    if (endDate) {
      where.completedAt = {
        ...where.completedAt,
        lte: new Date(endDate),
      };
    }

    const results = await prisma.assessmentResult.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        completedAt: "desc",
      },
    });

    // Calculate statistics
    const stats = {
      totalParticipants: results.length,
      averageScore:
        results.length > 0
          ? results.reduce((sum, r) => sum + (r.score || 0), 0) /
            results.length
          : 0,
      averageTime:
        results.length > 0
          ? results.reduce((sum, r) => sum + (r.timeTaken || 0), 0) /
            results.length
          : 0,
      passRate:
        results.length > 0
          ? (results.filter((r) => r.isPassed === true).length /
              results.length) *
            100
          : 0,
    };

    return NextResponse.json({
      results: results.map((r) => ({
        id: r.id,
        user: r.user,
        result: r.result,
        score: r.score,
        isPassed: r.isPassed,
        timeTaken: r.timeTaken,
        completedAt: r.completedAt,
      })),
      stats,
    });
  } catch (error) {
    console.error("Error fetching results:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
