import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/assessment-results/[id] - دریافت جزئیات یک نتیجه
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await prisma.assessment_results.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            departments: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        assessments: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
    });

    if (!result) {
      return NextResponse.json(
        { error: "نتیجه یافت نشد" },
        { status: 404 }
      );
    }

    // Check permissions - only admin can view any result, others can only view their own
    if (session.user.role !== "ADMIN" && result.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      ...result,
      user: result.users ? {
        ...result.users,
        department: (result.users as any).departments,
      } : null,
      assessment: result.assessments,
    });
  } catch (error) {
    console.error("Error fetching assessment result:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/assessment-results/[id] - حذف یک نتیجه (فقط ADMIN)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can delete results
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if result exists
    const result = await prisma.assessment_results.findUnique({
      where: { id },
    });

    if (!result) {
      return NextResponse.json(
        { error: "نتیجه یافت نشد" },
        { status: 404 }
      );
    }

    // Delete the result
    await prisma.assessment_results.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "نتیجه با موفقیت حذف شد"
    });
  } catch (error) {
    console.error("Error deleting assessment result:", error);
    return NextResponse.json(
      { error: "خطا در حذف نتیجه" },
      { status: 500 }
    );
  }
}
