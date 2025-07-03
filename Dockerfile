# Use Node.js 18 Debian for better Prisma compatibility
FROM node:18-slim AS base

# Install system dependencies needed for build and runtime
FROM base AS builder
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean
WORKDIR /app

# Copy package files and install ALL dependencies (not just production)
COPY package.json package-lock.json* ./
RUN npm ci && npm cache clean --force

COPY . .

# Generate Prisma Client for Debian environment
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Install runtime dependencies for Prisma
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

ENV NODE_ENV production

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

# Copy the built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma schema and generated client (from Debian-built environment)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"] 