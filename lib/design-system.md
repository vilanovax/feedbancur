# سیستم طراحی (Design System)

این فایل راهنمای استفاده از سیستم طراحی و Design Tokens در پروژه است.

## 📁 ساختار فایل‌ها

- `lib/design-tokens.ts` - تعریف تمام توکن‌های طراحی (رنگ‌ها، فاصله‌ها، تایپوگرافی)
- `tailwind.config.ts` - پیکربندی Tailwind با استفاده از Design Tokens
- `app/globals.css` - متغیرهای CSS برای استفاده مستقیم

## 🎨 استفاده از رنگ‌ها

### با Tailwind Classes

```tsx
// Primary
<button className="bg-primary-600 hover:bg-primary-700 text-white">
  ذخیره
</button>

// Success
<div className="bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200">
  عملیات موفق بود
</div>

// Error
<p className="text-error-600 dark:text-error-400">
  خطایی رخ داد
</p>
```

### با Helper Functions

```tsx
import { getColor } from '@/lib/design-tokens';

const primaryColor = getColor('primary', 500); // '#3b82f6'
const errorColor = getColor('error', 600);     // '#dc2626'
```

### با CSS Variables

```tsx
<div style={{ backgroundColor: 'var(--primary-500)' }}>
  محتوا
</div>
```

## 🎭 استفاده از Badge Variants

```tsx
import { badgeVariants } from '@/lib/design-tokens';

// قبل (hardcoded):
<Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
  MBTI
</Badge>

// بعد (با design tokens):
<Badge className={badgeVariants.purple}>
  MBTI
</Badge>

// سایر variants:
<Badge className={badgeVariants.primary}>Primary</Badge>
<Badge className={badgeVariants.success}>موفق</Badge>
<Badge className={badgeVariants.warning}>هشدار</Badge>
<Badge className={badgeVariants.error}>خطا</Badge>
```

## 🔘 استفاده از Button Variants

```tsx
import { buttonVariants } from '@/lib/design-tokens';

// قبل:
<button className="bg-blue-600 hover:bg-blue-700 text-white">
  ذخیره
</button>

// بعد:
<button className={`px-4 py-2 rounded-lg ${buttonVariants.primary}`}>
  ذخیره
</button>

// سایر variants:
<button className={buttonVariants.secondary}>ثانویه</button>
<button className={buttonVariants.outline}>خطی</button>
<button className={buttonVariants.ghost}>شبح</button>
```

## 📝 استفاده از Input Variants

```tsx
import { inputVariants } from '@/lib/design-tokens';

<input
  type="text"
  className={`px-4 py-2 ${inputVariants.default}`}
  placeholder="نام کاربری"
/>

// Input با خطا:
<input
  type="email"
  className={`px-4 py-2 ${inputVariants.error}`}
  placeholder="ایمیل"
/>
```

## 🃏 استفاده از Card Variants

```tsx
import { cardVariants } from '@/lib/design-tokens';

<div className={`p-6 ${cardVariants.default}`}>
  محتوای کارت
</div>

<div className={cardVariants.elevated}>
  کارت با سایه بزرگ
</div>
```

## 📏 فاصله‌ها (Spacing)

```tsx
// Tailwind classes با design tokens:
<div className="p-4 m-6 gap-8">  // 16px, 24px, 32px
  محتوا
</div>

// با helper function:
import { getSpacing } from '@/lib/design-tokens';

const spacing = getSpacing(4); // '1rem' (16px)
```

## 🔤 تایپوگرافی

```tsx
// Font sizes:
<h1 className="text-4xl font-bold">عنوان بزرگ</h1>
<h2 className="text-3xl font-semibold">عنوان متوسط</h2>
<p className="text-base">متن عادی</p>
<small className="text-sm">متن کوچک</small>

// Font weights:
<p className="font-light">نازک</p>
<p className="font-normal">عادی</p>
<p className="font-medium">متوسط</p>
<p className="font-semibold">نیمه‌سنگین</p>
<p className="font-bold">سنگین</p>

// Line heights:
<p className="leading-tight">ارتفاع خط فشرده</p>
<p className="leading-normal">ارتفاع خط عادی</p>
<p className="leading-relaxed">ارتفاع خط گشاد</p>
```

## 🎯 سایه‌ها (Shadows)

```tsx
<div className="shadow-sm">سایه کوچک</div>
<div className="shadow-md">سایه متوسط</div>
<div className="shadow-lg">سایه بزرگ</div>
<div className="shadow-xl">سایه خیلی بزرگ</div>

// با helper function:
import { getShadow } from '@/lib/design-tokens';

const shadow = getShadow('md');
```

