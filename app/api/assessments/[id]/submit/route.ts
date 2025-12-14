import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateMBTI } from "@/lib/assessment-calculators/mbti";
import { calculateDISC } from "@/lib/assessment-calculators/disc";

// POST /api/assessments/[id]/submit - ثبت نهایی (USER)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { answers } = body; // { questionId: answer }

    // Get assessment with questions
    const assessment = await prisma.assessment.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    // Get progress to calculate time taken
    const progress = await prisma.assessmentProgress.findUnique({
      where: {
        assessmentId_userId: {
          assessmentId: params.id,
          userId: session.user.id,
        },
      },
    });

    if (!progress) {
      return NextResponse.json(
        { error: "Progress not found. Please start the assessment first." },
        { status: 404 }
      );
    }

    // Validate all required questions are answered
    const requiredQuestions = assessment.questions.filter((q) => q.isRequired);
    const missingAnswers = requiredQuestions.filter(
      (q) => !answers[q.id] || answers[q.id] === ""
    );

    if (missingAnswers.length > 0) {
      return NextResponse.json(
        {
          error: "Please answer all required questions",
          missingQuestions: missingAnswers.map((q) => q.id),
        },
        { status: 400 }
      );
    }

    // Calculate time taken (in seconds)
    const timeTaken = Math.floor(
      (new Date().getTime() - new Date(progress.startedAt).getTime()) / 1000
    );

    // Calculate result based on assessment type
    let result: any;
    let score: number | null = null;
    let isPassed: boolean | null = null;

    switch (assessment.type) {
      case "MBTI":
        result = calculateMBTI(answers, assessment.questions);
        break;

      case "DISC":
        result = calculateDISC(answers, assessment.questions);
        break;

      case "CUSTOM":
        // For custom assessments, calculate simple score
        // Sum up all scores from selected options
        let totalScore = 0;
        let maxScore = 0;

        for (const question of assessment.questions) {
          const answer = answers[question.id];
          const options = question.options as any[];

          if (options && Array.isArray(options)) {
            // Find max score for this question
            const questionMaxScore = Math.max(
              ...options.map((opt) =>
                typeof opt.score === "number" ? opt.score : 0
              )
            );
            maxScore += questionMaxScore;

            // Find selected option score
            const selectedOption = options.find(
              (opt) => opt.value === answer
            );
            if (selectedOption && typeof selectedOption.score === "number") {
              totalScore += selectedOption.score;
            }
          }
        }

        score = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
        isPassed =
          assessment.passingScore !== null
            ? score >= assessment.passingScore
            : null;

        result = {
          score,
          totalScore,
          maxScore,
          percentage: score,
          isPassed,
        };
        break;

      default:
        return NextResponse.json(
          { error: "Unknown assessment type" },
          { status: 400 }
        );
    }

    // Save result
    const assessmentResult = await prisma.assessmentResult.create({
      data: {
        assessmentId: params.id,
        userId: session.user.id,
        answers,
        result,
        score,
        isPassed,
        startedAt: progress.startedAt,
        timeTaken,
      },
    });

    // Delete progress
    await prisma.assessmentProgress.delete({
      where: {
        assessmentId_userId: {
          assessmentId: params.id,
          userId: session.user.id,
        },
      },
    });

    return NextResponse.json({
      id: assessmentResult.id,
      result: assessmentResult.result,
      score: assessmentResult.score,
      isPassed: assessmentResult.isPassed,
      timeTaken: assessmentResult.timeTaken,
      completedAt: assessmentResult.completedAt,
      showResults: assessment.showResults,
    });
  } catch (error) {
    console.error("Error submitting assessment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
