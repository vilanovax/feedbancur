import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/assessments/[id]/questions - لیست سوالات (ADMIN)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const questions = await prisma.assessment_questions.findMany({
      where: { assessmentId: params.id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/assessments/[id]/questions - افزودن سوال (ADMIN)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Validation
    if (!questionText || !questionType) {
      return NextResponse.json(
        { error: "Question text and type are required" },
        { status: 400 }
      );
    }

    // Check if assessment exists
    const assessment = await prisma.assessments.findUnique({
      where: { id: params.id },
    });

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    // Get the last order number if order is not provided
    let questionOrder = order;
    if (questionOrder === undefined) {
      const lastQuestion = await prisma.assessment_questions.findFirst({
        where: { assessmentId: params.id },
        orderBy: { order: "desc" },
      });
      questionOrder = lastQuestion ? lastQuestion.order + 1 : 1;
    }

    const question = await prisma.assessment_questions.create({
      data: {
        assessmentId: params.id,
        questionText,
        questionType,
        order: questionOrder,
        isRequired: isRequired ?? true,
        options: options || [],
        image,
      },
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
