"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Home,
  MessageSquare,
  CheckSquare,
  Bell,
  Trophy,
  Building2,
  BarChart3,
  Users,
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
import { useState, useCallback, useMemo } from "react";
import { useStatusChange } from "@/lib/hooks/useStatusChange";
import {
  SidebarHeader,
  SidebarNav,
  SidebarLogout,
} from "@/components/sidebar";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const {
    userStatuses,
    currentStatus,
    statusMenuOpen,
    statusLoading,
    statusMenuRef,
    setStatusMenuOpen,
    handleStatusChange,
  } = useStatusChange();

  const isActive = useCallback(
    (path: string) => {
      if (path.includes("?")) {
        const [basePath] = path.split("?");
        return pathname === basePath || pathname.startsWith(basePath);
      }
      if (path === "/") {
        return pathname === "/";
      }
      return pathname === path || pathname.startsWith(path);
    },
    [pathname]
  );

  const toggleMenu = useCallback((menuName: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuName)
        ? prev.filter((m) => m !== menuName)
        : [...prev, menuName]
    );
  }, []);

  const closeSidebar = useCallback(() => setIsOpen(false), []);

  const navItems = useMemo(
    () => [
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
        roles: ["MANAGER", "EMPLOYEE"],
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
        name: "وضعیت تیم",
        href: "/team-status",
        icon: Users,
        roles: ["ADMIN"],
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
    ],
    []
  );

  const filteredNavItems = useMemo(
    () => navItems.filter((item) => item.roles.includes(session?.user?.role || "")),
    [navItems, session?.user?.role]
  );

  const SidebarContent = () => (
    <>
      <SidebarHeader
        session={session}
        currentStatus={currentStatus}
        userStatuses={userStatuses}
        statusMenuOpen={statusMenuOpen}
        statusLoading={statusLoading}
        statusMenuRef={statusMenuRef}
        onStatusMenuToggle={() => setStatusMenuOpen(!statusMenuOpen)}
        onStatusChange={handleStatusChange}
      />

      <SidebarNav
        navItems={filteredNavItems}
        userRole={session?.user?.role || ""}
        expandedMenus={expandedMenus}
        isActive={isActive}
        onToggleMenu={toggleMenu}
        onCloseSidebar={closeSidebar}
      />

      <SidebarLogout />
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
          onClick={closeSidebar}
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
