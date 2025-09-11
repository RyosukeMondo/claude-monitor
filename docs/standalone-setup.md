# Standalone Mode Setup Guide

Complete guide for running Claude Monitor in standalone mode without Docker containers. This mode uses SQLite for database storage and in-memory caching for a lightweight development experience.

## Overview

Standalone mode provides a simplified development environment that:
- **Requires only Node.js and npm** - no Docker, PostgreSQL, or Redis
- **Auto-configures everything** - generates `.env.local` and SQLite database
- **Supports all features** - full functionality including real-time monitoring
- **Perfect for development** - faster startup, easier debugging, simpler setup

## Prerequisites

### System Requirements
- **Node.js 18.0+** - Check with `node --version`
- **npm 9.0+** - Usually included with Node.js
- **4GB RAM** - Recommended for smooth operation
- **1GB disk space** - For dependencies and database

### Operating System Support
- ✅ **Linux** (Ubuntu, Debian, CentOS, etc.)
- ✅ **macOS** (Intel and Apple Silicon)
- ✅ **Windows** (with WSL2 recommended)

### Claude Code Setup (Optional)
While not required for the monitoring system itself, you'll need Claude Code CLI installed to generate sessions to monitor:
```bash
# Install Claude Code CLI
curl -fsSL https://claude.ai/install.sh | bash

# Verify installation
claude --version
```

## Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd claude-monitor
npm install
```

### 2. Start in Standalone Mode
```bash
npm run dev
```

That's it! The application will:
1. **Detect standalone environment** automatically
2. **Generate `.env.local`** with optimal settings
3. **Create SQLite database** at `prisma/dev.db`
4. **Run database migrations** automatically
5. **Seed with sample data** for testing
6. **Start the web server** on http://localhost:3000

### 3. Access the Dashboard
Open your browser to http://localhost:3000 and you'll see:
- 🟢 **Environment Status**: "Standalone Mode Active"
- 📊 **Dashboard**: Ready to monitor Claude Code sessions
- ⚙️ **Configuration**: Auto-generated settings display

## Configuration Details

### Auto-Generated `.env.local`

When you first run `npm run dev`, the system creates:

```bash
# Claude Monitor Standalone Configuration
# Generated automatically for development without Docker

# Application Environment
NODE_ENV=development

# Server Configuration
PORT=3000
CLAUDE_MONITOR_HOST=localhost
CLAUDE_MONITOR_CORS_ORIGINS=http://localhost:3000

# Database Configuration (SQLite for standalone mode)
DATABASE_URL=file:./prisma/dev.db
CLAUDE_MONITOR_DB_MAX_CONNECTIONS=5
CLAUDE_MONITOR_DB_CONNECTION_TIMEOUT=5000

# Logging Configuration
CLAUDE_MONITOR_LOG_LEVEL=DEBUG
CLAUDE_MONITOR_LOG_CONSOLE=true
CLAUDE_MONITOR_LOG_FILE=./logs/claude-monitor.log
CLAUDE_MONITOR_LOG_MAX_SIZE_MB=100

# Monitoring Configuration
CLAUDE_MONITOR_IDLE_TIMEOUT=30
CLAUDE_MONITOR_INPUT_TIMEOUT=5
CLAUDE_MONITOR_CONTEXT_PRESSURE_TIMEOUT=10
CLAUDE_MONITOR_TASK_CHECK_INTERVAL=30
CLAUDE_MONITOR_COMPLETION_COOLDOWN=60

# Recovery Configuration
CLAUDE_MONITOR_MAX_RETRIES=3
CLAUDE_MONITOR_RETRY_BACKOFF=2.0
CLAUDE_MONITOR_COMPACT_TIMEOUT=30

# Notifications Configuration
CLAUDE_MONITOR_DESKTOP_NOTIFICATIONS=true
CLAUDE_MONITOR_LOG_ACTIONS=true
CLAUDE_MONITOR_NOTIFICATION_RATE_LIMIT=60

# Claude Configuration
CLAUDE_MONITOR_PROJECTS_PATH=~/.claude/projects
CLAUDE_MONITOR_SESSION_TIMEOUT=3600
CLAUDE_MONITOR_MAX_CONCURRENT_SESSIONS=10

# Development Mode Indicators
CLAUDE_MONITOR_STANDALONE_MODE=true
CLAUDE_MONITOR_DEVELOPMENT_MODE=true
```

### File Structure Created

```
claude-monitor/
├── .env.local              # Auto-generated configuration
├── prisma/
│   ├── dev.db             # SQLite database file
│   └── migrations/        # Database schema versions
├── logs/
│   └── claude-monitor.log # Application logs
└── data/                  # Session cache and temp files
```

## Advanced Configuration

### Custom Settings

You can modify `.env.local` after generation. Common customizations:

#### Change Server Port
```bash
PORT=3001
CLAUDE_MONITOR_CORS_ORIGINS=http://localhost:3001
```

#### Adjust Logging Level
```bash
CLAUDE_MONITOR_LOG_LEVEL=INFO  # DEBUG, INFO, WARN, ERROR
```

#### Custom Database Location
```bash
DATABASE_URL=file:./custom/path/monitoring.db
```

#### Performance Tuning
```bash
# Reduce monitoring frequency for better performance
CLAUDE_MONITOR_TASK_CHECK_INTERVAL=60
CLAUDE_MONITOR_IDLE_TIMEOUT=60

