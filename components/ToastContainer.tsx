"use client";

import Toast, { ToastProps } from "./Toast";

interface ToastContainerProps {
  toasts: Omit<ToastProps, "onClose">[];
  onClose: (id: string) => void;
}

export default function ToastContainer({
  toasts,
  onClose,
}: ToastContainerProps) {
  return (
    <div
      className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-md px-4 space-y-2"
      dir="rtl"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
}
