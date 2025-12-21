import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createTaskSchema = z.object({
  title: z.string().min(1, 'عنوان الزامی است'),
  description: z.string().min(1, 'توضیحات الزامی است'),
  departmentId: z.string(),
  feedbackId: z.string().optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  assignedEmployeeIds: z.array(z.string()).optional(),
  assignedUserIds: z.array(z.string()).optional(),
});

// دریافت لیست تسک‌ها
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const departmentId = searchParams.get('departmentId');

    const where: any = {};

    // فیلتر براساس نقش کاربر
    if (session.user.role === 'EMPLOYEE') {
      // کارمندان فقط تسک‌های خودشان را می‌بینند
      where.assignedTo = {
        some: {
          OR: [
            { userId: session.user.id },
          ],
        },
      };
    } else if (session.user.role === 'MANAGER' && session.user.departmentId) {
      // مدیران فقط تسک‌های بخش خود را می‌بینند
      where.departmentId = session.user.departmentId;
    }
    // ADMIN همه تسک‌ها را می‌بیند

    if (status) {
      where.status = status;
    }

    if (departmentId && session.user.role === 'ADMIN') {
      where.departmentId = departmentId;
    }

    const tasks = await prisma.tasks.findMany({
      where,
      include: {
        departments: true,
        users: {
          select: {
            id: true,
            name: true,
            mobile: true,
          },
        },
        task_assignments: {
          include: {
            employees: true,
            users: {
              select: {
                id: true,
                name: true,
                mobile: true,
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
        task_comments: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت تسک‌ها' },
      { status: 500 }
    );
  }
}

// ایجاد تسک جدید
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // فقط ادمین و مدیران می‌توانند تسک ایجاد کنند
    if (session.user.role === 'EMPLOYEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const data = createTaskSchema.parse(body);

    // روتینگ خودکار بر اساس کلیدواژه
    let targetDepartmentId = data.departmentId;

    if (data.feedbackId) {
      const feedback = await prisma.feedbacks.findUnique({
        where: { id: data.feedbackId },
        include: { departments: true },
      });

      if (feedback) {
        // جستجو برای دپارتمان مناسب بر اساس کلیدواژه
        const departments = await prisma.departments.findMany({
          where: {
            keywords: {
              hasSome: extractKeywords(data.title + ' ' + data.description),
            },
          },
        });

        if (departments.length > 0) {
          targetDepartmentId = departments[0].id;
        } else {
          targetDepartmentId = feedback.departmentId;
        }
      }
    }

    // ایجاد تسک
    const task = await prisma.tasks.create({
      data: {
        title: data.title,
        description: data.description,
        departmentId: targetDepartmentId,
        feedbackId: data.feedbackId,
        priority: data.priority || 'MEDIUM',
        createdById: session.user.id,
      },
      include: {
        departments: true,
        users: {
          select: {
            id: true,
            name: true,
            mobile: true,
          },
        },
      },
    });

    // تخصیص به کارمندان/کاربران
    if (data.assignedEmployeeIds && data.assignedEmployeeIds.length > 0) {
      await prisma.taskAssignment.createMany({
        data: data.assignedEmployeeIds.map((employeeId) => ({
          taskId: task.id,
          employeeId,
        })),
      });
    }

    if (data.assignedUserIds && data.assignedUserIds.length > 0) {
      await prisma.taskAssignment.createMany({
        data: data.assignedUserIds.map((userId) => ({
          taskId: task.id,
          userId,
        })),
      });
    }

    // اگر فیدبکی مرتبط است، وضعیت آن را به REVIEWED تغییر بده
    if (data.feedbackId) {
      await prisma.feedbacks.update({
        where: { id: data.feedbackId },
        data: { status: 'REVIEWED' },
      });
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Create task error:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد تسک' },
      { status: 500 }
    );
  }
}

// تابع استخراج کلیدواژه‌ها از متن
function extractKeywords(text: string): string[] {
  const commonWords = ['است', 'می', 'را', 'به', 'در', 'از', 'که', 'و', 'این', 'آن'];
  const words = text
    .toLowerCase()
    .replace(/[^\u0600-\u06FF\s]/g, '') // فقط حروف فارسی
    .split(/\s+/)
    .filter((word) => word.length > 2 && !commonWords.includes(word));

  return [...new Set(words)].slice(0, 10); // 10 کلیدواژه منحصر به فرد
}
