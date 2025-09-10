#!/bin/bash
#
# Claude Monitor Installation Script
#
# This script installs the Claude Monitor system service following systemd best practices
# and handles various installation edge cases.
#

set -euo pipefail

# Configuration
INSTALL_DIR="/opt/claude-monitor"
CONFIG_DIR="/etc/claude-monitor"
LOG_DIR="/var/log/claude-monitor"
RUN_DIR="/var/run/claude-monitor"
USER="claude-monitor"
GROUP="claude-monitor"
SERVICE_NAME="claude-monitor"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Check system requirements
check_requirements() {
    log_info "Checking system requirements..."
    
    # Check if systemd is available
    if ! command -v systemctl &> /dev/null; then
        log_error "systemd is required but not found"
        exit 1
    fi
    
    # Check Python version
    if ! command -v python3 &> /dev/null; then
        log_error "Python 3 is required but not found"
        exit 1
    fi
    
    local python_version=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
    local required_version="3.8"
    
    if ! python3 -c "import sys; exit(0 if sys.version_info >= (3, 8) else 1)" 2>/dev/null; then
        log_error "Python 3.8 or higher is required (found: $python_version)"
        exit 1
    fi
    
    log_success "Python $python_version found"
    
    # Check required Python modules
    local required_modules=("watchdog" "pyyaml")
    for module in "${required_modules[@]}"; do
        if ! python3 -c "import $module" 2>/dev/null; then
            log_warn "Python module '$module' not found - will install via pip"
        fi
    done
    
    # Check available disk space (require at least 100MB)
    local available_space=$(df / | awk 'NR==2 {print $4}')
    if [[ $available_space -lt 102400 ]]; then  # 100MB in KB
        log_error "Insufficient disk space (need at least 100MB)"
        exit 1
    fi
    
    log_success "System requirements check passed"
}

# Install Python dependencies
install_python_deps() {
    log_info "Installing Python dependencies..."
    
    # Install pip if not available
    if ! command -v pip3 &> /dev/null; then
        log_info "Installing pip3..."
        if command -v apt-get &> /dev/null; then
            apt-get update && apt-get install -y python3-pip
        elif command -v yum &> /dev/null; then
            yum install -y python3-pip
        elif command -v dnf &> /dev/null; then
            dnf install -y python3-pip
        else
            log_error "Could not install pip3 - unsupported package manager"
            exit 1
        fi
    fi
    
    # Install required modules
    pip3 install --upgrade pip
    pip3 install watchdog pyyaml psutil
    
    log_success "Python dependencies installed"
}

# Create system user and group
create_user() {
    log_info "Creating system user and group..."
    
    # Create group if it doesn't exist
    if ! getent group "$GROUP" >/dev/null 2>&1; then
        groupadd --system "$GROUP"
        log_success "Created group: $GROUP"
    else
        log_info "Group $GROUP already exists"
    fi
    
    # Create user if it doesn't exist
    if ! getent passwd "$USER" >/dev/null 2>&1; then
        useradd --system --gid "$GROUP" --home-dir "$INSTALL_DIR" \
                --shell /sbin/nologin --comment "Claude Monitor Service" "$USER"
        log_success "Created user: $USER"
    else
        log_info "User $USER already exists"
    fi
}

# Create directories
create_directories() {
    log_info "Creating directories..."
    
    # Install directory
    mkdir -p "$INSTALL_DIR"/{bin,src,logs}
    chown -R "$USER:$GROUP" "$INSTALL_DIR"
    chmod 755 "$INSTALL_DIR"
    
    # Configuration directory
    mkdir -p "$CONFIG_DIR"
    chown root:$GROUP "$CONFIG_DIR"
    chmod 750 "$CONFIG_DIR"
    
    # Log directory
    mkdir -p "$LOG_DIR"
    chown "$USER:$GROUP" "$LOG_DIR"
    chmod 755 "$LOG_DIR"
    
    # Runtime directory
    mkdir -p "$RUN_DIR"
    chown "$USER:$GROUP" "$RUN_DIR"
    chmod 755 "$RUN_DIR"
    
    log_success "Directories created"
}

