"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Star, Calendar, Building2, User, XCircle, RefreshCw, MessageCircle, X, Check } from "lucide-react";
import { format } from "date-fns";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";
import { useToast } from "@/contexts/ToastContext";

export default function ForwardedFeedbacksPage() {
  const toast = useToast();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingForward, setCancelingForward] = useState<string | null>(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedFeedbackForChat, setSelectedFeedbackForChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, any[]>>({});
  const [newMessageTexts, setNewMessageTexts] = useState<Record<string, string>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user.role !== "ADMIN") {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user.role === "ADMIN") {
      fetchForwardedFeedbacks();
    }
  }, [session]);

  // دریافت تعداد پیام‌های خوانده نشده برای همه فیدبک‌ها
  useEffect(() => {
    if (feedbacks.length > 0) {
      feedbacks.forEach((feedback) => {
        if (feedback.forwardedToId) {
          fetchUnreadCount(feedback.id);
        }
      });
    }
  }, [feedbacks]);

  const fetchForwardedFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/feedback");
      if (res.ok) {
        const data = await res.json();
        // فقط فیدبک‌های ارجاع شده که وضعیت آنها "انجام شد" نیست
        const forwardedOnly = data.filter((f: any) => 
          f.forwardedToId !== null && f.status !== "COMPLETED"
        );
        setFeedbacks(forwardedOnly);
      }
    } catch (error) {
      console.error("Error fetching forwarded feedbacks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelForward = async (feedbackId: string) => {
    if (!confirm("آیا از لغو ارجاع این فیدبک اطمینان دارید؟")) {
      return;
    }

    setCancelingForward(feedbackId);
    try {
      const res = await fetch(`/api/feedback/${feedbackId}/cancel-forward`, {
        method: "POST",
      });

      if (res.ok) {
        toast.success("ارجاع فیدبک با موفقیت لغو شد");
        fetchForwardedFeedbacks();
      } else {
        const error = await res.json();
        toast.error(error.error || "خطا در لغو ارجاع");
      }
    } catch (error) {
      console.error("Error canceling forward:", error);
      toast.error("خطا در لغو ارجاع");
    } finally {
      setCancelingForward(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "REVIEWED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "ARCHIVED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      case "DEFERRED":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "COMPLETED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "در انتظار";
      case "REVIEWED":
        return "بررسی شده";
      case "ARCHIVED":
        return "آرشیو شده";
      case "DEFERRED":
        return "رسیدگی آینده";
      case "COMPLETED":
        return "انجام شد";
      default:
        return status;
    }
  };

  // توابع مدیریت چت
  const fetchUnreadCount = async (feedbackId: string) => {
    try {
      const res = await fetch(`/api/feedback/${feedbackId}/messages/unread`);
      if (res.ok) {
        const data = await res.json();
        setUnreadCounts((prev) => ({ ...prev, [feedbackId]: data.count }));
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const fetchMessages = async (feedbackId: string) => {
    try {
      const res = await fetch(`/api/feedback/${feedbackId}/messages`);
      if (res.ok) {
        const msgs = await res.json();
        setMessages((prev) => ({ ...prev, [feedbackId]: msgs }));
        // به‌روزرسانی تعداد خوانده نشده
        fetchUnreadCount(feedbackId);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const openChatModal = (feedbackId: string) => {
    setSelectedFeedbackForChat(feedbackId);
    setChatModalOpen(true);
    fetchMessages(feedbackId);
    // پاک کردن تعداد خوانده نشده
    setUnreadCounts((prev) => ({ ...prev, [feedbackId]: 0 }));
  };

  const closeChatModal = () => {
    setChatModalOpen(false);
    setSelectedFeedbackForChat(null);
  };

  // به‌روزرسانی خودکار پیام‌ها وقتی مودال باز است
  useEffect(() => {
    if (chatModalOpen && selectedFeedbackForChat) {
      const interval = setInterval(() => {
        fetchMessages(selectedFeedbackForChat);
      }, 3000); // هر 3 ثانیه یکبار

      return () => clearInterval(interval);
    }
  }, [chatModalOpen, selectedFeedbackForChat]);

  const sendMessage = async (feedbackId: string) => {
    const text = newMessageTexts[feedbackId]?.trim();
    if (!text) return;

    try {
      const res = await fetch(`/api/feedback/${feedbackId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });

      if (res.ok) {
        const newMessage = await res.json();
        setMessages((prev) => ({
          ...prev,
          [feedbackId]: [...(prev[feedbackId] || []), newMessage],
        }));
        setNewMessageTexts((prev) => ({ ...prev, [feedbackId]: "" }));
        // اسکرول به پایین
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        // به‌روزرسانی پیام‌ها برای دریافت isRead به‌روز شده
        setTimeout(() => {
          fetchMessages(feedbackId);
        }, 500);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">در حال بارگذاری...</div>
      </div>
    );
  }

  if (session?.user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex" dir="rtl">
      <Sidebar />
      <AppHeader />
      <main className="flex-1 lg:mr-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              فیدبک‌های ارجاع شده
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              لیست فیدبک‌هایی که به مدیران ارجاع داده شده‌اند
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-xl text-gray-600 dark:text-gray-400">
                در حال بارگذاری...
              </div>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400">
                فیدبک ارجاع شده‌ای یافت نشد
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {feedbacks.map((feedback) => (
                <div
                  key={feedback.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white line-clamp-2">
                      {feedback.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openChatModal(feedback.id)}
                        className={`p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition relative ${
                          (feedback._count?.messages > 0 || messages[feedback.id]?.length > 0)
                            ? "text-green-700 dark:text-green-500"
                            : "text-green-600 dark:text-green-400"
                        }`}
                        title="چت با مدیر"
                      >
                        <MessageCircle 
                          size={18} 
                          fill={(feedback._count?.messages > 0 || messages[feedback.id]?.length > 0) ? "currentColor" : "none"}
                          strokeWidth={(feedback._count?.messages > 0 || messages[feedback.id]?.length > 0) ? 2 : 1.5}
                        />
                        {unreadCounts[feedback.id] > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {unreadCounts[feedback.id]}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse mb-3 flex-wrap gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        feedback.status
                      )}`}
                    >
                      {getStatusText(feedback.status)}
                    </span>
                    {feedback.department?.allowDirectFeedback && feedback.forwardedToId && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        مستقیم
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <div className="flex items-center space-x-reverse">
                      <Building2 size={14} />
                      <span className="mr-[5px]">
                        {feedback.department.name}
                        {feedback.department.manager && (
                          <span className="text-gray-500 dark:text-gray-400">
                            {" "}({feedback.department.manager.name})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <User size={14} />
                      <span>{feedback.user.name}</span>
                    </div>
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <Calendar size={14} />
                      <span>
                        {format(new Date(feedback.createdAt), "yyyy/MM/dd")}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3 mb-4 flex-grow">
                    {feedback.content}
                  </p>

                  {/* Forwarded Info */}
                  <div className="text-xs text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded mb-3">
                    <div className="font-medium mb-1">ارجاع شده به:</div>
                    <div>{feedback.forwardedTo?.name || "نامشخص"}</div>
                    {feedback.forwardedAt && (
                      <div className="text-xs mt-1 text-gray-500 dark:text-gray-500">
                        {format(new Date(feedback.forwardedAt), "yyyy/MM/dd HH:mm")}
                      </div>
                    )}
                  </div>

                  {/* Only Cancel Forward Button for ADMIN */}
                  <button
                    onClick={() => handleCancelForward(feedback.id)}
                    disabled={cancelingForward === feedback.id}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                  >
                    {cancelingForward === feedback.id ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        در حال لغو...
                      </>
                    ) : (
                      <>
                        <XCircle size={14} />
                        لغو ارجاع
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Chat Modal */}
      {chatModalOpen && selectedFeedbackForChat && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <MessageCircle size={20} className="text-green-600 dark:text-green-400" />
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                  چت با مدیر
                </h2>
              </div>
              <button
                onClick={closeChatModal}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages[selectedFeedbackForChat]?.length > 0 ? (
                messages[selectedFeedbackForChat].map((message: any) => {
                  const isMyMessage = message.senderId === session?.user.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMyMessage ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          isMyMessage
                            ? "bg-green-500 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        <div className="text-xs mb-1 opacity-75">
                          {message.sender.name} ({message.sender.role === "ADMIN" ? "ادمین" : "مدیر"})
                        </div>
                          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                          <div className="flex items-center justify-end gap-1 text-xs mt-1 opacity-75">
                            <span>{format(new Date(message.createdAt), "HH:mm")}</span>
                            {isMyMessage && (
                              <Check 
                                size={14} 
                                className={message.isRead ? "text-blue-300" : "text-white/50"}
                              />
                            )}
                          </div>
                        </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                  پیامی وجود ندارد. اولین پیام را ارسال کنید.
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="flex items-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
              <input
                type="text"
                value={newMessageTexts[selectedFeedbackForChat] || ""}
                onChange={(e) =>
                  setNewMessageTexts((prev) => ({
                    ...prev,
                    [selectedFeedbackForChat]: e.target.value,
                  }))
                }
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(selectedFeedbackForChat);
                  }
                }}
                placeholder="پیام خود را بنویسید..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
              />
              <button
                onClick={() => sendMessage(selectedFeedbackForChat)}
                disabled={!newMessageTexts[selectedFeedbackForChat]?.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
              >
                ارسال
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
