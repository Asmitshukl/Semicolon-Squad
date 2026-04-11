# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY ../prisma ../prisma

# Install dependencies
RUN npm install --production=false

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Create required directories
RUN mkdir -p uploads/voice uploads/evidence

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget -q --spider http://localhost:5000/api/health || exit 1

# Run the application
CMD ["node", "dist/server.js"]
