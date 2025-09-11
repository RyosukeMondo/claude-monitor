#!/bin/bash
set -e

# Docker entrypoint script for Claude Monitor
# Handles database initialization, Claude Code CLI setup, and application startup

echo "🚀 Starting Claude Monitor deployment setup..."

# Function for error handling with clear messaging
handle_error() {
    local error_msg="$1"
    local troubleshooting="$2"
    echo "❌ ERROR: $error_msg"
    if [ -n "$troubleshooting" ]; then
        echo "💡 TROUBLESHOOTING: $troubleshooting"
    fi
    exit 1
}

# Function to check if Claude Code is installed and functional
check_claude_code() {
    echo "🔍 Checking Claude Code CLI installation..."
    
    if ! command -v claude &> /dev/null; then
        echo "⚠️  Claude Code CLI not found in PATH"
        return 1
    fi
    
    # Test Claude Code version
    if claude --version &> /dev/null; then
        local version=$(claude --version 2>/dev/null || echo "unknown")
        echo "✅ Claude Code CLI found: $version"
        return 0
    else
        echo "⚠️  Claude Code CLI found but not functional"
        return 1
    fi
}

# Function to install Claude Code CLI
install_claude_code() {
    echo "📦 Installing Claude Code CLI..."
    
    # Try installing via npm (most reliable in container)
    if command -v npm &> /dev/null; then
        echo "  → Installing via npm..."
        if npm install -g @anthropic-ai/claude &> /dev/null; then
            echo "✅ Claude Code CLI installed successfully via npm"
            return 0
        else
            echo "⚠️  npm installation failed, trying alternative methods..."
        fi
    fi
    
    # Try installing via curl (fallback)
    if command -v curl &> /dev/null; then
        echo "  → Installing via curl..."
        if curl -fsSL https://claude.ai/install.sh | bash &> /dev/null; then
            echo "✅ Claude Code CLI installed successfully via curl"
            # Update PATH for current session
            export PATH="$HOME/.local/bin:$PATH"
            return 0
        else
            echo "⚠️  curl installation failed"
        fi
    fi
    
    return 1
}

# Function to install spec-workflow MCP tools
install_mcp_tools() {
    echo "🔧 Installing spec-workflow MCP tools..."
    
    if command -v npm &> /dev/null; then
        # Install spec-workflow MCP server
        if npm install -g @anthropic-ai/spec-workflow &> /dev/null; then
            echo "✅ spec-workflow MCP tools installed successfully"
            return 0
        else
            echo "⚠️  Failed to install spec-workflow MCP tools via npm"
        fi
    fi
    
    echo "⚠️  spec-workflow MCP tools installation failed, continuing without enhanced functionality"
    return 1
}

# Function to check Claude Code authentication status
check_claude_auth() {
    echo "🔐 Checking Claude Code authentication status..."
    
    # Create .claude directory if it doesn't exist
    mkdir -p "$HOME/.claude"
    
    # Try to run a simple Claude Code command to check auth
    if timeout 10s claude auth status &> /dev/null; then
        echo "✅ Claude Code authentication is configured"
        return 0
    else
        echo "⚠️  Claude Code authentication required"
        return 1
    fi
}

# Function to provide authentication setup instructions
provide_auth_instructions() {
    echo ""
    echo "🔐 CLAUDE CODE AUTHENTICATION SETUP REQUIRED"
    echo "=============================================="
    echo ""
    echo "Your Claude Code CLI needs to be authenticated before you can use it."
    echo ""
    echo "📋 SETUP INSTRUCTIONS:"
    echo "1. Open a terminal/shell in this container:"
    echo "   docker exec -it <container-name> /bin/bash"
    echo ""
    echo "2. Run the authentication command:"
    echo "   claude auth login"
    echo ""
    echo "3. Follow the prompts to authenticate with your Anthropic account"
    echo ""
    echo "4. Once authenticated, restart this container or the Claude Monitor service"
    echo ""
    echo "🌐 AUTHENTICATION URL: https://claude.ai/login"
    echo ""
    echo "📁 Authentication state will be persisted in the mounted ~/.claude directory"
    echo ""
    echo "⚠️  The Claude Monitor application will start, but Claude Code launcher"
    echo "   functionality will be limited until authentication is completed."
    echo ""
    echo "=============================================="
    echo ""
}

# Claude Code CLI Setup
echo ""
echo "🤖 Setting up Claude Code CLI..."

# Check if Claude Code is already installed
if ! check_claude_code; then
    echo "📦 Claude Code CLI not found or not functional, attempting installation..."
    
    if install_claude_code; then
        echo "✅ Claude Code CLI installation completed"
    else
        handle_error "Failed to install Claude Code CLI" \
            "Please install manually: 1) Run 'npm install -g @anthropic-ai/claude' or 2) Visit https://claude.ai/download for installation instructions"
    fi
else
    echo "✅ Claude Code CLI is already installed and functional"
fi

# Install spec-workflow MCP tools (optional, don't fail if this doesn't work)
install_mcp_tools

# Check authentication status
if ! check_claude_auth; then
    provide_auth_instructions
    # Set environment variable to indicate auth is needed
    export CLAUDE_AUTH_REQUIRED=true
else
    echo "✅ Claude Code authentication is configured"
    export CLAUDE_AUTH_REQUIRED=false
fi

echo ""
echo "🗄️  Setting up database..."

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
echo ""
echo "🎉 Starting Claude Monitor application..."
echo ""

# Display final status summary
echo "📊 DEPLOYMENT STATUS SUMMARY:"
echo "================================"
if [ "$CLAUDE_AUTH_REQUIRED" = "true" ]; then
    echo "🤖 Claude Code CLI: ✅ Installed, ⚠️  Authentication Required"
    echo "   → Follow the authentication instructions above before using launcher features"
else
    echo "🤖 Claude Code CLI: ✅ Installed and Authenticated"
fi
echo "🗄️  Database: ✅ Ready"
echo "🌐 Web Interface: Starting..."
echo "================================"
echo ""

exec "$@"