## 🔵 Border Radius

```tsx
<div className="rounded-sm">گوشه‌های کوچک</div>
<div className="rounded-md">گوشه‌های متوسط</div>
<div className="rounded-lg">گوشه‌های بزرگ</div>
<div className="rounded-full">کاملاً گرد</div>
```

## ⚡ انیمیشن‌ها

```tsx
// استفاده از انیمیشن‌های از پیش تعریف شده:
<div className="animate-fadeIn">محو شدن</div>
<div className="animate-slideUp">اسلاید از پایین</div>
<div className="animate-scaleIn">بزرگ شدن</div>

// Transition durations:
<div className="transition-fast">150ms</div>
<div className="transition-base">200ms</div>
<div className="transition-slow">300ms</div>
```

## 📱 Breakpoints

```tsx
// Responsive design:
<div className="
  text-sm sm:text-base md:text-lg lg:text-xl
  p-4 sm:p-6 md:p-8 lg:p-10
">
  محتوای واکنش‌گرا
</div>
```

## 🔢 Z-Index

```tsx
import { designTokens } from '@/lib/design-tokens';

// در Tailwind:
<div className="z-modal">مودال</div>
<div className="z-dropdown">دراپ‌داون</div>

// یا در style:
<div style={{ zIndex: designTokens.zIndex.modal }}>
  مودال
</div>
```

## ✅ مثال کامل: کامپوننت با Design Tokens

```tsx
import { badgeVariants, buttonVariants, cardVariants } from '@/lib/design-tokens';

export default function UserCard({ user }) {
  return (
    <div className={`p-6 ${cardVariants.default}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-secondary-900 dark:text-white">
          {user.name}
        </h3>
        <span className={badgeVariants.success}>
          فعال
        </span>
      </div>

      <p className="text-base text-secondary-600 dark:text-secondary-400 mb-6">
        {user.email}
      </p>

      <div className="flex gap-3">
        <button className={`px-4 py-2 rounded-lg ${buttonVariants.primary}`}>
          ویرایش
        </button>
        <button className={`px-4 py-2 rounded-lg ${buttonVariants.outline}`}>
          مشاهده
        </button>
      </div>
    </div>
  );
}
```

## 🎨 پالت رنگ‌ها

### Primary (آبی)
- 50: `#eff6ff` - خیلی روشن
- 100: `#dbeafe`
- 500: `#3b82f6` - پیش‌فرض
- 600: `#2563eb` - hover
- 900: `#1e3a8a` - خیلی تیره

### Success (سبز)
- 100: `#dcfce7`
- 500: `#22c55e`
- 600: `#16a34a`

### Warning (زرد/نارنجی)
- 100: `#fef3c7`
- 500: `#f59e0b`
- 600: `#d97706`

### Error (قرمز)
- 100: `#fee2e2`
- 500: `#ef4444`
- 600: `#dc2626`

### Purple (بنفش) - برای MBTI
- 100: `#f3e8ff`
- 500: `#a855f7`
- 800: `#6b21a8`

### Amber (کهربایی) - برای Status
- 100: `#fef3c7`
- 500: `#f59e0b`

## 📖 منابع بیشتر

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- Design Tokens: `lib/design-tokens.ts`
- Tailwind Config: `tailwind.config.ts`
- Global Styles: `app/globals.css`

## 🔄 تبدیل کد قدیمی به جدید

### مثال 1: Badge Colors

```tsx
// قبل:
<Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
  MBTI
</Badge>

// بعد:
import { badgeVariants } from '@/lib/design-tokens';

<Badge className={badgeVariants.purple}>
  MBTI
</Badge>
```

### مثال 2: Button Colors

```tsx
// قبل:
<button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
  آپلود
</button>

// بعد:
import { buttonVariants } from '@/lib/design-tokens';

<button className={`px-4 py-2 rounded-lg ${buttonVariants.primary}`}>
  آپلود
</button>
```

### مثال 3: Card Styling

```tsx
// قبل:
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
  محتوا
</div>

// بعد:
import { cardVariants } from '@/lib/design-tokens';

<div className={`p-6 ${cardVariants.default}`}>
  محتوا
</div>
```

---

با استفاده از این سیستم طراحی، کد شما:
- ✅ خوانا‌تر می‌شود
- ✅ قابل نگهداری‌تر است
- ✅ Consistency بیشتری دارد
- ✅ تغییرات theme راحت‌تر انجام می‌شود
