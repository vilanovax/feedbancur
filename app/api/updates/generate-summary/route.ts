import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateUpdateSummary, OpenAISettings } from "@/lib/openai";

// POST - تولید خلاصه با AI
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ادمین می‌تواند
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, content } = body;

    if (!content) {
      return NextResponse.json(
        { error: "محتوا الزامی است" },
        { status: 400 }
      );
    }

    // دریافت تنظیمات OpenAI
    const settings = await prisma.settings.findFirst();

    let openAISettings: OpenAISettings = {
      enabled: false,
      apiKey: "",
      model: "gpt-3.5-turbo",
    };

    if (settings?.openAISettings) {
      const parsed =
        typeof settings.openAISettings === "string"
          ? JSON.parse(settings.openAISettings)
          : settings.openAISettings;
      openAISettings = {
        enabled: parsed.enabled || false,
        apiKey: parsed.apiKey || "",
        model: parsed.model || "gpt-3.5-turbo",
      };
    }

    if (!openAISettings.enabled || !openAISettings.apiKey) {
      return NextResponse.json(
        { error: "تنظیمات OpenAI فعال نیست یا API key تنظیم نشده است" },
        { status: 400 }
      );
    }

    const summary = await generateUpdateSummary(
      title || "",
      content,
      openAISettings
    );

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Error generating summary:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
