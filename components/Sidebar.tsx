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
} from "lucide-react";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const isActive = (path: string) => {
    if (path.includes("?")) {
      const [basePath] = path.split("?");
      return pathname === basePath || pathname.startsWith(basePath);
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
      roles: ["ADMIN", "MANAGER", "EMPLOYEE"],
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
      name: "تسک‌ها",
      href: "/tasks",
      icon: CheckSquare,
      roles: ["ADMIN", "MANAGER", "EMPLOYEE"],
    },
    {
      name: "اعلانات",
      href: "/announcements",
      icon: Bell,
      roles: ["ADMIN", "MANAGER", "EMPLOYEE"],
    },
    {
      name: "بورد افتخارات",
      href: "/public-board",
      icon: Trophy,
      roles: ["ADMIN", "MANAGER", "EMPLOYEE"],
    },
    {
      name: "مدیریت کاربران",
      href: "/users",
      icon: Users,
      roles: ["ADMIN", "MANAGER"],
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
    },
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(session?.user?.role || "")
  );

  const SidebarContent = () => (
    <>
      {/* Logo/Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800">سیستم فیدبک</h2>
        {session?.user && (
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-700">
              {session.user.name}
            </p>
            <p className="text-xs text-gray-500">{session.user.mobile}</p>
            <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {session.user.role === "ADMIN"
                ? "مدیرعامل"
                : session.user.role === "MANAGER"
                ? "مدیر"
                : "کارمند"}
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
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
                        className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                          isActive(item.href) && !hasActiveSubItem
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                      <button
                        onClick={() => toggleMenu(item.name)}
                        className={`px-2 py-3 rounded-lg transition ${
                          isActive(item.href) || hasActiveSubItem
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 hover:bg-gray-100"
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
                                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition text-sm ${
                                    isActive(subItem.href)
                                      ? "bg-blue-500 text-white"
                                      : "text-gray-600 hover:bg-gray-100"
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
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                      isActive(item.href)
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
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
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">خروج</span>
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
      <aside className="hidden lg:flex lg:flex-col fixed right-0 top-0 h-screen w-64 bg-white border-l border-gray-200 shadow-lg z-30">
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
