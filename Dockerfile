# Use Node.js 20 Alpine image for smaller size and better performance
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install build dependencies for native modules (like jimp)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    pkgconfig \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create cache directory with proper permissions
RUN mkdir -p /app/cache && \
    chmod 755 /app/cache

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S gallant -u 1001 -G nodejs

# Change ownership of app directory to the nodejs user
RUN chown -R gallant:nodejs /app

# Switch to non-root user
USER gallant

# Expose port (will be configurable via environment)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the application
CMD ["node", "server.js"]
