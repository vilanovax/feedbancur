import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/assessments/[id]/start - شروع یا ادامه آزمون
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

    // بررسی دسترسی کاربر به آزمون
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
        assignments: {
          where: {
            departmentId: session.user.departmentId || undefined,
          },
        },
      },
    });

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    // بررسی فعال بودن آزمون
    if (!assessment.isActive) {
      return NextResponse.json(
        { error: "این آزمون غیرفعال است" },
        { status: 403 }
      );
    }

    // بررسی تخصیص آزمون به بخش کاربر (برای غیر ادمین)
    if (session.user.role !== "ADMIN") {
      if (!session.user.departmentId) {
        return NextResponse.json(
          { error: "شما به هیچ بخشی تخصیص داده نشده‌اید" },
          { status: 403 }
        );
      }

      if (assessment.assignments.length === 0) {
        return NextResponse.json(
          { error: "این آزمون به بخش شما تخصیص داده نشده است" },
          { status: 403 }
        );
      }
    }

    // بررسی وجود پیشرفت قبلی
    const existingProgress = await prisma.assessmentProgress.findFirst({
      where: {
        assessmentId: id,
        userId: session.user.id,
      },
    });

    // بررسی نتیجه قبلی
    const existingResult = await prisma.assessmentResult.findFirst({
      where: {
        assessmentId: id,
        userId: session.user.id,
      },
    });

    // اگر قبلاً تکمیل کرده و allowRetake فالس است
    if (existingResult && !assessment.allowRetake) {
      return NextResponse.json(
        { error: "شما قبلاً این آزمون را تکمیل کرده‌اید و امکان تکرار وجود ندارد" },
        { status: 403 }
      );
    }

    // اگر پیشرفت جدیدی شروع می‌شود، progress قبلی را پاک کنیم
    if (existingResult && assessment.allowRetake && existingProgress) {
      await prisma.assessmentProgress.delete({
        where: { id: existingProgress.id },
      });
    }

    // ایجاد یا به‌روزرسانی پیشرفت
    let progress;
    if (!existingProgress || (existingResult && assessment.allowRetake)) {
      progress = await prisma.assessmentProgress.create({
        data: {
          assessmentId: id,
          userId: session.user.id,
          startedAt: new Date(),
          answers: {},
          currentQuestion: 0,
        },
      });
    } else {
      progress = existingProgress;
    }

    // بازگرداندن داده‌های آزمون
    return NextResponse.json({
      assessment: {
        id: assessment.id,
        title: assessment.title,
        description: assessment.description,
        type: assessment.type,
        instructions: assessment.instructions,
        timeLimit: assessment.timeLimit,
        showResults: assessment.showResults,
        totalQuestions: assessment.questions.length,
      },
      questions: assessment.questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options,
        order: q.order,
        isRequired: q.isRequired || false,
        image: q.image || null,
      })),
      progress: {
        id: progress.id,
        answers: progress.answers,
        lastQuestion: progress.currentQuestion,
        startedAt: progress.startedAt,
      },
    });
  } catch (error) {
    console.error("Error starting assessment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
