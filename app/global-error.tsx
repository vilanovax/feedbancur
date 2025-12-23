"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error:", error);
  }, [error]);

  return (
    <html lang="fa" dir="rtl">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f9fafb",
            padding: "1rem",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: "28rem",
              width: "100%",
              backgroundColor: "white",
              borderRadius: "0.75rem",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              padding: "2rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "4rem",
                height: "4rem",
                backgroundColor: "#fef2f2",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.5rem",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#dc2626"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </div>

            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "#111827",
                marginBottom: "0.5rem",
              }}
            >
              خطای بحرانی
            </h1>

            <p
              style={{
                color: "#6b7280",
                marginBottom: "1.5rem",
              }}
            >
              متأسفانه مشکل جدی در برنامه پیش آمده است. لطفاً صفحه را مجدداً
              بارگذاری کنید.
            </p>

            <button
              onClick={reset}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.5rem",
                backgroundColor: "#2563eb",
                color: "white",
                borderRadius: "0.5rem",
                border: "none",
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              تلاش مجدد
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
