# Development stage — uses host node_modules via volume mount
FROM casey-api:latest AS dev


WORKDIR /app

ENV NODE_ENV=development
ENV PORT=3000

EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["/workspace/node_modules/.bin/tsx", "watch", "src/index.ts"]

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install all deps (including devDependencies)
RUN npm install

# Source is volume-mounted at runtime — no COPY needed
# Migrations + seed run via entrypoint script

ENV NODE_ENV=development
ENV PORT=3000

EXPOSE 3000

CMD ["/workspace/node_modules/.bin/tsx", "watch", "src/index.ts"]

# ─── Build stage ──────────────────────────────────────────────────────────────
FROM casey-api:latest AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .
RUN npm run build

# ─── Production stage ─────────────────────────────────────────────────────────
FROM casey-api:latest AS production

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/tsconfig.json ./tsconfig.json

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/index.js"]
