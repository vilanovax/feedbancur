"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MobileLayout from "@/components/MobileLayout";
import { Link2, ExternalLink } from "lucide-react";

type AdminLink = {
  id: string;
  title: string;
  url: string;
  description: string | null;
  icon: string | null;
  category: string | null;
  order: number;
};

export default function MobileLinksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [links, setLinks] = useState<AdminLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) void fetchLinks();
  }, [session]);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin-links");
      if (res.ok) setLinks(await res.json());
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">در حال بارگذاری...</div>
      </div>
    );
  }

  const role = session?.user?.role === "MANAGER" ? "MANAGER" : "EMPLOYEE";

  // Group by category
  const grouped = links.reduce<Record<string, AdminLink[]>>((acc, link) => {
    const key = link.category || "سایر";
    if (!acc[key]) acc[key] = [];
    acc[key].push(link);
    return acc;
  }, {});

  return (
    <MobileLayout role={role} title="لینک‌های مفید">
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">
            در حال بارگذاری...
          </div>
        ) : links.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm px-6 py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
              <Link2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              لینکی در دسترس نیست
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ادمین هنوز لینکی برای شما منتشر نکرده است
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([category, categoryLinks]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 px-1">
                {category}
              </h3>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
                {categoryLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                      {link.icon ? (
                        <span className="text-lg" aria-hidden>
                          {link.icon}
                        </span>
                      ) : (
                        <Link2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {link.title}
                      </h4>
                      {link.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-0.5">
                          {link.description}
                        </p>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 shrink-0 mt-1" />
                  </a>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </MobileLayout>
  );
}
