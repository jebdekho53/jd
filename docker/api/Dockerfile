# Placeholder — full Dockerfile generated in Phase 1
# Multi-stage build: deps → build → production

FROM node:20-alpine AS base
WORKDIR /app

# Phase 1 will implement:
# - pnpm install
# - prisma generate
# - nest build
# - non-root user

FROM base AS production
CMD ["node", "dist/main.js"]
