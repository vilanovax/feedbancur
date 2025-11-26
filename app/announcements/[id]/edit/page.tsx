"use client";

import { useState, useEffect } from "react";
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
  const id = params?.id as string;

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
  }, [status, session, router, id]);

  const fetchAnnouncement = async () => {
    try {
      const res = await fetch(`/api/announcements/${id}`);
      if (res.ok) {
        const data = await res.json();

        // Check if user has permission to edit
        const canEdit =
          session?.user.role === "ADMIN" ||
          data.createdById === session?.user.id;

        if (!canEdit) {
          setError("شما دسترسی به ویرایش این اعلان را ندارید");
          setTimeout(() => router.push("/announcements/manage"), 2000);
          return;
        }

        setAnnouncement(data);
      } else {
        const error = await res.json();
        setError(error.error || "خطا در دریافت اطلاعات اعلان");
        setTimeout(() => router.push("/announcements/manage"), 2000);
      }
    } catch (error) {
      console.error("Error fetching announcement:", error);
      setError("خطایی رخ داد");
      setTimeout(() => router.push("/announcements/manage"), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    const res = await fetch(`/api/announcements/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
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
