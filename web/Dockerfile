# Development stage
FROM node:20-alpine AS dev

WORKDIR /app

# Copy monorepo package files for install
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY web/package*.json ./web/
COPY api/package*.json ./api/

# Install all workspace deps (Linux-native binaries built here)
RUN npm install --ignore-scripts
RUN npm install --workspace=web --include=dev --ignore-scripts

ENV NODE_ENV=development
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

EXPOSE 3001

CMD ["sh", "-c", "cd /app/web && /app/node_modules/.bin/next dev -p 3001"]
