"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MobileLayout from "@/components/MobileLayout";
import { Star, Calendar, Building2, User, Send, ArrowUpDown, CheckCircle, Clock, Archive, Grid3x3, List, Plus, Trash2, CheckSquare, X, MessageCircle, Check, FileText, Save, Pencil, Image as ImageIcon, Download, Maximize2 } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import { formatPersianDate, getTimeAgo } from "@/lib/date-utils";
import { getStatusColor } from "@/lib/status-utils";
import { useStatusTexts } from "@/lib/hooks/useStatusTexts";
import { useToast } from "@/contexts/ToastContext";

type SortOption = "date-desc" | "date-asc" | "priority" | "status";
type ViewMode = "grid" | "list";

export default function ManagerTasksPage() {
  const toast = useToast();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<any[]>(() => {
    // بارگذاری از cache در صورت وجود
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("managerTasksFeedbacks_cache");
      const cacheTime = localStorage.getItem("managerTasksFeedbacks_cache_time");
      if (cached && cacheTime) {
        const timeDiff = Date.now() - parseInt(cacheTime);
        // Cache برای 2 دقیقه معتبر است
        if (timeDiff < 2 * 60 * 1000) {
          try {
            return JSON.parse(cached);
          } catch (e) {
            localStorage.removeItem("managerTasksFeedbacks_cache");
            localStorage.removeItem("managerTasksFeedbacks_cache_time");
          }
        }
      }
    }
    return [];
  });
  const [loading, setLoading] = useState(true);
  const [quickFilter, setQuickFilter] = useState<"all" | "forwarded" | "completed">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("managerTasksQuickFilter");
      // Migrate old "active" to "forwarded" for backward compatibility
      if (saved === "active") {
        return "forwarded";
      }
      if (saved && ["all", "forwarded", "completed"].includes(saved)) {
        return saved as "all" | "forwarded" | "completed";
      }
    }
    return "all";
  });
  const [sortOption, setSortOption] = useState<SortOption>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("managerTasksSortOption") as SortOption;
      if (saved && ["date-desc", "date-asc", "priority", "status"].includes(saved)) {
        return saved;
      }
    }
    return "date-desc";
  });
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("managerTasksViewMode") as ViewMode;
      if (saved && (saved === "grid" || saved === "list")) {
        return saved;
      }
    }
    return "list";
  });
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [selectedFeedbackForChecklist, setSelectedFeedbackForChecklist] = useState<string | null>(null);
  const [checklists, setChecklists] = useState<Record<string, any[]>>({});
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({});
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingTexts, setEditingTexts] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedFeedbackForChat, setSelectedFeedbackForChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, any[]>>({});
  const [newMessageTexts, setNewMessageTexts] = useState<Record<string, string>>({});
  const [messageImages, setMessageImages] = useState<Record<string, File | null>>({});
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [selectedFeedbackForNotes, setSelectedFeedbackForNotes] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [notesLoading, setNotesLoading] = useState<Record<string, boolean>>({});
  const [notesSaved, setNotesSaved] = useState(false);
  const [completedModalOpen, setCompletedModalOpen] = useState(false);
  const [selectedFeedbackForCompleted, setSelectedFeedbackForCompleted] = useState<string | null>(null);
  const [userResponse, setUserResponse] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
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
      // استفاده از cache برای نمایش سریع‌تر
      fetchFeedbacks(true);
    }
  }, [session, refreshStatusTexts]);

  const fetchFeedbacks = async (useCache = true) => {
    // اگر cache معتبر وجود دارد و useCache true است، از آن استفاده کن
    if (useCache && typeof window !== "undefined") {
      const cached = localStorage.getItem("managerTasksFeedbacks_cache");
      const cacheTime = localStorage.getItem("managerTasksFeedbacks_cache_time");
      if (cached && cacheTime) {
        const timeDiff = Date.now() - parseInt(cacheTime);
        if (timeDiff < 2 * 60 * 1000) {
          try {
            const cachedData = JSON.parse(cached);
            setFeedbacks(cachedData);
            setLoading(false);
            // در پس‌زمینه به‌روزرسانی کن
            fetchFeedbacksFromAPI();
            return;
          } catch (e) {
            // اگر parse نشد، ادامه بده و از API بگیر
          }
        }
      }
    }

    // اگر cache وجود ندارد یا منقضی شده، از API بگیر
    await fetchFeedbacksFromAPI();
  };

  const fetchFeedbacksFromAPI = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("receivedFeedbacks", "true");

      const res = await fetch(`/api/feedback?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data);
        // ذخیره در cache
        if (typeof window !== "undefined") {
          localStorage.setItem("managerTasksFeedbacks_cache", JSON.stringify(data));
          localStorage.setItem("managerTasksFeedbacks_cache_time", Date.now().toString());
        }
      }
    } catch (error) {
      console.error("Error fetching received feedbacks:", error);
    } finally {
      setLoading(false);
    }
  };


  // ذخیره تنظیمات مرتب‌سازی در localStorage
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("managerTasksSortOption", sortOption);
    }
  }, [sortOption]);

  // ذخیره وضعیت نمایش در localStorage
  useEffect(() => {
    if (isFirstRender.current) {
      return;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("managerTasksViewMode", viewMode);
    }
  }, [viewMode]);

  // ذخیره quick filter در localStorage
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("managerTasksQuickFilter", quickFilter);
    }
  }, [quickFilter]);

  // به‌روزرسانی فیدبک‌ها هنگام تغییر session (بدون cache)
  useEffect(() => {
    if (session?.user.role === "MANAGER" && !isFirstRender.current) {
      fetchFeedbacks(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);


  const getPriorityValue = (type?: string) => {
    switch (type) {
      case "CRITICAL":
        return 3;
      case "SUGGESTION":
        return 2;
      case "SURVEY":
        return 1;
      default:
        return 0;
    }
  };

  // فیلتر و مرتب‌سازی فیدبک‌ها
  const sortedFeedbacks = useMemo(() => {
    // اعمال quick filter
    let filtered = [...feedbacks];
    
    if (quickFilter === "all") {
      // فیدبک‌های ارجاع شده به این مدیر و فیدبک‌های انجام شده
      filtered = filtered.filter((f) => 
        (f.forwardedToId && f.forwardedToId === session?.user.id) || 
        f.status === "COMPLETED"
      );
    } else if (quickFilter === "forwarded") {
      // فقط فیدبک‌های ارجاع شده به این مدیر (بدون فیدبک‌های انجام شده)
      filtered = filtered.filter((f) => 
        f.forwardedToId && 
        f.forwardedToId === session?.user.id && 
        f.status !== "COMPLETED"
      );
    } else if (quickFilter === "completed") {
      // تسک‌های اجرا شده: COMPLETED
      filtered = filtered.filter((f) => f.status === "COMPLETED");
    }
    
    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "date-desc":
          // برای تسک‌های ارجاع شده، از forwardedAt استفاده کن
          const dateA = a.forwardedAt || a.createdAt;
          const dateB = b.forwardedAt || b.createdAt;
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        case "date-asc":
          const dateAsc = a.forwardedAt || a.createdAt;
          const dateBsc = b.forwardedAt || b.createdAt;
          return new Date(dateAsc).getTime() - new Date(dateBsc).getTime();
        case "priority":
          const priorityDiff = getPriorityValue(b.type) - getPriorityValue(a.type);
          if (priorityDiff !== 0) return priorityDiff;
          const datePrioB = b.forwardedAt || b.createdAt;
          const datePrioA = a.forwardedAt || a.createdAt;
          return new Date(datePrioB).getTime() - new Date(datePrioA).getTime();
        case "status":
          const statusOrder = {
            PENDING: 0,
            REVIEWED: 1,
            DEFERRED: 2,
            COMPLETED: 3,
            ARCHIVED: 4,
          };
          return (
            (statusOrder[a.status as keyof typeof statusOrder] || 99) -
            (statusOrder[b.status as keyof typeof statusOrder] || 99)
          );
        default:
          return 0;
      }
    });
    return sorted;
  }, [feedbacks, sortOption, quickFilter]);

  const handleStatusChange = async (feedbackId: string, newStatus: string) => {
    // اگر وضعیت COMPLETED است، مودال را باز کن
    if (newStatus === "COMPLETED") {
      setSelectedFeedbackForCompleted(feedbackId);
      setUserResponse("");
      setAdminNotes("");
      setCompletedModalOpen(true);
      return;
    }

    // برای سایر وضعیت‌ها، مستقیماً تغییر بده
    try {
      const res = await fetch(`/api/feedback/${feedbackId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success("وضعیت فیدبک با موفقیت تغییر کرد");
        fetchFeedbacksFromAPI();
      } else {
        const error = await res.json();
        toast.error(error.error || "خطا در تغییر وضعیت");
      }
    } catch (error) {
      console.error("Error changing status:", error);
      toast.error("خطا در تغییر وضعیت");
    }
  };

  const handleCompleteFeedback = async () => {
    if (!selectedFeedbackForCompleted) return;

    try {
      const res = await fetch(`/api/feedback/${selectedFeedbackForCompleted}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          status: "COMPLETED",
          userResponse: userResponse.trim() || undefined,
          adminNotes: adminNotes.trim() || undefined,
        }),
      });

      if (res.ok) {
        toast.success("وضعیت فیدبک با موفقیت به انجام شد تغییر کرد");
        setCompletedModalOpen(false);
        setSelectedFeedbackForCompleted(null);
        setUserResponse("");
        setAdminNotes("");
        fetchFeedbacksFromAPI();
      } else {
        const error = await res.json();
        toast.error(error.error || "خطا در تغییر وضعیت");
      }
    } catch (error) {
      console.error("Error completing feedback:", error);
      toast.error("خطا در تغییر وضعیت");
    }
  };


  // توابع مدیریت چک لیست
  const fetchChecklist = async (feedbackId: string) => {
    try {
      const res = await fetch(`/api/feedback/${feedbackId}/checklist`);
      if (res.ok) {
        const items = await res.json();
        // مرتب‌سازی: اول تیک نخورده‌ها، سپس تیک خورده‌ها
        const sortedItems = items.sort((a: any, b: any) => {
          if (a.isCompleted !== b.isCompleted) {
            return a.isCompleted ? 1 : -1;
          }
          return (a.order || 0) - (b.order || 0);
        });
        setChecklists((prev) => ({ ...prev, [feedbackId]: sortedItems }));
      }
    } catch (error) {
      console.error("Error fetching checklist:", error);
    }
  };

  const openChecklistModal = (feedbackId: string) => {
    setSelectedFeedbackForChecklist(feedbackId);
    setChecklistModalOpen(true);
    if (!checklists[feedbackId]) {
      fetchChecklist(feedbackId);
    }
  };

  const closeChecklistModal = () => {
    setChecklistModalOpen(false);
    setSelectedFeedbackForChecklist(null);
  };

  const addChecklistItem = async (feedbackId: string) => {
    const text = newItemTexts[feedbackId]?.trim();
    if (!text) return;

    // Optimistic update: اضافه کردن فوری به UI
    const tempId = `temp-${Date.now()}`;
    const optimisticItem = {
      id: tempId,
      title: text,
      isCompleted: false,
      order: (checklists[feedbackId] || []).length,
      createdAt: new Date(),
    };

    setChecklists((prev) => {
      const existingChecklists = Array.isArray(prev[feedbackId]) ? prev[feedbackId] : [];
      return {
        ...prev,
        [feedbackId]: [...existingChecklists, optimisticItem],
      };
    });
    setNewItemTexts((prev) => ({ ...prev, [feedbackId]: "" }));

    // Focus را به input برگردان
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    try {
      const res = await fetch(`/api/feedback/${feedbackId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: text }),
      });

      if (res.ok) {
        const newItem = await res.json();
        // جایگزین کردن آیتم موقت با آیتم واقعی
        setChecklists((prev) => {
          const existingChecklists = Array.isArray(prev[feedbackId]) ? prev[feedbackId] : [];
          return {
            ...prev,
            [feedbackId]: existingChecklists.map((item: any) =>
              item.id === tempId ? newItem : item
            ),
          };
        });
      } else {
        // در صورت خطا، آیتم موقت را حذف کن
        setChecklists((prev) => {
          const existingChecklists = Array.isArray(prev[feedbackId]) ? prev[feedbackId] : [];
          return {
            ...prev,
            [feedbackId]: existingChecklists.filter((item: any) => item.id !== tempId),
          };
        });
        // متن را برگردان
        setNewItemTexts((prev) => ({ ...prev, [feedbackId]: text }));
        toast.error("خطا در اضافه کردن آیتم");
      }
    } catch (error) {
      console.error("Error adding checklist item:", error);
      // در صورت خطا، آیتم موقت را حذف کن
      setChecklists((prev) => {
        const existingChecklists = Array.isArray(prev[feedbackId]) ? prev[feedbackId] : [];
        return {
          ...prev,
          [feedbackId]: existingChecklists.filter((item: any) => item.id !== tempId),
        };
      });
      // متن را برگردان
      setNewItemTexts((prev) => ({ ...prev, [feedbackId]: text }));
      toast.error("خطا در اضافه کردن آیتم");
    }
  };

  const toggleChecklistItem = async (itemId: string, feedbackId: string, currentStatus: boolean) => {
    try {
      // اگر در حال تیک زدن است (از false به true)، باید order را به آخر ببریم
      let updateData: any = { isCompleted: !currentStatus };
      
      if (!currentStatus) {
        // در حال تیک زدن است - باید به انتهای لیست برود
        const currentItems = checklists[feedbackId] || [];
        const lastOrder = currentItems.length > 0 
          ? Math.max(...currentItems.map((item: any) => item.order || 0))
          : -1;
        updateData.order = lastOrder + 1;
      }

      const res = await fetch(`/api/feedback/checklist/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        const updatedItem = await res.json();
        // مرتب‌سازی مجدد: آیتم‌های تیک نخورده اول، سپس تیک خورده‌ها
        const updatedList = (checklists[feedbackId] || [])
          .map((item: any) => item.id === itemId ? updatedItem : item)
          .sort((a: any, b: any) => {
            // اول تیک نخورده‌ها، سپس تیک خورده‌ها
            if (a.isCompleted !== b.isCompleted) {
              return a.isCompleted ? 1 : -1;
            }
            // در هر گروه، بر اساس order مرتب می‌کنیم
            return (a.order || 0) - (b.order || 0);
          });
        
        setChecklists((prev) => ({
          ...prev,
          [feedbackId]: updatedList,
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
        setChecklists((prev) => {
          const existingChecklists = Array.isArray(prev[feedbackId]) ? prev[feedbackId] : [];
          return {
            ...prev,
            [feedbackId]: existingChecklists.filter((item: any) => item.id !== itemId),
          };
        });
      }
    } catch (error) {
      console.error("Error deleting checklist item:", error);
    }
  };

  const startEditingItem = (itemId: string, currentTitle: string) => {
    setEditingItemId(itemId);
    setEditingTexts((prev) => ({ ...prev, [itemId]: currentTitle }));
  };

  const cancelEditingItem = () => {
    setEditingItemId(null);
    setEditingTexts({});
  };

  const saveEditingItem = async (itemId: string, feedbackId: string) => {
    const newTitle = editingTexts[itemId]?.trim();
    if (!newTitle) {
      toast.info("عنوان آیتم نمی‌تواند خالی باشد");
      return;
    }

    // Optimistic update
    setChecklists((prev) => {
      const existingChecklists = Array.isArray(prev[feedbackId]) ? prev[feedbackId] : [];
      return {
        ...prev,
        [feedbackId]: existingChecklists.map((item: any) =>
          item.id === itemId ? { ...item, title: newTitle } : item
        ),
      };
    });
    setEditingItemId(null);
    setEditingTexts({});

    try {
      const res = await fetch(`/api/feedback/checklist/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });

      if (res.ok) {
        const updatedItem = await res.json();
        setChecklists((prev) => {
          const existingChecklists = Array.isArray(prev[feedbackId]) ? prev[feedbackId] : [];
          return {
            ...prev,
            [feedbackId]: existingChecklists.map((item: any) =>
              item.id === itemId ? updatedItem : item
            ),
          };
        });
      } else {
        // در صورت خطا، تغییرات را برگردان
        fetchChecklist(feedbackId);
        toast.error("خطا در ویرایش آیتم");
      }
    } catch (error) {
      console.error("Error updating checklist item:", error);
      // در صورت خطا، تغییرات را برگردان
      fetchChecklist(feedbackId);
      toast.error("خطا در ویرایش آیتم");
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
        const response = await res.json();
        const messagesData = response.data || response;
        setMessages((prev) => ({ ...prev, [feedbackId]: messagesData }));
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
        setMessages((prev) => {
          const current: any = prev[feedbackId];
          const existingMessages = Array.isArray(current)
            ? current
            : (Array.isArray(current?.data) ? current.data : []);
          return {
            ...prev,
            [feedbackId]: [...existingMessages, newMessage],
          };
        });
        setNewMessageTexts((prev) => ({ ...prev, [feedbackId]: "" }));
        setMessageImages((prev) => ({ ...prev, [feedbackId]: null }));
        setImagePreviews((prev) => {
          const newPreviews = { ...prev };
          delete newPreviews[feedbackId];
          return newPreviews;
        });
        // اسکرول به پایین
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

  // توابع مدیریت یادداشت
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

  const openNotesModal = async (feedbackId: string) => {
    setSelectedFeedbackForNotes(feedbackId);
    await fetchNotes(feedbackId);
    setNotesModalOpen(true);
  };

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
        setNotesSaved(true);
        setTimeout(() => setNotesSaved(false), 3000);
      } else {
        const error = await res.json();
        toast.error(error.error || "خطا در ذخیره یادداشت");
      }
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("خطا در ذخیره یادداشت");
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
    <MobileLayout role="MANAGER" title="تسک‌ها">
      {notesSaved && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-200 px-4 py-3 rounded-lg text-sm">
          یادداشت با موفقیت ذخیره شد
        </div>
      )}
      <div className="space-y-4">
        {/* Quick Filters and View Mode Toggle */}
        <div className="flex items-center justify-between gap-2">
          {/* Quick Filters - Chips */}
          <div className="flex items-center gap-2 flex-1 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setQuickFilter("all")}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                quickFilter === "all"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              همه
            </button>
            <button
              onClick={() => setQuickFilter("forwarded")}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                quickFilter === "forwarded"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              ارجاع شده
            </button>
            <button
              onClick={() => setQuickFilter("completed")}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                quickFilter === "completed"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              انجام شده
            </button>
          </div>

          {/* View Mode Toggle */}
          {!loading && sortedFeedbacks.length > 0 && (
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700 flex-shrink-0">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded transition ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                aria-label="نمایش لیستی"
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded transition ${
                  viewMode === "grid"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                aria-label="نمایش گریدی"
              >
                <Grid3x3 size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Sort Options */}
        {!loading && sortedFeedbacks.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                مرتب‌سازی:
              </label>
            </div>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
            >
              <option value="date-desc">جدیدترین</option>
              <option value="date-asc">قدیمی‌ترین</option>
              <option value="priority">اولویت</option>
              <option value="status">وضعیت</option>
            </select>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-600 dark:text-gray-400">در حال بارگذاری...</div>
          </div>
        ) : sortedFeedbacks.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <p className="text-gray-600 dark:text-gray-400">
              فیدبک دریافتی‌ای یافت نشد
            </p>
          </div>
        ) : viewMode === "list" ? (
          <div className="space-y-4">
            {sortedFeedbacks.map((feedback) => (
              <div
                key={feedback.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-800 dark:[color:var(--color-amber-100)] flex-1">
                    {feedback.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    {feedback.forwardedToId && (
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
                    )}
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

                {/* Forwarded Badge */}
                {feedback.forwardedToId && (
                  <div className="mb-3 flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded">
                    <Send size={12} />
                    <span>
                      ارجاع شده از ادمین
                      {feedback.forwardedAt && ` - ${getTimeAgo(feedback.forwardedAt)} پیش`}
                    </span>
                  </div>
                )}

                <div className="mb-3 flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      feedback.status
                    )}`}
                  >
                    {getStatusTextLocal(feedback.status)}
                  </span>
                  {feedback.department?.allowDirectFeedback && feedback.forwardedToId && (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      مستقیم
                    </span>
                  )}
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
                      {formatPersianDate(feedback.createdAt)} ({getTimeAgo(feedback.createdAt)})
                    </span>
                  </div>
                </div>

                <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3 mb-4">
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
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {sortedFeedbacks.map((feedback) => (
              <div
                key={feedback.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex flex-col"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-base font-semibold text-gray-800 dark:text-white flex-1 line-clamp-2">
                    {feedback.title}
                  </h3>
                  <div className="flex items-center gap-1">
                    {feedback.forwardedToId && (
                      <button
                        onClick={() => openChatModal(feedback.id)}
                        className={`p-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition relative ${
                          (feedback._count?.messages > 0 || messages[feedback.id]?.length > 0)
                            ? "text-green-700 dark:text-green-500"
                            : "text-green-600 dark:text-green-400"
                        }`}
                        title="چت با ادمین"
                      >
                        <MessageCircle 
                          size={16} 
                          fill={(feedback._count?.messages > 0 || messages[feedback.id]?.length > 0) ? "currentColor" : "none"}
                          strokeWidth={(feedback._count?.messages > 0 || messages[feedback.id]?.length > 0) ? 2 : 1.5}
                        />
                        {unreadCounts[feedback.id] > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                            {unreadCounts[feedback.id]}
                          </span>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => openChecklistModal(feedback.id)}
                      className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition relative"
                      title="چک لیست"
                    >
                      <CheckSquare size={16} />
                      {checklists[feedback.id] && checklists[feedback.id].length > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                          {checklists[feedback.id].filter((item: any) => item.isCompleted).length}/{checklists[feedback.id].length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => openNotesModal(feedback.id)}
                      className="p-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition relative"
                      title="یادداشت"
                    >
                      <FileText size={16} />
                      {notes[feedback.id] && notes[feedback.id].trim().length > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 bg-purple-600 text-white text-[10px] rounded-full w-2 h-2 flex items-center justify-center"></span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Forwarded Badge */}
                {feedback.forwardedToId && (
                  <div className="mb-2 flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded">
                    <Send size={10} />
                    <span>
                      ارجاع شده
                      {feedback.forwardedAt && ` - ${getTimeAgo(feedback.forwardedAt)} پیش`}
                    </span>
                  </div>
                )}

                <div className="mb-2 flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      feedback.status
                    )}`}
                  >
                    {getStatusTextLocal(feedback.status)}
                  </span>
                  {feedback.department?.allowDirectFeedback && feedback.forwardedToId && (
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      مستقیم
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400 mb-3 flex-grow">
                  <div className="flex items-center gap-1">
                    <Building2 size={12} />
                    <span className="truncate">{feedback.department.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User size={12} />
                    <span className="truncate">{feedback.user.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>
                      {formatPersianDate(feedback.createdAt)} ({getTimeAgo(feedback.createdAt)})
                    </span>
                  </div>
                </div>

                <p className="text-gray-700 dark:text-gray-300 text-xs line-clamp-2 mb-3 flex-grow">
                  {feedback.content}
                </p>

                {/* Status Actions */}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <select
                    value={feedback.status}
                    onChange={(e) => handleStatusChange(feedback.id, e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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

        {/* Checklist Modal */}
        {checklistModalOpen && selectedFeedbackForChecklist && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
              {/* Modal Header */}
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

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Existing Items */}
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
                        disabled={editingItemId === item.id}
                      >
                        {item.isCompleted && <CheckCircle size={16} />}
                      </button>
                      {editingItemId === item.id ? (
                        <input
                          type="text"
                          value={editingTexts[item.id] || ""}
                          onChange={(e) =>
                            setEditingTexts((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              saveEditingItem(item.id, selectedFeedbackForChecklist);
                            } else if (e.key === "Escape") {
                              cancelEditingItem();
                            }
                          }}
                          className="flex-1 px-2 py-1.5 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-blue-600 dark:text-white"
                          autoFocus
                        />
                      ) : (
                        <span
                          className={`flex-1 text-sm ${
                            item.isCompleted
                              ? "line-through text-gray-400 dark:text-gray-500"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {item.title}
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        {editingItemId === item.id ? (
                          <>
                            <button
                              onClick={() => saveEditingItem(item.id, selectedFeedbackForChecklist)}
                              className="flex-shrink-0 p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition"
                              title="ذخیره"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={cancelEditingItem}
                              className="flex-shrink-0 p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
                              title="لغو"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditingItem(item.id, item.title)}
                              className="flex-shrink-0 p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                              title="ویرایش"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => deleteChecklistItem(item.id, selectedFeedbackForChecklist)}
                              className="flex-shrink-0 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                              title="حذف"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                    چک لیستی وجود ندارد. آیتم جدید اضافه کنید.
                  </div>
                )}

                {/* Add New Item */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <input
                    ref={inputRef}
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
                    title="افزودن"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Modal */}
        {chatModalOpen && selectedFeedbackForChat && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md h-[80vh] flex flex-col">
              {/* Modal Header */}
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
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                {/* Image Preview */}
                {imagePreviews[selectedFeedbackForChat] && (
                  <div className="relative inline-block">
                    <Image
                      src={imagePreviews[selectedFeedbackForChat]}
                      alt="پیش‌نمایش"
                      width={200}
                      height={200}
                      className="rounded-lg max-w-[200px] max-h-[200px] object-cover"
                      unoptimized
                    />
                    <button
                      onClick={() => handleImageSelect(selectedFeedbackForChat, null)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
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

        {/* Completed Feedback Modal */}
        {completedModalOpen && selectedFeedbackForCompleted && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                    تکمیل فیدبک
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setCompletedModalOpen(false);
                    setSelectedFeedbackForCompleted(null);
                    setUserResponse("");
                    setAdminNotes("");
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    پیام برای کاربر (اختیاری)
                  </label>
                  <textarea
                    value={userResponse}
                    onChange={(e) => setUserResponse(e.target.value)}
                    placeholder="پیامی برای کاربری که فیدبک را ایجاد کرده است..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    این پیام به عنوان یک پیام در چت فیدبک اضافه می‌شود
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    یادداشت برای ادمین (اختیاری)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="یادداشتی برای ادمین..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    این یادداشت به عنوان یک پیام در چت فیدبک اضافه می‌شود
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setCompletedModalOpen(false);
                    setSelectedFeedbackForCompleted(null);
                    setUserResponse("");
                    setAdminNotes("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                >
                  انصراف
                </button>
                <button
                  onClick={handleCompleteFeedback}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                  <CheckCircle size={16} />
                  تکمیل فیدبک
                </button>
              </div>
            </div>
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
    </MobileLayout>
  );
}

