# راهنمای عیب‌یابی خطاهای Liara

## خطای "Application error: a server-side exception has occurred"

این خطا معمولاً به دلایل زیر رخ می‌دهد:

### 1. بررسی Environment Variables

در پنل Liara، مطمئن شوید که این متغیرها تنظیم شده‌اند:

```env
DATABASE_URL=postgresql://user:password@host:port/database?schema=public
NEXTAUTH_URL=https://your-app.liara.run
NEXTAUTH_SECRET=your-secret-key-here
NODE_ENV=production
```

**نکات مهم:**
- `DATABASE_URL` باید از پنل Liara Database کپی شود
- `NEXTAUTH_URL` باید دقیقاً با URL اپلیکیشن شما در Liara مطابقت داشته باشد
- برای تولید `NEXTAUTH_SECRET` از این دستور استفاده کنید:
  ```bash
  openssl rand -base64 32
  ```

### 2. بررسی Prisma Client

مطمئن شوید که Prisma Client به درستی generate شده است:

```bash
# در Terminal Liara (SSH)
liara ssh
cd /app
npx prisma generate
```

### 3. بررسی Database Connection

مطمئن شوید که دیتابیس به درستی تنظیم شده است:

```bash
# در Terminal Liara
liara ssh
cd /app
npx prisma db push
```

یا اگر از migration استفاده می‌کنید:

```bash
npx prisma migrate deploy
```

### 4. بررسی Logs

برای مشاهده خطاهای دقیق:

1. در پنل Liara، به بخش **Logs** بروید
2. یا از Terminal:
   ```bash
   liara logs --app feedbanx
   ```

### 5. بررسی Build Process

مطمئن شوید که build به درستی انجام شده است:

```bash
# در Terminal Liara
liara ssh
cd /app
npm run build
```

### 6. بررسی Dependencies

مطمئن شوید که همه dependencies نصب شده‌اند:

```bash
# در Terminal Liara
liara ssh
cd /app
npm install
```

### 7. مشکلات رایج

#### مشکل: "Can't reach database server"
**راه حل:**
- `DATABASE_URL` را بررسی کنید
- مطمئن شوید که دیتابیس در Liara فعال است
- Connection String را از پنل Liara Database دوباره کپی کنید

#### مشکل: "Prisma Client did not initialize yet"
**راه حل:**
```bash
liara ssh
cd /app
npx prisma generate
npm run build
```

#### مشکل: "NEXTAUTH_SECRET is not set"
**راه حل:**
- در پنل Liara، Environment Variables را بررسی کنید
- `NEXTAUTH_SECRET` را اضافه کنید

#### مشکل: "Invalid NEXTAUTH_URL"
**راه حل:**
- `NEXTAUTH_URL` باید دقیقاً با URL اپلیکیشن شما مطابقت داشته باشد
- مثال: `https://feedbanx.liara.run` (نه `http://` یا با `/` در انتها)

### 8. دستورات مفید برای Debug

```bash
# اتصال به سرور Liara
liara ssh

# مشاهده Environment Variables
env | grep -E "DATABASE_URL|NEXTAUTH"

# بررسی وضعیت Prisma
npx prisma --version
npx prisma generate

# بررسی وضعیت Next.js
npm run build
npm start

# مشاهده Logs
liara logs --app feedbanx --tail 100
```

### 9. راه‌اندازی مجدد

اگر مشکل حل نشد:

1. در پنل Liara، اپلیکیشن را **Restart** کنید
2. یا از Terminal:
   ```bash
   liara restart --app feedbanx
   ```

### 10. بررسی فایل‌های مهم

- `liara.json`: تنظیمات build و start
- `package.json`: scripts و dependencies
- `.env` یا Environment Variables در Liara: متغیرهای محیطی
- `prisma/schema.prisma`: schema دیتابیس

## نکات مهم

1. **همیشه بعد از تغییر Environment Variables، اپلیکیشن را Restart کنید**
2. **مطمئن شوید که Prisma Client بعد از هر تغییر در schema، generate شده است**
3. **Logs را بررسی کنید تا خطای دقیق را ببینید**
4. **DATABASE_URL باید از پنل Liara Database کپی شود، نه از جای دیگر**

## تماس با پشتیبانی

اگر مشکل حل نشد:
1. Logs را از پنل Liara کپی کنید
2. Environment Variables را بررسی کنید (بدون نمایش مقادیر حساس)
3. با پشتیبانی Liara تماس بگیرید