# Increase for more aggressive monitoring
CLAUDE_MONITOR_TASK_CHECK_INTERVAL=10
CLAUDE_MONITOR_IDLE_TIMEOUT=15
```

### Manual Configuration

If you prefer manual setup instead of auto-generation:

```bash
# Prevent auto-generation
touch .env.local

# Copy example configuration
cp .env.example .env.local

# Edit as needed
nano .env.local

# Run setup manually
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

## Usage Examples

### Basic Monitoring

1. **Start Claude Monitor:**
   ```bash
   npm run dev
   ```

2. **Start a Claude Code session** in another terminal:
   ```bash
   cd /path/to/your/project
   claude
   ```

3. **Monitor in the dashboard:**
   - Sessions appear automatically in the web interface
   - Real-time updates show Claude's responses
   - Session history is preserved in SQLite

### Testing with Multiple Sessions

```bash
# Terminal 1: Start Claude Monitor
cd claude-monitor
npm run dev

# Terminal 2: First Claude session
cd /path/to/project1
claude

# Terminal 3: Second Claude session  
cd /path/to/project2
claude

# Terminal 4: Check status
curl http://localhost:3000/api/sessions
```

### Development Workflow

```bash
# Start development
npm run dev

# In another terminal: run tests
npm test

# Check logs
tail -f logs/claude-monitor.log

# Reset database if needed
npm run db:reset
npm run dev
```

## Troubleshooting

### Common Issues and Solutions

#### ❌ "Port 3000 already in use"
```bash
# Find what's using the port
lsof -i :3000

# Kill the process or use different port
PORT=3001 npm run dev
```

#### ❌ "Database connection failed"
```bash
# Check database file exists and has correct permissions
ls -la prisma/dev.db

# Reset database
rm -f prisma/dev.db
npm run db:migrate
npm run db:seed
```

#### ❌ "Configuration file error"
```bash
# Remove and regenerate
rm -f .env.local
npm run dev

# Check configuration validity
npm run config:validate
```

#### ❌ "Node.js version too old"
```bash
# Check version
node --version

# Update using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install --lts
nvm use --lts

# Or download from nodejs.org
```

#### ❌ "npm install fails"
```bash
# Clear cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Check npm version
npm --version
npm install -g npm@latest
```

#### ❌ "Claude sessions not appearing"
```bash
# Check Claude Code is installed
claude --version

# Verify projects path
ls -la ~/.claude/projects/

# Check permissions
chmod 755 ~/.claude/projects/

# Enable debug logging
echo "CLAUDE_MONITOR_LOG_LEVEL=DEBUG" >> .env.local
npm run dev
```

#### ❌ "Real-time updates not working"
```bash
# Check WebSocket connection in browser console
# Should see: "WebSocket connection established"

# Test WebSocket endpoint
curl http://localhost:3000/api/ws

# Check firewall settings
sudo ufw status
```

### Performance Issues

#### Slow Startup
```bash
# Check system resources
htop

# Reduce logging
echo "CLAUDE_MONITOR_LOG_LEVEL=WARN" >> .env.local

# Clear old logs
rm -f logs/claude-monitor.log
```

#### High Memory Usage
```bash
# Monitor memory usage
npm run dev &
top -p $!

# Reduce concurrent sessions
echo "CLAUDE_MONITOR_MAX_CONCURRENT_SESSIONS=5" >> .env.local

# Increase check intervals
echo "CLAUDE_MONITOR_TASK_CHECK_INTERVAL=60" >> .env.local
```

#### Database Growing Large
```bash
# Check database size
ls -lh prisma/dev.db

# Clean old sessions (older than 7 days)
npm run db:cleanup

# Reset database entirely
npm run db:reset
```

### File Permission Issues

#### Cannot write to logs directory
```bash
mkdir -p logs
chmod 755 logs
chown $(whoami) logs
```

#### Cannot create database file
```bash
mkdir -p prisma
chmod 755 prisma
ls -la prisma/
```

#### Cannot read Claude projects
```bash
# Check Claude directory exists
ls -la ~/.claude/

# Fix permissions
chmod 755 ~/.claude/
chmod 755 ~/.claude/projects/
```

## Switching Between Modes

### From Standalone to Docker

1. **Stop standalone mode:**
   ```bash
   # Press Ctrl+C to stop npm run dev
   ```

2. **Start Docker mode:**
   ```bash
   docker-compose up -d
   ```

3. **Data migration (optional):**
   ```bash
   # Export from SQLite
   npm run db:export

   # Import to PostgreSQL (in Docker)
   docker-compose exec app npm run db:import
   ```

### From Docker to Standalone

1. **Stop Docker services:**
   ```bash
   docker-compose down
   ```

2. **Export data (optional):**
   ```bash
   docker-compose up db -d
   docker-compose exec app npm run db:export
   docker-compose down
   ```

