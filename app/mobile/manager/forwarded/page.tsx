"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MobileLayout from "@/components/MobileLayout";
import { Star, Calendar, Building2, User, CheckCircle, Clock, Archive, MessageCircle, CheckSquare, FileText, X, Save, Plus, Trash2, Check, Send } from "lucide-react";
import { format } from "date-fns";
import { getStatusColor } from "@/lib/status-utils";
import { useStatusTexts } from "@/lib/hooks/useStatusTexts";
import { formatPersianDate, getTimeAgo } from "@/lib/date-utils";

export default function ManagerForwardedFeedbacksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [selectedFeedbackForNotes, setSelectedFeedbackForNotes] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [notesLoading, setNotesLoading] = useState<Record<string, boolean>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [checklists, setChecklists] = useState<Record<string, any[]>>({});
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [selectedFeedbackForChecklist, setSelectedFeedbackForChecklist] = useState<string | null>(null);
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({});
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedFeedbackForChat, setSelectedFeedbackForChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, any[]>>({});
  const [newMessageTexts, setNewMessageTexts] = useState<Record<string, string>>({});
  const [messagesEndRef, setMessagesEndRef] = useState<HTMLDivElement | null>(null);
  const { getStatusTextLocal, refreshStatusTexts, getStatusTextsOrder } = useStatusTexts();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user.role !== "MANAGER") {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user.role === "MANAGER") {
      // به‌روزرسانی تنظیمات از API برای اطمینان از به‌روز بودن
      refreshStatusTexts();
      fetchForwardedFeedbacks();
    }
  }, [session, refreshStatusTexts]);

  // دریافت تعداد پیام‌های خوانده نشده
  useEffect(() => {
    if (feedbacks.length > 0) {
      feedbacks.forEach((feedback) => {
        fetchUnreadCount(feedback.id);
      });
    }
  }, [feedbacks]);

  // به‌روزرسانی خودکار پیام‌ها وقتی مودال چت باز است
  useEffect(() => {
    if (chatModalOpen && selectedFeedbackForChat) {
      const interval = setInterval(() => {
        fetchMessages(selectedFeedbackForChat);
      }, 3000); // هر 3 ثانیه یکبار

      return () => clearInterval(interval);
    }
  }, [chatModalOpen, selectedFeedbackForChat]);

  // اسکرول به پایین وقتی پیام جدید می‌آید
  useEffect(() => {
    if (messagesEndRef) {
      messagesEndRef.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, messagesEndRef]);

  const fetchUnreadCount = async (feedbackId: string) => {
    try {
      const res = await fetch(`/api/feedback/${feedbackId}/messages/unread`);
      if (res.ok) {
        const data = await res.json();
        setUnreadCounts((prev) => ({ ...prev, [feedbackId]: data.count || 0 }));
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  // دریافت یادداشت‌ها
  const fetchNotes = async (feedbackId: string) => {
    if (notesLoading[feedbackId]) return;
    
    setNotesLoading((prev) => ({ ...prev, [feedbackId]: true }));
    try {
      const res = await fetch(`/api/feedback/${feedbackId}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes((prev) => ({ ...prev, [feedbackId]: data.notes || "" }));
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setNotesLoading((prev) => ({ ...prev, [feedbackId]: false }));
    }
  };

  // باز کردن مودال یادداشت
  const openNotesModal = async (feedbackId: string) => {
    setSelectedFeedbackForNotes(feedbackId);
    await fetchNotes(feedbackId);
    setNotesModalOpen(true);
  };

  // ذخیره یادداشت
  const saveNotes = async () => {
    if (!selectedFeedbackForNotes) return;

    try {
      const res = await fetch(`/api/feedback/${selectedFeedbackForNotes}/notes`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: notes[selectedFeedbackForNotes] || "" }),
      });

      if (res.ok) {
        setNotesModalOpen(false);
        alert("یادداشت با موفقیت ذخیره شد");
      } else {
        const error = await res.json();
        alert(error.error || "خطا در ذخیره یادداشت");
      }
    } catch (error) {
      console.error("Error saving notes:", error);
      alert("خطا در ذخیره یادداشت");
    }
  };

  // دریافت چک لیست
  const fetchChecklist = async (feedbackId: string) => {
    try {
      const res = await fetch(`/api/feedback/${feedbackId}/checklist`);
      if (res.ok) {
        const data = await res.json();
        setChecklists((prev) => ({ ...prev, [feedbackId]: data }));
      }
    } catch (error) {
      console.error("Error fetching checklist:", error);
    }
  };

  // باز کردن مودال چک لیست
  const openChecklistModal = async (feedbackId: string) => {
    setSelectedFeedbackForChecklist(feedbackId);
    await fetchChecklist(feedbackId);
    setChecklistModalOpen(true);
  };

  // باز کردن مودال چت
  const openChatModal = async (feedbackId: string) => {
    setSelectedFeedbackForChat(feedbackId);
    setChatModalOpen(true);
    await fetchMessages(feedbackId);
  };

  const closeChatModal = () => {
    setChatModalOpen(false);
    setSelectedFeedbackForChat(null);
  };

  const fetchMessages = async (feedbackId: string) => {
    try {
      const res = await fetch(`/api/feedback/${feedbackId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => ({ ...prev, [feedbackId]: data }));
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

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
        setUnreadCounts((prev) => ({ ...prev, [feedbackId]: 0 }));
        // به‌روزرسانی پیام‌ها برای دریافت isRead به‌روز شده
        setTimeout(() => {
          fetchMessages(feedbackId);
        }, 500);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const closeChecklistModal = () => {
    setChecklistModalOpen(false);
    setSelectedFeedbackForChecklist(null);
  };

  const addChecklistItem = async (feedbackId: string) => {
    const text = newItemTexts[feedbackId]?.trim();
    if (!text) return;

    try {
      const res = await fetch(`/api/feedback/${feedbackId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: text }),
      });

      if (res.ok) {
        const newItem = await res.json();
        setChecklists((prev) => ({
          ...prev,
          [feedbackId]: [...(prev[feedbackId] || []), newItem],
        }));
        setNewItemTexts((prev) => ({ ...prev, [feedbackId]: "" }));
      }
    } catch (error) {
      console.error("Error adding checklist item:", error);
    }
  };

  const toggleChecklistItem = async (itemId: string, feedbackId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/feedback/checklist/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !currentStatus }),
      });

      if (res.ok) {
        const updatedItem = await res.json();
        setChecklists((prev) => ({
          ...prev,
          [feedbackId]: (prev[feedbackId] || []).map((item: any) =>
            item.id === itemId ? updatedItem : item
          ),
        }));
      }
    } catch (error) {
      console.error("Error toggling checklist item:", error);
    }
  };

  const deleteChecklistItem = async (itemId: string, feedbackId: string) => {
    try {
      const res = await fetch(`/api/feedback/checklist/${itemId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setChecklists((prev) => ({
          ...prev,
          [feedbackId]: (prev[feedbackId] || []).filter((item: any) => item.id !== itemId),
        }));
      }
    } catch (error) {
      console.error("Error deleting checklist item:", error);
    }
  };

  const fetchForwardedFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/feedback?forwardedToMe=true");
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data);
      }
    } catch (error) {
      console.error("Error fetching forwarded feedbacks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (feedbackId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/feedback/${feedbackId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        alert("وضعیت فیدبک با موفقیت تغییر کرد");
        fetchForwardedFeedbacks();
      } else {
        const error = await res.json();
        alert(error.error || "خطا در تغییر وضعیت");
      }
    } catch (error) {
      console.error("Error changing status:", error);
      alert("خطا در تغییر وضعیت");
    }
  };


  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">در حال بارگذاری...</div>
      </div>
    );
  }

  if (session?.user.role !== "MANAGER") {
    return null;
  }

  return (
    <MobileLayout role="MANAGER" title="فیدبک‌های ارجاع شده">
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-4 text-white">
          <p className="text-purple-100 text-sm">
            فیدبک‌هایی که ادمین برای شما ارجاع داده است
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-600 dark:text-gray-400">در حال بارگذاری...</div>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <p className="text-gray-600 dark:text-gray-400">
              فیدبک ارجاع شده‌ای یافت نشد
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedbacks.map((feedback) => (
              <div
                key={feedback.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex-1">
                    {feedback.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    {/* ایکون‌های چت، چک لیست و یادداشت */}
                    <button
                      onClick={() => openChatModal(feedback.id)}
                      className={`p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition relative ${
                        (feedback._count?.messages > 0 || messages[feedback.id]?.length > 0)
                          ? "text-green-700 dark:text-green-500"
                          : "text-green-600 dark:text-green-400"
                      }`}
                      title="چت با ادمین"
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
                    <button
                      onClick={() => openChecklistModal(feedback.id)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition relative"
                      title="چک لیست"
                    >
                      <CheckSquare size={18} />
                      {checklists[feedback.id] && checklists[feedback.id].length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {checklists[feedback.id].filter((item: any) => item.isCompleted).length}/{checklists[feedback.id].length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => openNotesModal(feedback.id)}
                      className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition relative"
                      title="یادداشت"
                    >
                      <FileText size={18} />
                      {notes[feedback.id] && notes[feedback.id].trim().length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-2 h-2 flex items-center justify-center"></span>
                      )}
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      feedback.status
                    )}`}
                  >
                    {getStatusTextLocal(feedback.status)}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} />
                    <span>{feedback.department.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={14} />
                    <span>{feedback.user.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span>
                      {formatPersianDate(feedback.createdAt)} (• {getTimeAgo(feedback.createdAt)})
                    </span>
                  </div>
                  {feedback.forwardedAt && (
                    <div className="flex items-center gap-2">
                      <Send size={14} className="text-purple-600 dark:text-purple-400" />
                      <span className="font-semibold text-purple-700 dark:text-purple-300">
                        ارجاع شده: {getTimeAgo(feedback.forwardedAt)} پیش
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                  {feedback.content}
                </p>

                {/* Status Actions */}
                <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <select
                    value={feedback.status}
                    onChange={(e) => handleStatusChange(feedback.id, e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {getStatusTextsOrder().map((status) => (
                      <option key={status.key} value={status.key}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* مودال یادداشت */}
        {notesModalOpen && selectedFeedbackForNotes && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-purple-600 dark:text-purple-400" />
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                    یادداشت‌های من
                  </h2>
                </div>
                <button
                  onClick={() => setNotesModalOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  <X size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <textarea
                  value={notes[selectedFeedbackForNotes] || ""}
                  onChange={(e) =>
                    setNotes((prev) => ({
                      ...prev,
                      [selectedFeedbackForNotes]: e.target.value,
                    }))
                  }
                  placeholder="یادداشت‌های خود را اینجا بنویسید..."
                  className="w-full h-64 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setNotesModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  انصراف
                </button>
                <button
                  onClick={saveNotes}
                  className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
                >
                  <Save size={16} />
                  ذخیره
                </button>
              </div>
            </div>
          </div>
        )}

        {/* مودال چک لیست */}
        {checklistModalOpen && selectedFeedbackForChecklist && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <CheckSquare size={20} className="text-blue-600 dark:text-blue-400" />
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                    چک لیست
                  </h2>
                  {checklists[selectedFeedbackForChecklist] && checklists[selectedFeedbackForChecklist].length > 0 && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full">
                      {checklists[selectedFeedbackForChecklist].filter((item: any) => item.isCompleted).length} / {checklists[selectedFeedbackForChecklist].length}
                    </span>
                  )}
                </div>
                <button
                  onClick={closeChecklistModal}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {checklists[selectedFeedbackForChecklist]?.length > 0 ? (
                  checklists[selectedFeedbackForChecklist].map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 rounded-lg p-3"
                    >
                      <button
                        onClick={() => toggleChecklistItem(item.id, selectedFeedbackForChecklist, item.isCompleted)}
                        className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition ${
                          item.isCompleted
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        {item.isCompleted && <CheckCircle size={16} />}
                      </button>
                      <span
                        className={`flex-1 text-sm ${
                          item.isCompleted
                            ? "line-through text-gray-400 dark:text-gray-500"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {item.title}
                      </span>
                      <button
                        onClick={() => deleteChecklistItem(item.id, selectedFeedbackForChecklist)}
                        className="flex-shrink-0 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                    چک لیستی وجود ندارد. آیتم جدید اضافه کنید.
                  </div>
                )}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <input
                    type="text"
                    value={newItemTexts[selectedFeedbackForChecklist] || ""}
                    onChange={(e) =>
                      setNewItemTexts((prev) => ({
                        ...prev,
                        [selectedFeedbackForChecklist]: e.target.value,
                      }))
                    }
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        addChecklistItem(selectedFeedbackForChecklist);
                      }
                    }}
                    placeholder="افزودن آیتم جدید..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    autoFocus
                  />
                  <button
                    onClick={() => addChecklistItem(selectedFeedbackForChecklist)}
                    className="flex-shrink-0 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* مودال چت */}
        {chatModalOpen && selectedFeedbackForChat && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <MessageCircle size={20} className="text-green-600 dark:text-green-400" />
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                    چت با ادمین
                  </h2>
                </div>
                <button
                  onClick={closeChatModal}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <X size={20} />
                </button>
              </div>
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
                <div ref={setMessagesEndRef} />
              </div>
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
    </MobileLayout>
  );
}

