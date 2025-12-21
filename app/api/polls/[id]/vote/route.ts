import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const voteSchema = z.object({
  optionId: z.string().optional(),
  optionIds: z.array(z.string()).optional(),
  ratingValue: z.number().optional(),
  textValue: z.string().optional(),
  comment: z.string().optional(),
});

// POST - ثبت رای
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // دریافت نظرسنجی
    const poll = await prisma.polls.findUnique({
      where: { id },
      include: {
        options: true,
      },
    });

    if (!poll) {
      return NextResponse.json(
        { error: 'نظرسنجی یافت نشد' },
        { status: 404 }
      );
    }

    // بررسی فعال بودن
    if (!poll.isActive) {
      return NextResponse.json(
        { error: 'نظرسنجی غیرفعال است' },
        { status: 400 }
      );
    }

    // بررسی زمان‌بندی
    if (poll.scheduledAt && new Date(poll.scheduledAt) > new Date()) {
      return NextResponse.json(
        { error: 'نظرسنجی هنوز شروع نشده است' },
        { status: 400 }
      );
    }

    // بررسی بسته بودن
    if (poll.closedAt && new Date(poll.closedAt) < new Date()) {
      return NextResponse.json(
        { error: 'نظرسنجی بسته شده است' },
        { status: 400 }
      );
    }

    // بررسی رای قبلی
    const existingVotes = await prisma.pollResponse.findMany({
      where: {
        pollId: id,
        userId: session.user.id,
      },
    });

    if (existingVotes.length > 0 && !poll.allowMultipleVotes) {
      return NextResponse.json(
        { error: 'شما قبلاً در این نظرسنجی شرکت کرده‌اید' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validatedData = voteSchema.parse(body);

    // اعتبارسنجی بر اساس نوع نظرسنجی
    if (poll.type === 'SINGLE_CHOICE') {
      if (!validatedData.optionId) {
        return NextResponse.json(
          { error: 'لطفاً یک گزینه انتخاب کنید' },
          { status: 400 }
        );
      }

      // بررسی معتبر بودن گزینه
      const option = poll.options.find((opt) => opt.id === validatedData.optionId);
      if (!option) {
        return NextResponse.json(
          { error: 'گزینه نامعتبر است' },
          { status: 400 }
        );
      }

      // اگر allowMultipleVotes فعال است، رای‌های قبلی را حذف کن
      if (poll.allowMultipleVotes) {
        await prisma.pollResponse.deleteMany({
          where: {
            pollId: id,
            userId: session.user.id,
          },
        });
      }

      // ثبت رای
      await prisma.pollResponse.create({
        data: {
          pollId: id,
          userId: session.user.id,
          optionId: validatedData.optionId,
          comment: validatedData.comment,
        },
      });
    } else if (poll.type === 'MULTIPLE_CHOICE') {
      if (!validatedData.optionIds || validatedData.optionIds.length === 0) {
        return NextResponse.json(
          { error: 'لطفاً حداقل یک گزینه انتخاب کنید' },
          { status: 400 }
        );
      }

      // بررسی معتبر بودن گزینه‌ها
      const validOptions = validatedData.optionIds.filter((optId) =>
        poll.options.some((opt) => opt.id === optId)
      );

      if (validOptions.length !== validatedData.optionIds.length) {
        return NextResponse.json(
          { error: 'برخی گزینه‌ها نامعتبر هستند' },
          { status: 400 }
        );
      }

      // اگر allowMultipleVotes فعال است، رای‌های قبلی را حذف کن
      if (poll.allowMultipleVotes) {
        await prisma.pollResponse.deleteMany({
          where: {
            pollId: id,
            userId: session.user.id,
          },
        });
      }

      // ثبت رای‌ها
      await prisma.pollResponse.createMany({
        data: validOptions.map((optionId) => ({
          pollId: id,
          userId: session.user.id,
          optionId,
          comment: validatedData.comment,
        })),
      });
    } else if (poll.type === 'RATING_SCALE') {
      if (!validatedData.ratingValue) {
        return NextResponse.json(
          { error: 'لطفاً امتیاز خود را وارد کنید' },
          { status: 400 }
        );
      }

      // بررسی محدوده امتیاز
      if (
        validatedData.ratingValue < (poll.minRating || 1) ||
        validatedData.ratingValue > (poll.maxRating || 5)
      ) {
        return NextResponse.json(
          { error: 'امتیاز خارج از محدوده مجاز است' },
          { status: 400 }
        );
      }

      // اگر allowMultipleVotes فعال است، رای‌های قبلی را حذف کن
      if (poll.allowMultipleVotes) {
        await prisma.pollResponse.deleteMany({
          where: {
            pollId: id,
            userId: session.user.id,
          },
        });
      }

      // ثبت رای
      await prisma.pollResponse.create({
        data: {
          pollId: id,
          userId: session.user.id,
          ratingValue: validatedData.ratingValue,
          comment: validatedData.comment,
        },
      });
    } else if (poll.type === 'TEXT_INPUT') {
      if (!validatedData.textValue || validatedData.textValue.trim().length === 0) {
        return NextResponse.json(
          { error: 'لطفاً پاسخ خود را وارد کنید' },
          { status: 400 }
        );
      }

      // بررسی حداکثر طول
      if (
        poll.maxTextLength &&
        validatedData.textValue.length > poll.maxTextLength
      ) {
        return NextResponse.json(
          { error: `پاسخ شما بیش از ${poll.maxTextLength} کاراکتر است` },
          { status: 400 }
        );
      }

      // اگر allowMultipleVotes فعال است، رای‌های قبلی را حذف کن
      if (poll.allowMultipleVotes) {
        await prisma.pollResponse.deleteMany({
          where: {
            pollId: id,
            userId: session.user.id,
          },
        });
      }

      // ثبت رای
      await prisma.pollResponse.create({
        data: {
          pollId: id,
          userId: session.user.id,
          textValue: validatedData.textValue,
          comment: validatedData.comment,
        },
      });
    }

    return NextResponse.json({ message: 'رای شما با موفقیت ثبت شد' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'داده‌های ورودی نامعتبر است', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Vote error:', error);
    return NextResponse.json(
      { error: 'خطا در ثبت رای' },
      { status: 500 }
    );
  }
}

// DELETE - حذف رای (فقط اگر allowMultipleVotes=true)
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

    const poll = await prisma.polls.findUnique({
      where: { id },
    });

    if (!poll) {
      return NextResponse.json(
        { error: 'نظرسنجی یافت نشد' },
        { status: 404 }
      );
    }

    if (!poll.allowMultipleVotes) {
      return NextResponse.json(
        { error: 'حذف رای در این نظرسنجی مجاز نیست' },
        { status: 403 }
      );
    }

    // حذف رای‌های کاربر
    await prisma.pollResponse.deleteMany({
      where: {
        pollId: id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ message: 'رای شما حذف شد' });
  } catch (error) {
    console.error('Delete vote error:', error);
    return NextResponse.json(
      { error: 'خطا در حذف رای' },
      { status: 500 }
    );
  }
}
