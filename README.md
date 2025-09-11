# Claude Monitor

A comprehensive Claude Code monitoring and management system with flexible deployment options. Run with Docker containers or standalone with just `npm run dev` for simplified development environments. Features web-based management of Claude Code instances, real-time JSONL monitoring, and automatic setup for both containerized and standalone modes.

## 🚀 Quick Start

### Standalone Mode (Simplest)

**No Docker required** - Perfect for development and testing:

1. **Clone and start:**
   ```bash
   git clone <repository-url>
   cd claude-monitor
   npm install
   npm run dev
   ```

2. **Auto-setup runs automatically:**
   - SQLite database created and seeded
   - Configuration generated in `.env.local`
   - File-based storage with in-memory caching

3. **Access the dashboard:**
   - Open http://localhost:3000
   - Start monitoring Claude Code sessions immediately

### Docker Compose (Production)

**Full containerization** with PostgreSQL and Redis:

1. **Clone and start the system:**
   ```bash
   git clone <repository-url>
   cd claude-monitor
   docker-compose up -d
   ```

2. **Access the web interface:**
   - Open http://localhost:3000 in your browser
   - The system will guide you through Claude Code authentication if needed

3. **Launch Claude Code instances:**
   - Click "Add Claude Instance" in the dashboard
   - Select your project directory
   - Configure TCP bridge port (default: 9999)
   - Start monitoring your Claude sessions

## 📋 Features

### 🚀 Flexible Deployment
- **Standalone Mode**: Run with just `npm run dev` - no Docker required
- **Docker Integration**: Full containerization with PostgreSQL and Redis
- **Auto-Detection**: Automatically configures based on environment
- **Zero-Config Setup**: Automatic database and configuration generation

### 🔧 Claude Code Launcher
- **Native TypeScript Implementation**: Launch Claude Code instances with TCP bridge functionality
- **Web-Based Management**: Add, remove, and monitor Claude Code instances from the web UI
- **TCP Command Interface**: Send commands programmatically (send, enter, up, down, ctrl-c, tab)
- **Process Lifecycle Management**: Automatic startup, health monitoring, and graceful shutdown
- **Multi-Instance Support**: Run up to 10 concurrent Claude Code instances

### 📊 JSONL Monitoring
- **Automatic Discovery**: Detects new Claude Code sessions in `~/.claude/projects/`
- **Real-Time Updates**: Live monitoring of JSONL log files with WebSocket updates
- **Session Tracking**: Persistent session history and metadata
- **Multi-Project Support**: Monitor sessions across different project directories

### 💾 Storage Flexibility
- **SQLite for Development**: File-based database for standalone mode
- **PostgreSQL for Production**: Scalable database for containerized deployments
- **In-Memory Caching**: Memory-based sessions for standalone development
- **Redis Caching**: Distributed caching for production environments

### 🐳 Docker Integration
- **Complete Containerization**: Full Docker Compose setup with all dependencies
- **Automatic Installation**: Claude Code CLI and MCP tools installed automatically
- **Volume Persistence**: Persistent database, logs, and Claude configuration
- **Health Monitoring**: Built-in health checks for all services
- **Production Ready**: Optimized multi-stage builds with security best practices

### 🔐 Authentication & Setup
- **Zero-Configuration**: Auto-generates configuration files for standalone mode
- **First-Time Setup**: Guided authentication flow for containerized environments
- **Persistent Auth**: Authentication state preserved across restarts
- **Clear Instructions**: Step-by-step setup guidance with troubleshooting

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web UI        │    │  Launcher API   │    │ Claude Launcher │
│   Dashboard     │◄──►│     Routes      │◄──►│    Service      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WebSocket     │    │ JSONL Monitor   │    │   TCP Bridge    │
│    Server       │◄──►│    Service      │    │    Server       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │    Redis        │    │ Claude Code     │
│   Database      │    │   (Optional)    │    │   Process       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Configuration

### Standalone Mode Configuration

Standalone mode automatically generates `.env.local` with optimal settings:

```bash
# Auto-generated configuration for standalone mode
NODE_ENV=development
PORT=3000
DATABASE_URL=file:./prisma/dev.db
CLAUDE_MONITOR_STANDALONE_MODE=true
CLAUDE_MONITOR_LOG_LEVEL=DEBUG
CLAUDE_MONITOR_LOG_CONSOLE=true
```

### Environment Variables

