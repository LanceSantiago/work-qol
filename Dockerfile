# Base image for local development
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

EXPOSE 5173

# Run Vite dev server, binding to 0.0.0.0 so it's reachable from the host
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
