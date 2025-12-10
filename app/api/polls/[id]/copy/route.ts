import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - کپی نظرسنجی
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // بررسی دسترسی: EMPLOYEE نمی‌تواند کپی کند
    if (session.user.role === 'EMPLOYEE') {
      return NextResponse.json(
        { error: 'شما مجاز به کپی نظرسنجی نیستید' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // دریافت نظرسنجی اصلی
    const originalPoll = await prisma.poll.findUnique({
      where: { id },
      include: {
        options: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!originalPoll) {
      return NextResponse.json(
        { error: 'نظرسنجی یافت نشد' },
        { status: 404 }
      );
    }

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
          { error: 'بخش شما مجاز به کپی نظرسنجی نیست' },
          { status: 403 }
        );
      }

      // بررسی محدودیت بخش
      if (
        originalPoll.departmentId &&
        !department.allowedPollDepartments.includes(originalPoll.departmentId)
      ) {
        return NextResponse.json(
          { error: 'شما مجاز به کپی نظرسنجی برای این بخش نیستید' },
          { status: 403 }
        );
      }
    }

    // ایجاد نظرسنجی جدید
    const newPoll = await prisma.poll.create({
      data: {
        title: originalPoll.title + ' - کپی',
        description: originalPoll.description,
        type: originalPoll.type,
        visibilityMode: originalPoll.visibilityMode,
        isActive: false, // پیش‌فرض غیرفعال
        allowMultipleVotes: originalPoll.allowMultipleVotes,
        isRequired: originalPoll.isRequired,
        showResultsMode: originalPoll.showResultsMode,
        maxTextLength: originalPoll.maxTextLength,
        departmentId: originalPoll.departmentId,
        createdById: session.user.id,
        minRating: originalPoll.minRating,
        maxRating: originalPoll.maxRating,
        options: {
          create: originalPoll.options.map((option) => ({
            text: option.text,
            order: option.order,
          })),
        },
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

    return NextResponse.json(newPoll, { status: 201 });
  } catch (error) {
    console.error('Copy poll error:', error);
    return NextResponse.json(
      { error: 'خطا در کپی نظرسنجی' },
      { status: 500 }
    );
  }
}
