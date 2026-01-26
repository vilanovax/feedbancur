import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// دریافت تسک‌های عمومی تکمیل شده
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get('departmentId');

    const where: any = {
      isPublic: true,
      status: 'COMPLETED',
    };

    // فیلتر براساس بخش
    if (departmentId) {
      where.departmentId = departmentId;
    }

    const tasks = await prisma.tasks.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        priority: true,
        completedAt: true,
        createdAt: true,
        departments: {
          select: {
            id: true,
            name: true,
            manager: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        task_assignments: {
          select: {
            employees: {
              select: {
                id: true,
                name: true,
                position: true,
              },
            },
            users: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        feedbacks: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
      take: 50, // آخرین 50 تسک تکمیل شده
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Get public board error:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت بورد عمومی' },
      { status: 500 }
    );
  }
}
