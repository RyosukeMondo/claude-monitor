# Use the official Node.js image as the base image
FROM node:20-alpine AS base

# Metadata labels for container optimization
LABEL org.opencontainers.image.description="Claude Monitor with integrated Claude Code launcher"
LABEL org.opencontainers.image.version="1.0.0"
LABEL maintainer="claude-monitor"

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine
RUN apk add --no-cache libc6-compat curl bash
WORKDIR /app

# Install all dependencies (including dev) for build
COPY package.json package-lock.json* ./
RUN npm ci && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Claude Code installation stage
FROM base AS claude-setup
WORKDIR /tmp

# Install Claude Code CLI and MCP tools in single layer
RUN apk add --no-cache curl bash ca-certificates python3 py3-pip git && \
    curl -fsSL https://claude.ai/install.sh | bash && \
    mkdir -p /opt/claude-tools && \
    apk del curl && \
    rm -rf /var/cache/apk/* /tmp/*

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install runtime dependencies and create users in single layer
RUN apk add --no-cache bash ca-certificates python3 git procps && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    rm -rf /var/cache/apk/*

# Copy Claude Code installation
COPY --from=claude-setup /root/.local/bin/claude /usr/local/bin/claude
COPY --from=claude-setup /opt/claude-tools /opt/claude-tools

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache and create directories
RUN mkdir -p .next /home/nextjs/.claude/projects && \
    chown -R nextjs:nodejs .next /home/nextjs/.claude

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Set up TTY and Claude Code environment
ENV TERM=xterm-256color
ENV FORCE_COLOR=1
ENV CLAUDE_HOME=/home/nextjs/.claude
ENV PATH="/usr/local/bin:$PATH"

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create startup script for Claude Code initialization
COPY --chown=nextjs:nodejs <<EOF /app/claude-init.sh
#!/bin/bash
# Initialize Claude Code if not authenticated
if [ ! -f "\$CLAUDE_HOME/config.json" ]; then
    echo "Claude Code first-time setup required"
    echo "Please visit the container logs for authentication instructions"
fi

# Start the main application
exec node server.js
EOF

RUN chmod +x /app/claude-init.sh

# Server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["/app/claude-init.sh"]