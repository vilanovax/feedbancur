import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const departmentSchema = z.object({
  name: z.string().min(1, "نام بخش الزامی است"),
  description: z.string().optional(),
  keywords: z.string().optional(),
  allowDirectFeedback: z.boolean().optional().default(false),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(departments);
  } catch (error) {
    console.error("Error fetching departments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = departmentSchema.parse(body);

    // تبدیل keywords از string به array
    let keywordsArray: string[] = [];
    if (validatedData.keywords) {
      if (typeof validatedData.keywords === 'string') {
        keywordsArray = validatedData.keywords.trim()
          ? validatedData.keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0)
          : [];
      } else if (Array.isArray(validatedData.keywords)) {
        keywordsArray = validatedData.keywords;
      }
    }

    const department = await prisma.department.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        keywords: keywordsArray,
        allowDirectFeedback: validatedData.allowDirectFeedback || false,
      },
    });

    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error creating department:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

