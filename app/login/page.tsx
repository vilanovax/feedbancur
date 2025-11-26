"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"mobile" | "otp" | "password">("mobile");
  const [usePassword, setUsePassword] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "خطا در ارسال کد تایید");
      } else {
        setSuccess(data.message);
        setStep("otp");
        // در محیط توسعه، کد را نمایش بده
        if (data.code) {
          setSuccess(`${data.message} - کد: ${data.code}`);
        }
      }
    } catch (err) {
      setError("خطایی رخ داد. لطفا دوباره تلاش کنید");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, code: otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "کد تایید نامعتبر است");
      } else {
        setStep("password");
      }
    } catch (err) {
      setError("خطایی رخ داد. لطفا دوباره تلاش کنید");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        mobile,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("شماره موبایل یا رمز عبور اشتباه است");
      } else {
        // بررسی اینکه آیا باید رمز را تغییر دهد
        // این بررسی در صفحه اصلی انجام می‌شود
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("خطایی رخ داد. لطفا دوباره تلاش کنید");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800" dir="rtl">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-white">
          ورود به سیستم
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {/* مرحله 1: وارد کردن شماره موبایل */}
        {step === "mobile" && (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div>
              <label
                htmlFor="mobile"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                شماره موبایل
              </label>
              <input
                id="mobile"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
                pattern="09\d{9}"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="09123456789"
              />
              <p className="text-xs text-gray-500 mt-1">
                شماره موبایل خود را با 09 وارد کنید
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "در حال ارسال..." : "ارسال کد تایید"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("password");
                setUsePassword(true);
              }}
              className="w-full text-blue-600 dark:text-blue-400 text-sm hover:underline"
            >
              ورود با رمز عبور
            </button>
          </form>
        )}

        {/* مرحله 2: وارد کردن کد OTP */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                کد تایید
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white text-center text-2xl tracking-widest"
                placeholder="123456"
              />
              <p className="text-xs text-gray-500 mt-1">
                کد 6 رقمی ارسال شده به شماره {mobile} را وارد کنید
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "در حال بررسی..." : "تایید کد"}
            </button>
            <button
              type="button"
              onClick={() => setStep("mobile")}
              className="w-full text-blue-600 dark:text-blue-400 text-sm hover:underline"
            >
              بازگشت
            </button>
          </form>
        )}

        {/* مرحله 3: وارد کردن رمز عبور */}
        {step === "password" && (
          <form onSubmit={handleLogin} className="space-y-6">
            {usePassword && (
              <div>
                <label
                  htmlFor="mobile-pwd"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  شماره موبایل
                </label>
                <input
                  id="mobile-pwd"
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                  pattern="09\d{9}"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="09123456789"
                />
              </div>
            )}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                رمز عبور
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "در حال ورود..." : "ورود"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("mobile");
                setUsePassword(false);
                setPassword("");
              }}
              className="w-full text-blue-600 dark:text-blue-400 text-sm hover:underline"
            >
              بازگشت
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

