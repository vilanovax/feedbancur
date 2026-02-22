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
# فقط برای prisma generate در زمان بیلد (مقدار واقعی در runtime پاس داده می‌شود)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"

RUN npx prisma generate
RUN npm run build
RUN npm prune --production

# Stage 3: اجرا
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# پورت و هاست
ENV PORT=5002
ENV HOSTNAME="0.0.0.0"

# متغیرهای محیطی (مقادیر واقعی با env_file در docker-compose override می‌شوند)
ENV DATABASE_URL=""
ENV NEXTAUTH_URL="http://localhost:5002"
ENV NEXTAUTH_SECRET=""
ENV OTP_ENABLED="true"
ENV OTP_DEFAULT="123456"

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
