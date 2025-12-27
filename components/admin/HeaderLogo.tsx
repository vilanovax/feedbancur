"use client";

import { memo } from "react";
import Link from "next/link";
import Image from "next/image";

interface HeaderLogoProps {
  logoUrl: string;
  onLogoError: () => void;
}

function HeaderLogo({ logoUrl, onLogoError }: HeaderLogoProps) {
  return (
    <Link href="/" className="flex items-center space-x-2 space-x-reverse">
      <div className="relative w-10 h-10 flex items-center justify-center bg-blue-600 rounded-lg">
        {logoUrl && logoUrl !== "/logo.png" && logoUrl.startsWith("/") ? (
          <Image
            src={logoUrl}
            alt="لوگو"
            fill
            sizes="40px"
            className="object-contain p-1"
            onError={onLogoError}
          />
        ) : (
          <span className="text-white font-bold text-lg">ف</span>
        )}
      </div>
      <h1 className="text-xl font-bold text-gray-800 dark:text-white hidden sm:block">
        سیستم فیدبک
      </h1>
    </Link>
  );
}

export default memo(HeaderLogo);
