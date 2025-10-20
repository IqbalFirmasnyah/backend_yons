# Stage 1: Build
FROM node:22-alpine AS builder

RUN apk add --no-cache \
  libc6-compat \
  chromium \
  nss \
  freetype \
  freetype-dev \
  harfbuzz \
  ca-certificates \
  ttf-freefont


ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_DOWNLOAD=true
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build


# Stage 2: Production
FROM node:22-alpine AS production
WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/modules/mail/templates ./src/modules/mail/templates

COPY .env .env 

EXPOSE 3000

# 🟢 Run migrations + start app at runtime (not build time)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]