# Install application files
install_files() {
    log_info "Installing application files..."
    
    local source_dir="$(dirname "$(realpath "$0")")/.."
    
    # Copy source files
    if [[ -d "$source_dir/src" ]]; then
        cp -r "$source_dir/src"/* "$INSTALL_DIR/src/"
        chown -R "$USER:$GROUP" "$INSTALL_DIR/src"
        chmod -R 644 "$INSTALL_DIR/src"
        find "$INSTALL_DIR/src" -name "*.py" -exec chmod 644 {} \;
    else
        log_error "Source directory not found: $source_dir/src"
        exit 1
    fi
    
    # Copy main executable
    if [[ -f "$source_dir/src/main.py" ]]; then
        cp "$source_dir/src/main.py" "$INSTALL_DIR/bin/claude-monitor"
        chown "$USER:$GROUP" "$INSTALL_DIR/bin/claude-monitor"
        chmod 755 "$INSTALL_DIR/bin/claude-monitor"
    else
        log_error "Main executable not found: $source_dir/src/main.py"
        exit 1
    fi
    
    # Install default configuration if it doesn't exist
    if [[ ! -f "$CONFIG_DIR/claude-monitor.yml" ]]; then
        if [[ -f "$source_dir/config/claude-monitor.yml" ]]; then
            cp "$source_dir/config/claude-monitor.yml" "$CONFIG_DIR/"
        else
            # Create minimal default config
            cat > "$CONFIG_DIR/claude-monitor.yml" << EOF
# Claude Monitor Configuration
daemon:
  enabled: true
  loop_interval: 5.0
  status_report_interval: 300.0

logging:
  level: INFO
  file: /var/log/claude-monitor/claude-monitor.log
  rotation:
    enabled: true
    max_size: 10MB
    backup_count: 5

components:
  log_parser:
    enabled: true
    log_file: ~/.local/share/claude_code/terminal_output.log
    
  state_detector:
    enabled: true
    
  recovery_engine:
    enabled: true
    
  task_monitor:
    enabled: true
    
  notifier:
    enabled: true

monitoring:
  project_path: /mnt/d/repos/claude-monitor
  spec_name: claude-auto-recovery
EOF
        fi
        
        chown root:$GROUP "$CONFIG_DIR/claude-monitor.yml"
        chmod 640 "$CONFIG_DIR/claude-monitor.yml"
        log_success "Default configuration installed"
    else
        log_info "Configuration file already exists, skipping"
    fi
    
    log_success "Application files installed"
}

# Install systemd service
install_service() {
    log_info "Installing systemd service..."
    
    local source_dir="$(dirname "$(realpath "$0")")"
    local service_file="$source_dir/claude-monitor.service"
    
    if [[ ! -f "$service_file" ]]; then
        log_error "Service file not found: $service_file"
        exit 1
    fi
    
    # Copy service file
    cp "$service_file" "/etc/systemd/system/"
    chown root:root "/etc/systemd/system/claude-monitor.service"
    chmod 644 "/etc/systemd/system/claude-monitor.service"
    
    # Reload systemd
    systemctl daemon-reload
    
    log_success "Systemd service installed"
}

# Setup log rotation
setup_logrotate() {
    log_info "Setting up log rotation..."
    
    cat > "/etc/logrotate.d/claude-monitor" << EOF
/var/log/claude-monitor/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 claude-monitor claude-monitor
    postrotate
        systemctl reload claude-monitor 2>/dev/null || true
    endscript
}
EOF
    
    log_success "Log rotation configured"
}

# Enable and start service
enable_service() {
    log_info "Enabling and starting service..."
    
    # Enable service
    systemctl enable "$SERVICE_NAME"
    
    # Start service
    if systemctl start "$SERVICE_NAME"; then
        log_success "Service started successfully"
    else
        log_error "Failed to start service"
        log_info "Check logs: journalctl -u $SERVICE_NAME"
        return 1
    fi
    
    # Wait a moment and check status
    sleep 2
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        log_success "Service is running"
    else
        log_warn "Service may not be running properly"
        log_info "Check status: systemctl status $SERVICE_NAME"
    fi
}

# Cleanup function
cleanup() {
    if [[ $? -ne 0 ]]; then
        log_error "Installation failed. Cleaning up..."
        systemctl stop "$SERVICE_NAME" 2>/dev/null || true
        systemctl disable "$SERVICE_NAME" 2>/dev/null || true
        rm -f "/etc/systemd/system/claude-monitor.service"
        systemctl daemon-reload
    fi
}

# Print installation summary
print_summary() {
    echo
    log_success "Installation completed successfully!"
    echo
    echo "Service details:"
    echo "  - Service name: $SERVICE_NAME"
    echo "  - Install directory: $INSTALL_DIR"
    echo "  - Configuration: $CONFIG_DIR/claude-monitor.yml"
    echo "  - Log directory: $LOG_DIR"
    echo "  - User: $USER"
    echo "  - Group: $GROUP"
    echo
    echo "Useful commands:"
    echo "  - Start service:    sudo systemctl start $SERVICE_NAME"
    echo "  - Stop service:     sudo systemctl stop $SERVICE_NAME"
    echo "  - Restart service:  sudo systemctl restart $SERVICE_NAME"
    echo "  - Check status:     sudo systemctl status $SERVICE_NAME"
    echo "  - View logs:        sudo journalctl -u $SERVICE_NAME -f"
    echo "  - Reload config:    sudo systemctl reload $SERVICE_NAME"
    echo
    echo "Configuration file: $CONFIG_DIR/claude-monitor.yml"
    echo "Edit the configuration and reload the service to apply changes."
    echo
}

# Main installation function
main() {
    echo "Claude Monitor Installation Script"
    echo "=================================="
    echo
    
    # Set up cleanup trap
    trap cleanup EXIT
    
    # Run installation steps
    check_root
    check_requirements
    install_python_deps
    create_user
    create_directories
    install_files
    install_service
    setup_logrotate
    enable_service
    
    # Success - disable cleanup
    trap - EXIT
    
    print_summary
}

# Handle command line arguments
case "${1:-install}" in
    install)
        main
        ;;
    --help|-h)
        echo "Usage: $0 [install]"
        echo
        echo "Installs Claude Monitor as a systemd service."
        echo
        echo "Options:"
        echo "  install    Install the service (default)"
        echo "  --help     Show this help message"
        exit 0
        ;;
    *)
        log_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac