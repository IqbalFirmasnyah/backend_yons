# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build NestJS (outputs to /dist)
RUN npm run build


# Stage 2: Production
FROM node:22-alpine AS production
WORKDIR /app

# Copy only needed files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY .env .env

# Generate Prisma client again (safe, ensures runtime client exists)
RUN npx prisma generate

# Apply database migrations
RUN npx prisma migrate deploy

# Expose port
EXPOSE 3000

# Run app
CMD ["node", "dist/src/main.js"]