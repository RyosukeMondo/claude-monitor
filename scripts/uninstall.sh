#!/bin/bash
#
# Claude Monitor Uninstallation Script
#
# This script completely removes the Claude Monitor system service and all associated files
# while following best practices for clean removal.
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

# Stop and disable service
stop_service() {
    log_info "Stopping and disabling service..."
    
    # Stop service if running
    if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
        log_info "Stopping service..."
        if systemctl stop "$SERVICE_NAME"; then
            log_success "Service stopped"
        else
            log_warn "Failed to stop service gracefully, forcing stop..."
            systemctl kill "$SERVICE_NAME" 2>/dev/null || true
            sleep 2
        fi
    else
        log_info "Service is not running"
    fi
    
    # Disable service if enabled
    if systemctl is-enabled --quiet "$SERVICE_NAME" 2>/dev/null; then
        log_info "Disabling service..."
        systemctl disable "$SERVICE_NAME"
        log_success "Service disabled"
    else
        log_info "Service is not enabled"
    fi
}

# Remove systemd service file
remove_service_file() {
    log_info "Removing systemd service file..."
    
    local service_file="/etc/systemd/system/claude-monitor.service"
    
    if [[ -f "$service_file" ]]; then
        rm -f "$service_file"
        systemctl daemon-reload
        log_success "Service file removed"
    else
        log_info "Service file not found"
    fi
}

# Remove application files
remove_files() {
    log_info "Removing application files..."
    
    # Remove install directory
    if [[ -d "$INSTALL_DIR" ]]; then
        rm -rf "$INSTALL_DIR"
        log_success "Install directory removed: $INSTALL_DIR"
    else
        log_info "Install directory not found: $INSTALL_DIR"
    fi
    
    # Handle configuration directory
    if [[ -d "$CONFIG_DIR" ]]; then
        if [[ "${1:-}" == "--keep-config" ]]; then
            log_info "Keeping configuration directory: $CONFIG_DIR"
        else
            # Ask user about configuration
            while true; do
                echo -n "Remove configuration directory $CONFIG_DIR? [y/N]: "
                read -r response
                case $response in
                    [Yy]* )
                        rm -rf "$CONFIG_DIR"
                        log_success "Configuration directory removed: $CONFIG_DIR"
                        break
                        ;;
                    [Nn]* | "" )
                        log_info "Keeping configuration directory: $CONFIG_DIR"
                        break
                        ;;
                    * )
                        echo "Please answer yes or no."
                        ;;
                esac
            done
        fi
    else
        log_info "Configuration directory not found: $CONFIG_DIR"
    fi
    
    # Handle log directory
    if [[ -d "$LOG_DIR" ]]; then
        if [[ "${1:-}" == "--keep-logs" ]] || [[ "${2:-}" == "--keep-logs" ]]; then
            log_info "Keeping log directory: $LOG_DIR"
        else
            # Ask user about logs
            while true; do
                echo -n "Remove log directory $LOG_DIR? [y/N]: "
                read -r response
                case $response in
                    [Yy]* )
                        rm -rf "$LOG_DIR"
                        log_success "Log directory removed: $LOG_DIR"
                        break
                        ;;
                    [Nn]* | "" )
                        log_info "Keeping log directory: $LOG_DIR"
                        break
                        ;;
                    * )
                        echo "Please answer yes or no."
                        ;;
                esac
            done
        fi
    else
        log_info "Log directory not found: $LOG_DIR"
    fi
    
    # Remove runtime directory
    if [[ -d "$RUN_DIR" ]]; then
        rm -rf "$RUN_DIR"
        log_success "Runtime directory removed: $RUN_DIR"
    else
        log_info "Runtime directory not found: $RUN_DIR"
    fi
}

# Remove system user and group
remove_user() {
    log_info "Removing system user and group..."
    
    # Remove user if it exists
    if getent passwd "$USER" >/dev/null 2>&1; then
        # Check if user has running processes
        if pgrep -u "$USER" >/dev/null 2>&1; then
            log_warn "User $USER has running processes. Killing them..."
            pkill -u "$USER" || true
            sleep 2
        fi
        
        userdel "$USER" 2>/dev/null || log_warn "Failed to remove user: $USER"
        log_success "User removed: $USER"
    else
        log_info "User not found: $USER"
    fi
    
    # Remove group if it exists and has no members
    if getent group "$GROUP" >/dev/null 2>&1; then
        # Check if group has any members
        local group_members=$(getent group "$GROUP" | cut -d: -f4)
        if [[ -z "$group_members" ]]; then
            groupdel "$GROUP" 2>/dev/null || log_warn "Failed to remove group: $GROUP"
            log_success "Group removed: $GROUP"
        else
            log_info "Group has members, keeping: $GROUP"
        fi
    else
        log_info "Group not found: $GROUP"
    fi
}

# Remove log rotation configuration
remove_logrotate() {
    log_info "Removing log rotation configuration..."
    
    local logrotate_file="/etc/logrotate.d/claude-monitor"
    
    if [[ -f "$logrotate_file" ]]; then
        rm -f "$logrotate_file"
        log_success "Log rotation configuration removed"
    else
        log_info "Log rotation configuration not found"
    fi
}

