# اجرا با Docker (فقط اپ)

دیتابیس در این ستاپ **داکرایز نشده** و روی همان سروری که اپ دیپلوی می‌شود قرار دارد.

## پیش‌نیاز

- روی سرور فایل `.env` با مقادیر واقعی (مثل `DATABASE_URL`، `NEXTAUTH_URL`، `NEXTAUTH_SECRET`) داشته باش.

## بیلد و اجرا

```bash
# بیلد ایمیج
docker build -t feedbancur .

# اجرا با docker run (متغیرها از .env روی همین ماشین)
docker run -d --env-file .env -p 3000:3000 --name feedbancur feedbancur
```

یا با Docker Compose:

```bash
docker compose up -d --build
```

اپ روی پورت **3000** در دسترس است.

## نکات

- **DATABASE_URL** باید به آدرس دیتابیس روی همان سرور اشاره کند (مثلاً `pgsql.feedban.ir:5174` یا `host.docker.internal` اگر دیتابیس روی همان ماشین است).
- مایگریشن‌های Prisma را جدا (روی سرور یا یک‌بار قبل از دیپلوی) اجرا کن:  
  `npx prisma migrate deploy`
