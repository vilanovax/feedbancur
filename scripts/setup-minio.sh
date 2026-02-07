#!/bin/bash

echo "🚀 Setting up MinIO for Feedban..."
echo ""

# رنگ‌ها برای خروجی
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# بررسی نصب بودن docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker نصب نیست. لطفاً ابتدا Docker را نصب کنید."
    exit 1
fi

echo -e "${BLUE}📦 Starting MinIO container...${NC}"
docker-compose -f docker-compose.minio.yml up -d

echo ""
echo -e "${YELLOW}⏳ Waiting for MinIO to be ready...${NC}"
sleep 5

# نصب mc (MinIO Client) اگر نصب نیست
if ! command -v mc &> /dev/null; then
    echo -e "${BLUE}📥 Installing MinIO Client (mc)...${NC}"

    # برای macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install minio/stable/mc
    # برای Linux
    else
        wget https://dl.min.io/client/mc/release/linux-amd64/mc
        chmod +x mc
        sudo mv mc /usr/local/bin/
    fi
fi

echo ""
echo -e "${BLUE}🔧 Configuring MinIO...${NC}"

# تنظیم alias برای MinIO
mc alias set local http://localhost:9000 minioadmin minioadmin123

# ایجاد bucket
echo -e "${BLUE}📁 Creating 'feedban' bucket...${NC}"
mc mb local/feedban --ignore-existing

# تنظیم policy عمومی برای دانلود فایل‌ها
echo -e "${BLUE}🔓 Setting public download policy...${NC}"
mc anonymous set download local/feedban

echo ""
echo -e "${GREEN}✅ MinIO setup completed successfully!${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}MinIO Configuration Details:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "🌐 MinIO Console:    http://localhost:9001"
echo "   Username:         minioadmin"
echo "   Password:         minioadmin123"
echo ""
echo "🔌 API Endpoint:     http://localhost:9000"
echo "📦 Bucket:           feedban"
echo "🔑 Access Key:       minioadmin"
echo "🔐 Secret Key:       minioadmin123"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Open http://localhost:9001 in your browser"
echo "2. Login with the credentials above"
echo "3. Go to Admin Panel → Settings → Object Storage"
echo "4. Enter the following configuration:"
echo ""
echo "   Enabled:          ✓ (checked)"
echo "   Endpoint:         http://localhost:9000"
echo "   Bucket:           feedban"
echo "   Access Key ID:    minioadmin"
echo "   Secret Access Key: minioadmin123"
echo "   Region:           us-east-1"
echo "   Force Path Style: ✓ (checked)"
echo ""
echo -e "${GREEN}Happy uploading! 🚀${NC}"
echo ""
