FROM postgres:18-alpine

# Copy schema files so a fresh container auto-initializes the database
COPY sql /docker-entrypoint-initdb.d

# Install curl for optional health checks within the container
RUN apk add --no-cache curl