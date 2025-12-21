import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/assessments/my-results - دریافت نتایج آزمون‌های کاربر (یا بخش برای مدیر)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let whereClause: any = {};

    // اگر مدیر است، نتایج بخش خودش را هم ببین
    if (session.user.role === "MANAGER") {
      const manager = await prisma.users.findUnique({
        where: { id: session.user.id },
        select: { departmentId: true },
      });

      if (manager?.departmentId) {
        // نتایج کاربران بخش مدیر + نتایج خود مدیر
        whereClause = {
          OR: [
            {
              users: {
                departmentId: manager.departmentId,
              },
            },
            {
              userId: session.user.id,
            },
          ],
        };
      } else {
        // اگر مدیر بخشی ندارد، فقط نتایج خودش
        whereClause = {
          userId: session.user.id,
        };
      }
    } else {
      // کارمند یا ادمین: فقط نتایج خودش
      whereClause = {
        userId: session.user.id,
      };
    }

    // دریافت تمام نتایج آزمون‌های کاربر (یا بخش برای مدیر)
    const results = await prisma.assessment_results.findMany({
      where: whereClause,
      include: {
        assessments: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            departmentId: true,
          },
        },
      },
      orderBy: {
        completedAt: "desc",
      },
    });

    // برای هر آزمون و هر کاربر، فقط آخرین نتیجه را برگردان
    // اگر مدیر است، نتایج همه کاربران بخش را نشان بده
    // اگر کارمند است، فقط نتایج خودش را نشان بده
    const latestResults = results.reduce((acc: any[], result) => {
      const key = session.user.role === "MANAGER"
        ? `${result.assessmentId}-${result.userId}` // برای مدیر: هر کاربر جداگانه
        : result.assessmentId; // برای کارمند: فقط آزمون

      const existing = acc.find((r) =>
        session.user.role === "MANAGER"
          ? r.assessment.id === result.assessmentId && r.user?.id === result.userId
          : r.assessment.id === result.assessmentId
      );

      if (!existing) {
        acc.push({
          id: result.id,
          assessmentId: result.assessmentId,
          assessment: result.assessments,
          result: result.result, // جزئیات کامل (MBTI/DISC details)
          score: result.score,
          isPassed: result.isPassed,
          completedAt: result.completedAt,
          user: session.user.role === "MANAGER" ? result.users : undefined, // برای مدیر: اطلاعات کاربر
        });
      }

      return acc;
    }, []);

    return NextResponse.json(latestResults);
  } catch (error) {
    console.error("Error fetching user assessment results:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

