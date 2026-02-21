# OpenClaw Inspector Service
# Runs the AI inspection assistant with WhatsApp integration

FROM node:22-alpine

# Install dependencies for Puppeteer (PDF generation)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tell Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Install OpenClaw globally
RUN npm install -g openclaw

# Create app directory
WORKDIR /app

# Copy and build MCP server first (changes less frequently)
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

COPY server/ ./server/
RUN cd server && npm run build

# Copy agent configuration (SOUL.md, SKILL.md, openclaw.yml)
COPY agents/inspector/ ./agents/inspector/

# Copy OpenClaw config
COPY deploy/openclaw-inspector/openclaw.yml ./openclaw.yml

# WhatsApp auth persistence - mount volume to /app/auth
ENV OPENCLAW_AUTH_DIR=/app/auth
RUN mkdir -p /app/auth

# Health check - OpenClaw exposes /health on gateway
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Expose gateway port
EXPOSE 3000

# Start OpenClaw gateway
CMD ["openclaw", "gateway", "start", "--config", "/app/openclaw.yml"]
