# Claude Monitor Deployment Guide

This guide explains how to deploy the Claude Monitor application using Docker and docker-compose.

## Quick Start

### Development Environment

```bash
# Clone the repository
git clone <repository-url>
cd claude-monitor

# Start development environment
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### Production Environment

```bash
# Build and start production environment
docker-compose up --build -d

# Check logs
docker-compose logs -f app

# Stop services
docker-compose down
```

## Configuration

The application uses environment variables for configuration. Key settings:

### Monitoring Configuration
- `CLAUDE_MONITOR_IDLE_TIMEOUT`: Idle timeout in seconds (default: 30)
- `CLAUDE_MONITOR_INPUT_TIMEOUT`: Input timeout in seconds (default: 5)
- `CLAUDE_MONITOR_TASK_CHECK_INTERVAL`: Task check interval in seconds (default: 30)

### Server Configuration
- `PORT`: Application port (default: 3000)
- `CLAUDE_MONITOR_HOST`: Host binding (default: 0.0.0.0)
- `CLAUDE_MONITOR_CORS_ORIGINS`: Comma-separated CORS origins

### Database Configuration
- `DATABASE_URL`: Database connection string
- `CLAUDE_MONITOR_DB_MAX_CONNECTIONS`: Max database connections (default: 10)

### Claude Integration
- `CLAUDE_MONITOR_PROJECTS_PATH`: Path to Claude projects (default: ~/.claude/projects)
- `CLAUDE_MONITOR_SESSION_TIMEOUT`: Session timeout in seconds (default: 3600)

## Docker Commands

### Build Application
```bash
cd app
docker build -t claude-monitor .
```

### Run Application Only
```bash
docker run -p 3000:3000 \
  -v ~/.claude:/app/.claude:ro \
  -e NODE_ENV=production \
  claude-monitor
```

### Full Stack with Docker Compose
```bash
# Production
docker-compose up -d

# Development with hot reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# View logs
docker-compose logs -f app

# Scale services
docker-compose up -d --scale app=3

# Clean up
docker-compose down -v
```

## Health Checks

The application includes health check endpoints:

- **HTTP**: `GET /api/health`
- **Container**: Built-in Docker health checks

Monitor application health:
```bash
# Check container health
docker-compose ps

# Application health endpoint
curl http://localhost:3000/api/health

# Detailed health information
curl http://localhost:3000/api/health?detailed=true
```

## Production Deployment

### Prerequisites
1. Docker and Docker Compose installed
2. Access to Claude projects directory (`~/.claude/projects`)
3. PostgreSQL database (if using external database)

### Deployment Steps
1. **Clone repository**
2. **Configure environment variables** (create `.env` file)
3. **Build and deploy** with docker-compose
4. **Run database migrations**
5. **Monitor application logs**

### Example .env file
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@db:5432/claude_monitor
CLAUDE_MONITOR_LOG_LEVEL=INFO
CLAUDE_MONITOR_PROJECTS_PATH=/app/.claude/projects
CLAUDE_MONITOR_SESSION_TIMEOUT=3600
```

## Troubleshooting

### Common Issues

1. **Container won't start**
   - Check Docker logs: `docker-compose logs app`
   - Verify environment variables
   - Ensure Claude projects directory is mounted

2. **Database connection failed**
   - Verify DATABASE_URL
   - Check database container status: `docker-compose ps db`
   - Run migrations: `docker-compose exec app npx prisma migrate deploy`

3. **File system permissions**
   - Ensure Claude projects directory is readable: `chmod -R +r ~/.claude`
   - Check container user permissions

4. **Performance issues**
   - Monitor resource usage: `docker stats`
   - Scale application: `docker-compose up -d --scale app=3`
   - Check database performance

### Logs and Monitoring
```bash
# Application logs
docker-compose logs -f app

# Database logs
docker-compose logs -f db

# All services logs
docker-compose logs -f

# Follow specific container
docker logs -f claude-monitor-app
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files with sensitive data
2. **File System**: Claude projects directory is mounted read-only
3. **Network**: Default configuration binds to all interfaces (0.0.0.0)
4. **Database**: Use strong passwords and restrict access
5. **HTTPS**: Configure reverse proxy (nginx/traefik) for SSL termination

## Scaling and Performance

### Horizontal Scaling
```bash
# Scale application containers
docker-compose up -d --scale app=3

# Use load balancer (nginx example in nginx.conf)
```

### Performance Optimization
- Enable Redis for caching and sessions
- Use PostgreSQL for production database
- Configure appropriate resource limits
- Monitor application metrics

## Backup and Recovery

### Database Backup
```bash
# PostgreSQL backup
docker-compose exec db pg_dump -U claude_monitor claude_monitor > backup.sql

# Restore
docker-compose exec -T db psql -U claude_monitor claude_monitor < backup.sql
```

### Volume Backup
```bash
# Backup volumes
docker run --rm -v claude_monitor_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/data.tar.gz -C /data .

# Restore volumes
docker run --rm -v claude_monitor_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/data.tar.gz -C /data
```