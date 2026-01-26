import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - دریافت نتایج نظرسنجی
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const poll = await prisma.polls.findUnique({
      where: { id },
      include: {
        options: {
          orderBy: {
            order: 'asc',
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!poll) {
      return NextResponse.json(
        { error: 'نظرسنجی یافت نشد' },
        { status: 404 }
      );
    }

    // بررسی اینکه آیا کاربر در نظرسنجی شرکت کرده
    const userResponse = await prisma.poll_responses.findFirst({
      where: {
        pollId: id,
        userId: session.user.id,
      },
    });

    // بررسی دسترسی
    const canView =
      session.user.role === 'ADMIN' ||
      poll.createdById === session.user.id ||
      poll.visibilityMode === 'PUBLIC' ||
      (poll.showResultsMode === 'LIVE' && poll.visibilityMode === 'PUBLIC') ||
      (userResponse && poll.showResultsMode !== 'NEVER'); // اگر شرکت کرده و نمایش نتایج NEVER نباشد

    if (!canView) {
      return NextResponse.json(
        { error: 'شما مجاز به مشاهده نتایج نیستید' },
        { status: 403 }
      );
    }

    // بررسی اینکه آیا نتایج باید نمایش داده شود
    if (
      poll.showResultsMode === 'AFTER_CLOSE' &&
      (!poll.closedAt || new Date(poll.closedAt) > new Date()) &&
      session.user.role !== 'ADMIN' &&
      poll.createdById !== session.user.id &&
      !userResponse // اگر شرکت نکرده
    ) {
      return NextResponse.json(
        { error: 'نتایج بعد از پایان نظرسنجی نمایش داده می‌شود' },
        { status: 403 }
      );
    }

    // محاسبه کل افراد هدف
    let targetUsersQuery: any = {
      role: { not: 'ADMIN' }, // ادمین‌ها جزء target نیستند
    };

    if (poll.departmentId) {
      targetUsersQuery.departmentId = poll.departmentId;
    }

    const targetUsers = await prisma.users.findMany({
      where: targetUsersQuery,
      select: {
        id: true,
        name: true,
        role: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // دریافت همه پاسخ‌ها
    const responses = await prisma.poll_responses.findMany({
      where: {
        pollId: id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            departmentId: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        option: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // محاسبه آمار کلی
    const totalTargetUsers = targetUsers.length;
    const uniqueRespondents = new Set(responses.map((r) => r.userId));
    const totalResponses = uniqueRespondents.size;
    const responseRate = totalTargetUsers > 0
      ? Math.round((totalResponses / totalTargetUsers) * 100)
      : 0;

    const stats = {
      totalTargetUsers,
      totalResponses,
      totalNotResponded: totalTargetUsers - totalResponses,
      responseRate,
    };

    // محاسبه نتایج بر اساس نوع
    let results: any = {};

    if (poll.type === 'SINGLE_CHOICE' || poll.type === 'MULTIPLE_CHOICE') {
      // شمارش رای به هر گزینه
      const optionCounts = poll.options.map((option) => {
        const voteCount = responses.filter(
          (r) => r.optionId === option.id
        ).length;
        const percentage = totalResponses > 0
          ? Math.round((voteCount / totalResponses) * 100)
          : 0;

        return {
          id: option.id,
          text: option.text,
          order: option.order,
          voteCount,
          percentage,
        };
      });

      results.options = optionCounts;
    } else if (poll.type === 'RATING_SCALE') {
      // محاسبه میانگین و توزیع
      const ratings = responses.map((r) => r.ratingValue).filter((r) => r !== null) as number[];
      const average = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        : 0;

      // توزیع امتیازها
      const distribution: { rating: number; count: number }[] = [];
      const minRating = poll.minRating || 1;
      const maxRating = poll.maxRating || 5;

      for (let i = minRating; i <= maxRating; i++) {
        const count = ratings.filter((r) => r === i).length;
        distribution.push({ rating: i, count });
      }

      results.average = parseFloat(average.toFixed(2));
      results.distribution = distribution;
      results.totalRatings = ratings.length;
    } else if (poll.type === 'TEXT_INPUT') {
      // فقط تعداد پاسخ‌های متنی
      results.textResponses = responses.map((r) => ({
        id: r.id,
        textValue: r.textValue,
        comment: r.comment,
        createdAt: r.createdAt,
        ...(poll.visibilityMode === 'PUBLIC' || session.user.role === 'ADMIN' || poll.createdById === session.user.id
          ? {
              user: {
                id: r.user.id,
                name: r.user.name,
              },
            }
          : {}),
      }));
    }

    // لیست رأی‌دهندگان (فقط برای PUBLIC یا ادمین/سازنده)
    let voters: any[] | undefined;

    if (
      poll.visibilityMode === 'PUBLIC' ||
      session.user.role === 'ADMIN' ||
      poll.createdById === session.user.id
    ) {
      voters = Array.from(uniqueRespondents).map((userId) => {
        const userResponses = responses.filter((r) => r.userId === userId);
        const user = userResponses[0].user;

        return {
          userId: user.id,
          name: user.name,
          role: user.role,
          department: user.department,
          votedAt: userResponses[0].createdAt,
          selectedOptions:
            poll.type === 'SINGLE_CHOICE' || poll.type === 'MULTIPLE_CHOICE'
              ? userResponses.map((r) => r.option?.text).filter(Boolean)
              : undefined,
          ratingValue:
            poll.type === 'RATING_SCALE'
              ? userResponses[0].ratingValue
              : undefined,
          textValue:
            poll.type === 'TEXT_INPUT'
              ? userResponses[0].textValue
              : undefined,
          comment: userResponses[0].comment,
        };
      });
    }

    // آمار بر اساس بخش (فقط برای ادمین یا سازنده)
    let departmentStats: any[] | undefined;

    if (
      (session.user.role === 'ADMIN' || poll.createdById === session.user.id) &&
      !poll.departmentId // نظرسنجی عمومی
    ) {
      const departments = await prisma.departments.findMany({
        select: {
          id: true,
          name: true,
        },
      });

      departmentStats = departments.map((dept) => {
        const deptTargetUsers = targetUsers.filter(
          (u) => u.departmentId === dept.id
        );
        const deptResponses = responses.filter(
          (r) => r.user.departmentId === dept.id
        );
        const deptUniqueRespondents = new Set(deptResponses.map((r) => r.userId));

        return {
          departmentId: dept.id,
          departmentName: dept.name,
          totalTarget: deptTargetUsers.length,
          totalResponded: deptUniqueRespondents.size,
          totalNotResponded: deptTargetUsers.length - deptUniqueRespondents.size,
          responseRate: deptTargetUsers.length > 0
            ? Math.round((deptUniqueRespondents.size / deptTargetUsers.length) * 100)
            : 0,
        };
      });
    }

    return NextResponse.json({
      poll: {
        id: poll.id,
        title: poll.title,
        type: poll.type,
        visibilityMode: poll.visibilityMode,
        showResultsMode: poll.showResultsMode,
        closedAt: poll.closedAt,
        department: poll.department,
      },
      stats,
      results,
      voters,
      departmentStats,
    });
  } catch (error) {
    console.error('Get results error:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت نتایج' },
      { status: 500 }
    );
  }
}
