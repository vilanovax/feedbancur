# 💡 مثال‌های عملی Performance Optimization

این فایل شامل مثال‌های عملی و آماده استفاده برای بهینه‌سازی performance است.

---

## 1. 🔌 اضافه کردن Performance Monitoring به API

### قبل:
```typescript
// app/api/feedback/route.ts
export async function GET(request: NextRequest) {
  const feedbacks = await prisma.feedbacks.findMany({
    include: { users: true, departments: true },
  });

  return NextResponse.json(feedbacks);
}
```

### بعد:
```typescript
// app/api/feedback/route.ts
import { PerformanceTimer, logApiPerformance } from '@/lib/performance';

export async function GET(request: NextRequest) {
  const timer = new PerformanceTimer('GET /api/feedback');

  const feedbacks = await prisma.feedbacks.findMany({
    include: { users: true, departments: true },
  });

  const duration = timer.end(false); // false = don't auto-log
  logApiPerformance('/api/feedback', duration, 'GET');

  return NextResponse.json(feedbacks);
}
```

**نتیجه در Console:**
```
🟢 [API] GET /api/feedback: 145.23ms
```

---

## 2. 📊 مانیتورینگ Database Queries

### قبل:
```typescript
const users = await prisma.users.findMany({
  where: { role: 'ADMIN' },
  include: { departments: true },
});
```

### بعد:
```typescript
import { measureQuery } from '@/lib/performance';

const users = await measureQuery('Get Admin Users', async () => {
  return prisma.users.findMany({
    where: { role: 'ADMIN' },
    include: { departments: true },
  });
});
```

**نتیجه در Console:**
```
⏱️ [Performance] Query: Get Admin Users: 67.89ms
```

**اگر کند باشد:**
```
⚠️ Slow query detected: Get Admin Users took 1234.56ms
```

---

## 3. ⚛️ بهینه‌سازی React Components با memo

### قبل:
```typescript
// components/FeedbackCard.tsx
export default function FeedbackCard({ feedback, onUpdate }) {
  return (
    <div>
      <h3>{feedback.title}</h3>
      <p>{feedback.content}</p>
      <button onClick={() => onUpdate(feedback.id)}>Update</button>
    </div>
  );
}
```

### بعد:
```typescript
// components/FeedbackCard.tsx
import { memo } from 'react';

const FeedbackCard = memo(function FeedbackCard({ feedback, onUpdate }) {
  return (
    <div>
      <h3>{feedback.title}</h3>
      <p>{feedback.content}</p>
      <button onClick={() => onUpdate(feedback.id)}>Update</button>
    </div>
  );
});

export default FeedbackCard;
```

**فایده:**
- Component فقط وقتی re-render می‌شود که props عوض شده باشند
- جلوگیری از re-render‌های غیرضروری
- بهبود performance در لیست‌های طولانی

---

## 4. 🔍 Debounce برای Search Input

### قبل:
```typescript
// components/SearchInput.tsx
const SearchInput = () => {
  const [query, setQuery] = useState('');

  const handleSearch = (value: string) => {
    // هر تایپ = یک API call 😱
    fetch(`/api/search?q=${value}`)
      .then(res => res.json())
      .then(data => setResults(data));
  };

  return (
    <input
      value={query}
      onChange={(e) => {
        setQuery(e.target.value);
        handleSearch(e.target.value);
      }}
    />
  );
};
```

### بعد:
```typescript
// components/SearchInput.tsx
import { debounce } from '@/lib/performance';
import { useCallback } from 'react';

const SearchInput = () => {
  const [query, setQuery] = useState('');

  // فقط بعد از 300ms توقف تایپ API call می‌زند ✅
  const handleSearch = useCallback(
    debounce((value: string) => {
      fetch(`/api/search?q=${value}`)
        .then(res => res.json())
        .then(data => setResults(data));
    }, 300),
    []
  );

  return (
    <input
      value={query}
      onChange={(e) => {
        setQuery(e.target.value);
        handleSearch(e.target.value);
      }}
    />
  );
};
```

**فایده:**
- کاهش 90% API calls
- بهبود performance سرور
- تجربه کاربری بهتر

---

## 5. 💾 استفاده از useMemo برای محاسبات سنگین

### قبل:
```typescript
const Dashboard = ({ feedbacks }) => {
  // این محاسبه در هر render اتفاق می‌افتد 😱
  const stats = calculateComplexStats(feedbacks);

  return <div>{stats.total}</div>;
};
```

### بعد:
```typescript
import { useMemo } from 'react';

const Dashboard = ({ feedbacks }) => {
  // فقط وقتی feedbacks عوض شود محاسبه می‌شود ✅
  const stats = useMemo(() => {
    return calculateComplexStats(feedbacks);
  }, [feedbacks]);

  return <div>{stats.total}</div>;
};
```

