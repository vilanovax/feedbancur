import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updatePollSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  scheduledAt: z.string().optional().nullable(),
  closedAt: z.string().optional().nullable(),
  visibilityMode: z.enum(['ANONYMOUS', 'PUBLIC']).optional(),
  showResultsMode: z.enum(['LIVE', 'AFTER_CLOSE']).optional(),
  isRequired: z.boolean().optional(),
});

const fullUpdatePollSchema = z.object({
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
  departmentIds: z.array(z.string()).optional(),
  scheduledAt: z.string().optional().nullable(),
  closedAt: z.string().optional().nullable(),
  options: z.array(z.object({
    id: z.string().optional(),
    text: z.string().min(1),
    order: z.number(),
  })).optional(),
  minRating: z.number().optional().nullable(),
  maxRating: z.number().optional().nullable(),
});

// GET - دریافت جزئیات نظرسنجی
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

    const poll = await prisma.poll.findUnique({
      where: { id },
      include: {
        options: {
          orderBy: {
            order: 'asc',
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        _count: {
          select: {
            responses: true,
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

    // بررسی رای کاربر
    const userResponse = await prisma.pollResponse.findMany({
      where: {
        pollId: id,
        userId: session.user.id,
      },
      include: {
        option: true,
      },
    });

    // تعیین اینکه آیا می‌تواند رای دهد
    const canVote =
      poll.isActive &&
      (!poll.closedAt || new Date(poll.closedAt) > new Date()) &&
      (!poll.scheduledAt || new Date(poll.scheduledAt) <= new Date()) &&
      (poll.allowMultipleVotes || userResponse.length === 0);

    // تعیین اینکه آیا می‌تواند نتایج را ببیند
    const canViewResults =
      session.user.role === 'ADMIN' ||
      poll.createdById === session.user.id ||
      poll.visibilityMode === 'PUBLIC' ||
      (poll.showResultsMode === 'LIVE' && userResponse.length > 0);

    return NextResponse.json({
      poll,
      userResponse: userResponse.length > 0 ? userResponse : null,
      canVote,
      canViewResults,
    });
  } catch (error) {
    console.error('Get poll error:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت نظرسنجی' },
      { status: 500 }
    );
  }
}

// PATCH - ویرایش نظرسنجی
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const poll = await prisma.poll.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            responses: true,
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

    // بررسی دسترسی
    if (
      session.user.role !== 'ADMIN' &&
      poll.createdById !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'شما مجاز به ویرایش این نظرسنجی نیستید' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = updatePollSchema.parse(body);

    // به‌روزرسانی نظرسنجی
    const updatedPoll = await prisma.poll.update({
      where: { id },
      data: {
        ...validatedData,
        scheduledAt: validatedData.scheduledAt
          ? new Date(validatedData.scheduledAt)
          : undefined,
        closedAt: validatedData.closedAt
          ? new Date(validatedData.closedAt)
          : undefined,
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

    return NextResponse.json(updatedPoll);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'داده‌های ورودی نامعتبر است', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update poll error:', error);
    return NextResponse.json(
      { error: 'خطا در ویرایش نظرسنجی' },
      { status: 500 }
    );
  }
}

// PUT - ویرایش کامل نظرسنجی
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existingPoll = await prisma.poll.findUnique({
      where: { id },
      include: {
        options: true,
      },
    });

    if (!existingPoll) {
      return NextResponse.json(
        { error: 'نظرسنجی یافت نشد' },
        { status: 404 }
      );
    }

    // بررسی دسترسی
    if (
      session.user.role !== 'ADMIN' &&
      existingPoll.createdById !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'شما مجاز به ویرایش این نظرسنجی نیستید' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = fullUpdatePollSchema.parse(body);

    // تعیین departmentId
    let finalDepartmentId = validatedData.departmentId;
    if (validatedData.departmentIds && validatedData.departmentIds.length > 0) {
      finalDepartmentId = validatedData.departmentIds[0];
    }

    // حذف گزینه‌های قبلی و ایجاد گزینه‌های جدید
    await prisma.pollOption.deleteMany({
      where: { pollId: id },
    });

    // به‌روزرسانی نظرسنجی
    const updatedPoll = await prisma.poll.update({
      where: { id },
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
        minRating: validatedData.minRating,
        maxRating: validatedData.maxRating,
        ...(validatedData.options && validatedData.options.length > 0
          ? {
              options: {
                create: validatedData.options.map(opt => ({
                  text: opt.text,
                  order: opt.order,
                })),
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

    return NextResponse.json(updatedPoll);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'داده‌های ورودی نامعتبر است', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Full update poll error:', error);
    return NextResponse.json(
      { error: 'خطا در ویرایش نظرسنجی' },
      { status: 500 }
    );
  }
}

// DELETE - حذف نظرسنجی
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const poll = await prisma.poll.findUnique({
      where: { id },
    });

    if (!poll) {
      return NextResponse.json(
        { error: 'نظرسنجی یافت نشد' },
        { status: 404 }
      );
    }

    // بررسی دسترسی
    if (
      session.user.role !== 'ADMIN' &&
      poll.createdById !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'شما مجاز به حذف این نظرسنجی نیستید' },
        { status: 403 }
      );
    }

    // حذف نظرسنجی (cascade delete برای options و responses)
    await prisma.poll.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'نظرسنجی با موفقیت حذف شد' });
  } catch (error) {
    console.error('Delete poll error:', error);
    return NextResponse.json(
      { error: 'خطا در حذف نظرسنجی' },
      { status: 500 }
    );
  }
}
