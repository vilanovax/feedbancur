"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MobileLayout from "@/components/MobileLayout";
import {
  FileText,
  CheckSquare,
  Plus,
  Pin,
  PinOff,
  Trash2,
  X,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { getTimeAgo } from "@/lib/date-utils";

type Tab = "notes" | "checklists";

type Note = {
  id: string;
  title: string | null;
  content: string;
  pinned: boolean;
  updatedAt: string;
};

type ChecklistItem = {
  id: string;
  text: string;
  isDone: boolean;
  order: number;
};

type Checklist = {
  id: string;
  title: string;
  updatedAt: string;
  items: ChecklistItem[];
};

export default function MobileNotesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();

  const [tab, setTab] = useState<Tab>("notes");
  const [notes, setNotes] = useState<Note[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);

  // edit/create modals
  const [editingNote, setEditingNote] = useState<Note | "new" | null>(null);
  const [editingList, setEditingList] = useState<Checklist | "new" | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) void refresh();
  }, [session]);

  const refresh = async () => {
    setLoading(true);
    try {
      const [n, c] = await Promise.all([
        fetch("/api/user-notes").then((r) => (r.ok ? r.json() : [])),
        fetch("/api/user-checklists").then((r) => (r.ok ? r.json() : [])),
      ]);
      setNotes(n);
      setChecklists(c);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">در حال بارگذاری...</div>
      </div>
    );
  }

  const role = session?.user?.role === "MANAGER" ? "MANAGER" : "EMPLOYEE";

  return (
    <MobileLayout role={role} title="یادداشت‌ها و چک‌لیست">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="grid grid-cols-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-1">
          <button
            onClick={() => setTab("notes")}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition ${
              tab === "notes"
                ? "bg-blue-600 text-white"
                : "text-gray-700 dark:text-gray-300"
            }`}
          >
            <FileText className="w-4 h-4" />
            یادداشت‌ها
            <span
              className={`text-xs rounded-full px-2 py-0.5 ${
                tab === "notes"
                  ? "bg-white/20"
                  : "bg-gray-100 dark:bg-gray-700"
              }`}
            >
              {notes.length}
            </span>
          </button>
          <button
            onClick={() => setTab("checklists")}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition ${
              tab === "checklists"
                ? "bg-blue-600 text-white"
                : "text-gray-700 dark:text-gray-300"
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            چک‌لیست‌ها
            <span
              className={`text-xs rounded-full px-2 py-0.5 ${
                tab === "checklists"
                  ? "bg-white/20"
                  : "bg-gray-100 dark:bg-gray-700"
              }`}
            >
              {checklists.length}
            </span>
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">
            در حال بارگذاری...
          </div>
        ) : tab === "notes" ? (
          <NotesList
            notes={notes}
            onEdit={(n) => setEditingNote(n)}
            onRefresh={refresh}
            toast={toast}
          />
        ) : (
          <ChecklistsList
            checklists={checklists}
            onEdit={(c) => setEditingList(c)}
            onRefresh={refresh}
            toast={toast}
          />
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() =>
          tab === "notes" ? setEditingNote("new") : setEditingList("new")
        }
        className="fixed bottom-20 left-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 active:scale-95 z-40"
        aria-label={tab === "notes" ? "یادداشت جدید" : "چک‌لیست جدید"}
      >
        <Plus size={28} />
      </button>

      {/* Note editor modal */}
      {editingNote && (
        <NoteEditor
          note={editingNote === "new" ? null : editingNote}
          onClose={() => setEditingNote(null)}
          onSaved={() => {
            setEditingNote(null);
            void refresh();
          }}
          toast={toast}
        />
      )}

      {/* Checklist editor modal */}
      {editingList && (
        <ChecklistEditor
          checklist={editingList === "new" ? null : editingList}
          onClose={() => setEditingList(null)}
          onSaved={() => {
            setEditingList(null);
            void refresh();
          }}
          toast={toast}
        />
      )}
    </MobileLayout>
  );
}

// -------- Notes list --------

function NotesList({
  notes,
  onEdit,
  onRefresh,
  toast,
}: {
  notes: Note[];
  onEdit: (n: Note) => void;
  onRefresh: () => void;
  toast: ReturnType<typeof useToast>;
}) {
  if (notes.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />}
        title="هنوز یادداشتی ندارید"
        description="اولین یادداشت خود را با دکمه + ایجاد کنید"
      />
    );
  }

  const togglePin = async (n: Note) => {
    const res = await fetch(`/api/user-notes/${n.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !n.pinned }),
    });
    if (res.ok) onRefresh();
    else toast.error("خطا در تغییر وضعیت");
  };

  const remove = async (n: Note) => {
    if (!confirm("حذف این یادداشت؟")) return;
    const res = await fetch(`/api/user-notes/${n.id}`, { method: "DELETE" });
    if (res.ok) onRefresh();
    else toast.error("خطا در حذف");
  };

  return (
    <div className="space-y-3">
      {notes.map((n) => (
        <div
          key={n.id}
          className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 ${
            n.pinned ? "border-r-4 border-blue-500" : ""
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <button
              onClick={() => onEdit(n)}
              className="flex-1 text-right min-w-0"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {n.title || "بدون عنوان"}
              </h3>
            </button>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => togglePin(n)}
                className={`p-1.5 rounded transition ${
                  n.pinned
                    ? "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    : "text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                }`}
                aria-label={n.pinned ? "حذف سنجاق" : "سنجاق"}
              >
                {n.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
              </button>
              <button
                onClick={() => remove(n)}
                className="p-1.5 rounded text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 transition"
                aria-label="حذف"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <button
            onClick={() => onEdit(n)}
            className="text-right w-full text-sm text-gray-700 dark:text-gray-300 line-clamp-3 whitespace-pre-wrap mb-2"
          >
            {n.content}
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-left">
            {getTimeAgo(n.updatedAt)}
          </p>
        </div>
      ))}
    </div>
  );
}

