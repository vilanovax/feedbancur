"use client";

import { memo, useCallback } from "react";
import Link from "next/link";
import { usePrefetch } from "@/lib/hooks/usePrefetch";

interface PrefetchLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  prefetchDelay?: number;
}

function PrefetchLinkComponent({
  href,
  children,
  className,
  onClick,
  prefetchDelay = 100,
}: PrefetchLinkProps) {
  const { prefetchPage } = usePrefetch();

  const handleMouseEnter = useCallback(() => {
    // Delay prefetch slightly to avoid unnecessary requests on quick mouse movements
    const timeoutId = setTimeout(() => {
      prefetchPage(href);
    }, prefetchDelay);

    return () => clearTimeout(timeoutId);
  }, [href, prefetchDelay, prefetchPage]);

  const handleFocus = useCallback(() => {
    prefetchPage(href);
  }, [href, prefetchPage]);

  return (
    <Link
      href={href}
      className={className}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
    >
      {children}
    </Link>
  );
}

export const PrefetchLink = memo(PrefetchLinkComponent);
