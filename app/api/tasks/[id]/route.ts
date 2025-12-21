import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FORWARDED']).optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  isPublic: z.boolean().optional(),
  forwardToDepartmentId: z.string().optional(),
  assignedEmployeeIds: z.array(z.string()).optional(),
  assignedUserIds: z.array(z.string()).optional(),
  comment: z.string().optional(),
});

// دریافت جزئیات یک تسک
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
    const task = await prisma.tasks.findUnique({
      where: { id },
      include: {
        departments: true,
        users: {
          select: {
            id: true,
            name: true,
            mobile: true,
            role: true,
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
                role: true,
              },
            },
          },
        },
        feedbacks: {
          include: {
            users_feedbacks_userIdTousers: {
              select: {
                id: true,
                name: true,
                mobile: true,
              },
            },
          },
        },
        task_comments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'تسک یافت نشد' }, { status: 404 });
    }

    // بررسی دسترسی
    if (session.user.role === 'EMPLOYEE') {
      const isAssigned = task.task_assignments.some(
        (assignment) => assignment.userId === session.user.id
      );
      if (!isAssigned) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (session.user.role === 'MANAGER') {
      if (task.departmentId !== session.user.departmentId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت تسک' },
      { status: 500 }
    );
  }
}

// بروزرسانی تسک
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
    const body = await req.json();
    const data = updateTaskSchema.parse(body);

    const existingTask = await prisma.tasks.findUnique({
      where: { id },
      include: { task_assignments: true },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'تسک یافت نشد' }, { status: 404 });
    }

    // بررسی دسترسی
    const isAssigned = existingTask.task_assignments.some(
      (assignment) => assignment.userId === session.user.id
    );
    const isManager =
      session.user.role === 'MANAGER' &&
      existingTask.departmentId === session.user.departmentId;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isAssigned && !isManager && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Forward کردن تسک به بخش دیگر
    if (data.forwardToDepartmentId && (isManager || isAdmin)) {
      await prisma.tasks.update({
        where: { id },
        data: {
          departmentId: data.forwardToDepartmentId,
          status: 'FORWARDED',
        },
      });

      if (data.comment) {
        await prisma.taskComment.create({
          data: {
            taskId: id,
            content: `فوروارد شد: ${data.comment}`,
          },
        });
      }

      return NextResponse.json({ message: 'تسک فوروارد شد' });
    }

    // بروزرسانی عادی
    const updateData: any = {};

    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.status) {
      updateData.status = data.status;
      if (data.status === 'COMPLETED') {
        updateData.completedAt = new Date();
      }
    }
    if (data.priority) updateData.priority = data.priority;
    if (typeof data.isPublic !== 'undefined') updateData.isPublic = data.isPublic;

    const updatedTask = await prisma.tasks.update({
      where: { id },
      data: updateData,
      include: {
        departments: true,
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
      },
    });

    // اضافه کردن کامنت اگر وجود داشت
    if (data.comment) {
      await prisma.taskComment.create({
        data: {
          taskId: id,
          content: data.comment,
        },
      });
    }

    // بروزرسانی تخصیص‌ها
    if (data.assignedEmployeeIds || data.assignedUserIds) {
      // حذف تخصیص‌های قبلی
      await prisma.taskAssignment.deleteMany({
        where: { taskId: id },
      });

      // ایجاد تخصیص‌های جدید
      if (data.assignedEmployeeIds && data.assignedEmployeeIds.length > 0) {
        await prisma.taskAssignment.createMany({
          data: data.assignedEmployeeIds.map((employeeId) => ({
            taskId: id,
            employeeId,
          })),
        });
      }

      if (data.assignedUserIds && data.assignedUserIds.length > 0) {
        await prisma.taskAssignment.createMany({
          data: data.assignedUserIds.map((userId) => ({
            taskId: id,
            userId,
          })),
        });
      }
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Update task error:', error);
    return NextResponse.json(
      { error: 'خطا در بروزرسانی تسک' },
      { status: 500 }
    );
  }
}

// حذف تسک
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // فقط ادمین می‌تواند تسک حذف کند
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    await prisma.tasks.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'تسک حذف شد' });
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json(
      { error: 'خطا در حذف تسک' },
      { status: 500 }
    );
  }
}
