import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const feedback = await prisma.feedbacks.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        keywords: true,
      },
    });

    if (!feedback) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }

    // دریافت تنظیمات OpenAI
    const settings = await prisma.settings.findFirst();
    const openAISettings = settings?.openAISettings
      ? typeof settings.openAISettings === 'string'
        ? JSON.parse(settings.openAISettings)
        : settings.openAISettings
      : null;

    if (!openAISettings?.enabled || !openAISettings?.apiKey) {
      return NextResponse.json(
        { error: "OpenAI is not configured or enabled" },
        { status: 400 }
      );
    }

    // استخراج کلمات کلیدی با OpenAI
    const model = openAISettings.model || "gpt-3.5-turbo";
    const prompt = `لطفاً کلمات کلیدی مهم این فیدبک را استخراج کن. فقط کلمات کلیدی را برگردان، بدون توضیحات اضافی. هر کلمه کلیدی را با کاما جدا کن. متن فیدبک:

عنوان: ${feedback.title}
محتوا: ${feedback.content}

کلمات کلیدی:`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAISettings.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: "شما یک دستیار هوشمند برای استخراج کلمات کلیدی از متن‌های فارسی هستید. فقط کلمات کلیدی را برگردان، بدون توضیحات.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 200,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI API error:", errorData);
        return NextResponse.json(
          { error: "Failed to extract keywords", details: errorData },
          { status: 500 }
        );
      }

      const data = await response.json();
      const keywordsText = data.choices[0]?.message?.content?.trim() || "";
      
      // تبدیل به آرایه و پاکسازی
      const keywords = keywordsText
        .split(/[،,]/)
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      // ذخیره کلمات کلیدی در دیتابیس
      await prisma.feedbacks.update({
        where: { id },
        data: { keywords },
      });

      return NextResponse.json({ keywords });
    } catch (error: any) {
      console.error("Error calling OpenAI API:", error);
      return NextResponse.json(
        { error: "Failed to extract keywords", message: error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in extract-keywords route:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

