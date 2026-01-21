# راهنمای یکپارچه‌سازی کامپوننت‌های جدید Feedback

این راهنما نحوه اضافه کردن کامپوننت‌های جدید به صفحه `/app/feedback/page.tsx` را توضیح می‌دهد.

## 1️⃣ Import کامپوننت‌های جدید

در بالای فایل `app/feedback/page.tsx`، این import ها را اضافه کنید:

```typescript
import ViewToggle from "@/components/feedback/ViewToggle";
import AdvancedFilters from "@/components/feedback/AdvancedFilters";
import QuickFilterChips from "@/components/feedback/QuickFilterChips";
import FeedbackTableView from "@/components/feedback/FeedbackTableView";
import BulkActionsBar from "@/components/feedback/BulkActionsBar";
import StatusBadge from "@/components/feedback/StatusBadge";
import PriorityBadge from "@/components/feedback/PriorityBadge";
```

## 2️⃣ اضافه کردن State ها

در کامپوننت `FeedbacksPageContent`، این state ها را اضافه کنید:

```typescript
// Bulk Selection
const [selectedFeedbacks, setSelectedFeedbacks] = useState<string[]>([]);

// Search Query
const [searchQuery, setSearchQuery] = useState("");

// تغییر viewMode از "grid" | "list" به "grid" | "list" | "table"
const [viewMode, setViewMode] = useState<"grid" | "list" | "table">(() => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("feedback_view_mode");
    if (saved === "table" || saved === "list" || saved === "grid") {
      return saved;
    }
  }
  return "grid";
});
```

## 3️⃣ Bulk Selection Handlers

```typescript
const handleSelectFeedback = (id: string) => {
  setSelectedFeedbacks((prev) =>
    prev.includes(id) ? prev.filter((fId) => fId !== id) : [...prev, id]
  );
};

const handleSelectAll = () => {
  if (selectedFeedbacks.length === displayedFeedbacks.length) {
    setSelectedFeedbacks([]);
  } else {
    setSelectedFeedbacks(displayedFeedbacks.map((f) => f.id));
  }
};

const handleClearSelection = () => {
  setSelectedFeedbacks([]);
};
```

## 4️⃣ Search Filter

در قسمت فیلتر کردن feedbacks، اضافه کنید:

```typescript
// در قسمت filteredFeedbacks
if (searchQuery) {
  const query = searchQuery.toLowerCase();
  filtered = filtered.filter((feedback) => {
    const matchesTitle = feedback.title?.toLowerCase().includes(query);
    const matchesDescription = feedback.description?.toLowerCase().includes(query);
    const matchesUser = feedback.users?.name?.toLowerCase().includes(query);
    return matchesTitle || matchesDescription || matchesUser;
  });
}
```

## 5️⃣ جایگزینی Header

قبلی:
```tsx
<div className="flex items-center justify-between mb-6">
  <h1>فیدبک‌ها</h1>
  <Link href="/feedback/new">+ فیدبک جدید</Link>
</div>
```

جدید:
```tsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
  <div>
    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
      فیدبک‌ها
    </h1>
    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
      مدیریت و پیگیری فیدبک‌های دریافتی
    </p>
  </div>

  <div className="flex items-center gap-3">
    <button onClick={fetchFeedbacks} disabled={loading}>
      <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
    </button>

    <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />

    <Link href="/feedback/new" className="btn-primary">
      <Plus size={18} />
      <span>فیدبک جدید</span>
    </Link>
  </div>
</div>
```

## 6️⃣ اضافه کردن Quick Filter Chips

بعد از Header:

```tsx
<QuickFilterChips
  activeFilter={quickFilter}
  onFilterChange={setQuickFilter}
  counts={{
    all: allFeedbacks.length,
    pending: allFeedbacks.filter(f => f.status === "PENDING").length,
    completed: allFeedbacks.filter(f => f.status === "COMPLETED").length,
    deferred: allFeedbacks.filter(f => f.status === "DEFERRED").length,
    archived: allFeedbacks.filter(f => f.status === "ARCHIVED").length,
  }}
/>
```

## 7️⃣ جایگزینی فیلترهای قدیمی

قبلی:
```tsx
<select value={selectedDepartment}>...</select>
<select value={selectedStatus}>...</select>
```

جدید:
```tsx
<AdvancedFilters
  departments={departments}
  selectedDepartment={selectedDepartment}
  onDepartmentChange={setSelectedDepartment}
  selectedStatus={selectedStatus}
  onStatusChange={setSelectedStatus}
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
  onClearFilters={() => {
    setSelectedDepartment("");
    setSelectedStatus("");
    setSearchQuery("");
  }}
/>
```

## 8️⃣ اضافه کردن Table View

در قسمت نمایش feedbacks:

