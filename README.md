# Claude Monitor with Docker Integration

A comprehensive Claude Code monitoring and management system with integrated Docker deployment and Claude Code launcher capabilities. This system provides web-based management of Claude Code instances, real-time JSONL monitoring, and containerized deployment with automatic setup.

## 🚀 Quick Start

### Docker Compose (Recommended)

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

### Development Setup

```bash
# Install dependencies
npm install

# Set up database
npm run db:migrate
npm run db:seed

# Start development server
npm run dev
```

## 📋 Features

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

### 🐳 Docker Integration
- **Complete Containerization**: Full Docker Compose setup with all dependencies
- **Automatic Installation**: Claude Code CLI and MCP tools installed automatically
- **Volume Persistence**: Persistent database, logs, and Claude configuration
- **Health Monitoring**: Built-in health checks for all services
- **Production Ready**: Optimized multi-stage builds with security best practices

### 🔐 Authentication & Setup
- **First-Time Setup**: Guided authentication flow for containerized environments
- **Persistent Auth**: Authentication state preserved across container restarts
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

### Environment Variables

#### Core Application
- `NODE_ENV`: Environment mode (development/production)
- `DATABASE_URL`: PostgreSQL connection string
- `CLAUDE_MONITOR_LOG_LEVEL`: Logging level (DEBUG/INFO/WARN/ERROR)
- `CLAUDE_MONITOR_LOG_CONSOLE`: Enable console logging (true/false)

#### Claude Code Launcher
- `CLAUDE_TCP_PORT`: Default TCP bridge port (default: 9999)
- `CLAUDE_AUTO_INSTALL`: Auto-install Claude Code CLI (true/false)
- `CLAUDE_LAUNCHER_ENABLED`: Enable launcher functionality (true/false)
- `CLAUDE_MAX_INSTANCES`: Maximum concurrent instances (default: 10)

#### Container Runtime
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

### Common Issues

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