# ─── Development stage ────────────────────────────────────────────────────────
FROM node:22-alpine AS dev

WORKDIR /app

# Install deps from monorepo root
COPY package*.json ./
COPY shared ./shared/
COPY web/package*.json ./web/

RUN npm install

# Source is volume-mounted at runtime
ENV NODE_ENV=development
ENV PORT=3001

EXPOSE 3001

WORKDIR /app/web
CMD ["npm", "run", "dev", "--", "-p", "3001"]

# ─── Build stage ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY shared ./shared/
COPY web ./web/

RUN npm install
RUN npm run build --workspace=shared
RUN npm run build --workspace=web

# ─── Production stage ─────────────────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app/web

COPY --from=builder /app/web/.next ./.next
COPY --from=builder /app/web/public ./public
COPY --from=builder /app/web/package*.json ./
COPY --from=builder /app/web/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["npm", "start"]
