import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import {
  generateUpdateSummary,
  generateUpdateTitle,
  getCategoryFromFeedbackType,
  OpenAISettings,
} from "@/lib/openai";

// POST - ایجاد اطلاع‌رسانی از فیدبک (فقط ADMIN/MANAGER)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ادمین و مدیر می‌توانند
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { feedbackId, useAI = true } = body;

    if (!feedbackId) {
      return NextResponse.json(
        { error: "شناسه فیدبک الزامی است" },
        { status: 400 }
      );
    }

    // بررسی فیدبک
    const feedback = await prisma.feedbacks.findUnique({
      where: { id: feedbackId },
      include: {
        departments: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!feedback) {
      return NextResponse.json(
        { error: "فیدبک یافت نشد" },
        { status: 404 }
      );
    }

    // بررسی اینکه قبلاً اطلاع‌رسانی ایجاد نشده باشد
    const existingUpdate = await prisma.updates.findUnique({
      where: { feedbackId },
    });

    if (existingUpdate) {
      return NextResponse.json(
        { error: "قبلاً برای این فیدبک اطلاع‌رسانی ایجاد شده است" },
        { status: 400 }
      );
    }

    // دریافت تنظیمات OpenAI
    let openAISettings: OpenAISettings = {
      enabled: false,
      apiKey: "",
      model: "gpt-3.5-turbo",
    };

    if (useAI) {
      const settings = await prisma.settings.findFirst();
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
    }

    // تولید عنوان و خلاصه
    const content = feedback.userResponse || feedback.content;
    let title = `رسیدگی به: ${feedback.title}`;
    let summary = content.substring(0, 200);

    if (useAI && openAISettings.enabled) {
      [title, summary] = await Promise.all([
        generateUpdateTitle(
          feedback.title,
          feedback.content,
          feedback.userResponse || "",
          openAISettings
        ),
        generateUpdateSummary(feedback.title, content, openAISettings),
      ]);
    }

    // ایجاد اطلاع‌رسانی
    const update = await prisma.updates.create({
      data: {
        id: randomUUID(),
        title,
        content,
        summary,
        category: getCategoryFromFeedbackType(feedback.type),
        source: "AUTOMATIC",
        feedbackId,
        tags: feedback.keywords || [],
        isDraft: false,
        isPublished: true,
        publishedAt: new Date(),
        createdById: session.user.id,
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
          },
        },
        feedbacks: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        id: update.id,
        title: update.title,
        content: update.content,
        summary: update.summary,
        category: update.category,
        source: update.source,
        tags: update.tags,
        publishedAt: update.publishedAt,
        createdBy: update.users,
        feedback: update.feedbacks,
        message: "اطلاع‌رسانی با موفقیت ایجاد شد",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating update from feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
