# ============================================
# FeedbanCur - فقط اپ (دیتابیس روی همان سرور است)
# ============================================

# Stage 1: نصب وابستگی‌ها
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./



# ست کردن ریجستری Runflare
RUN npm config set registry "https://mirror-npm.runflare.com" \
    && npm config set strict-ssl false \
    && npm config set progress=true

# نصب با verbose (ignore-scripts چون prisma/schema هنوز کپی نشده؛ prisma generate در stage بعد اجرا می‌شود)
RUN npm install --verbose --ignore-scripts

# Stage 2: بیلد اپ
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# جلوگیری از OOM در بیلد (SIGKILL وقتی حافظه کم است)
ENV NODE_OPTIONS="--max-old-space-size=4096"
# Prisma در بیلد به DATABASE_URL نیاز دارد (مقدار واقعی در runtime از compose می‌آید)
ENV DATABASE_URL="postgresql://postgres:KetabMetab88%40@pgsql.feedban.ir:5174/Bizbuzz?schema=feedban"

RUN npm run build
RUN npm prune --production

# Stage 3: اجرا
FROM node:20-alpine AS runner
WORKDIR /app

# NODE_ENV, PORT, HOSTNAME و بقیه در docker-compose.yml ست می‌شوند
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/package.json /app/package-lock.json* ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 5002

CMD ["npm", "start"]
