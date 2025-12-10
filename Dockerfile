FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build argument for VietMap API key
ARG NEXT_PUBLIC_VIETMAP_API_KEY
ENV NEXT_PUBLIC_VIETMAP_API_KEY=$NEXT_PUBLIC_VIETMAP_API_KEY

# Build Next.js application
RUN bun run build

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose ports
EXPOSE 3000

# Use entrypoint script
ENTRYPOINT ["docker-entrypoint.sh"]
