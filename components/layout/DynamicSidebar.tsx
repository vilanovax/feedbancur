"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Sidebar skeleton for loading state
function SidebarSkeleton() {
  return (
    <aside className="hidden lg:flex lg:flex-col fixed right-0 top-0 h-screen w-64 bg-white border-l border-gray-200 shadow-xl z-30">
      <div className="p-4 border-b border-gray-200">
        <Skeleton className="h-12 w-12 rounded-full mx-auto mb-2" />
        <Skeleton className="h-4 w-24 mx-auto mb-1" />
        <Skeleton className="h-3 w-16 mx-auto" />
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </nav>
    </aside>
  );
}

const DynamicSidebar = dynamic(() => import("@/components/Sidebar"), {
  loading: () => <SidebarSkeleton />,
  ssr: false,
});

export default DynamicSidebar;
