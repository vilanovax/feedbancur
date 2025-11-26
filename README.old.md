# سیستم فیدبک کارمندان

یک اپلیکیشن PWA برای مدیریت و اندازه‌گیری فیدبک کارمندان از بخش‌های مختلف شرکت.

## ویژگی‌ها

- ✅ PWA (Progressive Web App)
- ✅ Next.js 14 با App Router
- ✅ TypeScript
- ✅ PostgreSQL با Prisma ORM
- ✅ احراز هویت با NextAuth
- ✅ مدیریت بخش‌ها
- ✅ ثبت و مشاهده فیدبک‌ها
- ✅ داشبورد آماری و تحلیلی
- ✅ آماده برای استقرار روی لیارا

## نصب و راه‌اندازی

### پیش‌نیازها

- Node.js 18+ 
- PostgreSQL
- npm یا yarn

### مراحل نصب

1. نصب وابستگی‌ها:
```bash
npm install
```

2. تنظیم متغیرهای محیطی:
```bash
cp .env.example .env
```

سپس فایل `.env` را ویرایش کنید و اطلاعات دیتابیس و NextAuth را وارد کنید.

3. راه‌اندازی دیتابیس:
```bash
npm run db:generate
npm run db:push
```

4. ایجاد آیکون‌های PWA:
برای کامل شدن PWA، باید دو آیکون با ابعاد 192x192 و 512x512 پیکسل ایجاد کنید و آنها را با نام‌های `icon-192x192.png` و `icon-512x512.png` در پوشه `public` قرار دهید.

5. ایجاد کاربر ادمین:
می‌توانید از Prisma Studio استفاده کنید (`npm run db:studio`) یا از اسکریپت موجود در `scripts/create-admin.ts` استفاده کنید.

6. اجرای پروژه:
```bash
npm run dev
```

اپلیکیشن در آدرس `http://localhost:3000` در دسترس خواهد بود.

## استقرار روی لیارا

1. پروژه را در GitHub/GitLab push کنید
2. در پنل لیارا، یک پروژه جدید ایجاد کنید
3. دیتابیس PostgreSQL را متصل کنید
4. متغیرهای محیطی را تنظیم کنید
5. Build command: `npm run build`
6. Start command: `npm start`

## ساختار پروژه

```
├── app/                 # صفحات و routes
│   ├── api/            # API routes
│   ├── feedback/       # صفحات فیدبک
│   ├── departments/    # مدیریت بخش‌ها
│   └── analytics/      # آمار و تحلیل
├── components/         # کامپوننت‌های React
├── lib/                # توابع کمکی
├── prisma/             # Schema و migrations
┌── public/             # فایل‌های استاتیک
└── types/              # TypeScript types
```

## نقش‌های کاربری

- **ADMIN**: دسترسی کامل به تمام بخش‌ها
- **MANAGER**: دسترسی به مدیریت بخش‌ها و مشاهده فیدبک‌ها
- **EMPLOYEE**: فقط می‌تواند فیدبک ثبت کند و فیدبک‌های خودش را ببیند

## تکنولوژی‌ها

- Next.js 14
- React 18
- TypeScript
- Prisma
- PostgreSQL
- NextAuth
- Tailwind CSS
- Recharts

## مستندات بیشتر

برای راهنمای کامل‌تر و جزئیات بیشتر، فایل [SETUP.md](./SETUP.md) را مطالعه کنید.

## لایسنس

MIT

