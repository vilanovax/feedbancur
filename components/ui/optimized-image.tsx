"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  onClick?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  fill = false,
  priority = false,
  onClick,
}: OptimizedImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // تشخیص نوع تصویر برای تنظیم unoptimized
  const isExternalImage = src.includes("liara.space") || src.startsWith("http");
  const isBase64 = src.startsWith("data:");
  const shouldSkipOptimization = isBase64 || isExternalImage;

  // برای تصاویر liara از proxy استفاده کن
  const imageSrc = src.includes("liara.space")
    ? `/api/image-proxy?url=${encodeURIComponent(src)}`
    : src;

  if (error) {
    return (
      <div
        className={cn(
          "bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm",
          className
        )}
        style={!fill ? { width, height } : undefined}
      >
        تصویر بارگذاری نشد
      </div>
    );
  }

  if (fill) {
    return (
      <div className={cn("relative", className)}>
        {loading && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
        )}
        <Image
          src={imageSrc}
          alt={alt}
          fill
          className={cn("object-cover", loading ? "opacity-0" : "opacity-100")}
          onLoad={() => setLoading(false)}
          onError={() => setError(true)}
          unoptimized={shouldSkipOptimization}
          priority={priority}
          onClick={onClick}
        />
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} style={{ width, height }}>
      {loading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
      )}
      <Image
        src={imageSrc}
        alt={alt}
        width={width || 400}
        height={height || 300}
        className={cn("object-contain", loading ? "opacity-0" : "opacity-100")}
        onLoad={() => setLoading(false)}
        onError={() => setError(true)}
        unoptimized={shouldSkipOptimization}
        priority={priority}
        onClick={onClick}
      />
    </div>
  );
}
