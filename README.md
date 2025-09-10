# Claude Monitor

**Next.js Web Dashboard for Automated Claude Code Recovery**

Claude Monitor is a modern web-based monitoring and recovery system built with Next.js that watches your Claude Code sessions in real-time. It provides a sophisticated dashboard for monitoring multiple projects, automatically detecting states like context pressure, input waiting, and errors, then executing appropriate recovery actions through an intuitive web interface.

## 🚀 Quick Start

### Web Dashboard Setup

**1. Install Dependencies and Setup Database:**
```bash
# Navigate to the app directory
cd app

# Install Node.js dependencies
npm install

# Setup the database
npm run db:generate
npm run db:migrate
npm run db:seed
```

**2. Start the Development Server:**
```bash
# Start Next.js development server
npm run dev

# Open your browser to http://localhost:3000
```

**3. Configure Project Monitoring:**
- Navigate to the Dashboard tab
- Add your project paths for monitoring
- Configure recovery settings for each project
- The system will automatically discover Claude Code sessions

### Legacy Python Monitor (Deprecated)

The original Python-based monitor is still available for reference but is being phased out in favor of the Next.js dashboard:

```bash
# Legacy Python monitor (for historical reference)
python3 run_monitor.py --config config/claude-monitor.yml
```

## 📋 Prerequisites

- Node.js 18+ and npm
- Claude Code CLI installed and configured
- Linux/macOS/WSL environment (for file system monitoring)
- Modern web browser (Chrome, Firefox, Safari, Edge)

## 🛠️ Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd claude-monitor
```

2. **Setup the Next.js application:**
```bash
cd app
npm install
```

3. **Initialize the database:**
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

4. **Start the development server:**
```bash
npm run dev
```

5. **Access the web dashboard:**
Open your browser to http://localhost:3000

## 🎯 Features

### Modern Web Dashboard
- **Real-time UI**: React-based dashboard with live updates via WebSocket
- **Project Management**: Monitor multiple Claude Code projects simultaneously
- **Session Tracking**: View detailed session history and conversation events
- **Performance Metrics**: Real-time charts and statistics for monitoring health

### Intelligent JSONL Processing
- **Structured Data**: Leverages Claude Code's native JSONL logs for clean event processing
- **State Detection**: Advanced TypeScript algorithms for detecting Claude states
- **Event Analysis**: Rich conversation event processing with full context
- **No Terminal Parsing**: Eliminates complex ANSI escape sequence handling

### Interactive Recovery Controls
- **One-Click Recovery**: Execute recovery actions directly from the web interface
- **Custom Commands**: Send arbitrary commands to Claude Code sessions
- **Automation Rules**: Configure automatic recovery behaviors per project
- **Recovery History**: Track all recovery actions and their effectiveness

### Developer Experience
- **TypeScript Safety**: Full type safety throughout the application
- **Modern Testing**: Jest unit tests, Playwright E2E tests
- **Database Integration**: Prisma ORM with SQLite/PostgreSQL support
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 📁 Project Structure

```
claude-monitor/
├── app/                          # Next.js Application
│   ├── src/
│   │   ├── app/                  # Next.js App Router pages
│   │   │   ├── dashboard/        # Dashboard page
│   │   │   ├── sessions/         # Session detail pages
│   │   │   └── recovery/         # Recovery controls page
│   │   ├── components/           # React components
│   │   │   └── dashboard/        # Dashboard-specific components
│   │   └── types/                # TypeScript type definitions
│   ├── lib/                      # Service layer and utilities
│   │   ├── services/             # Business logic services
│   │   └── database/             # Database schema and operations
│   ├── prisma/                   # Database schema and migrations
│   ├── __tests__/                # Unit tests
│   ├── e2e/                      # End-to-end tests
│   ├── docs/                     # Documentation files
│   ├── package.json              # Dependencies and scripts
│   └── next.config.ts            # Next.js configuration
├── config/                       # Legacy Python configuration
├── src/                          # Legacy Python source (deprecated)
└── README.md                    # This file
```

## ⚙️ Configuration

### Web Dashboard Configuration

Configuration is managed through the web interface and stored in the database:

1. **Project Settings**: Configure monitoring for each project
2. **Recovery Rules**: Set up automatic recovery behaviors  
3. **Notification Preferences**: Choose alert levels and methods
4. **Performance Tuning**: Adjust monitoring intervals and thresholds

### Environment Variables

Create a `.env.local` file in the `app/` directory:

```bash
# Database
DATABASE_URL="file:./dev.db"

# Development settings
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Claude Code paths
CLAUDE_PROJECTS_PATH="~/.claude/projects"
CLAUDE_LOG_PATH="~/.local/share/claude_code"

# WebSocket settings
WEBSOCKET_PORT=3001
WS_HEARTBEAT_INTERVAL=30000

