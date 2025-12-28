import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - دریافت اطلاعات پروژه برای نمایش فرم عمومی
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const project = await prisma.projects.findUnique({
      where: { token },
      select: {
        id: true,
        name: true,
        description: true,
        isPublic: true,
        requireLogin: true,
        allowAnonymous: true,
        isActive: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "پروژه یافت نشد" },
        { status: 404 }
      );
    }

    if (!project.isActive) {
      return NextResponse.json(
        { error: "این پروژه غیرفعال است" },
        { status: 403 }
      );
    }

    if (!project.isPublic) {
      return NextResponse.json(
        { error: "این پروژه عمومی نیست" },
        { status: 403 }
      );
    }

    // دریافت تنظیمات برای feedbackTypes
    const settings = await prisma.settings.findFirst();
    const feedbackTypes = settings?.feedbackTypes || [
      { value: "SUGGESTION", label: "پیشنهاد" },
      { value: "BUG", label: "گزارش مشکل" },
      { value: "COMPLAINT", label: "شکایت" },
      { value: "OTHER", label: "سایر" },
    ];

    return NextResponse.json({
      id: project.id,
      name: project.name,
      description: project.description,
      requireLogin: project.requireLogin,
      allowAnonymous: project.allowAnonymous,
      feedbackTypes,
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات پروژه" },
      { status: 500 }
    );
  }
}
