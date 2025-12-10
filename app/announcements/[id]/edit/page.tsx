"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Bell } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";
import AnnouncementForm from "@/components/AnnouncementForm";

export default function EditAnnouncementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const announcementId = params?.id as string;
  const [announcement, setAnnouncement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      if (session.user.role === "EMPLOYEE") {
        router.push("/announcements");
      } else {
        fetchAnnouncement();
      }
    }
  }, [status, session, router, announcementId]);

  const fetchAnnouncement = async () => {
    try {
      const res = await fetch(`/api/announcements/${announcementId}`);
      if (res.ok) {
        const data = await res.json();
        setAnnouncement(data);
      } else if (res.status === 404) {
        setError("اعلان یافت نشد");
      } else {
        setError("خطا در دریافت اعلان");
      }
    } catch (error) {
      console.error("Error fetching announcement:", error);
      setError("خطا در دریافت اعلان");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("content", data.content);
    formData.append("priority", data.priority);
    // فقط departmentId را اضافه کن اگر مقدار داشت
    if (data.departmentId) {
      formData.append("departmentId", data.departmentId);
    }
    formData.append("isActive", data.isActive ? "true" : "false");
    if (data.scheduledAt) {
      formData.append("scheduledAt", data.scheduledAt);
    }

    // اضافه کردن فایل‌های موجود
    if (data.existingAttachments) {
      formData.append("existingAttachments", JSON.stringify(data.existingAttachments));
    }

    // اضافه کردن فایل‌های جدید
    if (data.files && data.files.length > 0) {
      formData.append("fileCount", data.files.length.toString());
      data.files.forEach((file: File, index: number) => {
        formData.append(`attachment_${index}`, file);
      });
    } else {
      formData.append("fileCount", "0");
    }

    const res = await fetch(`/api/announcements/${announcementId}`, {
      method: "PATCH",
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "خطا در بروزرسانی اعلان");
    }

    router.push("/announcements/manage");
  };

  const handleCancel = () => {
    router.push("/announcements/manage");
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">در حال بارگذاری...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex" dir="rtl">
        <Sidebar />
        <AppHeader />
        <main className="flex-1 lg:mr-64 mt-16 p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-6 py-4 rounded-lg">
              {error}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!announcement) {
    return null;
  }

  // Prepare initial data for the form
  const initialData = {
    title: announcement.title,
    content: announcement.content,
    priority: announcement.priority,
    departmentId: announcement.departmentId,
    isActive: announcement.isActive,
    scheduledAt: announcement.scheduledAt
      ? new Date(announcement.scheduledAt).toISOString().slice(0, 16)
      : null,
    attachments: announcement.attachments || [],
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex" dir="rtl">
      <Sidebar />
      <AppHeader />
      <main className="flex-1 lg:mr-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8 flex items-center gap-3">
              <Bell size={32} />
              ویرایش اعلان
            </h1>

            <AnnouncementForm
              mode="edit"
              initialData={initialData}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