# Monitoring settings
JSONL_POLL_INTERVAL=1000
STATE_DETECTION_CONFIDENCE=0.7
RECOVERY_COOLDOWN_MS=10000
```

### Legacy Configuration

The legacy Python monitor configuration is in `config/claude-monitor.yml` (deprecated).

## 🚨 Monitoring States

Claude Monitor's TypeScript state detection engine identifies these Claude Code states:

### 🟢 ACTIVE
- **Description**: Claude Code is actively processing requests
- **Detection**: Tool calls in JSONL, assistant message activity, file operations
- **Dashboard**: Green indicator with activity timeline
- **Actions**: Real-time monitoring and performance tracking

### 🟡 IDLE  
- **Description**: No recent conversation activity
- **Detection**: No new JSONL events for configured threshold
- **Dashboard**: Yellow indicator with "last seen" timestamp
- **Actions**: Optional idle notifications, session health checks

### 🟠 WAITING_INPUT
- **Description**: Claude is waiting for user response
- **Detection**: Assistant message without follow-up user message
- **Dashboard**: Blue indicator with wait duration
- **Actions**: User notification, stuck session detection

### 🔴 ERROR
- **Description**: Error states in conversation flow
- **Detection**: Error patterns in JSONL message content
- **Dashboard**: Red indicator with error details and recovery options
- **Actions**: Automatic error recovery, manual intervention options

### ❓ UNKNOWN
- **Description**: Unable to determine current state
- **Detection**: Insufficient data or parsing errors
- **Dashboard**: Gray indicator with diagnostic information
- **Actions**: Session refresh, debug logging, manual state override

## 📊 Usage Examples

### Web Dashboard Usage

**1. Monitor Multiple Projects:**
```bash
# Start the dashboard
cd app && npm run dev

# Open http://localhost:3000 in your browser
# Navigate to Dashboard tab
# Add project paths: /home/user/project1, /home/user/project2
# View real-time status for all projects
```

**2. Session Management:**
```bash
# View detailed session information
# Click on any project in the dashboard
# See conversation timeline, command history, state transitions
# Access recovery controls and session management
```

**3. Recovery Actions:**
```bash
# From the web interface:
# - Click "Send /clear" for context cleanup
# - Use "Custom Command" for specific actions
# - Configure automatic recovery rules
# - View recovery history and success rates
```

### CLI Usage (for development)

**Development server with debugging:**
```bash
# Start with debug logging
NODE_ENV=development npm run dev

# Run tests
npm run test              # Unit tests
npm run e2e              # End-to-end tests
npm run test:coverage    # Coverage report

# Database management
npm run db:studio        # Database GUI
npm run db:reset         # Reset database
npm run db:seed          # Seed with test data
```

### NPM Scripts Reference

**Development:**
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint code analysis

**Testing:**
- `npm run test` - Run Jest unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run e2e` - Run Playwright E2E tests
- `npm run e2e:ui` - Run E2E tests with UI

**Database:**
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open database GUI
- `npm run db:seed` - Seed database with test data
- `npm run db:reset` - Reset database and reseed

### API Integration

The Next.js application exposes REST APIs for programmatic integration:

```bash
# Get project status
curl http://localhost:3000/api/projects

# Send recovery action
curl -X POST http://localhost:3000/api/recovery \
  -H "Content-Type: application/json" \
  -d '{"projectPath":"/path/to/project","action":"clear"}'

# Get session details
curl http://localhost:3000/api/sessions/[session-id]

# WebSocket connection (for real-time updates)
const socket = io('http://localhost:3000');
socket.on('stateChange', (data) => {
  console.log('State changed:', data);
});
```

**TypeScript SDK Usage:**
```typescript
import { MonitoringClient } from './lib/client';

const client = new MonitoringClient('http://localhost:3000');

// Monitor a project
await client.startMonitoring('/path/to/project');

// Send recovery action
const result = await client.sendRecoveryAction({
  projectPath: '/path/to/project',
  action: 'clear',
  reason: 'Context pressure detected'
});
```

## 📈 Analytics and Reporting

The web dashboard provides comprehensive analytics:

### Real-time Metrics
- **State Distribution**: Live pie charts showing current project states
- **Activity Timeline**: Historical view of state changes and events
- **Performance Graphs**: Response times, processing rates, system load
- **Recovery Analytics**: Success rates, action frequency, effectiveness scores

### Exportable Reports
- **CSV Export**: Download session data and metrics for analysis
- **JSON API**: Programmatic access to all monitoring data
- **Performance Reports**: Detailed analysis of monitoring efficiency
- **Custom Dashboards**: Create project-specific monitoring views

### Database Queries
Use Prisma Studio (`npm run db:studio`) to explore data directly:
```sql
-- Recent recovery actions
SELECT * FROM RecoveryAction 
WHERE createdAt > datetime('now', '-24 hours')
ORDER BY createdAt DESC;

-- Project monitoring statistics
SELECT projectPath, COUNT(*) as sessionCount,
       AVG(responseTime) as avgResponseTime
FROM MonitoringSession 
GROUP BY projectPath;
```

