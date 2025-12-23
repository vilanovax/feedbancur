import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface TeamStatusSettings {
  enabled: boolean;
  onlineThresholdMinutes: number; // کاربر اگر در این مدت فعالیت داشته، آنلاین است
  managerAccess: {
    canViewOwnDepartment: boolean;
    canViewOtherDepartments: boolean;
    allowedDepartments: string[]; // اگر خالی باشد، همه بخش‌ها قابل مشاهده‌اند
  };
  employeeAccess: {
    canViewOwnDepartment: boolean;
    canViewOtherDepartments: boolean;
    allowedDepartments: string[]; // اگر خالی باشد، همه بخش‌ها قابل مشاهده‌اند
  };
}

const defaultSettings: TeamStatusSettings = {
  enabled: true,
  onlineThresholdMinutes: 5,
  managerAccess: {
    canViewOwnDepartment: true,
    canViewOtherDepartments: false,
    allowedDepartments: [],
  },
  employeeAccess: {
    canViewOwnDepartment: true,
    canViewOtherDepartments: false,
    allowedDepartments: [],
  },
};

// GET - دریافت لیست وضعیت تیم با کنترل دسترسی
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");

    // دریافت تنظیمات
    const settings = await prisma.settings.findFirst();
    const teamStatusSettings: TeamStatusSettings = settings?.teamStatusSettings
      ? (typeof settings.teamStatusSettings === "string"
          ? JSON.parse(settings.teamStatusSettings)
          : settings.teamStatusSettings)
      : defaultSettings;

    // بررسی فعال بودن قابلیت
    if (!teamStatusSettings.enabled) {
      return NextResponse.json(
        { error: "این قابلیت غیرفعال است" },
        { status: 403 }
      );
    }

    // دریافت اطلاعات کاربر فعلی برای بررسی دپارتمان
    const currentUser = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { departmentId: true },
    });

    // تعیین دپارتمان‌های قابل مشاهده بر اساس نقش
    let allowedDepartmentIds: string[] = [];
    let canViewAll = false;

    if (session.user.role === "ADMIN") {
      // ادمین همه را می‌بیند
      canViewAll = true;
    } else if (session.user.role === "MANAGER") {
      const access = teamStatusSettings.managerAccess;

      if (access.canViewOwnDepartment && currentUser?.departmentId) {
        allowedDepartmentIds.push(currentUser.departmentId);
      }

      if (access.canViewOtherDepartments) {
        if (access.allowedDepartments.length > 0) {
          allowedDepartmentIds = [...allowedDepartmentIds, ...access.allowedDepartments];
        } else {
          canViewAll = true;
        }
      }
    } else {
      // EMPLOYEE
      const access = teamStatusSettings.employeeAccess;

      if (access.canViewOwnDepartment && currentUser?.departmentId) {
        allowedDepartmentIds.push(currentUser.departmentId);
      }

      if (access.canViewOtherDepartments) {
        if (access.allowedDepartments.length > 0) {
          allowedDepartmentIds = [...allowedDepartmentIds, ...access.allowedDepartments];
        } else {
          canViewAll = true;
        }
      }
    }

    // بررسی دسترسی به دپارتمان درخواست شده
    if (departmentId && !canViewAll && !allowedDepartmentIds.includes(departmentId)) {
      return NextResponse.json(
        { error: "شما دسترسی به این بخش را ندارید" },
        { status: 403 }
      );
    }

    // ساخت where clause
    const whereClause: any = {
      isActive: true,
    };

    if (departmentId) {
      whereClause.departmentId = departmentId;
    } else if (!canViewAll && allowedDepartmentIds.length > 0) {
      whereClause.departmentId = { in: allowedDepartmentIds };
    } else if (!canViewAll && allowedDepartmentIds.length === 0) {
      // کاربر دسترسی به هیچ بخشی ندارد
      return NextResponse.json({ users: [], departments: [] });
    }

    // دریافت کاربران
    const users = await prisma.users.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        avatar: true,
        role: true,
        lastSeen: true,
        departmentId: true,
        departments: {
          select: {
            id: true,
            name: true,
          },
        },
        statusId: true,
        user_statuses: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: [
        { lastSeen: "desc" },
        { name: "asc" },
      ],
    });

    // محاسبه وضعیت آنلاین
    const onlineThreshold = new Date(
      Date.now() - teamStatusSettings.onlineThresholdMinutes * 60 * 1000
    );

    const formattedUsers = users.map((user) => {
      const isOnline = user.lastSeen && user.lastSeen > onlineThreshold;
      return {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        isOnline,
        lastSeen: user.lastSeen,
        department: user.departments,
        status: user.user_statuses,
      };
    });

    // دریافت لیست دپارتمان‌های قابل مشاهده
    let departmentsWhereClause: any = {};
    if (!canViewAll && allowedDepartmentIds.length > 0) {
      departmentsWhereClause = { id: { in: allowedDepartmentIds } };
    }

    const departments = await prisma.departments.findMany({
      where: departmentsWhereClause,
      select: {
        id: true,
        name: true,
        _count: {
          select: { users: true },
        },
      },
      orderBy: { name: "asc" },
    });

    // آمار کلی
    const onlineCount = formattedUsers.filter((u) => u.isOnline).length;
    const offlineCount = formattedUsers.length - onlineCount;

    return NextResponse.json({
      users: formattedUsers,
      departments: departments.map((d) => ({
        id: d.id,
        name: d.name,
        userCount: d._count.users,
      })),
      stats: {
        total: formattedUsers.length,
        online: onlineCount,
        offline: offlineCount,
      },
      settings: {
        onlineThresholdMinutes: teamStatusSettings.onlineThresholdMinutes,
      },
    });
  } catch (error) {
    console.error("Error fetching team status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
