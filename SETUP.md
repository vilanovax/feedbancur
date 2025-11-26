# راهنمای راه‌اندازی

## مراحل اولیه

### 1. نصب وابستگی‌ها
```bash
npm install
```

### 2. تنظیم متغیرهای محیطی
فایل `.env` را ایجاد کنید و محتوای زیر را در آن قرار دهید:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/feedbancur?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"

# App
NODE_ENV="development"
```

**نکته مهم**: برای تولید `NEXTAUTH_SECRET` می‌توانید از دستور زیر استفاده کنید:
```bash
openssl rand -base64 32
```

### 3. راه‌اندازی دیتابیس

ابتدا مطمئن شوید که PostgreSQL در حال اجرا است، سپس:

```bash
# تولید Prisma Client
npm run db:generate

# ایجاد جداول در دیتابیس
npm run db:push
```

### 4. ایجاد کاربر ادمین

برای ایجاد کاربر ادمین، می‌توانید از یکی از روش‌های زیر استفاده کنید:

#### روش 1: استفاده از Prisma Studio
```bash
npm run db:studio
```
سپس در رابط گرافیکی، یک کاربر جدید با role="ADMIN" ایجاد کنید.

#### روش 2: استفاده از اسکریپت
```bash
# تنظیم متغیرهای محیطی (اختیاری)
export ADMIN_EMAIL="admin@company.com"
export ADMIN_PASSWORD="admin123"
export ADMIN_NAME="مدیر سیستم"

# اجرای اسکریپت
npx ts-node scripts/create-admin.ts
```

### 5. ایجاد آیکون‌های PWA

برای کامل شدن PWA، باید آیکون‌ها را ایجاد کنید:

1. دو تصویر با ابعاد 192x192 و 512x512 پیکسل ایجاد کنید
2. آنها را به ترتیب با نام‌های `icon-192x192.png` و `icon-512x512.png` در پوشه `public` قرار دهید

یا می‌توانید از ابزارهای آنلاین مثل [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator) استفاده کنید.

### 6. اجرای پروژه

```bash
npm run dev
```

پروژه در آدرس `http://localhost:3000` در دسترس خواهد بود.

## استقرار روی لیارا

### مراحل استقرار:

1. **ایجاد پروژه در لیارا**
   - وارد پنل لیارا شوید
   - یک پروژه جدید از نوع Next.js ایجاد کنید

2. **اتصال به Repository**
   - پروژه خود را در GitHub/GitLab push کنید
   - آدرس repository را در لیارا وارد کنید

3. **تنظیم دیتابیس PostgreSQL**
   - در پنل لیارا، یک دیتابیس PostgreSQL ایجاد کنید
   - Connection String را کپی کنید

4. **تنظیم متغیرهای محیطی**
   در بخش Environment Variables، متغیرهای زیر را اضافه کنید:
   ```
   DATABASE_URL=<connection-string-from-liara>
   NEXTAUTH_URL=<your-liara-app-url>
   NEXTAUTH_SECRET=<generate-a-secret-key>
   NODE_ENV=production
   ```

5. **تنظیمات Build**
   - Build Command: `npm run build`
   - Start Command: `npm start`

6. **اجرای Migration**
   پس از اولین استقرار، باید migration را اجرا کنید:
   ```bash
   npm run db:push
   ```
   یا از طریق SSH در لیارا:
   ```bash
   liara ssh
   npm run db:push
   ```

7. **ایجاد کاربر ادمین**
   پس از استقرار، کاربر ادمین را ایجاد کنید (مطابق مراحل بالا)

## ساختار نقش‌ها

- **ADMIN**: دسترسی کامل به تمام بخش‌ها
- **MANAGER**: می‌تواند بخش‌ها را مدیریت کند و تمام فیدبک‌ها را ببیند
- **EMPLOYEE**: فقط می‌تواند فیدبک ثبت کند و فیدبک‌های خودش را ببیند

## دستورات مفید

```bash
# اجرای پروژه در حالت توسعه
npm run dev

# Build برای production
npm run build

# اجرای پروژه در حالت production
npm start

# باز کردن Prisma Studio
npm run db:studio

# ایجاد migration جدید
npm run db:migrate

# اعمال تغییرات schema به دیتابیس (بدون migration)
npm run db:push
```

## عیب‌یابی

### مشکل اتصال به دیتابیس
- مطمئن شوید که PostgreSQL در حال اجرا است
- Connection String را بررسی کنید
- فایروال و تنظیمات شبکه را بررسی کنید

### مشکل احراز هویت
- `NEXTAUTH_SECRET` را بررسی کنید
- `NEXTAUTH_URL` باید با URL واقعی اپلیکیشن مطابقت داشته باشد

### مشکل PWA
- مطمئن شوید که آیکون‌ها در پوشه `public` وجود دارند
- در حالت development، PWA غیرفعال است (برای تست از production build استفاده کنید)

