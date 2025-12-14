import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/assessments/[id]/result - نتیجه شخصی (USER)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get latest result for this user and assessment
    const result = await prisma.assessmentResult.findFirst({
      where: {
        assessmentId: params.id,
        userId: session.user.id,
      },
      orderBy: {
        completedAt: "desc",
      },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            showResults: true,
          },
        },
      },
    });

    if (!result) {
      return NextResponse.json(
        { error: "No result found for this assessment" },
        { status: 404 }
      );
    }

    // Check if results should be shown
    if (!result.assessment.showResults) {
      return NextResponse.json(
        {
          message: "Results are not available for this assessment",
          completedAt: result.completedAt,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      id: result.id,
      assessment: result.assessment,
      result: result.result,
      score: result.score,
      isPassed: result.isPassed,
      timeTaken: result.timeTaken,
      completedAt: result.completedAt,
    });
  } catch (error) {
    console.error("Error fetching result:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
