# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY eslint.config.js ./
COPY public ./public

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src
COPY index.html ./

# Build the frontend
ARG VITE_API_URL=http://localhost:5000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Runtime stage - Serve with nginx
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Copy built app from builder
COPY --from=builder /app/dist .

# Copy nginx configuration
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/javascript application/json;
    gzip_min_length 1000;

    # Cache static assets
    location ~* \\.(?:js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing - all routes go to index.html
    location / {
        try_files \$uri \$uri/ /index.html;
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
EOF

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD wget -q --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
