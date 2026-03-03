# Development stage — uses host node_modules via volume mount
FROM casey-api:latest AS dev

WORKDIR /app

ENV NODE_ENV=development
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

EXPOSE 3001

CMD ["sh", "-c", "cd /app/web && /app/node_modules/.bin/next dev -p 3001"]

# Production stage (future use)
FROM casey-api:latest AS production

WORKDIR /app

COPY --from=0 /app/web/.next ./.next
COPY --from=0 /app/web/public ./public
COPY --from=0 /app/web/package*.json ./
COPY --from=0 /app/web/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["npm", "start"]
