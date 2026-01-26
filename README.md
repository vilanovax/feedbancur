# 📋 FeedbanCur - سیستم مدیریت بازخورد

سیستم جامع مدیریت بازخورد، ارزیابی و مدیریت پروژه

## 🚀 راه‌اندازی سریع

### پیش‌نیازها
- Node.js 18+
- Docker Desktop
- PostgreSQL 18 (از طریق Docker)

### نصب

```bash
# نصب وابستگی‌ها
npm install

# راه‌اندازی دیتابیس
docker-compose up -d

# اعمال Schema دیتابیس
npx prisma db push
npx prisma generate

# اجرای برنامه
npm run dev
```

برنامه در آدرس http://localhost:3002 اجرا می‌شود.

## 🗄️ دیتابیس

### اتصال لوکال
```
Host: localhost
Port: 5433
User: feedbancur
Password: feedbancur123
Database: feedbancur
```

### دستورات مفید

```bash
# مشاهده لاگ‌های دیتابیس
docker logs feedbancur_postgres

# اتصال به دیتابیس
docker exec -it feedbancur_postgres psql -U feedbancur -d feedbancur

# Restart دیتابیس
docker-compose restart

# پاک کردن دیتابیس (احتیاط!)
docker-compose down -v
```

## 📁 ساختار پروژه

```
feedbancur/
├── app/                    # Next.js App Router
│   ├── (authenticated)/   # صفحات احراز هویت شده
│   ├── api/               # API Routes
│   └── login/             # صفحه ورود
├── components/            # کامپوننت‌های React
├── lib/                   # توابع کمکی
├── prisma/                # Prisma Schema
├── public/                # فایل‌های استاتیک
└── uploads/               # فایل‌های آپلود شده
```

## 🔑 ویژگی‌های اصلی

- ✅ مدیریت بازخورد (Feedback Management)
- 📊 داشبورد تحلیلی
- 👥 مدیریت کاربران و دپارتمان‌ها
- 📝 سیستم ارزیابی (MBTI, DISC, Holland, MSQ)
- 📁 مدیریت فایل و پوشه
- 🔔 سیستم اعلان‌ها
- 💬 چت و پیام‌رسانی
- 📱 رابط کاربری موبایل
- 🌓 حالت تاریک

## 🔐 احراز هویت

سیستم از NextAuth.js برای احراز هویت استفاده می‌کند.

### نقش‌های کاربری
- `ADMIN` - مدیر سیستم
- `MANAGER` - مدیر دپارتمان
- `EMPLOYEE` - کارمند

## 🛠️ فناوری‌های استفاده شده

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL 18
- **ORM**: Prisma 6
- **Authentication**: NextAuth.js
- **UI**: Tailwind CSS + Radix UI
- **Charts**: Recharts
- **Forms**: React Hook Form
- **State**: SWR
- **Icons**: Lucide React

## 📝 محیط‌های مختلف

### Development (Local)
```env
DATABASE_URL="postgresql://feedbancur:feedbancur123@localhost:5433/feedbancur?schema=public"
NEXTAUTH_URL="http://localhost:3002"
NODE_ENV="development"
```

### Production (Liara)
برای بازگشت به دیتابیس Liara:
```bash
cp .env.liara.backup .env
```

## 🐛 عیب‌یابی

### Docker خاموش است
```bash
open -a "Docker Desktop"
```

### خطای اتصال به دیتابیس
```bash
# بررسی وضعیت container
docker ps

# راه‌اندازی مجدد
docker-compose up -d
```

### خطای Prisma Schema
```bash
npx prisma generate
npx prisma db push
```

## 📚 مستندات بیشتر

- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - راهنمای راه‌اندازی دیتابیس
- [Prisma Docs](https://www.prisma.io/docs)
- [Next.js Docs](https://nextjs.org/docs)

## 👨‍💻 توسعه‌دهندگان

برای شروع توسعه:

```bash
# ایجاد branch جدید
git checkout -b feature/new-feature

# نصب وابستگی‌های جدید
npm install package-name

# اجرای Type Check
npx tsc --noEmit

# اجرای Build
npm run build
```

## 📄 لایسنس

این پروژه تحت لایسنس MIT منتشر شده است.
