import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * API endpoint برای proxy کردن تصاویر از لیارا
 * این endpoint مشکل CORS را حل می‌کند و تصاویر را از لیارا دریافت کرده و به کاربر می‌دهد
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ADMIN و MANAGER می‌توانند تصاویر را ببینند
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // بررسی اینکه URL از لیارا است
    if (!imageUrl.includes("liara.space")) {
      return NextResponse.json({ error: "Invalid image source" }, { status: 400 });
    }

    // دریافت تصویر از لیارا
    try {
      const response = await fetch(imageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      });

      if (!response.ok) {
        console.error("Error fetching image from Liara:", response.status, response.statusText);
        return NextResponse.json(
          { error: `Failed to fetch image: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }

      const imageBuffer = await response.arrayBuffer();
      const contentType = response.headers.get("content-type") || "image/jpeg";

      // برگرداندن تصویر با headerهای مناسب
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (fetchError: any) {
      console.error("Error fetching image:", fetchError);
      return NextResponse.json(
        { error: `Failed to fetch image: ${fetchError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in image proxy:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

