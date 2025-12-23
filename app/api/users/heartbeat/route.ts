import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - به‌روزرسانی lastSeen کاربر (heartbeat)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // به‌روزرسانی lastSeen
    await prisma.users.update({
      where: { id: session.user.id },
      data: { lastSeen: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating heartbeat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