# Remove Python dependencies (optional)
remove_python_deps() {
    if [[ "${1:-}" == "--remove-deps" ]] || [[ "${2:-}" == "--remove-deps" ]] || [[ "${3:-}" == "--remove-deps" ]]; then
        log_info "Removing Python dependencies..."
        
        # Only remove if they were likely installed by us
        local deps=("watchdog" "pyyaml" "psutil")
        for dep in "${deps[@]}"; do
            if pip3 show "$dep" >/dev/null 2>&1; then
                pip3 uninstall -y "$dep" || log_warn "Failed to remove $dep"
                log_success "Removed Python package: $dep"
            fi
        done
    else
        log_info "Keeping Python dependencies (use --remove-deps to remove them)"
    fi
}

# Clean up any remaining files
cleanup_remaining() {
    log_info "Cleaning up remaining files..."
    
    # Remove any remaining PID files
    find /var/run -name "*claude-monitor*" -type f -delete 2>/dev/null || true
    
    # Remove any temporary files
    find /tmp -name "*claude-monitor*" -type f -user "$USER" -delete 2>/dev/null || true
    
    # Clean systemd journal entries (optional)
    if [[ "${1:-}" == "--clean-logs" ]] || [[ "${2:-}" == "--clean-logs" ]] || [[ "${3:-}" == "--clean-logs" ]]; then
        log_info "Cleaning systemd journal entries..."
        journalctl --vacuum-size=0 --unit="$SERVICE_NAME" 2>/dev/null || log_warn "Failed to clean journal entries"
    fi
    
    log_success "Cleanup completed"
}

# Verify removal
verify_removal() {
    log_info "Verifying removal..."
    
    local issues=0
    
    # Check if service is still active
    if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
        log_warn "Service is still active"
        ((issues++))
    fi
    
    # Check if service is still enabled
    if systemctl is-enabled --quiet "$SERVICE_NAME" 2>/dev/null; then
        log_warn "Service is still enabled"
        ((issues++))
    fi
    
    # Check if files still exist
    local dirs=("$INSTALL_DIR" "$RUN_DIR")
    for dir in "${dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            log_warn "Directory still exists: $dir"
            ((issues++))
        fi
    done
    
    # Check if service file exists
    if [[ -f "/etc/systemd/system/claude-monitor.service" ]]; then
        log_warn "Service file still exists"
        ((issues++))
    fi
    
    # Check if user/group still exist
    if getent passwd "$USER" >/dev/null 2>&1; then
        log_warn "User still exists: $USER"
        ((issues++))
    fi
    
    if [[ $issues -eq 0 ]]; then
        log_success "Removal verification passed"
        return 0
    else
        log_warn "Removal verification found $issues issues"
        return 1
    fi
}

# Print uninstallation summary
print_summary() {
    echo
    if verify_removal; then
        log_success "Uninstallation completed successfully!"
    else
        log_warn "Uninstallation completed with warnings (see above)"
    fi
    echo
    
    # Show what was kept
    local kept_items=()
    [[ -d "$CONFIG_DIR" ]] && kept_items+=("Configuration: $CONFIG_DIR")
    [[ -d "$LOG_DIR" ]] && kept_items+=("Logs: $LOG_DIR")
    
    if [[ ${#kept_items[@]} -gt 0 ]]; then
        echo "The following items were preserved:"
        for item in "${kept_items[@]}"; do
            echo "  - $item"
        done
        echo
    fi
    
    echo "Claude Monitor has been uninstalled from this system."
    echo
}

# Show help
show_help() {
    echo "Claude Monitor Uninstallation Script"
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Removes Claude Monitor service and associated files."
    echo
    echo "Options:"
    echo "  --keep-config     Keep configuration directory"
    echo "  --keep-logs       Keep log directory" 
    echo "  --remove-deps     Remove Python dependencies"
    echo "  --clean-logs      Clean systemd journal entries"
    echo "  --force           Force removal without prompts"
    echo "  --help            Show this help message"
    echo
    echo "Examples:"
    echo "  $0                          # Interactive removal"
    echo "  $0 --keep-config --keep-logs # Keep config and logs"
    echo "  $0 --force --remove-deps    # Force removal including deps"
    echo
}

# Main uninstallation function
main() {
    local force=false
    
    # Parse arguments
    for arg in "$@"; do
        case $arg in
            --force)
                force=true
                ;;
        esac
    done
    
    echo "Claude Monitor Uninstallation Script"
    echo "====================================="
    echo
    
    # Confirmation prompt (unless forced)
    if [[ "$force" != true ]]; then
        echo "This will remove Claude Monitor and associated files from your system."
        while true; do
            echo -n "Continue with uninstallation? [y/N]: "
            read -r response
            case $response in
                [Yy]* )
                    break
                    ;;
                [Nn]* | "" )
                    log_info "Uninstallation cancelled"
                    exit 0
                    ;;
                * )
                    echo "Please answer yes or no."
                    ;;
            esac
        done
        echo
    fi
    
    # Run uninstallation steps
    stop_service
    remove_service_file
    remove_files "$@"
    remove_user
    remove_logrotate
    remove_python_deps "$@"
    cleanup_remaining "$@"
    
    print_summary
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        show_help
        exit 0
        ;;
    *)
        check_root
        main "$@"
        ;;
esac