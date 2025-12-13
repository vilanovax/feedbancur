import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createPollSchema = z.object({
  title: z.string().min(1, 'عنوان الزامی است'),
  description: z.string().optional().nullable(),
  type: z.enum(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'RATING_SCALE', 'TEXT_INPUT']),
  visibilityMode: z.enum(['ANONYMOUS', 'PUBLIC']).optional(),
  isActive: z.boolean().optional(),
  allowMultipleVotes: z.boolean().optional(),
  isRequired: z.boolean().optional(),
  showResultsMode: z.enum(['LIVE', 'AFTER_CLOSE']).optional(),
  maxTextLength: z.number().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  departmentIds: z.array(z.string()).optional(), // پشتیبانی از چند بخش
  scheduledAt: z.string().optional().nullable(),
  closedAt: z.string().optional().nullable(),
  options: z.array(z.object({
    text: z.string().min(1),
    order: z.number(),
  })).optional(),
  minRating: z.number().optional().nullable(),
  maxRating: z.number().optional().nullable(),
});

// GET - دریافت لیست نظرسنجی‌ها
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const showAll = searchParams.get('showAll') === 'true';

    const where: any = {
      AND: [
        showAll ? {} : { isActive: true },
        showAll ? {} : {
          OR: [
            { scheduledAt: null },
            { scheduledAt: { lte: new Date() } },
          ],
        },
        {
          OR: [
            { departmentId: null },
          ],
        },
      ],
    };

    if (session.user.departmentId) {
      where.AND[2].OR.push({ departmentId: session.user.departmentId });
    }

    const polls = await prisma.poll.findMany({
      where,
      include: {
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
        _count: {
          select: {
            responses: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // بررسی اینکه آیا کاربر رای داده است یا نه
    const pollsWithVoteStatus = await Promise.all(
      polls.map(async (poll) => {
        const userResponse = await prisma.pollResponse.findFirst({
          where: {
            pollId: poll.id,
            userId: session.user.id,
          },
        });

        return {
          ...poll,
          hasVoted: !!userResponse,
        };
      })
    );

    return NextResponse.json(pollsWithVoteStatus);
  } catch (error) {
    console.error('Get polls error:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت نظرسنجی‌ها' },
      { status: 500 }
    );
  }
}

// POST - ایجاد نظرسنجی جدید
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // بررسی دسترسی: EMPLOYEE نمی‌تواند ایجاد کند
    if (session.user.role === 'EMPLOYEE') {
      return NextResponse.json(
        { error: 'شما مجاز به ایجاد نظرسنجی نیستید' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = createPollSchema.parse(body);

    // بررسی دسترسی برای MANAGER
    if (session.user.role === 'MANAGER') {
      const department = await prisma.department.findUnique({
        where: { id: session.user.departmentId! },
        select: {
          canCreatePoll: true,
          allowedPollDepartments: true,
        },
      });

      if (!department?.canCreatePoll) {
        return NextResponse.json(
          { error: 'بخش شما مجاز به ایجاد نظرسنجی نیست' },
          { status: 403 }
        );
      }

      // مدیر نمی‌تواند نظرسنجی برای "همه شرکت" ایجاد کند
      const targetDepartmentId = validatedData.departmentIds?.[0] || validatedData.departmentId;
      if (!targetDepartmentId) {
        return NextResponse.json(
          { error: 'شما باید یک بخش را برای نظرسنجی انتخاب کنید' },
          { status: 403 }
        );
      }

      // بررسی محدودیت بخش
      if (!department.allowedPollDepartments.includes(targetDepartmentId)) {
        return NextResponse.json(
          { error: 'شما مجاز به ایجاد نظرسنجی برای این بخش نیستید' },
          { status: 403 }
        );
      }

      // اگر چند بخش انتخاب شده، همه را بررسی کن
      if (validatedData.departmentIds && validatedData.departmentIds.length > 1) {
        const unauthorizedDepts = validatedData.departmentIds.filter(
          deptId => !department.allowedPollDepartments.includes(deptId)
        );
        if (unauthorizedDepts.length > 0) {
          return NextResponse.json(
            { error: 'شما مجاز به ایجاد نظرسنجی برای برخی بخش‌های انتخابی نیستید' },
            { status: 403 }
          );
        }
      }
    }

    // اعتبارسنجی بر اساس نوع
    if (
      (validatedData.type === 'SINGLE_CHOICE' ||
        validatedData.type === 'MULTIPLE_CHOICE') &&
      (!validatedData.options || validatedData.options.length < 2)
    ) {
      return NextResponse.json(
        { error: 'نظرسنجی چندگزینه‌ای باید حداقل ۲ گزینه داشته باشد' },
        { status: 400 }
      );
    }

    if (
      validatedData.type === 'RATING_SCALE' &&
      (!validatedData.minRating ||
        !validatedData.maxRating ||
        validatedData.minRating >= validatedData.maxRating)
    ) {
      return NextResponse.json(
        { error: 'محدوده امتیاز نامعتبر است' },
        { status: 400 }
      );
    }

    // تعیین departmentId - اگر departmentIds داده شده، اولین مورد را استفاده کن
    // (برای سازگاری با ساختار فعلی که فقط یک department پشتیبانی می‌کند)
    let finalDepartmentId = validatedData.departmentId;
    if (validatedData.departmentIds && validatedData.departmentIds.length > 0) {
      finalDepartmentId = validatedData.departmentIds[0];
    }

    // ایجاد نظرسنجی
    const poll = await prisma.poll.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        type: validatedData.type,
        visibilityMode: validatedData.visibilityMode || 'PUBLIC',
        isActive: validatedData.isActive ?? true,
        allowMultipleVotes: validatedData.allowMultipleVotes ?? false,
        isRequired: validatedData.isRequired ?? false,
        showResultsMode: validatedData.showResultsMode || 'LIVE',
        maxTextLength: validatedData.maxTextLength,
        departmentId: finalDepartmentId,
        scheduledAt: validatedData.scheduledAt
          ? new Date(validatedData.scheduledAt)
          : null,
        closedAt: validatedData.closedAt
          ? new Date(validatedData.closedAt)
          : null,
        createdById: session.user.id,
        minRating: validatedData.minRating,
        maxRating: validatedData.maxRating,
        ...(validatedData.options && validatedData.options.length > 0
          ? {
              options: {
                create: validatedData.options,
              },
            }
          : {}),
      },
      include: {
        options: true,
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

    // ایجاد نوتیفیکیشن برای کاربران
    // فقط اگر نظرسنجی فعال باشد و زمان‌بندی نشده باشد یا زمان آن رسیده باشد
    const shouldNotify = poll.isActive &&
      (!poll.scheduledAt || new Date(poll.scheduledAt) <= new Date());

    if (shouldNotify) {
      // پیدا کردن کاربران هدف
      const targetUserWhere: any = {
        isActive: true,
      };

      // اگر بخش خاصی انتخاب شده، فقط کاربران آن بخش
      if (validatedData.departmentIds && validatedData.departmentIds.length > 0) {
        targetUserWhere.departmentId = { in: validatedData.departmentIds };
      } else if (finalDepartmentId) {
        targetUserWhere.departmentId = finalDepartmentId;
      }
      // اگر هیچ بخشی انتخاب نشده، همه کاربران فعال

      const targetUsers = await prisma.user.findMany({
        where: targetUserWhere,
        select: { id: true },
      });

      // ایجاد نوتیفیکیشن برای همه کاربران هدف
      if (targetUsers.length > 0) {
        const notificationPromises = targetUsers.map(user =>
          prisma.notification.create({
            data: {
              userId: user.id,
              title: 'نظرسنجی جدید',
              content: `نظرسنجی جدیدی با عنوان "${poll.title}" ایجاد شده است. لطفاً شرکت کنید.`,
              type: 'INFO',
              redirectUrl: `/mobile/polls/${poll.id}`,
            },
          })
        );
        await Promise.all(notificationPromises);
      }
    }

    return NextResponse.json(poll, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'داده‌های ورودی نامعتبر است', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create poll error:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد نظرسنجی' },
      { status: 500 }
    );
  }
}