```tsx
{viewMode === "table" ? (
  <FeedbackTableView
    feedbacks={displayedFeedbacks}
    selectedFeedbacks={selectedFeedbacks}
    onSelectFeedback={handleSelectFeedback}
    onSelectAll={handleSelectAll}
    onOpenActions={(feedback) => {
      setSelectedFeedback(feedback);
      // باز کردن منوی عملیات
    }}
  />
) : viewMode === "grid" ? (
  // Grid View فعلی
) : (
  // List View فعلی
)}
```

## 9️⃣ اضافه کردن Bulk Actions Bar

در انتهای return:

```tsx
<BulkActionsBar
  selectedCount={selectedFeedbacks.length}
  onClearSelection={handleClearSelection}
  onForward={handleBulkForward}
  onArchive={handleBulkArchive}
  onDelete={handleBulkDelete}
  onMarkComplete={handleBulkMarkComplete}
  onMarkDeferred={handleBulkMarkDeferred}
/>
```

## 🔟 پیاده‌سازی Bulk Actions

```typescript
const handleBulkForward = async () => {
  try {
    const response = await fetch("/api/feedbacks/bulk-forward", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        feedbackIds: selectedFeedbacks,
        managerId: selectedManager,
      }),
    });

    if (response.ok) {
      toast.success(`${selectedFeedbacks.length} فیدبک ارجاع شد`);
      setSelectedFeedbacks([]);
      fetchFeedbacks();
    }
  } catch (error) {
    toast.error("خطا در ارجاع دسته‌جمعی");
  }
};

const handleBulkArchive = async () => {
  try {
    const response = await fetch("/api/feedbacks/bulk-archive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedbackIds: selectedFeedbacks }),
    });

    if (response.ok) {
      toast.success(`${selectedFeedbacks.length} فیدبک آرشیو شد`);
      setSelectedFeedbacks([]);
      fetchFeedbacks();
    }
  } catch (error) {
    toast.error("خطا در آرشیو دسته‌جمعی");
  }
};

const handleBulkDelete = async () => {
  if (!confirm(`آیا از حذف ${selectedFeedbacks.length} فیدبک اطمینان دارید؟`)) {
    return;
  }

  try {
    const response = await fetch("/api/feedbacks/bulk-delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedbackIds: selectedFeedbacks }),
    });

    if (response.ok) {
      toast.success(`${selectedFeedbacks.length} فیدبک حذف شد`);
      setSelectedFeedbacks([]);
      fetchFeedbacks();
    }
  } catch (error) {
    toast.error("خطا در حذف دسته‌جمعی");
  }
};
```

## 1️⃣1️⃣ استفاده از Status و Priority Badges

در Grid/List View، Badge ها را اضافه کنید:

```tsx
// به جای:
<span className={getStatusColor(feedback.status)}>
  {getStatusTextLocal(feedback.status)}
</span>

// استفاده کنید:
<StatusBadge status={feedback.status} size="sm" />
<PriorityBadge priority={feedback.priority} size="sm" />
```

## 1️⃣2️⃣ Mobile Responsive

کامپوننت‌ها به صورت پیش‌فرض responsive هستند، اما برای بهبود:

```tsx
// در موبایل، ViewToggle را مخفی کنید یا ساده‌تر کنید
<div className="hidden sm:flex">
  <ViewToggle ... />
</div>

// Quick Filter Chips با scroll افقی
<div className="overflow-x-auto">
  <QuickFilterChips ... />
</div>

// Table View با scroll افقی
<div className="overflow-x-auto">
  <FeedbackTableView ... />
</div>
```

---

## ✅ چک‌لیست نهایی

- [ ] Import کامپوننت‌های جدید
- [ ] اضافه کردن state های bulk selection
- [ ] اضافه کردن search query state
- [ ] تغییر viewMode type به "grid" | "list" | "table"
- [ ] پیاده‌سازی handlers
- [ ] جایگزینی Header
- [ ] اضافه کردن QuickFilterChips
- [ ] جایگزینی AdvancedFilters
- [ ] اضافه کردن Table View
- [ ] اضافه کردن BulkActionsBar
- [ ] پیاده‌سازی Bulk Actions (API calls)
- [ ] جایگزینی Status/Priority با Badge ها
- [ ] تست Mobile Responsive

---

## 🎨 نتیجه نهایی

بعد از اعمال تمام تغییرات، صفحه feedback شامل موارد زیر خواهد بود:

✅ **3 حالت نمایش:** Grid, List, Table
✅ **فیلترهای پیشنفته:** جستجو، بخش، وضعیت
✅ **Quick Filter Chips:** با counter
✅ **Bulk Selection:** انتخاب چند فیدبک
✅ **Bulk Actions:** ارجاع، آرشیو، حذف، تکمیل، موکول
✅ **Status & Priority Badges:** رنگی و با آیکون
✅ **Mobile Responsive:** کاملاً واکنش‌گرا
✅ **Dark Mode:** پشتیبانی کامل