---

## 6. 🎣 استفاده از useCallback برای Event Handlers

### قبل:
```typescript
const FeedbackList = ({ feedbacks }) => {
  const handleUpdate = (id: string) => {
    // این function در هر render جدید ساخته می‌شود 😱
    updateFeedback(id);
  };

  return feedbacks.map(f => (
    <FeedbackCard
      key={f.id}
      feedback={f}
      onUpdate={handleUpdate} // همیشه reference جدید
    />
  ));
};
```

### بعد:
```typescript
import { useCallback } from 'react';

const FeedbackList = ({ feedbacks }) => {
  const handleUpdate = useCallback((id: string) => {
    // این function فقط یکبار ساخته می‌شود ✅
    updateFeedback(id);
  }, []); // dependency array خالی = فقط یکبار

  return feedbacks.map(f => (
    <FeedbackCard
      key={f.id}
      feedback={f}
      onUpdate={handleUpdate} // همیشه همان reference
    />
  ));
};
```

**فایده:**
- اگر `FeedbackCard` با `memo` wrap شده باشد، re-render نمی‌شود
- Performance بهتر در لیست‌های طولانی

---

## 7. 🖼️ بهینه‌سازی Images با next/image

### قبل:
```typescript
<img
  src="/uploads/logo.png"
  alt="Logo"
  width="100"
  height="100"
/>
```

### بعد:
```typescript
import Image from 'next/image';

<Image
  src="/uploads/logo.png"
  alt="Logo"
  width={100}
  height={100}
  quality={80}
  placeholder="blur"
  blurDataURL="data:image/png;base64,..."
  priority={false} // lazy load
/>
```

**فایده:**
- تصویر به‌صورت خودکار optimize می‌شود
- Lazy loading برای سرعت بالاتر
- Responsive images برای device‌های مختلف
- WebP و AVIF automatic

---

## 8. 📦 Dynamic Import برای کامپوننت‌های سنگین

### قبل:
```typescript
import HeavyChart from '@/components/HeavyChart';

const Dashboard = () => {
  return (
    <div>
      <HeavyChart data={data} />
    </div>
  );
};
```

### بعد:
```typescript
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <div>در حال بارگذاری...</div>,
  ssr: false, // فقط در client load شود
});

const Dashboard = () => {
  return (
    <div>
      <HeavyChart data={data} />
    </div>
  );
};
```

**فایده:**
- کاهش initial bundle size
- Faster page load
- بهتر برای SEO

---

## 9. 🔄 استفاده از Cache Tracker

```typescript
import { cacheTracker } from '@/lib/performance';

const getCachedData = async (key: string) => {
  const cached = cache.get(key);

  if (cached) {
    cacheTracker.recordHit();
    return cached;
  }

  cacheTracker.recordMiss();
  const data = await fetchData();
  cache.set(key, data);
  return data;
};

// مشاهده آمار
cacheTracker.log('User Cache');
// 📊 [Cache] User Cache: { hits: 45, misses: 5, total: 50, hitRate: '90.00%' }
```

---

## 10. 🚦 Throttle برای Scroll Events

### قبل:
```typescript
useEffect(() => {
  const handleScroll = () => {
    // این function صدها بار در ثانیه صدا می‌شود 😱
    console.log(window.scrollY);
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

### بعد:
```typescript
import { throttle } from '@/lib/performance';

useEffect(() => {
  const handleScroll = throttle(() => {
    // حداکثر هر 100ms یکبار صدا می‌شود ✅
    console.log(window.scrollY);
  }, 100);

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

---

## 📊 چک‌لیست استفاده

برای هر feature جدید:

- [ ] آیا API route از PerformanceTimer استفاده می‌کند؟
- [ ] آیا queryهای سنگین با measureQuery wrap شده‌اند؟
- [ ] آیا کامپوننت‌های list item با memo wrap شده‌اند؟
- [ ] آیا event handlers از useCallback استفاده می‌کنند؟
- [ ] آیا محاسبات سنگین با useMemo cache شده‌اند؟
- [ ] آیا search inputs از debounce استفاده می‌کنند؟
- [ ] آیا تصاویر از next/image استفاده می‌کنند؟
- [ ] آیا کامپوننت‌های سنگین dynamic import شده‌اند؟

---

## 🎯 نکات مهم

1. **همیشه اندازه‌گیری کنید** - قبل و بعد از optimization
2. **Premature optimization** نکنید - اول کد را کامل کنید
3. **User experience** در اولویت اول
4. **Development mode** performance کمتری دارد - همیشه در production تست کنید

---

**آخرین به‌روزرسانی:** 2026-01-26
