"use client";

import { memo } from "react";
import Image from "next/image";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showOnlineIndicator?: boolean;
  isOnline?: boolean;
}

const sizeClasses = {
  xs: "w-8 h-8",
  sm: "w-10 h-10",
  md: "w-12 h-12",
  lg: "w-14 h-14",
  xl: "w-16 h-16",
};

const iconSizes = {
  xs: "w-4 h-4",
  sm: "w-5 h-5",
  md: "w-6 h-6",
  lg: "w-7 h-7",
  xl: "w-8 h-8",
};

const indicatorSizes = {
  xs: "w-2 h-2",
  sm: "w-2.5 h-2.5",
  md: "w-3 h-3",
  lg: "w-4 h-4",
  xl: "w-4 h-4",
};

function AvatarComponent({
  src,
  alt,
  size = "md",
  className,
  showOnlineIndicator = false,
  isOnline = false,
}: AvatarProps) {
  const sizeClass = sizeClasses[size];
  const iconSize = iconSizes[size];
  const indicatorSize = indicatorSizes[size];

  return (
    <div className={cn("relative", className)}>
      {src ? (
        <div className={cn(sizeClass, "relative rounded-full overflow-hidden")}>
          <Image
            src={src}
            alt={alt}
            fill
            sizes={size === "xl" ? "64px" : size === "lg" ? "56px" : size === "md" ? "48px" : size === "sm" ? "40px" : "32px"}
            className="object-cover"
            unoptimized={src.startsWith("data:") || src.includes("liara.space")}
          />
        </div>
      ) : (
        <div
          className={cn(
            sizeClass,
            "bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center"
          )}
        >
          <User className={cn(iconSize, "text-gray-500 dark:text-gray-400")} />
        </div>
      )}

      {showOnlineIndicator && (
        <span
          className={cn(
            indicatorSize,
            "absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-gray-800",
            isOnline ? "bg-green-500" : "bg-gray-400"
          )}
        />
      )}
    </div>
  );
}

export const Avatar = memo(AvatarComponent);
