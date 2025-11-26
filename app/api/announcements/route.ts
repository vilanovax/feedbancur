import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'عنوان الزامی است'),
  content: z.string().min(1, 'محتوا الزامی است'),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  departmentId: z.string().optional().nullable(), // null = برای همه
  isActive: z.boolean().optional(),
  scheduledAt: z.string().optional().nullable(),
});

// دریافت لیست اعلانات
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const showAll = searchParams.get('showAll') === 'true'; // برای صفحه مدیریت

    const where: any = {
      AND: [
        showAll ? {} : { isActive: true }, // فقط اعلانات فعال (مگر در حالت مدیریت)
        showAll ? {} : {
          OR: [
            { scheduledAt: null }, // اعلانات بدون زمان‌بندی
            { scheduledAt: { lte: new Date() } }, // اعلانات که زمانشان رسیده
          ],
        },
        {
          OR: [
            { departmentId: null }, // اعلانات عمومی
          ],
        },
      ],
    };

    // اگر کاربر در بخشی است، اعلانات آن بخش را هم نشان بده
    if (session.user.departmentId) {
      where.AND[2].OR.push({ departmentId: session.user.departmentId });
    }

    const announcements = await prisma.announcement.findMany({
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
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // آخرین 50 اعلان
    });

    return NextResponse.json(announcements);
  } catch (error) {
    console.error('Get announcements error:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اعلانات' },
      { status: 500 }
    );
  }
}

// ایجاد اعلان جدید
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // فقط ادمین و مدیران می‌توانند اعلان ایجاد کنند
    if (session.user.role === 'EMPLOYEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const data = createAnnouncementSchema.parse(body);

    // مدیران فقط برای بخش خود اعلان ایجاد کنند
    if (session.user.role === 'MANAGER') {
      if (data.departmentId && data.departmentId !== session.user.departmentId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      // MANAGER نمی‌تواند اعلان عمومی (برای همه) ایجاد کند
      if (data.departmentId === null) {
        return NextResponse.json(
          { error: 'فقط مدیرعامل می‌تواند اعلان عمومی ایجاد کند' },
          { status: 403 }
        );
      }
      // اگر بخشی مشخص نشده، به بخش خود مدیر اختصاص بده
      if (!data.departmentId) {
        data.departmentId = session.user.departmentId;
      }
    }

    // تنظیم زمان انتشار
    const isActive = data.isActive !== undefined ? data.isActive : true;
    const scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
    const publishedAt = isActive && !scheduledAt ? new Date() : null;

    const announcement = await prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        priority: data.priority || 'MEDIUM',
        departmentId: data.departmentId || null,
        isActive,
        scheduledAt,
        publishedAt,
        createdById: session.user.id,
      },
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
      },
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Create announcement error:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد اعلان' },
      { status: 500 }
    );
  }
}
