# Stage 1: Build the React application
FROM node:23-alpine AS build

WORKDIR /app

# Copy package.json and yarn.lock
COPY app/frontend/package.json app/frontend/yarn.lock ./

# Copy .env file for Vite environment variables
COPY .env .env

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the frontend application code
COPY app/frontend/. .

# Build the application
RUN yarn build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the build output from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the custom Nginx configuration
COPY app/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
