import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createEmployeeSchema = z.object({
  name: z.string().min(1, 'نام الزامی است'),
  position: z.string().optional(),
  departmentId: z.string(),
});

// دریافت لیست کارمندان
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get('departmentId');

    const where: any = {};

    // فیلتر براساس بخش
    if (departmentId) {
      where.departmentId = departmentId;
    } else if (session.user.role === 'MANAGER' && session.user.departmentId) {
      // مدیران فقط کارمندان بخش خود را می‌بینند
      where.departmentId = session.user.departmentId;
    }

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const skip = (page - 1) * limit;
    const usePagination = searchParams.get('paginated') === 'true';

    const [employees, total] = await Promise.all([
      prisma.employees.findMany({
        where,
        include: {
          departments: true,
          task_assignments: {
            include: {
              tasks: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                },
              },
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
        skip,
        take: limit,
      }),
      prisma.employees.count({ where }),
    ]);

    if (usePagination) {
      return NextResponse.json({
        data: employees,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    }

    return NextResponse.json(employees);
  } catch (error) {
    console.error('Get employees error:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت کارمندان' },
      { status: 500 }
    );
  }
}

// ایجاد کارمند جدید
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // فقط ادمین و مدیران می‌توانند کارمند ایجاد کنند
    if (session.user.role === 'EMPLOYEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const data = createEmployeeSchema.parse(body);

    // مدیران فقط برای بخش خود کارمند ایجاد کنند
    if (
      session.user.role === 'MANAGER' &&
      data.departmentId !== session.user.departmentId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const employee = await prisma.employees.create({
      data: {
        name: data.name,
        position: data.position,
        departmentId: data.departmentId,
      },
      include: {
        departments: true,
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error('Create employee error:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد کارمند' },
      { status: 500 }
    );
  }
}
