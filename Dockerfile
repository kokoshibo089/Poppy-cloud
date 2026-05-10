# 1. Base Image: Use a full Node.js image to have access to build tools
FROM node:20-slim

# 2. Install essential Linux tools for the "Cloud Linux" experience
RUN apt-get update && apt-get install -y \
    bash \
    git \
    curl \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 3. Create app directory
WORKDIR /app

# 4. Copy package files and install dependencies
COPY services/workload-runner/package*.json ./
RUN npm install --production

# 5. Copy the rest of the source code
COPY services/workload-runner/ ./

# 6. Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# 7. Expose the port
EXPOSE 3000

# 8. Start the kernel
CMD ["node", "src/index.js"]
