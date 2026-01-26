import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const sendOTPSchema = z.object({
  mobile: z.string().regex(/^09\d{9}$/, 'شماره موبایل معتبر نیست'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mobile } = sendOTPSchema.parse(body);

    // تولید کد OTP (در محیط واقعی از سرویس SMS استفاده شود)
    const code = process.env.OTP_DEFAULT || '123456';

    // ایجاد OTP در دیتابیس
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 دقیقه

    // حذف OTPهای قبلی برای این شماره
    await prisma.otps.deleteMany({
      where: {
        mobile,
        verified: false,
      },
    });

    // ایجاد OTP جدید
    const otp = await prisma.otps.create({
      data: {
        id: crypto.randomUUID(),
        mobile,
        code,
        expiresAt,
      },
    });

    // در محیط واقعی، کد را از طریق SMS ارسال کنید
    console.log(`OTP for ${mobile}: ${code}`);

    return NextResponse.json({
      success: true,
      message: 'کد تایید ارسال شد',
      // در production این را حذف کنید
      ...(process.env.NODE_ENV === 'development' && { code }),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'خطا در ارسال کد تایید' },
      { status: 500 }
    );
  }
}
