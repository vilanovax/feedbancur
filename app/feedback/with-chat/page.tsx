"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Star, Calendar, Building2, User, MessageCircle, X, Check, Image as ImageIcon, Download, Maximize2 } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";
import { useToast } from "@/contexts/ToastContext";

export default function FeedbacksWithChatPage() {
  const toast = useToast();
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedFeedbackForChat, setSelectedFeedbackForChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, any[]>>({});
  const [newMessageTexts, setNewMessageTexts] = useState<Record<string, string>>({});
  const [messageImages, setMessageImages] = useState<Record<string, File | null>>({});
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
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
      fetchFeedbacksWithChat();
    }
  }, [session]);

  // باز کردن چت از طریق پارامتر URL
  useEffect(() => {
    const openChatId = searchParams.get("openChat");
    if (openChatId && feedbacks.length > 0 && !chatModalOpen) {
      // بررسی اینکه این فیدبک در لیست وجود دارد
      const feedbackExists = feedbacks.some((f) => f.id === openChatId);
      if (feedbackExists) {
        openChatModal(openChatId);
        // پاک کردن پارامتر از URL
        router.replace("/feedback/with-chat", { scroll: false });
      }
    }
  }, [searchParams, feedbacks, chatModalOpen, router]);

  const fetchFeedbacksWithChat = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/feedback/with-chat");
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data);
      }
    } catch (error) {
      console.error("Error fetching feedbacks with chat:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (feedbackId: string) => {
    try {
      const res = await fetch(`/api/feedback/${feedbackId}/messages`);
      if (res.ok) {
        const msgs = await res.json();
        setMessages((prev) => ({ ...prev, [feedbackId]: msgs }));
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const openChatModal = (feedbackId: string) => {
    setSelectedFeedbackForChat(feedbackId);
    setChatModalOpen(true);
    fetchMessages(feedbackId);
  };

  const closeChatModal = () => {
    setChatModalOpen(false);
    setSelectedFeedbackForChat(null);
    fetchFeedbacksWithChat(); // به‌روزرسانی لیست
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
    const image = messageImages[feedbackId];
    
    if (!text && !image) return;

    try {
      const formData = new FormData();
      if (text) {
        formData.append("content", text);
      }
      if (image) {
        formData.append("image", image);
      }

      const res = await fetch(`/api/feedback/${feedbackId}/messages`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const newMessage = await res.json();
        setMessages((prev) => ({
          ...prev,
          [feedbackId]: [...(prev[feedbackId] || []), newMessage],
        }));
        setNewMessageTexts((prev) => ({ ...prev, [feedbackId]: "" }));
        setMessageImages((prev) => ({ ...prev, [feedbackId]: null }));
        setImagePreviews((prev) => {
          const newPreviews = { ...prev };
          delete newPreviews[feedbackId];
          return newPreviews;
        });
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        // به‌روزرسانی پیام‌ها برای دریافت isRead به‌روز شده
        setTimeout(() => {
          fetchMessages(feedbackId);
        }, 500);
      } else {
        const error = await res.json();
        toast.error(error.error || "خطا در ارسال پیام");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("خطا در ارسال پیام");
    }
  };

  const handleImageSelect = (feedbackId: string, file: File | null) => {
    if (!file) {
      setMessageImages((prev) => ({ ...prev, [feedbackId]: null }));
      setImagePreviews((prev) => {
        const newPreviews = { ...prev };
        delete newPreviews[feedbackId];
        return newPreviews;
      });
      return;
    }

    // بررسی حجم فایل (از تنظیمات)
    const maxSize = 5 * 1024 * 1024; // 5MB پیش‌فرض
    if (file.size > maxSize) {
      toast.info(`حجم فایل نباید بیشتر از ${maxSize / 1024 / 1024} مگابایت باشد`);
      return;
    }

    // بررسی فرمت فایل
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.info("فرمت فایل مجاز نیست. فقط تصاویر JPEG، PNG، GIF و WebP مجاز است.");
      return;
    }

    setMessageImages((prev) => ({ ...prev, [feedbackId]: file }));
    
    // ایجاد preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviews((prev) => ({
        ...prev,
        [feedbackId]: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
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
              فیدبک‌های دارای چت
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              لیست فیدبک‌هایی که چت برای آنها ایجاد شده است
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
                فیدبکی با چت یافت نشد
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
                        {feedback.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {feedback.unreadCount}
                          </span>
                        )}
                      </button>
                    </div>
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
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <MessageCircle 
                        size={14} 
                        fill={feedback._count?.messages > 0 ? "currentColor" : "none"}
                        strokeWidth={feedback._count?.messages > 0 ? 2 : 1.5}
                        className={feedback._count?.messages > 0 ? "text-green-700 dark:text-green-500" : "text-green-600 dark:text-green-400"}
                      />
                      <span>{feedback._count.messages} پیام</span>
                    </div>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3 mb-4 flex-grow">
                    {feedback.content}
                  </p>

                  {feedback.messages && feedback.messages.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded mb-3">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        آخرین پیام:
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                        {feedback.messages[0].content}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {format(new Date(feedback.messages[0].createdAt), "yyyy/MM/dd HH:mm")}
                      </div>
                    </div>
                  )}
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
                        {message.content && (
                          <div className="text-sm whitespace-pre-wrap mb-2">{message.content}</div>
                        )}
                        {message.image && (
                          <div className="mb-2 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity" onClick={() => {
                            setSelectedImageUrl(message.image);
                            setImageModalOpen(true);
                          }}>
                            <img
                              src={
                                message.image.includes("liara.space")
                                  ? `/api/image-proxy?url=${encodeURIComponent(message.image)}`
                                  : message.image
                              }
                              alt="ضمیمه"
                              className="max-w-full h-auto rounded-lg"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                        )}
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
            <div className="flex flex-col gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
              {/* Image Preview */}
              {imagePreviews[selectedFeedbackForChat] && (
                <div className="relative inline-block max-w-xs">
                  <img
                    src={imagePreviews[selectedFeedbackForChat]}
                    alt="Preview"
                    className="max-w-full h-auto rounded-lg border border-gray-300 dark:border-gray-600"
                  />
                  <button
                    onClick={() => handleImageSelect(selectedFeedbackForChat, null)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <label className="flex-shrink-0 cursor-pointer p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                  <ImageIcon size={20} />
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      handleImageSelect(selectedFeedbackForChat, file);
                    }}
                    className="hidden"
                  />
                </label>
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
                  disabled={!newMessageTexts[selectedFeedbackForChat]?.trim() && !messageImages[selectedFeedbackForChat]}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                >
                  ارسال
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {imageModalOpen && selectedImageUrl && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setImageModalOpen(false)}>
          <div className="relative w-full h-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header with close and download buttons */}
            <div className="flex items-center justify-between p-4 bg-black/50 rounded-t-lg">
              <div className="flex items-center gap-2">
                <Maximize2 size={20} className="text-white" />
                <span className="text-white text-sm">نمایش تصویر</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    try {
                      let imageUrl: string;
                      if (selectedImageUrl.includes("liara.space")) {
                        // برای تصاویر لیارا از proxy استفاده می‌کنیم
                        imageUrl = `/api/image-proxy?url=${encodeURIComponent(selectedImageUrl)}`;
                      } else {
                        // برای تصاویر محلی
                        imageUrl = selectedImageUrl.startsWith("http") 
                          ? selectedImageUrl 
                          : `${typeof window !== "undefined" ? window.location.origin : ""}${selectedImageUrl}`;
                      }
                      
                      // دریافت تصویر و دانلود
                      const response = await fetch(imageUrl);
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = `image-${Date.now()}.${selectedImageUrl.split('.').pop() || 'jpg'}`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                    } catch (error) {
                      console.error("Error downloading image:", error);
                      toast.error("خطا در دانلود تصویر");
                    }
                  }}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                  title="دانلود تصویر"
                >
                  <Download size={18} />
                  <span className="text-sm">دانلود</span>
                </button>
                <button
                  onClick={() => setImageModalOpen(false)}
                  className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                  title="بستن"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* Image */}
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              <img
                src={
                  selectedImageUrl.includes("liara.space")
                    ? `/api/image-proxy?url=${encodeURIComponent(selectedImageUrl)}`
                    : selectedImageUrl
                }
                alt="تصویر بزرگ"
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
                onError={(e) => {
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f0f0f0' width='400' height='300'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle' font-family='Arial' font-size='18'%3Eتصویر در دسترس نیست%3C/text%3E%3C/svg%3E";
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

