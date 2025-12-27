"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, ArrowRight, Bug } from "lucide-react";

interface Props {
  children: ReactNode;
  pageName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class PageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Page Error:", error);
    console.error("Component Stack:", errorInfo.componentStack);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoBack = () => {
    window.history.back();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6" dir="rtl">
          <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Bug className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">خطای غیرمنتظره</h1>
                  {this.props.pageName && (
                    <p className="text-red-100 text-sm">در صفحه {this.props.pageName}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-3 mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-700 dark:text-gray-300">
                    متأسفانه در پردازش این صفحه مشکلی پیش آمده است. لطفاً دوباره تلاش کنید.
                  </p>
                </div>
              </div>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mb-6">
                  <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                    جزئیات خطا (فقط در محیط توسعه)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-x-auto">
                    <p className="text-xs text-red-600 dark:text-red-400 font-mono whitespace-pre-wrap break-all">
                      {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <pre className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-mono whitespace-pre-wrap">
                        {this.state.error.stack.slice(0, 500)}...
                      </pre>
                    )}
                  </div>
                </details>
              )}

              <div className="flex gap-3">
                <button
                  onClick={this.handleRetry}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  بارگذاری مجدد
                </button>

                <button
                  onClick={this.handleGoBack}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  <ArrowRight className="w-4 h-4" />
                  بازگشت
                </button>
              </div>

              <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
                اگر مشکل ادامه داشت، با پشتیبانی تماس بگیرید.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PageErrorBoundary;
