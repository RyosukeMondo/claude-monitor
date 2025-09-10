# Setup Guide

Complete setup and configuration guide for Claude Monitor Next.js application.

## System Requirements

### Software Requirements
- **Node.js**: Version 18.0 or higher
- **npm**: Version 9.0 or higher (comes with Node.js)
- **Claude Code CLI**: Latest version installed and configured
- **Operating System**: Linux, macOS, or Windows with WSL2

### Hardware Requirements
- **Memory**: Minimum 2GB RAM available for the application
- **Storage**: At least 1GB free space for dependencies and database
- **CPU**: Any modern multi-core processor

### Browser Compatibility
- Chrome 100+, Firefox 100+, Safari 15+, Edge 100+
- JavaScript must be enabled
- WebSocket support required for real-time features

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd claude-monitor
```

### 2. Navigate to Application Directory

```bash
cd app
```

### 3. Install Dependencies

```bash
# Install all Node.js dependencies
npm install

# Verify installation
npm list --depth=0
```

### 4. Environment Configuration

Create a `.env.local` file in the `app/` directory:

```bash
# Database Configuration
DATABASE_URL="file:./dev.db"

# Claude Code Integration
CLAUDE_PROJECTS_PATH="~/.claude/projects"
CLAUDE_LOG_PATH="~/.local/share/claude_code"

# Application Settings
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# WebSocket Configuration
WEBSOCKET_PORT=3001
WS_HEARTBEAT_INTERVAL=30000

# Monitoring Configuration
JSONL_POLL_INTERVAL=1000
STATE_DETECTION_CONFIDENCE=0.7
RECOVERY_COOLDOWN_MS=10000
LOG_LEVEL=info
```

### 5. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed with initial data
npm run db:seed
```

### 6. Verify Setup

```bash
# Run tests to ensure everything is working
npm run test

# Start development server
npm run dev
```

Open your browser to `http://localhost:3000` to verify the application is running.

## Configuration

### Database Configuration

#### Development (SQLite - Default)
For development, the application uses SQLite by default:

```bash
DATABASE_URL="file:./dev.db"
```

#### Production (PostgreSQL)
For production deployments, use PostgreSQL:

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/claude_monitor"
```

Then run:
```bash
npm run db:deploy
```

### Claude Code Integration

The application monitors Claude Code sessions by watching JSONL files. Configure the paths:

```bash
# Default locations (usually correct)
CLAUDE_PROJECTS_PATH="~/.claude/projects"
CLAUDE_LOG_PATH="~/.local/share/claude_code"

# Custom locations if needed
CLAUDE_PROJECTS_PATH="/custom/path/to/claude/projects"
```

### Performance Tuning

Adjust these settings based on your system performance:

```bash
# File monitoring frequency (milliseconds)
JSONL_POLL_INTERVAL=1000  # Check files every second

# State detection sensitivity (0.0 - 1.0)
STATE_DETECTION_CONFIDENCE=0.7  # 70% confidence threshold

# Recovery action cooldown (milliseconds)
RECOVERY_COOLDOWN_MS=10000  # 10 second cooldown
```

## Troubleshooting

### Common Installation Issues

#### Node.js Version Issues
```bash
# Check your Node.js version
node --version

# If too old, update Node.js:
# Using nvm (recommended):
nvm install --lts
nvm use --lts

# Or download from nodejs.org
```

#### Permission Errors
```bash
# Fix npm permissions on Unix systems
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Alternative: use nvm to avoid permission issues
```

#### Database Connection Issues
```bash
# Reset database if corrupted
npm run db:reset

# Check database file exists
ls -la dev.db

# Generate client again if needed
npm run db:generate
```

### Claude Code Integration Issues

#### JSONL Files Not Found
```bash
# Check if Claude Code is creating JSONL files
ls -la ~/.claude/projects/

# Verify a Claude session creates files
claude --version  # Start Claude Code
# Check if new session directory is created
```

#### File Permission Issues
```bash
# Ensure the application can read Claude Code files
chmod -R 755 ~/.claude/projects/
chmod 755 ~/.local/share/claude_code/
```

#### Path Resolution Issues
```bash
# Check if environment variables are set correctly
echo $CLAUDE_PROJECTS_PATH
echo $CLAUDE_LOG_PATH

# Update .env.local if needed
```

### Application Startup Issues

#### Port Already in Use
```bash
# Check what's using port 3000
lsof -i :3000

# Kill the process or use different port
PORT=3001 npm run dev
```

#### WebSocket Connection Failed
```bash
# Check if WebSocket port is available
lsof -i :3001

# Ensure firewall allows the connection
sudo ufw allow 3001  # Ubuntu/Debian
```

#### Build Errors
```bash
# Clear build cache
rm -rf .next
npm run build

# Clear node_modules if needed
rm -rf node_modules package-lock.json
npm install
```

## Development Setup

### IDE Configuration

#### VS Code Extensions
Recommended extensions for development:
- ES7+ React/Redux/React-Native snippets
- TypeScript Importer
- Prisma
- Tailwind CSS IntelliSense
- ESLint
- Prettier

#### Settings
Add to your VS Code `settings.json`:
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  }
}
```

### Git Hooks

Set up pre-commit hooks for code quality:
```bash
# Install husky for git hooks
npm install --save-dev husky

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run test"
```

## Production Deployment

### Build for Production

```bash
# Create optimized production build
npm run build

# Start production server
npm run start
```

### Environment Variables for Production

Update `.env.production.local`:
```bash
# Production database
DATABASE_URL="postgresql://user:password@host:port/database"

# Security
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Monitoring
SENTRY_DSN="https://your-sentry-dsn"
LOG_LEVEL=warn

# Performance
JSONL_POLL_INTERVAL=5000  # Less frequent in production
```

### Health Check

Verify your production deployment:
```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/projects
```

## Next Steps

After successful setup:

1. **Read the API Documentation**: `docs/api.md`
2. **Explore the Dashboard**: Navigate to `http://localhost:3000/dashboard`
3. **Add Your First Project**: Use the web interface to add a Claude Code project
4. **Configure Recovery Settings**: Set up automatic recovery rules
5. **Test Recovery Actions**: Try manual recovery commands

## Getting Help

If you encounter issues:

1. Check the [troubleshooting section](#troubleshooting) above
2. Review application logs: `npm run dev` shows detailed output
3. Check the browser developer console for client-side errors
4. Use database studio to inspect data: `npm run db:studio`
5. Run tests to identify issues: `npm run test`

For additional support, refer to the main project documentation or create an issue in the repository.