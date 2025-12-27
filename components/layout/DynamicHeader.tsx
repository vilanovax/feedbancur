"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Header skeleton for loading state
function HeaderSkeleton() {
  return (
    <header className="fixed top-0 left-0 right-0 lg:right-64 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-20 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </header>
  );
}

const DynamicHeader = dynamic(() => import("@/components/AdminHeader"), {
  loading: () => <HeaderSkeleton />,
  ssr: false,
});

export default DynamicHeader;