3. **Start standalone mode:**
   ```bash
   npm run dev
   # Import data if exported above
   npm run db:import
   ```

## Development Scripts

### Available npm Scripts

```bash
# Primary commands
npm run dev              # Start in standalone mode
npm run build           # Build for production
npm run start           # Start production build

# Database management
npm run db:generate     # Generate Prisma client
npm run db:migrate      # Run database migrations
npm run db:seed         # Seed with sample data
npm run db:reset        # Reset database (destructive)
npm run db:studio       # Open database browser

# Configuration
npm run config:check    # Validate configuration
npm run config:generate # Force regenerate .env.local

# Testing
npm test               # Run unit tests
npm run test:watch     # Watch mode for tests
npm run e2e            # End-to-end tests

# Maintenance
npm run lint           # Check code style
npm run type-check     # TypeScript validation
npm run clean          # Clean build artifacts
```

### Development Workflow

1. **Daily Development:**
   ```bash
   npm run dev
   # Work on features...
   npm test
   npm run lint
   ```

2. **Before Committing:**
   ```bash
   npm run type-check
   npm test
   npm run build
   ```

3. **Database Changes:**
   ```bash
   # After schema changes
   npm run db:generate
   npm run db:migrate
   
   # Reset for testing
   npm run db:reset
   ```

## API Reference

### Configuration API
- `GET /api/config` - Current configuration
- `GET /api/config/environment` - Environment detection results
- `POST /api/config/generate` - Force regenerate configuration

### Health Endpoints
- `GET /api/health` - System health check
- `GET /api/health/database` - Database connectivity
- `GET /api/health/storage` - File system status

### Development Endpoints (Standalone Only)
- `GET /api/dev/reset` - Reset to clean state
- `GET /api/dev/logs` - Recent log entries
- `POST /api/dev/seed` - Reseed database

## Best Practices

### Security
- 🔒 **Never commit `.env.local`** - contains sensitive configuration
- 🔒 **Use `.env.example`** for template sharing
- 🔒 **Secure file permissions** - 600 for env files, 755 for directories

### Performance
- ⚡ **Monitor resource usage** - use `htop` or Activity Monitor
- ⚡ **Clean logs regularly** - prevent disk space issues
- ⚡ **Optimize check intervals** - balance responsiveness vs performance

### Development
- 🛠️ **Use consistent Node.js version** - consider using nvm
- 🛠️ **Regular database resets** - for clean testing state
- 🛠️ **Enable debug logging** - when troubleshooting issues

### Monitoring
- 📊 **Check dashboard regularly** - for session discovery
- 📊 **Monitor log files** - for error patterns
- 📊 **Validate configuration** - after changes

## Migration from Legacy Setup

### From Pre-Standalone Version

If you're migrating from a version before standalone mode support:

1. **Backup existing data:**
   ```bash
   cp .env.local .env.local.backup
   npm run db:export > backup.sql
   ```

2. **Update to latest version:**
   ```bash
   git pull origin main
   npm install
   ```

3. **Let auto-detection configure:**
   ```bash
   rm .env.local  # Remove old config
   npm run dev    # Auto-generates new config
   ```

4. **Import data if needed:**
   ```bash
   npm run db:import < backup.sql
   ```

### From Manual Configuration

If you had a manual setup, the new auto-configuration will:
- ✅ **Preserve your custom settings** in existing `.env.local`
- ✅ **Only add missing variables** needed for standalone mode
- ✅ **Update deprecated settings** to new format

## Advanced Topics

### Custom Environment Detection

Override automatic detection if needed:

```bash
# Force standalone mode
export CLAUDE_MONITOR_FORCE_STANDALONE=true
npm run dev

# Force Docker mode
export CLAUDE_MONITOR_FORCE_DOCKER=true
npm run dev
```

### Multiple Instances

Run multiple instances for different projects:

```bash
# Instance 1 (default)
PORT=3000 npm run dev

# Instance 2 (custom config)
PORT=3001 DATABASE_URL=file:./project2.db npm run dev

# Instance 3 (different project monitoring)
PORT=3002 CLAUDE_MONITOR_PROJECTS_PATH=/path/to/other/projects npm run dev
```

### Integration Testing

Test standalone mode in CI/CD:

```bash
# GitHub Actions example
- name: Test Standalone Mode
  run: |
    npm ci
    npm run dev &
    sleep 10
    curl http://localhost:3000/api/health
    npm test
```

## Getting Help

### Support Resources
1. **Built-in Help:** Visit http://localhost:3000/help when running
2. **Configuration Validator:** `npm run config:check`
3. **Log Analysis:** Check `logs/claude-monitor.log`
4. **GitHub Issues:** Report bugs or request features

### Community
- 📖 **Documentation:** Additional guides in `/docs`
- 💬 **Discussions:** GitHub Discussions for questions
- 🐛 **Bug Reports:** GitHub Issues with reproduction steps

---

**Standalone Mode** makes Claude Monitor accessible to any developer with just Node.js and npm. No containers, no complex setup - just `npm run dev` and start monitoring!