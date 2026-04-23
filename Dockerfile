# Stage 1: Build
FROM node:25-alpine AS builder
WORKDIR /app

# Install build tools
RUN apk add --no-cache brotli curl

# Install dependencies
COPY package*.json ./
RUN npm install

# Fetch and compress AI models
COPY scripts/fetch-models.sh scripts/fetch-models.sh
RUN npm run fetch-models

# Build application
COPY . .
RUN npm run build

# Stage 2: Serve
FROM alpine:latest

# Install Nginx with Brotli support
RUN apk add --no-cache nginx nginx-mod-http-brotli

# Load Brotli module
RUN sed -i '1i load_module /usr/lib/nginx/modules/ngx_http_brotli_static_module.so;' /etc/nginx/nginx.conf

# Deploy build artifacts
RUN mkdir -p /usr/share/nginx/html
COPY --from=builder /app/build /usr/share/nginx/html

# Configure Nginx
COPY nginx.conf /etc/nginx/http.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
