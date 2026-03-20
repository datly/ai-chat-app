FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Set build-time environment variable
ARG REACT_APP_API_BASE_URL=http://localhost:5005
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL

# Build the application
RUN npm run build

# Production stage - serve with simple http server
FROM node:18-alpine

WORKDIR /app

# Install serve
RUN npm install -g serve

# Copy built files
COPY --from=build /app/build ./build

EXPOSE 3000

# Serve the application
CMD ["serve", "-s", "build", "-l", "3000"]