#### Core Application
- `NODE_ENV`: Environment mode (development/production)
- `DATABASE_URL`: Database connection (SQLite file: or PostgreSQL string)
- `CLAUDE_MONITOR_LOG_LEVEL`: Logging level (DEBUG/INFO/WARN/ERROR)
- `CLAUDE_MONITOR_LOG_CONSOLE`: Enable console logging (true/false)
- `CLAUDE_MONITOR_STANDALONE_MODE`: Enable standalone mode features (true/false)

#### Claude Code Launcher
- `CLAUDE_TCP_PORT`: Default TCP bridge port (default: 9999)
- `CLAUDE_AUTO_INSTALL`: Auto-install Claude Code CLI (true/false)
- `CLAUDE_LAUNCHER_ENABLED`: Enable launcher functionality (true/false)
- `CLAUDE_MAX_INSTANCES`: Maximum concurrent instances (default: 10)

#### Container Runtime (Docker Mode Only)
- `TERM`: Terminal type for Claude Code TTY (default: xterm-256color)
- `DEBIAN_FRONTEND`: Package manager frontend (default: noninteractive)

### Docker Compose Services

#### App Service
- **Ports**: 3000 (web UI), 9999 (TCP bridge)
- **Volumes**: ~/.claude (Claude config), database data, logs
- **Capabilities**: SYS_PTRACE for process management
- **Health Check**: HTTP endpoint monitoring

#### Database Service
- **Image**: PostgreSQL 16 Alpine
- **Port**: 5432
- **Persistence**: Volume-mounted data directory
- **Health Check**: pg_isready monitoring

#### Redis Service (Optional)
- **Image**: Redis 7 Alpine
- **Port**: 6379
- **Persistence**: Volume-mounted data directory
- **Health Check**: Redis ping monitoring

## 📖 Usage Guide

### Managing Claude Code Instances

#### Creating a New Instance
1. Navigate to the dashboard
2. Click "Add Claude Instance"
3. Configure the instance:
   - **Project Path**: Select your project directory
   - **Display Name**: Optional friendly name
   - **TCP Port**: Port for command interface (auto-assigned if not specified)
   - **Auto Restart**: Enable automatic restart on crash
   - **Environment Variables**: Custom environment settings
   - **Claude Arguments**: Additional CLI arguments

#### Sending TCP Commands
```javascript
// Connect to TCP bridge
const socket = new net.Socket();
socket.connect(9999, 'localhost');

// Send commands
socket.write(JSON.stringify({ type: 'send', content: '/help' }));
socket.write(JSON.stringify({ type: 'enter' }));
socket.write(JSON.stringify({ type: 'ctrl-c' }));
```

#### Command Types
- `send`: Send text to Claude Code
- `enter`: Press Enter key
- `up`/`down`: Arrow key navigation
- `ctrl-c`: Send interrupt signal
- `tab`: Tab completion
- `raw`: Send raw input

### JSONL Monitoring

The system automatically monitors JSONL files in:
```
~/.claude/projects/{project-folder-path-with-dashes}/{session_id}.jsonl
```

#### Session Discovery
- **Automatic**: New sessions detected via file system watching
- **Real-time**: Updates processed with <100ms latency
- **Multi-project**: Supports monitoring across different project directories
- **Historical**: Session data preserved for analysis

### API Endpoints

#### Launcher Management
- `POST /api/launcher/instances` - Create new instance
- `GET /api/launcher/instances` - List active instances
- `DELETE /api/launcher/instances/:id` - Stop instance
- `POST /api/launcher/instances/:id/commands` - Send TCP command

#### Session Monitoring
- `GET /api/sessions` - List monitored sessions
- `GET /api/sessions/:id` - Get session details
- `GET /api/projects` - List monitored projects

## 🚨 Troubleshooting

### Standalone Mode Issues

#### Application Won't Start
```bash
# Check Node.js version (requires 18+)
node --version

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

#### Database Errors
```bash
# Reset SQLite database
rm -f prisma/dev.db
npm run db:migrate
npm run db:seed

# Check database file permissions
ls -la prisma/dev.db
```

#### Configuration Problems
```bash
# Remove and regenerate config
rm -f .env.local
npm run dev  # Auto-generates new config

# Check configuration status
npm run config:check
```

#### Port Already in Use
```bash
# Find what's using port 3000
lsof -i :3000

# Start on different port
PORT=3001 npm run dev
```

#### File Permission Issues
```bash
# Fix directory permissions
chmod 755 ~/.claude/projects/
chmod 755 ./prisma/
mkdir -p ./logs && chmod 755 ./logs/
```

### Docker Mode Issues

#### Claude Code Installation Failed
```bash
# Check installation status
docker-compose logs app | grep claude

