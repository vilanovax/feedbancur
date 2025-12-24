import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { randomUUID } from 'crypto';

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

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const skip = (page - 1) * limit;
    const usePagination = searchParams.get('paginated') === 'true';

    const [polls, total] = await Promise.all([
      prisma.polls.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          departments: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              poll_responses: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.polls.count({ where }),
    ]);

    // بهینه‌سازی N+1: گرفتن همه responses کاربر با یک query (بجای N query)
    const pollIds = polls.map((p: any) => p.id);
    const userResponses = pollIds.length > 0
      ? await prisma.poll_responses.findMany({
          where: {
            pollId: { in: pollIds },
            userId: session.user.id,
          },
          select: { pollId: true },
        })
      : [];
    const votedPollIds = new Set(userResponses.map((r) => r.pollId));

    // تبدیل نام‌های Prisma به فرمت frontend
    const pollsWithVoteStatus = polls.map((poll: any) => ({
      ...poll,
      createdBy: poll.users,
      department: poll.departments,
      _count: {
        responses: poll._count.poll_responses,
      },
      users: undefined,
      departments: undefined,
      hasVoted: votedPollIds.has(poll.id),
    }));

    if (usePagination) {
      return NextResponse.json({
        data: pollsWithVoteStatus,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    }

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
      if (!session.user.departmentId) {
        return NextResponse.json(
          { error: 'شما به هیچ بخشی اختصاص داده نشده‌اید' },
          { status: 403 }
        );
      }

      const department = await prisma.departments.findUnique({
        where: { id: session.user.departmentId },
        select: {
          canCreatePoll: true,
          allowedPollDepartments: true,
        },
      });

      if (!department) {
        return NextResponse.json(
          { error: 'بخش شما یافت نشد' },
          { status: 404 }
        );
      }

      if (!department.canCreatePoll) {
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
      const allowedDepartments = department.allowedPollDepartments || [];
      if (!allowedDepartments.includes(targetDepartmentId)) {
        return NextResponse.json(
          { error: 'شما مجاز به ایجاد نظرسنجی برای این بخش نیستید' },
          { status: 403 }
        );
      }

      // اگر چند بخش انتخاب شده، همه را بررسی کن
      if (validatedData.departmentIds && validatedData.departmentIds.length > 1) {
        const unauthorizedDepts = validatedData.departmentIds.filter(
          deptId => !allowedDepartments.includes(deptId)
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
    const pollId = randomUUID();
    const poll = await prisma.polls.create({
      data: {
        id: pollId,
        updatedAt: new Date(),
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
              poll_options: {
                create: validatedData.options.map((opt) => ({
                  id: randomUUID(),
                  text: opt.text,
                  order: opt.order,
                })),
              },
            }
          : {}),
      },
      include: {
        poll_options: true,
        users: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        departments: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // تبدیل به فرمت frontend
    const responsePoll = {
      ...poll,
      options: (poll as any).poll_options,
      createdBy: (poll as any).users,
      department: (poll as any).departments,
      poll_options: undefined,
      users: undefined,
      departments: undefined,
    };

    // ایجاد نوتیفیکیشن برای کاربران
    // فقط اگر نظرسنجی فعال باشد و زمان‌بندی نشده باشد یا زمان آن رسیده باشد
    // موقتاً غیرفعال شده برای دیباگ
    const shouldNotify = false; // poll.isActive && (!poll.scheduledAt || new Date(poll.scheduledAt) <= new Date());

    if (shouldNotify) {
      try {
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

        const targetUsers = await prisma.users.findMany({
          where: targetUserWhere,
          select: { id: true },
        });

        // ایجاد نوتیفیکیشن برای همه کاربران هدف
        if (targetUsers.length > 0) {
          // استفاده از createMany برای کارایی بهتر
          await prisma.notifications.createMany({
            data: targetUsers.map(user => ({
              id: randomUUID(),
              userId: user.id,
              title: 'نظرسنجی جدید',
              content: `نظرسنجی جدیدی با عنوان "${poll.title}" ایجاد شده است. لطفاً شرکت کنید.`,
              type: 'INFO',
              redirectUrl: `/mobile/polls/${poll.id}`,
              updatedAt: new Date(),
            })),
          });
        }
      } catch (notificationError: any) {
        // در صورت خطا در ایجاد notifications، فقط لاگ می‌کنیم و ادامه می‌دهیم
        console.error('Error creating notifications:', notificationError?.message || notificationError);
        console.error('Notification error stack:', notificationError?.stack);
      }
    }
    return NextResponse.json(responsePoll, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'داده‌های ورودی نامعتبر است', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create poll error:', error);
    // Log full error details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'خطا در ایجاد نظرسنجی', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
