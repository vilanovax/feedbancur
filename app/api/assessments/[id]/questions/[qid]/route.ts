import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/assessments/[id]/questions/[qid] - ویرایش سوال (ADMIN)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; qid: string }> }
) {
  try {
    const { id, qid } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { questionText, questionType, order, isRequired, options, image } =
      body;

    // Check if question exists
    const existingQuestion = await prisma.assessment_questions.findUnique({
      where: { id: qid },
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // Verify question belongs to the assessment
    if (existingQuestion.assessmentId !== id) {
      return NextResponse.json(
        { error: "Question does not belong to this assessment" },
        { status: 400 }
      );
    }

    const question = await prisma.assessment_questions.update({
      where: { id: qid },
      data: {
        ...(questionText !== undefined && { questionText }),
        ...(questionType !== undefined && { questionType }),
        ...(order !== undefined && { order }),
        ...(isRequired !== undefined && { isRequired }),
        ...(options !== undefined && { options }),
        ...(image !== undefined && { image }),
      },
    });

    return NextResponse.json(question);
  } catch (error) {
    console.error("Error updating question:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/assessments/[id]/questions/[qid] - حذف سوال (ADMIN)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; qid: string }> }
) {
  try {
    const { id, qid } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if question exists
    const existingQuestion = await prisma.assessment_questions.findUnique({
      where: { id: qid },
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // Verify question belongs to the assessment
    if (existingQuestion.assessmentId !== id) {
      return NextResponse.json(
        { error: "Question does not belong to this assessment" },
        { status: 400 }
      );
    }

    await prisma.assessment_questions.delete({
      where: { id: qid },
    });

    // Reorder remaining questions
    const remainingQuestions = await prisma.assessment_questions.findMany({
      where: { assessmentId: id },
      orderBy: { order: "asc" },
    });

    // Update orders
    for (let i = 0; i < remainingQuestions.length; i++) {
      if (remainingQuestions[i].order !== i + 1) {
        await prisma.assessment_questions.update({
          where: { id: remainingQuestions[i].id },
          data: { order: i + 1 },
        });
      }
    }

    return NextResponse.json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
