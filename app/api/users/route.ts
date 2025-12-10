import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const createUserSchema = z.object({
  mobile: z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست"),
  name: z.string().min(1, "نام الزامی است"),
  email: z.string().email("ایمیل معتبر نیست").optional().or(z.literal("")),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"], {
    errorMap: () => ({ message: "نقش باید ADMIN، MANAGER یا EMPLOYEE باشد" }),
  }),
  departmentId: z.string().optional().nullable(), // برای ADMIN اختیاری است
  password: z.string().min(6, "رمز عبور حداقل 6 کاراکتر باید باشد").optional(),
  isActive: z.boolean().optional().default(true),
});

// GET - لیست کاربران
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ADMIN و MANAGER می‌توانند لیست کاربران را ببینند
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const departmentId = searchParams.get("departmentId");
    const search = searchParams.get("search");
    const showAdmins = searchParams.get("showAdmins") === "true";

    const where: any = {};

    // فقط اگر showAdmins فعال نباشد، ادمین‌ها را فیلتر کن
    if (!showAdmins) {
      where.role = { not: "ADMIN" };
    }

    // MANAGER فقط کاربران بخش خودش را می‌بیند
    if (session.user.role === "MANAGER") {
      where.departmentId = session.user.departmentId;
    }

    // فیلتر بر اساس نقش
    if (role && (role === "ADMIN" || role === "MANAGER" || role === "EMPLOYEE")) {
      where.role = role;
    }

    // فیلتر بر اساس بخش
    if (departmentId) {
      where.departmentId = departmentId;
    }

    // جستجو در نام و موبایل
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { mobile: { contains: search } },
      ];
    }

    let users;
    try {
      // استفاده از type assertion برای جلوگیری از خطای TypeScript
      users = await (prisma.user.findMany as any)({
        where,
        select: {
          id: true,
          mobile: true,
          email: true,
          name: true,
          role: true,
          departmentId: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (dbError: any) {
      // اگر فیلد isActive وجود نداشت، بدون آن query بزن
      if (
        dbError?.message?.includes("isActive") ||
        dbError?.code === "P2009" ||
        dbError?.code === "P2011" ||
        dbError?.message?.includes("Unknown field") ||
        dbError?.message?.includes("Unknown arg")
      ) {
        console.warn("isActive field not found, fetching without it:", dbError.message);
        users = await prisma.user.findMany({
          where,
          select: {
            id: true,
            mobile: true,
            email: true,
            name: true,
            role: true,
            departmentId: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });
      } else {
        throw dbError;
      }
    }

    // اطمینان از اینکه isActive برای همه کاربران وجود دارد
    const usersWithDefaultActive = users.map((user: any) => ({
      ...user,
      isActive: user.isActive ?? true,
    }));

    return NextResponse.json(usersWithDefaultActive);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST - ایجاد کاربر جدید
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ADMIN و MANAGER می‌توانند کاربر بسازند
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = createUserSchema.parse(body);

    // فقط ADMIN می‌تواند کاربر ADMIN ایجاد کند
    if (data.role === "ADMIN" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "فقط ادمین می‌تواند کاربر ادمین دیگر ایجاد کند" },
        { status: 403 }
      );
    }

    // MANAGER فقط می‌تواند EMPLOYEE بسازد و فقط در بخش خودش
    if (session.user.role === "MANAGER") {
      if (data.role !== "EMPLOYEE") {
        return NextResponse.json(
          { error: "مدیر فقط می‌تواند کارمند ایجاد کند" },
          { status: 403 }
        );
      }

      if (data.departmentId !== session.user.departmentId) {
        return NextResponse.json(
          { error: "شما فقط می‌توانید کارمند در بخش خودتان ایجاد کنید" },
          { status: 403 }
        );
      }
    }

    // بررسی وجود بخش (فقط برای MANAGER و EMPLOYEE)
    if (data.role !== "ADMIN") {
      if (!data.departmentId) {
        return NextResponse.json(
          { error: "انتخاب بخش برای مدیر و کارمند الزامی است" },
          { status: 400 }
        );
      }
    }

    // بررسی تکراری نبودن شماره موبایل
    const existingUser = await prisma.user.findUnique({
      where: { mobile: data.mobile },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "این شماره موبایل قبلاً ثبت شده است" },
        { status: 400 }
      );
    }

    // بررسی وجود بخش (فقط اگر departmentId داده شده باشد)
    if (data.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: data.departmentId },
      });

      if (!department) {
        return NextResponse.json(
          { error: "بخش مورد نظر یافت نشد" },
          { status: 404 }
        );
      }
    }

    // اگر رمز عبور ارسال نشده یا خالی است، از رمز پیش‌فرض استفاده کن
    const passwordToUse = (data.password && data.password.trim()) || "123456";
    const mustChangePassword = !data.password || !data.password.trim(); // اگر رمز ارسال نشده یا خالی است، باید تغییر دهد
    
    // Hash کردن رمز عبور
    const hashedPassword = await bcrypt.hash(passwordToUse, 10);

    // ایجاد کاربر
    console.log("Creating user with data:", { 
      mobile: data.mobile,
      name: data.name,
      email: data.email,
      role: data.role,
      departmentId: data.departmentId,
      isActive: data.isActive ?? true,
      password: "***"
    });
    
    let user;
    try {
      user = await prisma.user.create({
        data: {
          mobile: data.mobile,
          name: data.name,
          email: data.email || null,
          role: data.role,
          departmentId: data.departmentId || null, // برای ADMIN می‌تواند null باشد
          password: hashedPassword,
          isActive: data.isActive ?? true,
          mustChangePassword: mustChangePassword,
        },
        select: {
          id: true,
          mobile: true,
          email: true,
          name: true,
          role: true,
          departmentId: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          isActive: true,
          createdAt: true,
        },
      });
      console.log("User created successfully:", user.id);
    } catch (dbError: any) {
      console.error("Database error creating user:", dbError);
      console.error("Error code:", dbError?.code);
      console.error("Error message:", dbError?.message);
      
      // اگر فیلد isActive مشکل داشت، بدون آن ایجاد کن
      if (
        dbError?.message?.includes("isActive") ||
        dbError?.code === "P2009" ||
        dbError?.code === "P2011" ||
        dbError?.message?.includes("Unknown field") ||
        dbError?.message?.includes("Unknown arg") ||
        dbError?.message?.includes("Unknown column")
      ) {
        console.warn("isActive field error, creating without it");
        user = await prisma.user.create({
          data: {
            mobile: data.mobile,
            name: data.name,
            email: data.email || null,
            role: data.role,
            departmentId: data.departmentId || null, // برای ADMIN می‌تواند null باشد
            password: hashedPassword,
            mustChangePassword: mustChangePassword,
          },
          select: {
            id: true,
            mobile: true,
            email: true,
            name: true,
            role: true,
            departmentId: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
            createdAt: true,
          },
        });
        // اضافه کردن isActive به response
        user = { ...user, isActive: data.isActive ?? true };
      } else {
        throw dbError;
      }
    }

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    // بررسی خطای تکراری بودن شماره موبایل از Prisma
    if (error?.code === "P2002" && error?.meta?.target?.includes("mobile")) {
      return NextResponse.json(
        { error: "این شماره موبایل قبلاً ثبت شده است" },
        { status: 400 }
      );
    }

    console.error("Error creating user:", error);
    return NextResponse.json(
      { 
        error: "خطا در ایجاد کاربر",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
