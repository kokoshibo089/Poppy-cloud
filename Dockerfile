FROM node:20-slim

# Install system dependencies for node-pty and general linux usage
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    bash \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first for better caching
COPY services/workload-runner/package*.json ./

# Install dependencies - allow native build failures but don't stop the process
RUN npm install || true

# Copy source code
COPY services/workload-runner/ ./

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Use the start script defined in package.json
CMD ["npm", "start"]
