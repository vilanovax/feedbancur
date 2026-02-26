import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, value, rating, url } = body;

    // فقط درخواست معتبر را بپذیر؛ ذخیره اختیاری است
    if (typeof name !== "string" || typeof value !== "number") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // در صورت نیاز می‌توان اینجا لاگ یا ذخیره در دیتابیس اضافه کرد
    if (process.env.NODE_ENV === "development") {
      console.debug("[Web Vitals]", name, value, rating, url);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
