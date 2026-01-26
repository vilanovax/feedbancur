# 🚀 راهنمای بهینه‌سازی Performance

## 📊 نتایج تحلیل Performance

### ✅ نقاط قوت فعلی

1. **✅ Database Indexing**
   - تمام جداول کلیدی indexهای مناسب دارند
   - Composite indexes برای queryهای پیچیده
   - Foreign key indexes برای join operations

2. **✅ Query Optimization**
   - استفاده از `Promise.all` برای queryهای موازی
   - استفاده از `include` برای جلوگیری از N+1 problem
   - Pagination در تمام لیست‌ها

3. **✅ API Caching**
   - استفاده از `unstable_cache` در Next.js
   - Cache tags برای revalidation
   - TTL مختلف برای انواع داده

### 🔍 موارد شناسایی شده

#### Indexهای موجود در `feedbacks`:
```
feedbacks_createdAt_idx
feedbacks_deletedAt_idx
feedbacks_departmentId_idx
feedbacks_forwardedToId_idx
feedbacks_status_idx
feedbacks_userId_idx
feedbacks_status_departmentId_idx     # Composite
feedbacks_status_forwardedToId_idx   # Composite
```

---

## 🎯 بهینه‌سازی‌های اعمال شده

### 1. Performance Monitoring Utilities
**فایل:** `lib/performance.ts`

```typescript
// استفاده از Performance Timer
import { PerformanceTimer } from '@/lib/performance';

const timer = new PerformanceTimer('My Operation');
// ... operation ...
timer.end(); // Logs: ⏱️ [Performance] My Operation: 123.45ms
```

```typescript
// اندازه‌گیری Query Performance
import { measureQuery } from '@/lib/performance';

const users = await measureQuery('Get Users', async () => {
  return prisma.users.findMany();
});
```

```typescript
// Debounce برای input handlers
import { debounce } from '@/lib/performance';

const handleSearch = debounce((value: string) => {
  // Search API call
}, 300);
```

---

## 📈 بهینه‌سازی‌های پیشنهادی

### 2. React Component Optimization

#### 2.1 استفاده از React.memo
برای کامپوننت‌های سنگین:

```typescript
// components/Dashboard.tsx
import { memo } from 'react';

const StatCard = memo(({ title, value }: Props) => {
  return (
    <div>
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  );
});

StatCard.displayName = 'StatCard';
```

#### 2.2 استفاده از useMemo و useCallback
```typescript
const memoizedValue = useMemo(() =>
  computeExpensiveValue(a, b),
  [a, b]
);

const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

---

### 3. Image Optimization

#### 3.1 استفاده از Next.js Image Component
```typescript
import Image from 'next/image';

<Image
  src="/uploads/logo.webp"
  alt="Logo"
  width={100}
  height={100}
  quality={80}
  placeholder="blur"
  blurDataURL="data:image/..."
/>
```

#### 3.2 تنظیمات next.config.js
```javascript
module.exports = {
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
    minimumCacheTTL: 60,
  },
};
```

---

### 4. API Response Optimization

#### 4.1 فشرده‌سازی پاسخ‌ها
```typescript
// middleware.ts
import { NextResponse } from 'next/server';

export function middleware(request: Request) {
  const response = NextResponse.next();

  // Enable compression
  response.headers.set('Content-Encoding', 'gzip');

  return response;
}
```

#### 4.2 محدود کردن فیلدهای بازگشتی
```typescript
// فقط فیلدهای مورد نیاز را select کنید
const users = await prisma.users.findMany({
  select: {
    id: true,
    name: true,
    email: true,
    // حذف فیلدهای غیرضروری
  },
});
```

---

### 5. Client-Side Caching

#### 5.1 بهینه‌سازی SWR
```typescript
// lib/swr.ts
export const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
};

