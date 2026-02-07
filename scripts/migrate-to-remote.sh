#!/bin/bash

# رنگ‌ها برای خروجی
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# اطلاعات دیتابیس
REMOTE_HOST="atlon.ir"
REMOTE_PORT="5342"
REMOTE_USER="admin"
REMOTE_PASS="dpadba"
REMOTE_DB="feedbancur"
BACKUP_FILE="/tmp/feedbancur_backup_$(date +%Y%m%d_%H%M%S).sql"

echo -e "${YELLOW}=== انتقال دیتابیس به سرور Remote ===${NC}\n"

# مرحله 1: بررسی اتصال
echo -e "${YELLOW}[1/5] بررسی اتصال به سرور...${NC}"
if docker run --rm postgres:18-alpine psql "postgresql://${REMOTE_USER}:${REMOTE_PASS}@${REMOTE_HOST}:${REMOTE_PORT}/postgres?sslmode=disable" -c "SELECT 1;" &>/dev/null; then
    echo -e "${GREEN}✓ اتصال برقرار شد${NC}\n"
else
    echo -e "${RED}✗ خطا: نمی‌توان به سرور متصل شد${NC}"
    echo -e "${YELLOW}لطفاً VPN را وصل کنید و دوباره امتحان کنید${NC}"
    exit 1
fi

# مرحله 2: ایجاد دیتابیس
echo -e "${YELLOW}[2/5] ایجاد دیتابیس feedbancur...${NC}"
docker run --rm postgres:18-alpine psql "postgresql://${REMOTE_USER}:${REMOTE_PASS}@${REMOTE_HOST}:${REMOTE_PORT}/postgres?sslmode=disable" -c "CREATE DATABASE ${REMOTE_DB};" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ دیتابیس ایجاد شد${NC}\n"
else
    echo -e "${YELLOW}⚠ دیتابیس از قبل وجود دارد (ادامه می‌دهیم)${NC}\n"
fi

# مرحله 3: اجرای Migration ها
echo -e "${YELLOW}[3/5] اجرای Prisma migrations...${NC}"
if npx prisma migrate deploy --schema=./prisma/schema.prisma; then
    echo -e "${GREEN}✓ Migration ها با موفقیت اجرا شدند${NC}\n"
else
    echo -e "${RED}✗ خطا در اجرای migration ها${NC}"
    exit 1
fi

# مرحله 4: بک‌آپ از دیتابیس لوکال
echo -e "${YELLOW}[4/5] بک‌آپ از دیتابیس لوکال...${NC}"
if docker exec feedbancur_postgres pg_dump -U feedbancur feedbancur > "${BACKUP_FILE}"; then
    echo -e "${GREEN}✓ بک‌آپ ایجاد شد: ${BACKUP_FILE}${NC}\n"
else
    echo -e "${RED}✗ خطا در ایجاد بک‌آپ${NC}"
    echo -e "${YELLOW}آیا دیتابیس لوکال در حال اجرا است؟${NC}"
    exit 1
fi

# مرحله 5: انتقال داده‌ها
echo -e "${YELLOW}[5/5] انتقال داده‌ها به سرور remote...${NC}"
if cat "${BACKUP_FILE}" | docker run --rm -i postgres:18-alpine psql "postgresql://${REMOTE_USER}:${REMOTE_PASS}@${REMOTE_HOST}:${REMOTE_PORT}/${REMOTE_DB}?sslmode=disable"; then
    echo -e "${GREEN}✓ داده‌ها با موفقیت منتقل شدند${NC}\n"
else
    echo -e "${RED}✗ خطا در انتقال داده‌ها${NC}"
    exit 1
fi

echo -e "${GREEN}=== انتقال با موفقیت کامل شد! ===${NC}"
echo -e "${YELLOW}فایل بک‌آپ در ${BACKUP_FILE} ذخیره شده است${NC}"
