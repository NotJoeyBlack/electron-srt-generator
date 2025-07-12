FROM node:18-bullseye

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    libgconf-2-4 \
    libxtst6 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxi6 \
    libxrender1 \
    libx11-xcb1 \
    libxcb-dri3-0 \
    libxcb-present0 \
    libxcb-shm0 \
    libxcb-sync1 \
    libxcb-xfixes0 \
    libxss1 \
    libxrandr2 \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Install Playwright dependencies
RUN npx playwright install-deps

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Install Playwright browsers
RUN npx playwright install

# Copy source code
COPY . .

# Create test directories
RUN mkdir -p test-data test-reports test-results

# Set environment variables
ENV NODE_ENV=test
ENV DISPLAY=:99
ENV ELECTRON_DISABLE_SECURITY_WARNINGS=1

# Create entrypoint script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Start Xvfb for headless testing\n\
Xvfb :99 -screen 0 1024x768x24 &\n\
export DISPLAY=:99\n\
\n\
# Wait for Xvfb to start\n\
sleep 2\n\
\n\
# Run tests\n\
exec "$@"' > /entrypoint.sh && chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

# Default command
CMD ["npm", "test"]

# Expose port for mock API
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check: OK')" || exit 1