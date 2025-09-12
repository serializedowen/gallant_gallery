# Use Node.js 20 Alpine image for smaller size and better performance
FROM node:22-alpine

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

# Copy package files for all components
COPY package*.json ./
COPY server/package*.json ./server/
COPY server/tsconfig.json ./server/
COPY client/package*.json ./client/
COPY client/tsconfig.json ./client/

# Install all dependencies (root, server, and client)
RUN npm i

# Install server dependencies
RUN cd server && npm i

# Install client dependencies
RUN cd client && npm i

# Copy application code
COPY . .

# Build the client (React app) first
RUN cd client && npm run build

# Build the server (TypeScript compilation)
RUN cd server && npm run build

# Verify that the builds were successful
RUN ls -la /app/client/build/ && ls -la /app/dist/

# Remove dev dependencies to reduce image size (client first, then server, then root)
RUN cd client && npm i --only=production && npm cache clean --force
RUN cd server && npm i --only=production && npm cache clean --force
RUN npm i --only=production && npm cache clean --force

# Create cache directory with proper permissions
RUN mkdir -p /app/cache && \
    chmod 755 /app/cache

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S gallant -u 1001 -G nodejs



# Move server dependencies into /app/dist folder
RUN mv server/node_modules dist/node_modules

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
CMD ["node", "dist/server.js"]
