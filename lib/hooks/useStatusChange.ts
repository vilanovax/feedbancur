"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export interface UserStatus {
  id: string;
  name: string;
  color: string;
}

interface UseStatusChangeReturn {
  userStatuses: UserStatus[];
  currentStatus: UserStatus | null;
  statusMenuOpen: boolean;
  statusLoading: boolean;
  statusMenuRef: React.RefObject<HTMLDivElement>;
  setStatusMenuOpen: (open: boolean) => void;
  handleStatusChange: (status: UserStatus | null) => Promise<void>;
  fetchUserStatuses: () => Promise<void>;
  fetchCurrentStatus: () => Promise<void>;
}

export function useStatusChange(): UseStatusChangeReturn {
  const { data: session, update } = useSession();
  const [userStatuses, setUserStatuses] = useState<UserStatus[]>([]);
  const [currentStatus, setCurrentStatus] = useState<UserStatus | null>(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  const fetchUserStatuses = useCallback(async () => {
    try {
      const role = session?.user?.role || "EMPLOYEE";
      const res = await fetch(`/api/user-statuses?role=${role}&isActive=true`);
      if (res.ok) {
        const data = await res.json();
        setUserStatuses(data);
      }
    } catch (err) {
      console.error("Error fetching user statuses:", err);
    }
  }, [session?.user?.role]);

  const fetchCurrentStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/users/me");
      if (res.ok) {
        const data = await res.json();
        if (data.user?.status) {
          setCurrentStatus(data.user.status);
        } else if (data.status) {
          setCurrentStatus(data.status);
        }
      }
    } catch (err) {
      console.error("Error fetching current status:", err);
    }
  }, []);

  const handleStatusChange = useCallback(async (status: UserStatus | null) => {
    setStatusLoading(true);
    try {
      // دریافت اطلاعات فعلی کاربر برای حفظ فیلدهای دیگر
      const currentUserRes = await fetch("/api/users/me");
      if (!currentUserRes.ok) {
        throw new Error("خطا در دریافت اطلاعات کاربر");
      }
      const currentUserData = await currentUserRes.json();
      const currentUser = currentUserData.user;

      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: currentUser?.name || session?.user?.name,
          email: currentUser?.email || session?.user?.email || null,
          avatar: currentUser?.avatar || null,
          statusId: status?.id || null,
        }),
      });

      const responseData = await res.json();

      if (res.ok) {
        setCurrentStatus(status);
        setStatusMenuOpen(false);
        await update();
        toast.success(status ? `استتوس به "${status.name}" تغییر کرد` : "استتوس حذف شد");
      } else {
        toast.error(responseData.error || "خطا در تغییر استتوس");
      }
    } catch (err) {
      console.error("Error in handleStatusChange:", err);
      toast.error("خطا در تغییر استتوس");
    } finally {
      setStatusLoading(false);
    }
  }, [session?.user?.name, session?.user?.email, update]);

  // دریافت استتوس‌ها هنگام mount
  useEffect(() => {
    if (session?.user) {
      fetchUserStatuses();
      fetchCurrentStatus();
    }
  }, [session, fetchUserStatuses, fetchCurrentStatus]);

  // بستن منوی استتوس با کلیک بیرون
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setStatusMenuOpen(false);
      }
    };

    if (statusMenuOpen) {
      const timer = setTimeout(() => {
        document.addEventListener("click", handleClickOutside);
      }, 100);
      return () => {
        clearTimeout(timer);
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [statusMenuOpen]);

  return {
    userStatuses,
    currentStatus,
    statusMenuOpen,
    statusLoading,
    statusMenuRef,
    setStatusMenuOpen,
    handleStatusChange,
    fetchUserStatuses,
    fetchCurrentStatus,
  };
}
