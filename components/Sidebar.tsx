"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Home,
  MessageSquare,
  CheckSquare,
  Bell,
  Trophy,
  Building2,
  BarChart3,
  Users,
  LogOut,
  Menu,
  X,
  Clock,
  CheckCircle,
  Send,
  Archive,
  Shield,
  Settings,
  Brain,
  ClipboardList,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface UserStatus {
  id: string;
  name: string;
  color: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session, update } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [userStatuses, setUserStatuses] = useState<UserStatus[]>([]);
  const [currentStatus, setCurrentStatus] = useState<UserStatus | null>(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => {
    if (path.includes("?")) {
      const [basePath] = path.split("?");
      return pathname === basePath || pathname.startsWith(basePath);
    }
    // برای داشبورد (/) فقط وقتی دقیقاً "/" باشد active شود
    if (path === "/") {
      return pathname === "/";
    }
    return pathname === path || pathname.startsWith(path);
  };

  const toggleMenu = (menuName: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuName)
        ? prev.filter((m) => m !== menuName)
        : [...prev, menuName]
    );
  };

  // دریافت استتوس‌های موجود و استتوس فعلی کاربر
  useEffect(() => {
    if (session?.user) {
      fetchUserStatuses();
      fetchCurrentStatus();
    }
  }, [session]);

  // بستن منوی استتوس با کلیک بیرون
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setStatusMenuOpen(false);
      }
    };

    if (statusMenuOpen) {
      // استفاده از setTimeout برای جلوگیری از بسته شدن فوری
      const timer = setTimeout(() => {
        document.addEventListener("click", handleClickOutside);
      }, 100);
      return () => {
        clearTimeout(timer);
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [statusMenuOpen]);

  const fetchUserStatuses = async () => {
    try {
      const role = session?.user?.role || "EMPLOYEE";
      console.log("Fetching statuses for role:", role);
      const res = await fetch(`/api/user-statuses?role=${role}&isActive=true`);
      if (res.ok) {
        const data = await res.json();
        console.log("Fetched statuses:", data);
        setUserStatuses(data);
      } else {
        console.error("Failed to fetch statuses:", res.status);
      }
    } catch (err) {
      console.error("Error fetching user statuses:", err);
    }
  };

  const fetchCurrentStatus = async () => {
    try {
      const res = await fetch("/api/users/me");
      if (res.ok) {
        const data = await res.json();
        console.log("Current user data:", data);
        if (data.user?.status) {
          console.log("Setting current status from user.status:", data.user.status);
          setCurrentStatus(data.user.status);
        } else if (data.status) {
          console.log("Setting current status from status:", data.status);
          setCurrentStatus(data.status);
        } else {
          console.log("No status found in response");
        }
      }
    } catch (err) {
      console.error("Error fetching current status:", err);
    }
  };

  const handleStatusChange = async (status: UserStatus | null) => {
    console.log("handleStatusChange called with:", status);
    setStatusLoading(true);
    try {
      // دریافت اطلاعات فعلی کاربر برای حفظ فیلدهای دیگر
      const currentUserRes = await fetch("/api/users/me");
      if (!currentUserRes.ok) {
        throw new Error("خطا در دریافت اطلاعات کاربر");
      }
      const currentUserData = await currentUserRes.json();
      const currentUser = currentUserData.user;
      console.log("Current user for update:", currentUser);

      const updateBody = {
        name: currentUser?.name || session?.user?.name,
        email: currentUser?.email || null,
        avatar: currentUser?.avatar || null,
        statusId: status?.id || null,
      };
      console.log("Sending update:", updateBody);

      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateBody),
      });

      const responseData = await res.json();
      console.log("Update response:", res.status, responseData);

      if (res.ok) {
        setCurrentStatus(status);
        setStatusMenuOpen(false);
        await update();
        toast.success(status ? `استتوس به "${status.name}" تغییر کرد` : "استتوس حذف شد");
      } else {
        toast.error(responseData.error || "خطا در تغییر استتوس");
      }
    } catch (err) {
      console.error("Error in handleStatusChange:", err);
      toast.error("خطا در تغییر استتوس");
    } finally {
      setStatusLoading(false);
    }
  };

  const navItems = [
    {
      name: "داشبورد",
      href: "/",
      icon: Home,
      roles: ["ADMIN", "MANAGER", "EMPLOYEE"],
    },
    {
      name: "ثبت فیدبک",
      href: "/feedback/new",
      icon: MessageSquare,
      roles: ["MANAGER", "EMPLOYEE"], // حذف ADMIN از اینجا
    },
    {
      name: "فیدبک‌ها",
      href: "/feedback",
      icon: MessageSquare,
      roles: ["ADMIN", "MANAGER", "EMPLOYEE"],
      subItems: [
        {
          name: "رسیدگی آینده",
          href: "/feedback?status=DEFERRED",
          icon: Clock,
          roles: ["ADMIN", "MANAGER"],
        },
        {
          name: "تکمیل شده",
          href: "/feedback?status=COMPLETED",
          icon: CheckCircle,
          roles: ["ADMIN", "MANAGER"],
        },
        {
          name: "ارجاع شده",
          href: "/forwarded-feedbacks",
          icon: Send,
          roles: ["ADMIN"],
        },
        {
          name: "آرشیو",
          href: "/archive",
          icon: Archive,
          roles: ["ADMIN", "MANAGER", "EMPLOYEE"],
        },
      ],
    },
    {
      name: "اعلانات",
      href: "/announcements",
      icon: Bell,
      roles: ["ADMIN", "MANAGER", "EMPLOYEE"],
    },
    {
      name: "نظرسنجی‌ها",
      href: "/polls",
      icon: CheckSquare,
      roles: ["ADMIN", "MANAGER", "EMPLOYEE"],
      subItems: [
        {
          name: "مدیریت نظرسنجی",
          href: "/polls/manage",
          icon: Settings,
          roles: ["ADMIN", "MANAGER"],
        },
      ],
    },
    {
      name: "بورد افتخارات",
      href: "/public-board",
      icon: Trophy,
      roles: ["ADMIN", "MANAGER", "EMPLOYEE"],
    },
    {
      name: "مدیریت آزمون‌ها",
      href: "/assessments",
      icon: ClipboardList,
      roles: ["ADMIN", "MANAGER", "EMPLOYEE"],
      subItems: [
        {
          name: "آزمون‌های من",
          href: "/my-assessments",
          icon: Brain,
          roles: ["ADMIN", "MANAGER", "EMPLOYEE"],
        },
      ],
    },
    {
      name: "مدیریت کاربران",
      href: "/users",
      icon: Users,
      roles: ["ADMIN", "MANAGER"],
    },
    {
      name: "مدیریت ادمین‌ها",
      href: "/admins",
      icon: Shield,
      roles: ["ADMIN"],
    },
    {
      name: "مدیریت بخش‌ها",
      href: "/departments",
      icon: Building2,
      roles: ["ADMIN", "MANAGER"],
    },
    {
      name: "آمار و گزارش‌ها",
      href: "/analytics",
      icon: BarChart3,
      roles: ["ADMIN", "MANAGER"],
      subItems: [
        {
          name: "کلمات کلیدی",
          href: "/analytics-keywords",
          icon: Settings,
          roles: ["ADMIN"],
        },
        {
          name: "گزارشات تحلیلی",
          href: "/analytics-keywords/reports",
          icon: BarChart3,
          roles: ["ADMIN", "MANAGER"],
        },
      ],
    },
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(session?.user?.role || "")
  );

  const SidebarContent = () => (
    <>
      {/* Logo/Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-blue-600 to-blue-700">
        <h2 className="text-2xl font-bold text-white mb-1">سیستم فیدبک</h2>
        {session?.user && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-white">
              {session.user.name}
            </p>
            <p className="text-xs text-blue-100 mt-1">{session.user.mobile}</p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full border border-white/30">
                {session.user.role === "ADMIN"
                  ? "مدیرعامل"
                  : session.user.role === "MANAGER"
                  ? "مدیر"
                  : "کارمند"}
              </span>

              {/* Status Selector */}
              <div className="relative" ref={statusMenuRef}>
                <button
                  onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                  disabled={statusLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    currentStatus
                      ? "text-white border-white/30"
                      : "bg-white/10 text-white/80 border-white/20 hover:bg-white/20"
                  }`}
                  style={currentStatus ? { backgroundColor: currentStatus.color } : {}}
                >
                  {statusLoading ? (
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <span className={`w-2 h-2 rounded-full ${currentStatus ? "bg-white" : "bg-white/50"}`}></span>
                      <span>{currentStatus?.name || "استتوس"}</span>
                      <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>

                {/* Status Dropdown */}
                {statusMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                      انتخاب استتوس
                    </div>

                    {/* بدون استتوس */}
                    <button
                      onClick={() => handleStatusChange(null)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition ${
                        !currentStatus ? "bg-blue-50 dark:bg-blue-900/20" : ""
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                      <span className="text-gray-700 dark:text-gray-300">بدون استتوس</span>
                      {!currentStatus && <span className="mr-auto text-blue-600">✓</span>}
                    </button>

                    {/* لیست استتوس‌ها */}
                    {userStatuses.map((status) => (
                      <button
                        key={status.id}
                        onClick={() => handleStatusChange(status)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition ${
                          currentStatus?.id === status.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: status.color }}
                        ></span>
                        <span className="text-gray-700 dark:text-gray-300">{status.name}</span>
                        {currentStatus?.id === status.id && (
                          <span className="mr-auto text-blue-600">✓</span>
                        )}
                      </button>
                    ))}

                    {userStatuses.length === 0 && (
                      <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                        استتوسی تعریف نشده
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto bg-white">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedMenus.includes(item.name);
            const hasActiveSubItem = item.subItems?.some((subItem) =>
              filteredNavItems.find((nav) => nav.href === subItem.href) &&
              session?.user?.role &&
              subItem.roles.includes(session.user.role) &&
              isActive(subItem.href)
            );

            return (
              <li key={item.href}>
                {hasSubItems ? (
                  <>
                    <div className="flex items-center">
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                          isActive(item.href) && !hasActiveSubItem
                            ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                            : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                      <button
                        onClick={() => toggleMenu(item.name)}
                        className={`px-2 py-3 rounded-lg transition-all duration-200 ${
                          isActive(item.href) || hasActiveSubItem
                            ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                            : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                        }`}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {isExpanded && item.subItems && (
                      <ul className="mr-4 mt-2 space-y-1">
                        {item.subItems
                          .filter(
                            (subItem) =>
                              session?.user?.role &&
                              subItem.roles.includes(session.user.role)
                          )
                          .map((subItem) => {
                            const SubIcon = subItem.icon;
                            return (
                              <li key={subItem.href}>
                                <Link
                                  href={subItem.href}
                                  onClick={() => setIsOpen(false)}
                                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-sm ${
                                    isActive(subItem.href)
                                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm"
                                      : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                                  }`}
                                >
                                  <SubIcon className="w-4 h-4" />
                                  <span>{subItem.name}</span>
                                </Link>
                              </li>
                            );
                          })}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive(item.href)
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                        : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200 bg-gray-50/50">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:shadow-sm font-medium"
        >
          <LogOut className="w-5 h-5" />
          <span>خروج</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 lg:hidden bg-blue-600 text-white p-3 rounded-lg shadow-lg"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col fixed right-0 top-0 h-screen w-64 bg-white border-l border-gray-200 shadow-xl z-30">
        <SidebarContent />
      </aside>

      {/* Sidebar - Mobile */}
      <aside
        className={`fixed right-0 top-0 h-screen w-64 bg-white border-l border-gray-200 shadow-lg z-40 transform transition-transform duration-300 lg:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
