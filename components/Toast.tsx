"use client";

import { useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onClose: (id: string) => void;
}

export default function Toast({
  id,
  message,
  type,
  duration = 5000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5" />;
      case "error":
        return <AlertCircle className="w-5 h-5" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5" />;
      case "info":
        return <Info className="w-5 h-5" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case "success":
        return "bg-green-50 dark:bg-green-900/20 border-green-500 text-green-800 dark:text-green-400";
      case "error":
        return "bg-red-50 dark:bg-red-900/20 border-red-500 text-red-800 dark:text-red-400";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 text-yellow-800 dark:text-yellow-400";
      case "info":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-800 dark:text-blue-400";
    }
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border-r-4 shadow-lg backdrop-blur-sm transition-all animate-in slide-in-from-top-5 ${getStyles()}`}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
      <div className="flex-1 text-sm font-medium whitespace-pre-wrap">
        {message}
      </div>
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
        aria-label="بستن"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
