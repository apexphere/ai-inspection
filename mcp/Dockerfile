# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Copy package files and install production deps
COPY package*.json ./
RUN npm ci --omit=dev && \
    # Rebuild better-sqlite3 for this platform
    npm rebuild better-sqlite3 && \
    # Clean up build tools
    apk del python3 make g++ && \
    rm -rf /root/.npm /tmp/*

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/storage/schema.sql ./dist/storage/

# Create data directory
RUN mkdir -p /app/data && chown -R node:node /app

# Run as non-root user
USER node

# Environment
ENV NODE_ENV=production
ENV DATA_DIR=/app/data

# MCP servers use stdio, but expose port for potential HTTP transport
EXPOSE 3100

CMD ["node", "dist/index.js"]