// استفاده
const { data } = useSWR('/api/users', fetcher, swrConfig);
```

#### 5.2 استفاده از staleTime و cacheTime
```typescript
const { data } = useSWR('/api/stats', fetcher, {
  refreshInterval: 60000, // هر 60 ثانیه
  dedupingInterval: 10000, // 10 ثانیه
});
```

---

### 6. Database Query Optimization

#### 6.1 استفاده از Raw Queries برای queryهای پیچیده
```typescript
// برای queryهای خیلی پیچیده
const result = await prisma.$queryRaw`
  SELECT
    d.name,
    COUNT(f.id) as feedback_count
  FROM departments d
  LEFT JOIN feedbacks f ON f.departmentId = d.id
  WHERE f.status = 'PENDING'
  GROUP BY d.id
  ORDER BY feedback_count DESC
  LIMIT 10
`;
```

#### 6.2 استفاده از Batch Operations
```typescript
// به جای loop، از createMany استفاده کنید
await prisma.users.createMany({
  data: users,
  skipDuplicates: true,
});
```

---

### 7. Bundle Size Optimization

#### 7.1 Dynamic Imports
```typescript
// به جای import استاتیک
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

#### 7.2 Tree Shaking
```typescript
// ❌ بد
import _ from 'lodash';

// ✅ خوب
import debounce from 'lodash/debounce';
```

---

### 8. Server-Side Optimization

#### 8.1 استفاده از Edge Runtime
```typescript
// app/api/edge-route/route.ts
export const runtime = 'edge';

export async function GET() {
  // این route در Edge Runtime اجرا می‌شود (سریع‌تر)
  return new Response('Hello from edge!');
}
```

#### 8.2 Streaming Responses
```typescript
export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      const data = await fetchLargeData();
      controller.enqueue(encoder.encode(data));
      controller.close();
    },
  });

  return new Response(stream);
}
```

---

## 📊 Performance Benchmarks

### قبل از بهینه‌سازی:
| API Endpoint | میانگین زمان |
|-------------|------------|
| GET /api/feedback | ~500ms |
| GET /api/analytics | ~1200ms |
| GET /api/users | ~300ms |

### بعد از بهینه‌سازی (هدف):
| API Endpoint | میانگین زمان |
|-------------|------------|
| GET /api/feedback | <200ms ✅ |
| GET /api/analytics | <400ms ✅ |
| GET /api/users | <150ms ✅ |

---

## 🛠️ ابزارهای مانیتورینگ

### 1. استفاده از Performance Utilities
```typescript
import { PerformanceTimer, logApiPerformance } from '@/lib/performance';

// در API route
export async function GET(request: Request) {
  const timer = new PerformanceTimer('GET /api/feedback');

  const result = await fetchFeedbacks();

  const duration = timer.end();
  logApiPerformance('/api/feedback', duration);

  return Response.json(result);
}
```

### 2. Chrome DevTools
- Performance tab
- Network tab
- Lighthouse audit

### 3. Next.js Analytics
```bash
npm install @vercel/analytics
```

---

## ✅ چک‌لیست بهینه‌سازی

### Backend:
- [x] Database indexes برای queryهای پرکاربرد
- [x] استفاده از `Promise.all` برای queryهای موازی
- [x] API caching با `unstable_cache`
- [ ] Rate limiting برای APIها
- [ ] Response compression (gzip)
- [ ] Connection pooling optimization

### Frontend:
- [ ] استفاده از `React.memo` برای کامپوننت‌های سنگین
- [ ] Dynamic imports برای کامپوننت‌های بزرگ
- [ ] Image optimization با Next.js Image
- [ ] Font optimization
- [ ] CSS optimization (purge unused)
- [ ] Bundle size analysis

### Database:
- [x] Indexes روی فیلدهای پرجستجو
- [x] Composite indexes برای queryهای پیچیده
- [ ] Query performance monitoring
- [ ] Connection pool tuning
- [ ] Vacuum و maintenance منظم

---

## 🎯 مراحل بعدی

1. **فوری:**
   - اضافه کردن React.memo به کامپوننت‌های سنگین
   - استفاده از Next.js Image در جای تصاویر
   - اضافه کردن debounce به search inputs

2. **کوتاه‌مدت:**
   - پیاده‌سازی Response compression
   - Bundle size analysis و optimization
   - اضافه کردن Performance monitoring

3. **بلندمدت:**
   - پیاده‌سازی CDN برای static files
   - Database sharding (در صورت نیاز)
   - Load balancing

---

**آخرین به‌روزرسانی:** 2026-01-26
