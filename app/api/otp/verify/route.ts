import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const verifyOTPSchema = z.object({
  mobile: z.string().regex(/^09\d{9}$/, 'شماره موبایل معتبر نیست'),
  code: z.string().length(6, 'کد تایید باید 6 رقم باشد'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mobile, code } = verifyOTPSchema.parse(body);

    // یافتن OTP
    const otp = await prisma.oTP.findFirst({
      where: {
        mobile,
        code,
        verified: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otp) {
      return NextResponse.json(
        { error: 'کد تایید نامعتبر یا منقضی شده است' },
        { status: 400 }
      );
    }

    // علامت‌گذاری OTP به عنوان تایید شده
    await prisma.oTP.update({
      where: { id: otp.id },
      data: { verified: true },
    });

    return NextResponse.json({
      success: true,
      message: 'کد تایید با موفقیت بررسی شد',
      mobile,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'خطا در بررسی کد تایید' },
      { status: 500 }
    );
  }
}
