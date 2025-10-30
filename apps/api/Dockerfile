FROM oven/bun:1-alpine AS base
WORKDIR /app


FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --production



FROM base AS builder
COPY package.json bun.lock ./
RUN bun install
COPY . .
RUN bunx prisma generate
RUN bun run build



FROM node:23-alpine AS production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

CMD ["node", "dist/main"]