// -------- Checklists list --------

function ChecklistsList({
  checklists,
  onEdit,
  onRefresh,
  toast,
}: {
  checklists: Checklist[];
  onEdit: (c: Checklist) => void;
  onRefresh: () => void;
  toast: ReturnType<typeof useToast>;
}) {
  // Track checked state optimistically so toggles don't require a full refetch
  // (refetching preserves order now that we sort by createdAt, but local mutation avoids flicker).
  const [localItems, setLocalItems] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem("mobileChecklistsCollapsed");
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "mobileChecklistsCollapsed",
        JSON.stringify(Array.from(collapsed))
      );
    }
  }, [collapsed]);

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (checklists.length === 0) {
    return (
      <EmptyState
        icon={<CheckSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />}
        title="هنوز چک‌لیستی ندارید"
        description="یک چک‌لیست جدید با دکمه + بسازید"
      />
    );
  }

  const getItemDone = (item: ChecklistItem) =>
    localItems[item.id] !== undefined ? localItems[item.id] : item.isDone;

  const remove = async (c: Checklist) => {
    if (!confirm(`حذف چک‌لیست «${c.title}»؟`)) return;
    const res = await fetch(`/api/user-checklists/${c.id}`, { method: "DELETE" });
    if (res.ok) onRefresh();
    else toast.error("خطا در حذف");
  };

  const toggleItem = async (item: ChecklistItem) => {
    const newVal = !getItemDone(item);
    setLocalItems((prev) => ({ ...prev, [item.id]: newVal }));
    const res = await fetch(`/api/user-checklists/items/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDone: newVal }),
    });
    if (!res.ok) {
      // revert on failure
      setLocalItems((prev) => ({ ...prev, [item.id]: !newVal }));
      toast.error("خطا در تغییر وضعیت");
    }
  };

  return (
    <div className="space-y-3">
      {checklists.map((c) => {
        const done = c.items.filter((i) => getItemDone(i)).length;
        const total = c.items.length;
        const pct = total === 0 ? 0 : Math.round((done / total) * 100);
        const isCollapsed = collapsed.has(c.id);
        return (
          <div
            key={c.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <button
                onClick={() => toggleCollapse(c.id)}
                className="flex-1 text-right min-w-0"
                aria-expanded={!isCollapsed}
              >
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {c.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {done} از {total} تکمیل شده
                </p>
              </button>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => toggleCollapse(c.id)}
                  className="p-1.5 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                  aria-label={isCollapsed ? "باز کردن" : "جمع کردن"}
                >
                  {isCollapsed ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => remove(c)}
                  className="p-1.5 text-gray-500 hover:text-red-600"
                  aria-label="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isCollapsed && (
              <>
                {done > 0 && (
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mt-3 mb-3">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}

                {total > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700 -mx-1 mt-2">
                    {c.items.slice(0, 5).map((item) => {
                      const isDone = getItemDone(item);
                      return (
                        <button
                          key={item.id}
                          onClick={() => toggleItem(item)}
                          className="flex items-center gap-2.5 w-full px-1 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded transition"
                        >
                          <span
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              isDone
                                ? "bg-blue-600 border-blue-600"
                                : "border-gray-400 dark:border-gray-500"
                            }`}
                          >
                            {isDone && <Check className="w-3 h-3 text-white" />}
                          </span>
                          <span
                            className={`flex-1 text-right text-sm truncate ${
                              isDone
                                ? "line-through text-gray-400 dark:text-gray-500"
                                : "text-gray-800 dark:text-gray-200"
                            }`}
                          >
                            {item.text}
                          </span>
                        </button>
                      );
                    })}
                    {c.items.length > 5 && (
                      <button
                        onClick={() => onEdit(c)}
                        className="block w-full text-right px-1 py-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        +{c.items.length - 5} آیتم دیگر
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => onEdit(c)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2"
                  >
                    افزودن آیتم
                  </button>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

// -------- Empty state --------

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm px-6 py-10 text-center">
      <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
        {title}
      </h4>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}

// -------- Note editor modal --------

function NoteEditor({
  note,
  onClose,
  onSaved,
  toast,
}: {
  note: Note | null;
  onClose: () => void;
  onSaved: () => void;
  toast: ReturnType<typeof useToast>;
}) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!content.trim()) {
      toast.error("محتوا نمی‌تواند خالی باشد");
      return;
    }
    setSaving(true);
    try {
      const res = note
        ? await fetch(`/api/user-notes/${note.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: title.trim() || null, content }),
          })
        : await fetch("/api/user-notes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: title.trim() || null, content }),
          });
      if (res.ok) onSaved();
      else {
        const data = await res.json();
        toast.error(data.error || "خطا در ذخیره");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-800 w-full sm:max-w-md rounded-t-2xl sm:rounded-xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {note ? "ویرایش یادداشت" : "یادداشت جدید"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-3 overflow-y-auto">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان (اختیاری)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            placeholder="متن یادداشت..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400"
          />
        </div>
        <div className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-400 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-500 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            انصراف
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "در حال ذخیره..." : "ذخیره"}
          </button>
        </div>
      </div>
    </div>
  );
}

// -------- Checklist editor modal --------

function ChecklistEditor({
  checklist,
  onClose,
  onSaved,
  toast,
}: {
  checklist: Checklist | null;
  onClose: () => void;
  onSaved: () => void;
  toast: ReturnType<typeof useToast>;
}) {
  const [title, setTitle] = useState(checklist?.title ?? "");
  const [items, setItems] = useState<ChecklistItem[]>(checklist?.items ?? []);
  const [newItemText, setNewItemText] = useState("");
  const [saving, setSaving] = useState(false);
  const [listId, setListId] = useState<string | null>(checklist?.id ?? null);

  const ensureList = async (): Promise<string | null> => {
    if (listId) return listId;
    if (!title.trim()) {
      toast.error("عنوان چک‌لیست الزامی است");
      return null;
    }
    const res = await fetch("/api/user-checklists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "خطا در ایجاد چک‌لیست");
      return null;
    }
    const created: Checklist = await res.json();
    setListId(created.id);
    return created.id;
  };

  const addItem = async () => {
    const text = newItemText.trim();
    if (!text) return;
    const id = await ensureList();
    if (!id) return;
    const res = await fetch(`/api/user-checklists/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      const item: ChecklistItem = await res.json();
      setItems((prev) => [...prev, item]);
      setNewItemText("");
    } else {
      toast.error("خطا در افزودن آیتم");
    }
  };

  const toggleItem = async (item: ChecklistItem) => {
    const res = await fetch(`/api/user-checklists/items/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDone: !item.isDone }),
    });
    if (res.ok) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isDone: !i.isDone } : i))
      );
    }
  };

  const removeItem = async (item: ChecklistItem) => {
    const res = await fetch(`/api/user-checklists/items/${item.id}`, {
      method: "DELETE",
    });
    if (res.ok) setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  const saveTitle = async () => {
    if (!listId) {
      const id = await ensureList();
      if (!id) return;
      onSaved();
      return;
    }
    if (!title.trim()) {
      toast.error("عنوان الزامی است");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/user-checklists/${listId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      if (res.ok) onSaved();
      else toast.error("خطا در ذخیره");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-800 w-full sm:max-w-md rounded-t-2xl sm:rounded-xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {checklist ? "ویرایش چک‌لیست" : "چک‌لیست جدید"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان چک‌لیست"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400"
          />

          {items.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                >
                  <button
                    onClick={() => toggleItem(item)}
                    className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition ${
                      item.isDone
                        ? "bg-blue-600 border-blue-600"
                        : "border-gray-400 dark:border-gray-500 hover:border-blue-500"
                    }`}
                    aria-label={item.isDone ? "برگرداندن" : "انجام شد"}
                  >
                    {item.isDone && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                  <span
                    className={`flex-1 text-sm ${
                      item.isDone
                        ? "line-through text-gray-400 dark:text-gray-500"
                        : "text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {item.text}
                  </span>
                  <button
                    onClick={() => removeItem(item)}
                    className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 rounded transition shrink-0"
                    aria-label="حذف آیتم"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
              هنوز آیتمی اضافه نشده
            </p>
          )}

          {/* Composer: integrated input with inline + button */}
          <div className="flex items-stretch gap-0 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void addItem();
                }
              }}
              placeholder="آیتم جدید..."
              className="flex-1 px-3 py-2 bg-transparent text-gray-900 placeholder:text-gray-500 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 text-sm focus:outline-none"
            />
            <button
              onClick={() => void addItem()}
              disabled={!newItemText.trim()}
              className="px-3 bg-blue-600 text-white flex items-center justify-center disabled:bg-gray-300 dark:disabled:bg-gray-600 transition"
              aria-label="افزودن آیتم"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-400 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-500 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            بستن
          </button>
          <button
            onClick={saveTitle}
            disabled={saving}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "در حال ذخیره..." : "ذخیره"}
          </button>
        </div>
      </div>
    </div>
  );
}
