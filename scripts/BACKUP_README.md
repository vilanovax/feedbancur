# راهنمای استفاده از اسکریپت‌های Backup

این اسکریپت‌ها برای استخراج داده‌های فعلی دیتابیس و ذخیره آن‌ها در فایل seed استفاده می‌شوند.

## اسکریپت اصلی: backup-to-seed

این اسکریپت تمام داده‌های فعلی دیتابیس را می‌خواند و آن‌ها را در فایل `seed-data.ts` ذخیره می‌کند.

### نحوه استفاده:

```bash
npm run backup-to-seed
```

یا:

```bash
npx ts-node scripts/backup-to-seed.ts
```

### چه کاری انجام می‌دهد:

1. تمام داده‌های دیتابیس را می‌خواند:
   - کاربران (Users)
   - بخش‌ها (Departments)
   - کارمندان (Employees)
   - فیدبک‌ها (Feedbacks)
   - وظایف (Tasks)
   - اعلان‌ها (Announcements)
   - پیام‌ها (Messages)

2. یک فایل seed جدید تولید می‌کند که شامل تمام این داده‌ها است

3. فایل `scripts/seed-data.ts` را با داده‌های جدید به‌روزرسانی می‌کند

### استفاده مجدد از داده‌ها:

پس از اجرای اسکریپت، می‌توانید فایل seed را در هر زمان اجرا کنید:

```bash
npx ts-node scripts/seed-data.ts
```

## اسکریپت‌های دیگر:

### export-database

این اسکریپت داده‌ها را در قالب JSON ذخیره می‌کند:

```bash
npm run export-db
```

یا:

```bash
npx ts-node scripts/export-database.ts
```

خروجی در فایل `scripts/database-export.json` ذخیره می‌شود.

### generate-seed-from-export

این اسکریپت از فایل JSON که توسط `export-database` ایجاد شده، فایل seed تولید می‌کند:

```bash
npx ts-node scripts/generate-seed-from-export.ts
```

## نکات مهم:

⚠️ **هشدار**: فایل `seed-data.ts` به صورت خودکار جایگزین می‌شود. اگر می‌خواهید نسخه قبلی را نگه دارید، قبل از اجرا از آن بکاپ بگیرید.

✅ **توصیه**: قبل از اجرای seed در دیتابیس جدید، مطمئن شوید که:
- دیتابیس خالی است یا
- از داده‌های قبلی بکاپ گرفته‌اید

## مثال استفاده:

```bash
# 1. استخراج داده‌های فعلی و ذخیره در seed
npm run backup-to-seed

# 2. در دیتابیس جدید، اجرای seed
npx ts-node scripts/seed-data.ts
```

