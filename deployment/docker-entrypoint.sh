#!/bin/bash
set -e

# Docker entrypoint script for Claude Monitor
# Handles database initialization and application startup

echo "🚀 Starting Claude Monitor deployment setup..."

# Wait for database to be ready (if using PostgreSQL)
if [ "$NODE_ENV" = "production" ] && [ -n "$DATABASE_URL" ] && [[ "$DATABASE_URL" == *"postgresql"* ]]; then
    echo "⏳ Waiting for PostgreSQL database to be ready..."
    
    # Extract database connection details from DATABASE_URL
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    
    # Wait for PostgreSQL
    until pg_isready -h "$DB_HOST" -p "$DB_PORT" > /dev/null 2>&1; do
        echo "⏳ Waiting for PostgreSQL at $DB_HOST:$DB_PORT..."
        sleep 2
    done
    
    echo "✅ PostgreSQL is ready!"
fi

# Run database migrations
if [ -f "prisma/schema.prisma" ]; then
    echo "🔄 Running database migrations..."
    if [ "$NODE_ENV" = "production" ]; then
        npx prisma migrate deploy
    else
        npx prisma migrate dev
    fi
    echo "✅ Database migrations completed!"
else
    echo "⚠️  No Prisma schema found, skipping migrations"
fi

# Seed database if needed (only in development or if explicitly requested)
if [ "$NODE_ENV" != "production" ] || [ "$SEED_DATABASE" = "true" ]; then
    if [ -f "lib/database/seed.ts" ]; then
        echo "🌱 Seeding database..."
        npm run db:seed
        echo "✅ Database seeded!"
    fi
fi

# Start the application
echo "🎉 Starting Claude Monitor application..."
exec "$@"