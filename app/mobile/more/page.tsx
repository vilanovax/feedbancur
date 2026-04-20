"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MobileLayout from "@/components/MobileLayout";
import {
  NotebookPen,
  Link2,
  ClipboardList,
  Newspaper,
  BarChart3,
  Users,
  Trophy,
  Settings,
  KeyRound,
  ChevronLeft,
} from "lucide-react";

type Tool = {
  name: string;
  description: string;
  href: string;
  icon: typeof NotebookPen;
  iconBg: string;
  iconColor: string;
};

export default function MobileMorePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">در حال بارگذاری...</div>
      </div>
    );
  }

  const role = session?.user?.role === "MANAGER" ? "MANAGER" : "EMPLOYEE";

  const personalTools: Tool[] = [
    {
      name: "یادداشت‌ها و چک‌لیست",
      description: "یادداشت‌های شخصی و چک‌لیست‌های شما",
      href: "/mobile/notes",
      icon: NotebookPen,
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      name: "لینک‌های مفید",
      description: "لینک‌هایی که ادمین منتشر کرده است",
      href: "/mobile/links",
      icon: Link2,
      iconBg: "bg-sky-100 dark:bg-sky-900/30",
      iconColor: "text-sky-600 dark:text-sky-400",
    },
  ];

  const resourceTools: Tool[] = [
    {
      name: "آزمون‌های شخصیت‌سنجی",
      description: "آزمون‌های موجود و نتایج شما",
      href:
        role === "MANAGER"
          ? "/mobile/manager/assessments"
          : "/mobile/employee/assessments",
      icon: ClipboardList,
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      name: "اطلاع‌رسانی‌ها",
      description: "بهبودها و تغییرات سیستم",
      href: "/mobile/updates",
      icon: Newspaper,
      iconBg: "bg-indigo-100 dark:bg-indigo-900/30",
      iconColor: "text-indigo-600 dark:text-indigo-400",
    },
    {
      name: "نظرسنجی‌ها",
      description: "نظرسنجی‌های فعال",
      href: "/mobile/polls",
      icon: BarChart3,
      iconBg: "bg-cyan-100 dark:bg-cyan-900/30",
      iconColor: "text-cyan-600 dark:text-cyan-400",
    },
    {
      name: "وضعیت تیم",
      description: "کاربران آنلاین و وضعیت‌ها",
      href:
        role === "MANAGER"
          ? "/mobile/manager/team-status"
          : "/mobile/employee/team-status",
      icon: Users,
      iconBg: "bg-teal-100 dark:bg-teal-900/30",
      iconColor: "text-teal-600 dark:text-teal-400",
    },
    {
      name: "بورد افتخارات",
      description: "تسک‌های تکمیل شده",
      href: "/mobile/public-board",
      icon: Trophy,
      iconBg: "bg-amber-100 dark:bg-amber-900/30",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
  ];

  const accountTools: Tool[] = [
    {
      name: "تنظیمات",
      description: "ترجیحات شخصی",
      href: "/mobile/settings",
      icon: Settings,
      iconBg: "bg-gray-100 dark:bg-gray-700",
      iconColor: "text-gray-700 dark:text-gray-300",
    },
    {
      name: "تغییر رمز عبور",
      description: "بروزرسانی رمز حساب",
      href: "/mobile/change-password",
      icon: KeyRound,
      iconBg: "bg-gray-100 dark:bg-gray-700",
      iconColor: "text-gray-700 dark:text-gray-300",
    },
  ];

  return (
    <MobileLayout role={role} title="بیشتر">
      <div className="space-y-6">
        <Section title="ابزارهای شخصی" tools={personalTools} />
        <Section title="منابع" tools={resourceTools} />
        <Section title="حساب کاربری" tools={accountTools} />
      </div>
    </MobileLayout>
  );
}

function Section({ title, tools }: { title: string; tools: Tool[] }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 px-1">
        {title}
      </h3>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.href}
              href={tool.href}
              className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
            >
              <div
                className={`w-10 h-10 rounded-lg ${tool.iconBg} flex items-center justify-center shrink-0`}
              >
                <Icon className={`w-5 h-5 ${tool.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 dark:text-white truncate">
                  {tool.name}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">
                  {tool.description}
                </p>
              </div>
              <ChevronLeft className="w-4 h-4 text-gray-400 shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
