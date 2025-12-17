"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Bell, ArrowRight, AlertCircle, Info, AlertTriangle, Send, MessageSquare, X, Paperclip, Download, FileText, Image as ImageIcon } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";
import MobileLayout from "@/components/MobileLayout";
import { useToast } from "@/contexts/ToastContext";

export default function AnnouncementDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const announcementId = params?.id as string;

  const [announcement, setAnnouncement] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // تشخیص موبایل
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // تعیین مسیر بازگشت بر اساس نقش کاربر و موبایل
  const getBackPath = () => {
    if (isMobile) {
      return "/mobile/announcements";
    }
    return "/announcements";
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && announcementId) {
      fetchAnnouncement();
      fetchMessages();
      recordView();
    }
  }, [status, announcementId, router]);

  const recordView = async () => {
    if (!announcementId) return;

    try {
      await fetch(`/api/announcements/${announcementId}/view`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error recording view:", error);
    }
  };

  const fetchAnnouncement = async () => {
    try {
      const res = await fetch(`/api/announcements/${announcementId}`);
      if (res.ok) {
        const data = await res.json();
        setAnnouncement(data);
      } else if (res.status === 404) {
        router.push("/announcements");
      }
    } catch (error) {
      console.error("Error fetching announcement:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/announcements/${announcementId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // بررسی نوع فایل
      const allowedTypes = [
        'image/',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip',
        'application/x-rar-compressed',
      ];
      
      const isValidType = allowedTypes.some(type => file.type.startsWith(type));
      if (!isValidType) {
        toast.warning('نوع فایل مجاز نیست. فایل‌های مجاز: تصاویر، PDF، Word، ZIP، RAR');
        return;
      }

      // بررسی حجم فایل (حداکثر 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.warning('حجم فایل نباید بیشتر از 10 مگابایت باشد');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const formData = new FormData();
      formData.append("content", newMessage);
      
      // اگر فایل وجود دارد و کاربر ADMIN است، اضافه کن
      if (selectedFile && session?.user.role === "ADMIN") {
        formData.append("attachment", selectedFile);
      }

      const res = await fetch(`/api/announcements/${announcementId}/messages`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const message = await res.json();
        setMessages((prev) => [...prev, message]);
        setNewMessage("");
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        const data = await res.json();
        toast.error(data.error || "خطا در ارسال پیام");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("خطا در ارسال پیام");
    } finally {
      setSending(false);
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case "HIGH":
        return <AlertTriangle className="text-red-500" size={24} />;
      case "MEDIUM":
        return <AlertCircle className="text-yellow-500" size={24} />;
      case "LOW":
        return <Info className="text-blue-500" size={24} />;
      default:
        return <Bell className="text-gray-500" size={24} />;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "HIGH":
        return "border-r-4 border-red-500 bg-red-50 dark:bg-red-900/20";
      case "MEDIUM":
        return "border-r-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20";
      case "LOW":
        return "border-r-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20";
      default:
        return "border-r-4 border-gray-300";
    }
  };

  const isImageFile = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.includes('image/');
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <ImageIcon size={20} />;
    }
    return <FileText size={20} />;
  };

  // تشخیص موبایل برای loading state
  const [isMobileLoading, setIsMobileLoading] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobileLoading(window.innerWidth < 1024);
    }
  }, []);

  if (status === "loading" || loading) {
    if (isMobileLoading && session?.user?.role) {
      const userRole = session.user.role === "EMPLOYEE" ? "EMPLOYEE" : "MANAGER";
      return (
        <MobileLayout role={userRole} title="اعلان">
          <div className="flex items-center justify-center h-64">
            <div className="text-xl">در حال بارگذاری...</div>
          </div>
        </MobileLayout>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">در حال بارگذاری...</div>
      </div>
    );
  }

  if (!announcement) {
    return null;
  }

  // محتوای صفحه
  const pageContent = (
    <>
      {/* Back Button */}
      <Link
        href={getBackPath()}
        className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-6"
      >
        <ArrowRight size={20} />
        <span>بازگشت به لیست اعلانات</span>
      </Link>

          {/* Announcement Card */}
          <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 ${getPriorityColor(announcement.priority)}`}>
            <div className="flex items-start gap-4 mb-4">
              <div className="mt-1">
                {getPriorityIcon(announcement.priority)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                      {announcement.title}
                    </h1>
                    {announcement.attachments && Array.isArray(announcement.attachments) && announcement.attachments.length > 0 && (
                      <Paperclip size={20} className="text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(announcement.createdAt).toLocaleDateString("fa-IR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-3 whitespace-pre-wrap">
                  {announcement.content}
                </p>

                {/* Attachments */}
                {announcement.attachments && Array.isArray(announcement.attachments) && announcement.attachments.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <h3 className="font-medium text-gray-800 dark:text-white">ضمیمه‌ها:</h3>
                    {announcement.attachments.map((attachment: any, index: number) => (
                      <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-3 mb-3">
                          {getFileIcon(attachment.name || attachment.url)}
                          <span className="font-medium text-gray-800 dark:text-white">
                            {attachment.name || `فایل ${index + 1}`}
                          </span>
                        </div>
                        
                        {isImageFile(attachment.url) ? (
                          <div className="mt-3">
                            <img
                              src={
                                attachment.url.includes("liara.space")
                                  ? `/api/image-proxy?url=${encodeURIComponent(attachment.url)}`
                                  : attachment.url
                              }
                              alt={attachment.name || "ضمیمه"}
                              className="max-w-full h-auto rounded-lg"
                            />
                            <a
                              href={`/api/download?url=${encodeURIComponent(attachment.url)}`}
                              download={attachment.name}
                              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                              <Download size={18} />
                              <span>دانلود تصویر</span>
                            </a>
                          </div>
                        ) : (
                          <a
                            href={`/api/download?url=${encodeURIComponent(attachment.url)}`}
                            download={attachment.name}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                          >
                            <Download size={18} />
                            <span>دانلود فایل</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400 mt-3">
                  <span>از طرف: {announcement.createdBy?.name}</span>
                  {announcement.department && (
                    <span>بخش: {announcement.department.name}</span>
                  )}
                  {!announcement.department && (
                    <span className="text-blue-600 dark:text-blue-400">
                      اعلان عمومی
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Messages Section - Only show if there are messages */}
          {messages.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare size={20} className="text-gray-600 dark:text-gray-400" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  پیام‌های اعلان
                </h2>
                <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full">
                  {messages.length}
                </span>
              </div>

              {/* Messages List */}
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border-r-4 border-blue-500"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800 dark:text-white">
                          {message.createdBy.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({message.createdBy.role === "ADMIN" ? "ادمین" : "مدیر"})
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(message.createdAt).toLocaleDateString("fa-IR", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-2">
                      {message.content}
                    </p>
                    {/* Attachment for message */}
                    {message.attachment && (
                      <div className="mt-3 p-3 bg-white dark:bg-gray-600/50 rounded-lg border border-gray-200 dark:border-gray-500">
                        <div className="flex items-center gap-2 mb-2">
                          {getFileIcon(message.attachmentName || message.attachment)}
                          <span className="text-sm font-medium text-gray-800 dark:text-white">
                            {message.attachmentName || "فایل ضمیمه"}
                          </span>
                        </div>
                        {isImageFile(message.attachment) ? (
                          <div className="mt-2">
                            <img
                              src={
                                message.attachment.includes("liara.space")
                                  ? `/api/image-proxy?url=${encodeURIComponent(message.attachment)}`
                                  : message.attachment
                              }
                              alt={message.attachmentName || "ضمیمه"}
                              className="max-w-full h-auto rounded-lg"
                            />
                          </div>
                        ) : (
                          <a
                            href={message.attachment}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                          >
                            <Download size={16} />
                            <span>دانلود فایل</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Add Message Form (Only for ADMIN and MANAGER who created the announcement) */}
              {(session?.user.role === "ADMIN" ||
                (session?.user.role === "MANAGER" && announcement.createdById === session?.user.id)) && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="پیام خود را بنویسید..."
                      rows={3}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.ctrlKey) {
                          sendMessage();
                        }
                      }}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                    >
                      <Send size={18} />
                      <span>{sending ? "در حال ارسال..." : "ارسال"}</span>
                    </button>
                  </div>
                  
                  {/* File upload - فقط برای ADMIN */}
                  {session?.user.role === "ADMIN" && (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileChange}
                        accept="image/*,.pdf,.doc,.docx,.zip,.rar"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-600 dark:file:text-gray-200"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        فایل‌های مجاز: تصاویر، PDF، Word، ZIP، RAR (حداکثر 10MB) - فقط ادمین
                      </p>
                      {selectedFile && (
                        <div className="mt-2 flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <Paperclip size={16} className="text-blue-600 dark:text-blue-400" />
                          <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                            {selectedFile.name}
                          </span>
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  برای ارسال، Ctrl+Enter را فشار دهید
                </p>
                </div>
              )}
            </div>
          )}
    </>
  );

  // Mobile view
  if (isMobile && session?.user?.role) {
    const userRole = session.user.role === "EMPLOYEE" ? "EMPLOYEE" : "MANAGER";
    return (
      <MobileLayout 
        role={userRole} 
        title={announcement.title}
        showBackButton={true}
        backHref={getBackPath()}
      >
        <div className="px-2">
          {pageContent}
        </div>
      </MobileLayout>
    );
  }

  // Desktop view
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex" dir="rtl">
      <Sidebar />
      <AppHeader />
      <main className="flex-1 lg:mr-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {pageContent}
        </div>
      </main>
    </div>
  );
}


