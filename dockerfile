FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY .env .env  # optional for local dev only

EXPOSE 3000

# ✅ Use JSON form for CMD (prevents OS signal issues)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]