## 🔧 Troubleshooting

### Common Issues

**Web dashboard won't start:**
```bash
# Check Node.js version
node --version  # Should be 18+

# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# Reset database
npm run db:reset
```

**JSONL files not being detected:**
```bash
# Check Claude Code directory
ls -la ~/.claude/projects/

# Verify environment variables
echo $CLAUDE_PROJECTS_PATH

# Check file permissions
chmod -R 755 ~/.claude/projects/
```

**Real-time updates not working:**
```bash
# Check WebSocket connection in browser console
# Should see "Connected to monitoring server"

# Verify WebSocket port
netstat -tlnp | grep 3001

# Check firewall settings
sudo ufw allow 3001
```

### Debug Mode

**Development server with debug output:**
```bash
# Enable debug logging
DEBUG=* npm run dev

# Run specific debug tests
DEBUG=jsonl-monitor npm run test -- --testPathPattern=jsonl
```

### Log Files and Debugging

**Browser Developer Tools:**
- Open browser DevTools (F12)
- Check Console tab for JavaScript errors
- Monitor Network tab for failed API requests
- View WebSocket connections in Network tab

**Server Logs:**
```bash
# View Next.js development logs
npm run dev -- --debug

# Check database operations
DATABASE_DEBUG=1 npm run dev

# Monitor file system watchers
DEBUG=chokidar npm run dev
```

## 🧪 Development

### Running Tests

**Unit Tests:**
```bash
npm run test                    # Run all tests
npm run test:watch             # Watch mode
npm run test:coverage          # With coverage
npm run test -- --testPathPattern=api  # Specific tests
```

**End-to-End Tests:**
```bash
npm run e2e                    # Headless mode
npm run e2e:headed            # With browser UI
npm run e2e:ui                # Interactive mode
npm run e2e:debug             # Debug mode
```

### Code Architecture

- **Type-Safe**: Full TypeScript coverage with strict mode
- **Component-Based**: React components with clear separation of concerns
- **Service Layer**: Business logic isolated in `/lib/services/`
- **Database-First**: Prisma ORM with migration-based schema evolution
- **Real-time**: WebSocket integration for live updates
- **Tested**: Comprehensive unit and E2E test coverage

## 📝 Configuration Reference

### Environment Variables

Create `.env.local` in the `app/` directory:

```bash
# Required
DATABASE_URL="file:./dev.db"
CLAUDE_PROJECTS_PATH="~/.claude/projects"

# Optional
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
WEBSOCKET_PORT=3001
JSONL_POLL_INTERVAL=1000
STATE_DETECTION_CONFIDENCE=0.7
RECOVERY_COOLDOWN_MS=10000
LOG_LEVEL=info

# Production
DATABASE_URL="postgresql://user:pass@host:port/db"
REDIS_URL="redis://localhost:6379"
SENTRY_DSN="https://..."
```

### Database Configuration

**Development (SQLite):**
```bash
# Use local SQLite database
DATABASE_URL="file:./dev.db"
npm run db:migrate
```

**Production (PostgreSQL):**
```bash
# Use PostgreSQL for production
DATABASE_URL="postgresql://username:password@localhost:5432/claude_monitor"
npm run db:deploy
```

### Next.js Configuration

Edit `next.config.ts` for advanced settings:
```typescript
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['prisma']
  },
  env: {
    CLAUDE_PROJECTS_PATH: process.env.CLAUDE_PROJECTS_PATH,
  }
};
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the [Setup Guide](./app/docs/setup.md)
3. Check the [API Documentation](./app/docs/api.md)
4. Check existing issues in the repository
5. Create a new issue with detailed information

## 🔮 Roadmap

### Completed ✅
- [x] Next.js web dashboard with real-time monitoring
- [x] JSONL-based event processing (no terminal parsing)
- [x] TypeScript service architecture
- [x] Interactive recovery controls
- [x] Multi-project monitoring support

### In Progress 🔄
- [ ] Enhanced state detection algorithms
- [ ] Mobile-responsive dashboard improvements  
- [ ] Advanced analytics and reporting
- [ ] WebSocket performance optimizations

### Planned 📅
- [ ] Machine learning-based state prediction
- [ ] Cloud deployment with Docker/Kubernetes
- [ ] Slack/Discord/Teams integration
- [ ] Plugin system for custom recovery actions
- [ ] Multi-user collaboration features
- [ ] API rate limiting and authentication
- [ ] Automated performance regression detection

## 📚 Documentation

- [Setup Guide](./app/docs/setup.md) - Complete installation and configuration guide
- [API Documentation](./app/docs/api.md) - REST API and WebSocket reference
- [Architecture Overview](#project-structure) - System design and component structure
- [TypeScript Types](./app/src/types/) - Complete type definitions for the system