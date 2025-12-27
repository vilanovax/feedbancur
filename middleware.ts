import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// صفحات عمومی که نیاز به احراز هویت ندارند
const publicPaths = [
  "/login",
  "/api/auth",
  "/api/otp",
  "/_next",
  "/favicon.ico",
  "/manifest.json",
  "/manifest.webmanifest",
  "/icons",
];

// صفحات مخصوص ادمین
const adminOnlyPaths = [
  "/users",
  "/departments",
  "/settings",
  "/backup",
  "/team-status",
];

// صفحات مخصوص ادمین و مدیر
const adminManagerPaths = [
  "/analytics",
  "/feedback",
  "/tasks",
  "/announcements",
  "/assessments",
];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // بررسی دسترسی به صفحات ادمین
    if (adminOnlyPaths.some((path) => pathname.startsWith(path))) {
      if (token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    // بررسی دسترسی به صفحات ادمین/مدیر
    if (adminManagerPaths.some((path) => pathname.startsWith(path))) {
      if (token?.role !== "ADMIN" && token?.role !== "MANAGER") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    // هدایت /dashboard به صفحه اصلی (چون صفحه "/" خودش داشبورد ادمین است)
    if (pathname === "/dashboard") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // بررسی دسترسی موبایل
    if (pathname.startsWith("/mobile/manager")) {
      if (token?.role !== "MANAGER" && token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/mobile/employee", req.url));
      }
    }

    if (pathname.startsWith("/mobile/employee")) {
      if (token?.role === "ADMIN") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // صفحات عمومی همیشه مجاز هستند
        if (publicPaths.some((path) => pathname.startsWith(path))) {
          return true;
        }

        // API routes عمومی
        if (pathname.startsWith("/api/") && !pathname.startsWith("/api/admin")) {
          // برخی API ها نیاز به token دارند - در خود API بررسی می‌شود
          return true;
        }

        // بقیه صفحات نیاز به احراز هویت دارند
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