# Manual installation inside container
docker-compose exec app bash
curl -fsSL https://claude.ai/install.sh | bash
```

#### Authentication Required
1. Check container logs for authentication URL:
   ```bash
   docker-compose logs app | grep auth
   ```
2. Visit the provided URL to authenticate
3. Authentication state persists across restarts

#### TCP Bridge Connection Failed
```bash
# Check if port is available
docker-compose exec app netstat -ln | grep 9999

# Check instance status
curl http://localhost:3000/api/launcher/instances
```

#### JSONL Monitoring Not Working
1. Verify Claude directory mount:
   ```bash
   docker-compose exec app ls -la /root/.claude
   ```
2. Check file permissions:
   ```bash
   docker-compose exec app chown -R nextjs:nodejs /home/nextjs/.claude
   ```

#### Database Connection Issues
```bash
# Check database health
docker-compose exec db pg_isready -U claude_monitor

# Reset database
docker-compose down -v
docker-compose up -d
```

### Performance Tuning

#### Memory Optimization
- **Max Instances**: Reduce `CLAUDE_MAX_INSTANCES` for limited memory
- **Log Retention**: Configure log rotation for long-running containers
- **Database**: Tune PostgreSQL settings for your workload

#### Network Optimization
- **Port Conflicts**: Use environment variables to change default ports
- **Firewall**: Ensure ports 3000 and 9999 are accessible
- **DNS**: Configure proper hostname resolution for container networking

### Log Analysis

#### Container Logs
```bash
# Application logs
docker-compose logs -f app

# Database logs
docker-compose logs -f db

# All services
docker-compose logs -f
```

#### Application Logs
- **Location**: `/app/logs` (mounted to `claude_monitor_logs` volume)
- **Format**: JSON structured logging with Pino
- **Levels**: DEBUG, INFO, WARN, ERROR

## 🧪 Testing

### Unit Tests
```bash
npm test
npm run test:coverage
```

### Integration Tests
```bash
npm run e2e
npm run e2e:headed  # With browser UI
npm run e2e:debug   # Debug mode
```

### Docker Environment Testing
```bash
# Test Docker Compose setup
docker-compose -f docker-compose.dev.yml up -d
npm run e2e

# Test production build
docker-compose up -d
curl http://localhost:3000/api/health
```

## 🔧 Development

### Project Structure
```
├── src/
│   ├── components/         # React components
│   │   └── launcher/       # Launcher UI components
│   └── pages/             # Next.js pages
├── lib/
│   ├── services/          # Business logic services
│   │   ├── claude-launcher.ts
│   │   ├── launcher-monitor.ts
│   │   └── tcp-server.ts
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── __tests__/             # Unit tests
├── e2e/                   # End-to-end tests
├── prisma/                # Database schema and migrations
├── docker-compose.yml     # Production Docker setup
├── docker-compose.dev.yml # Development Docker setup
└── Dockerfile             # Container image definition
```

### Contributing

1. **Setup Development Environment:**
   ```bash
   git clone <repository-url>
   cd claude-monitor
   npm install
   npm run db:migrate
   ```

2. **Run Tests:**
   ```bash
   npm test
   npm run e2e
   ```

3. **Submit Changes:**
   - Create feature branch
   - Add tests for new functionality
   - Ensure all tests pass
   - Submit pull request

### Code Quality

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code style enforcement
- **Prettier**: Code formatting
- **Jest**: Unit testing framework
- **Playwright**: End-to-end testing
- **Prisma**: Type-safe database access

## 📈 Performance Characteristics

### System Limits
- **Concurrent Instances**: Up to 10 Claude Code instances
- **JSONL Processing**: <100ms latency for file updates
- **TCP Command Latency**: <10ms command forwarding
- **Web Interface**: <200ms response time for status updates

### Resource Requirements
- **Memory**: 512MB minimum, 2GB recommended
- **CPU**: 1 core minimum, 2 cores recommended
- **Storage**: 10GB for logs and database
- **Network**: Ports 3000, 5432, 6379, 9999

### Scaling Considerations
- **Horizontal**: Deploy multiple instances with shared database
- **Vertical**: Increase container resources for more concurrent instances
- **Storage**: Configure log rotation and database maintenance
- **Monitoring**: Use built-in health checks and metrics endpoints

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

## 🆘 Support

- **Issues**: Report bugs and feature requests via GitHub Issues
- **Documentation**: Additional documentation in `/docs` directory
- **Community**: Join discussions in GitHub Discussions
- **Professional Support**: Contact maintainers for enterprise support

---

**Claude Monitor** - Comprehensive Claude Code monitoring and management with Docker integration