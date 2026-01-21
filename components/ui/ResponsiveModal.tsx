"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closeButton?: boolean;
  className?: string;
}

export default function ResponsiveModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  size = "md",
  closeButton = true,
  className = "",
}: ResponsiveModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-full mx-4",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className={`
          bg-white dark:bg-gray-800
          w-full ${sizeClasses[size]}

          /* Mobile: slide up from bottom + rounded top corners */
          max-sm:rounded-t-2xl max-sm:max-h-[90vh] max-sm:animate-slideUp

          /* Desktop: centered + all rounded corners */
          sm:rounded-xl sm:max-h-[85vh] sm:animate-scaleIn

          shadow-2xl overflow-hidden flex flex-col
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || icon || closeButton) && (
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {icon && (
                <div className="flex-shrink-0">{icon}</div>
              )}
              {title && (
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {subtitle}
                    </p>
                  )}
                </div>
              )}
            </div>
            {closeButton && (
              <button
                onClick={onClose}
                className="flex-shrink-0 p-2 sm:p-2.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors touch-manipulation"
                aria-label="بستن"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 overscroll-contain">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
