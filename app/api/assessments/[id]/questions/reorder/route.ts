import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/assessments/[id]/questions/reorder - تغییر ترتیب سوالات (ADMIN)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { questionOrders } = body; // [{ id: "q1", order: 1 }, { id: "q2", order: 2 }, ...]

    if (!Array.isArray(questionOrders)) {
      return NextResponse.json(
        { error: "questionOrders must be an array" },
        { status: 400 }
      );
    }

    // Check if assessment exists
    const assessment = await prisma.assessments.findUnique({
      where: { id },
    });

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    // Update each question's order
    await prisma.$transaction(
      questionOrders.map((item: { id: string; order: number }) =>
        prisma.assessment_questions.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );

    // Fetch updated questions
    const questions = await prisma.assessment_questions.findMany({
      where: { assessmentId: id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error("Error reordering questions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
