"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DynamicSidebar, DynamicHeader } from "@/components/layout";
import { useToast } from "@/contexts/ToastContext";
import {
  Link2,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  X,
  CheckCircle,
  XCircle,
} from "lucide-react";

type AdminLink = {
  id: string;
  title: string;
  url: string;
  description: string | null;
  icon: string | null;
  category: string | null;
  departmentId: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  departments?: { id: string; name: string } | null;
  users?: { id: string; name: string };
};

type Department = { id: string; name: string };

type FormState = {
  title: string;
  url: string;
  description: string;
  icon: string;
  category: string;
  departmentId: string;
  order: number;
  isActive: boolean;
};

const emptyForm: FormState = {
  title: "",
  url: "",
  description: "",
  icon: "",
  category: "",
  departmentId: "",
  order: 0,
  isActive: true,
};

export default function AdminLinksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();

  const [links, setLinks] = useState<AdminLink[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AdminLink | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user.role !== "ADMIN") {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated" && session?.user.role === "ADMIN") {
      void fetchAll();
    }
  }, [status, session]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [linksRes, deptsRes] = await Promise.all([
        fetch("/api/admin-links?showAll=true"),
        fetch("/api/departments"),
      ]);
      if (linksRes.ok) setLinks(await linksRes.json());
      if (deptsRes.ok) setDepartments(await deptsRes.json());
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (link: AdminLink) => {
    setEditing(link);
    setForm({
      title: link.title,
      url: link.url,
      description: link.description ?? "",
      icon: link.icon ?? "",
      category: link.category ?? "",
      departmentId: link.departmentId ?? "",
      order: link.order,
      isActive: link.isActive,
    });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.url.trim()) {
      toast.error("عنوان و آدرس الزامی است");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        url: form.url.trim(),
        description: form.description.trim() || null,
        icon: form.icon.trim() || null,
        category: form.category.trim() || null,
        departmentId: form.departmentId || null,
        order: form.order,
        isActive: form.isActive,
      };
      const res = editing
        ? await fetch(`/api/admin-links/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin-links", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (res.ok) {
        setShowModal(false);
        void fetchAll();
      } else {
        const data = await res.json();
        toast.error(data.error || "خطا در ذخیره");
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (link: AdminLink) => {
    if (!confirm(`حذف لینک «${link.title}»؟`)) return;
    const res = await fetch(`/api/admin-links/${link.id}`, { method: "DELETE" });
    if (res.ok) void fetchAll();
    else toast.error("خطا در حذف");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">در حال بارگذاری...</div>
      </div>
    );
  }

  if (session?.user.role !== "ADMIN") return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex" dir="rtl">
      <DynamicSidebar />
      <DynamicHeader />

      <main className="flex-1 lg:mr-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
              <Link2 className="text-blue-600" size={32} />
              مدیریت لینک‌های مفید
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              لینک‌هایی که کاربران در صفحه «لینک‌های مفید» می‌بینند
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-lg"
          >
            <Plus size={20} />
            <span>لینک جدید</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">
            در حال بارگذاری...
          </div>
        ) : links.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-12 text-center">
            <Link2 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              هنوز لینکی ثبت نشده
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              اولین لینک را با دکمه «لینک جدید» اضافه کنید
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <Th>عنوان</Th>
                  <Th>آدرس</Th>
                  <Th>دسته</Th>
                  <Th>بخش</Th>
                  <Th>ترتیب</Th>
                  <Th>وضعیت</Th>
                  <Th>عملیات</Th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {links.map((link) => (
                  <tr key={link.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {link.icon && (
                          <span className="text-lg" aria-hidden>
                            {link.icon}
                          </span>
                        )}
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {link.title}
                          </div>
                          {link.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {link.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline max-w-xs truncate"
                      >
                        <span className="truncate">{link.url}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {link.category || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {link.departments?.name || "همه"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {link.order}
                    </td>
                    <td className="px-6 py-4">
                      {link.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          فعال
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <XCircle className="w-4 h-4" />
                          غیرفعال
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(link)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                          aria-label="ویرایش"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => remove(link)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          aria-label="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editing ? "ویرایش لینک" : "لینک جدید"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto">
              <Field label="عنوان *">
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input"
                  placeholder="مثلاً: پورتال کارمندان"
                />
              </Field>
              <Field label="آدرس *">
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  className="input"
                  placeholder="https://..."
                  dir="ltr"
                />
              </Field>
              <Field label="توضیح (اختیاری)">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="input"
                  placeholder="توضیح کوتاه"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="ایموجی/آیکون (اختیاری)">
                  <input
                    type="text"
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    className="input"
                    placeholder="📘"
                  />
                </Field>
                <Field label="دسته‌بندی (اختیاری)">
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="input"
                    placeholder="منابع آموزشی"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="بخش">
                  <select
                    value={form.departmentId}
                    onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                    className="input"
                  >
                    <option value="">همه کاربران</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="ترتیب">
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                    className="input"
                  />
                </Field>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-5 w-5 accent-blue-600 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-800 dark:text-gray-200">
                  فعال (برای کاربران قابل مشاهده)
                </span>
              </label>
            </div>
            <div className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 border border-gray-400 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-500 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                انصراف
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "در حال ذخیره..." : editing ? "بروزرسانی" : "ایجاد"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          color: #111827;
          background: white;
          font-size: 0.875rem;
        }
        :global(.dark) .input {
          background: #374151;
          border-color: #4b5563;
          color: white;
        }
        .input:focus {
          outline: none;
          box-shadow: 0 0 0 2px #3b82f6;
          border-color: transparent;
        }
        .input::placeholder {
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
      {children}
    </th>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
