#!/bin/bash

# رنگ‌ها برای خروجی
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

REMOTE_HOST="atlon.ir"
REMOTE_PORT="5342"
REMOTE_USER="admin"
REMOTE_PASS="dpadba"

echo -e "${YELLOW}=== تست اتصال به دیتابیس Remote ===${NC}\n"

# تست پورت
echo -e "${YELLOW}[1/3] تست دسترسی به پورت...${NC}"
if nc -zv -w 5 ${REMOTE_HOST} ${REMOTE_PORT} 2>&1 | grep -q "succeeded"; then
    echo -e "${GREEN}✓ پورت ${REMOTE_PORT} قابل دسترسی است${NC}\n"
else
    echo -e "${RED}✗ نمی‌توان به پورت ${REMOTE_PORT} متصل شد${NC}"
    echo -e "${YELLOW}لطفاً VPN را وصل کنید${NC}\n"
    exit 1
fi

# تست اتصال PostgreSQL
echo -e "${YELLOW}[2/3] تست اتصال PostgreSQL...${NC}"
if docker run --rm postgres:18-alpine psql "postgresql://${REMOTE_USER}:${REMOTE_PASS}@${REMOTE_HOST}:${REMOTE_PORT}/postgres?sslmode=disable" -c "SELECT version();" &>/dev/null; then
    echo -e "${GREEN}✓ اتصال PostgreSQL موفق بود${NC}\n"
else
    echo -e "${RED}✗ خطا در اتصال PostgreSQL${NC}"
    echo -e "${YELLOW}لطفاً username و password را بررسی کنید${NC}\n"
    exit 1
fi

# لیست دیتابیس‌ها
echo -e "${YELLOW}[3/3] لیست دیتابیس‌های موجود:${NC}"
docker run --rm postgres:18-alpine psql "postgresql://${REMOTE_USER}:${REMOTE_PASS}@${REMOTE_HOST}:${REMOTE_PORT}/postgres?sslmode=disable" -c "\l"

echo -e "\n${GREEN}=== اتصال موفق بود! ===${NC}"
