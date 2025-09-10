/**
 * JSONL File System Monitoring Service
 * 
 * Monitors Claude Code JSONL files in ~/.claude/projects/ for real-time changes.
 * Converts Python LogFileMonitor functionality to TypeScript with modern file watching.
 */

import * as chokidar from 'chokidar';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { EventEmitter } from 'events';
import { LogHelpers } from '../utils/logger';
import { ErrorHelpers } from '../utils/error-handler';
import { FileSystemError, JSONLParsingError, ProjectError, ErrorFactory } from '../utils/errors';

// Types for JSONL events
export interface JSONLEvent {
  type: 'new_line' | 'file_created' | 'file_deleted' | 'session_started' | 'session_ended' | 'error';
  filePath: string;
  projectPath?: string;
  sessionId?: string;
  content?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  error?: Error;
}

export interface SessionInfo {
  sessionId: string;
  jsonlFilePath: string;
  projectPath: string;
  isActive: boolean;
  eventCount: number;
  startTime: Date;
  lastActivity: Date;
  fileSize: number;
}

export interface ProjectMonitoringInfo {
  projectPath: string;
  encodedPath: string;
  displayName: string;
  activeSessions: SessionInfo[];
  monitoring: boolean;
  lastActivity: Date;
  totalEventCount: number;
  averageEventsPerHour: number;
}

// Configuration interface based on Python LogParser config
export interface JSONLMonitorConfig {
  pollInterval?: number;           // Milliseconds between file system checks
  maxContextLines?: number;        // Maximum lines to keep in memory per file
  fileCheckInterval?: number;      // Milliseconds between file stat checks
  encoding?: string;               // File encoding (default: utf-8)
  bufferSize?: number;            // Buffer size for file reading
  maxLineLength?: number;         // Maximum line length before truncation
  claudeProjectsDir?: string;     // Override for Claude projects directory
  excludePatterns?: string[];     // File patterns to exclude from monitoring
  includeTempFiles?: boolean;     // Whether to monitor temporary files
  performanceMonitoring?: boolean; // Whether to track performance stats
}

// Internal file monitoring state
interface FileMonitorState {
  filePath: string;
  projectPath: string;
  sessionId: string;
  watcher: chokidar.FSWatcher | null;
  currentPosition: number;
  currentLineNumber: number;
  lastModified: Date;
  isActive: boolean;
  eventCount: number;
}

/**
 * JSONLFileSystemMonitor - Main monitoring service
 * 
 * Provides real-time monitoring of Claude Code JSONL files with features:
 * - Cross-platform file watching using chokidar
 * - Project path encoding/decoding logic
 * - Session lifecycle tracking
 * - Memory-efficient line-by-line processing
 * - Event-driven architecture for real-time updates
 */
export class JSONLFileSystemMonitor extends EventEmitter {
  private config: Required<JSONLMonitorConfig>;
  private claudeProjectsDir: string;
  private monitoredProjects: Map<string, ProjectMonitoringInfo>;
  private fileMonitors: Map<string, FileMonitorState>;
  private globalWatcher: chokidar.FSWatcher | null;
  private isMonitoring: boolean;
  private stats: {
    startTime: Date | null;
    totalFiles: number;
    totalLines: number;
    totalEvents: number;
    errors: number;
    lastActivity: Date | null;
    processingRate: number;
  };

  constructor(config: JSONLMonitorConfig = {}) {
    super();
    
    // Set default configuration similar to Python LogParser
    this.config = {
      pollInterval: config.pollInterval ?? 100,
      maxContextLines: config.maxContextLines ?? 1000,
      fileCheckInterval: config.fileCheckInterval ?? 1000,
      encoding: config.encoding ?? 'utf-8',
      bufferSize: config.bufferSize ?? 8192,
      maxLineLength: config.maxLineLength ?? 32768,
      claudeProjectsDir: config.claudeProjectsDir ?? path.join(os.homedir(), '.claude', 'projects'),
      excludePatterns: config.excludePatterns ?? ['**/.DS_Store', '**/Thumbs.db', '**/*.tmp'],
      includeTempFiles: config.includeTempFiles ?? false,
      performanceMonitoring: config.performanceMonitoring ?? true
    };

    this.claudeProjectsDir = this.config.claudeProjectsDir;
    this.monitoredProjects = new Map();
    this.fileMonitors = new Map();
    this.globalWatcher = null;
    this.isMonitoring = false;
    this.stats = {
      startTime: null,
      totalFiles: 0,
      totalLines: 0,
      totalEvents: 0,
      errors: 0,
      lastActivity: null,
      processingRate: 0
    };
  }

  /**
   * Start monitoring the Claude projects directory
   */
  async startGlobalMonitoring(): Promise<boolean> {
    if (this.isMonitoring) {
      LogHelpers.warning('jsonl-monitor', 'Global monitoring is already active');
      this.emit('warning', 'Global monitoring is already active');
      return false;
    }

    try {
      LogHelpers.info('jsonl-monitor', 'Starting global JSONL monitoring', {
        claudeProjectsDir: this.claudeProjectsDir,
        config: this.config
      });

      // Check if Claude projects directory exists
      await fs.access(this.claudeProjectsDir);
      
      // Set up global directory watcher
      this.globalWatcher = chokidar.watch(this.claudeProjectsDir, {
        ignored: this.config.excludePatterns,
        persistent: true,
        ignoreInitial: false,
        followSymlinks: true,
        depth: 3, // Limit depth to avoid excessive watching
        awaitWriteFinish: {
          stabilityThreshold: 100,
          pollInterval: 50
        }
      });

      // Set up event handlers
      this.globalWatcher
        .on('add', (filePath) => this.handleFileAdded(filePath))
        .on('change', (filePath) => this.handleFileChanged(filePath))
        .on('unlink', (filePath) => this.handleFileDeleted(filePath))
        .on('error', (error) => this.handleWatcherError(error));

      this.isMonitoring = true;
      this.stats.startTime = new Date();
      
      LogHelpers.systemEvent('jsonl-monitor', 'monitoring_started', 'Global JSONL monitoring started successfully', {
        directory: this.claudeProjectsDir,
        startTime: this.stats.startTime
      });
      
      this.emit('monitoring_started', { 
        directory: this.claudeProjectsDir,
        startTime: this.stats.startTime 
      });
      
      return true;
    } catch (error) {
      await this.handleError(error, 'Failed to start global monitoring');
      return false;
    }
  }

  /**
   * Stop global monitoring
   */
  async stopGlobalMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    try {
      // Stop global watcher
      if (this.globalWatcher) {
        await this.globalWatcher.close();
        this.globalWatcher = null;
      }

      // Stop all file monitors
      for (const monitor of this.fileMonitors.values()) {
        if (monitor.watcher) {
          await monitor.watcher.close();
        }
      }
      this.fileMonitors.clear();

      this.isMonitoring = false;
      this.emit('monitoring_stopped', { stopTime: new Date() });
    } catch (error) {
      await this.handleError(error, 'Error stopping global monitoring');
    }
  }

  /**
   * Start monitoring a specific project path
   */
  async startProjectMonitoring(projectPath: string): Promise<boolean> {
    try {
      const encodedPath = this.encodeProjectPath(projectPath);
      const projectDir = path.join(this.claudeProjectsDir, encodedPath);

      // Check if project directory exists
      try {
        await fs.access(projectDir);
      } catch {
        this.emit('project_not_found', { projectPath, encodedPath });
        return false;
      }

      // Create project monitoring info
      const projectInfo: ProjectMonitoringInfo = {
        projectPath,
        encodedPath,
        displayName: path.basename(projectPath),
        activeSessions: [],
        monitoring: true,
        lastActivity: new Date(),
        totalEventCount: 0,
        averageEventsPerHour: 0
      };

      this.monitoredProjects.set(projectPath, projectInfo);

      // Start monitoring existing JSONL files
      await this.scanProjectDirectory(projectDir, projectPath);

      this.emit('project_monitoring_started', { projectPath, encodedPath });
      return true;
    } catch (error) {
      this.handleErrorSync(error, `Failed to start monitoring project: ${projectPath}`);
      return false;
    }
  }

  /**
   * Stop monitoring a specific project
   */
  async stopProjectMonitoring(projectPath: string): Promise<void> {
    const projectInfo = this.monitoredProjects.get(projectPath);
    if (!projectInfo) {
      return;
    }

    try {
      // Stop file monitors for this project
      const projectFilters = Array.from(this.fileMonitors.entries())
        .filter(([_, monitor]) => monitor.projectPath === projectPath);

      for (const [filePath, monitor] of projectFilters) {
        if (monitor.watcher) {
          await monitor.watcher.close();
        }
        this.fileMonitors.delete(filePath);
      }

      // Remove project from monitoring
      projectInfo.monitoring = false;
      this.monitoredProjects.delete(projectPath);

      this.emit('project_monitoring_stopped', { projectPath });
    } catch (error) {
      this.handleErrorSync(error, `Error stopping project monitoring: ${projectPath}`);
    }
  }

  /**
   * Get list of available project sessions
   */
  async getProjectSessions(projectPath: string): Promise<SessionInfo[]> {
    const projectInfo = this.monitoredProjects.get(projectPath);
    if (!projectInfo) {
      return [];
    }

    return projectInfo.activeSessions;
  }

  /**
   * Encode project path for Claude directory structure
   * Converts /mnt/d/repos/claude-monitor -> -mnt-d-repos-claude-monitor
   */
  private encodeProjectPath(projectPath: string): string {
    // Convert absolute path to encoded format used by Claude Code
    return projectPath.replace(/\//g, '-').replace(/\\/g, '-');
  }

  /**
   * Decode encoded project path back to actual path
   * Converts -mnt-d-repos-claude-monitor -> /mnt/d/repos/claude-monitor
   */
  private decodeProjectPath(encodedPath: string): string {
    // Simple heuristic: if starts with dash and contains dashes, it's likely encoded
    if (encodedPath.startsWith('-') && encodedPath.includes('-')) {
      // For Unix paths starting with -, convert back to /
      return '/' + encodedPath.substring(1).replace(/-/g, '/');
    } else if (encodedPath.includes('-') && !encodedPath.includes('/') && !encodedPath.includes('\\')) {
      // For Windows-style or other encoded paths, convert dashes back to slashes
      return encodedPath.replace(/-/g, '/');
    }
    return encodedPath;
  }

  /**
   * Scan project directory for existing JSONL files
   */
  private async scanProjectDirectory(projectDir: string, projectPath: string): Promise<void> {
    try {
      const files = await fs.readdir(projectDir);
      const jsonlFiles = files.filter(file => file.endsWith('.jsonl'));

      for (const file of jsonlFiles) {
        const filePath = path.join(projectDir, file);
        const sessionId = path.basename(file, '.jsonl');
        
        // Validate session ID format (should be UUID)
        if (this.isValidSessionId(sessionId)) {
          await this.startFileMonitoring(filePath, projectPath, sessionId);
        }
      }
    } catch (error) {
      await this.handleError(error, `Error scanning project directory: ${projectDir}`);
    }
  }

  /**
   * Start monitoring a specific JSONL file
   */
  private async startFileMonitoring(filePath: string, projectPath: string, sessionId: string): Promise<void> {
    try {
      const stats = await fs.stat(filePath);
      
      const monitor: FileMonitorState = {
        filePath,
        projectPath,
        sessionId,
        watcher: null,
        currentPosition: stats.size, // Start from end to avoid replaying historical data
        currentLineNumber: 0,
        lastModified: stats.mtime,
        isActive: true,
        eventCount: 0
      };

      // Create file watcher
      monitor.watcher = chokidar.watch(filePath, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 50,
          pollInterval: 10
        }
      });

      monitor.watcher.on('change', () => this.processFileChanges(filePath));
      monitor.watcher.on('unlink', () => this.handleFileDeleted(filePath));

      this.fileMonitors.set(filePath, monitor);

      // Update project info
      const projectInfo = this.monitoredProjects.get(projectPath);
      if (projectInfo) {
        const sessionInfo: SessionInfo = {
          sessionId,
          jsonlFilePath: filePath,
          projectPath,
          isActive: true,
          eventCount: 0,
          startTime: stats.birthtime || stats.mtime,
          lastActivity: stats.mtime,
          fileSize: stats.size
        };
        
        projectInfo.activeSessions.push(sessionInfo);
      }

      this.stats.totalFiles++;
      
      this.emit('file_monitoring_started', {
        filePath,
        projectPath,
        sessionId
      });
      
    } catch (error) {
      this.handleErrorSync(error, `Failed to start monitoring file: ${filePath}`);
    }
  }

  /**
   * Process file changes and emit new line events
   */
  private async processFileChanges(filePath: string): Promise<void> {
    const monitor = this.fileMonitors.get(filePath);
    if (!monitor || !monitor.isActive) {
      return;
    }

    try {
      const stats = await fs.stat(filePath);
      
      // Check if file was truncated (size decreased)
      if (stats.size < monitor.currentPosition) {
        monitor.currentPosition = 0;
        monitor.currentLineNumber = 0;
      }

      // Only process if file grew
      if (stats.size > monitor.currentPosition) {
        await this.readNewLines(filePath, monitor, stats.size);
      }

      monitor.lastModified = stats.mtime;
      this.stats.lastActivity = new Date();
      
      // Update project info
      const projectInfo = this.monitoredProjects.get(monitor.projectPath);
      if (projectInfo) {
        projectInfo.lastActivity = new Date();
        
        const session = projectInfo.activeSessions.find(s => s.sessionId === monitor.sessionId);
        if (session) {
          session.lastActivity = new Date();
          session.fileSize = stats.size;
          session.eventCount = monitor.eventCount;
        }
      }

    } catch (error) {
      this.handleErrorSync(error, `Error processing file changes: ${filePath}`);
    }
  }

  /**
   * Read new lines from file starting from last known position
   */
  private async readNewLines(filePath: string, monitor: FileMonitorState, newSize: number): Promise<void> {
    try {
      const buffer = Buffer.alloc(newSize - monitor.currentPosition);
      const fileHandle = await fs.open(filePath, 'r');
      
      try {
        const { bytesRead } = await fileHandle.read(buffer, 0, buffer.length, monitor.currentPosition);
        const content = buffer.subarray(0, bytesRead).toString(this.config.encoding);
        
        // Process lines
        const lines = content.split('\n');
        
        // If content doesn't end with newline, save the last incomplete line
        const hasIncomplete = !content.endsWith('\n');
        const completeLines = hasIncomplete ? lines.slice(0, -1) : lines;
        
        for (const line of completeLines) {
          if (line.trim()) {
            monitor.currentLineNumber++;
            monitor.eventCount++;
            this.stats.totalLines++;
            this.stats.totalEvents++;
            
            // Truncate overly long lines
            const processedLine = line.length > this.config.maxLineLength 
              ? line.substring(0, this.config.maxLineLength) + '... [truncated]'
              : line;
            
            this.emit('jsonl_line', {
              type: 'new_line' as const,
              filePath,
              projectPath: monitor.projectPath,
              sessionId: monitor.sessionId,
              content: processedLine,
              timestamp: new Date(),
              metadata: {
                lineNumber: monitor.currentLineNumber,
                fileSize: newSize,
                position: monitor.currentPosition
              }
            });
          }
        }
        
        // Update position (don't include incomplete line)
        if (hasIncomplete && lines.length > 1) {
          monitor.currentPosition = newSize - Buffer.byteLength(lines[lines.length - 1], this.config.encoding);
        } else {
          monitor.currentPosition = newSize;
        }
        
      } finally {
        await fileHandle.close();
      }
      
    } catch (error) {
      this.handleErrorSync(error, `Error reading new lines from: ${filePath}`);
    }
  }

  /**
   * Handle file system events
   */
  private async handleFileAdded(filePath: string): Promise<void> {
    if (!filePath.endsWith('.jsonl')) {
      return;
    }

    try {
      const relativePath = path.relative(this.claudeProjectsDir, filePath);
      const pathParts = relativePath.split(path.sep);
      
      if (pathParts.length >= 2) {
        const encodedPath = pathParts[0];
        const fileName = pathParts[pathParts.length - 1];
        const sessionId = path.basename(fileName, '.jsonl');
        const projectPath = this.decodeProjectPath(encodedPath);
        
        if (this.isValidSessionId(sessionId)) {
          // Check if we're monitoring this project
          if (this.monitoredProjects.has(projectPath)) {
            await this.startFileMonitoring(filePath, projectPath, sessionId);
            
            this.emit('jsonl_file_created', {
              type: 'file_created' as const,
              filePath,
              projectPath,
              sessionId,
              timestamp: new Date()
            });
          }
        }
      }
    } catch (error) {
      this.handleErrorSync(error, `Error handling file added: ${filePath}`);
    }
  }

  private async handleFileChanged(filePath: string): Promise<void> {
    if (this.fileMonitors.has(filePath)) {
      await this.processFileChanges(filePath);
    }
  }

  private async handleFileDeleted(filePath: string): Promise<void> {
    const monitor = this.fileMonitors.get(filePath);
    if (monitor) {
      // Close watcher
      if (monitor.watcher) {
        await monitor.watcher.close();
      }
      
      // Remove from monitors
      this.fileMonitors.delete(filePath);
      
      // Update project info
      const projectInfo = this.monitoredProjects.get(monitor.projectPath);
      if (projectInfo) {
        projectInfo.activeSessions = projectInfo.activeSessions.filter(
          s => s.jsonlFilePath !== filePath
        );
      }
      
      this.emit('jsonl_file_deleted', {
        type: 'file_deleted' as const,
        filePath,
        projectPath: monitor.projectPath,
        sessionId: monitor.sessionId,
        timestamp: new Date()
      });
    }
  }

  private handleWatcherError(error: Error): void {
    this.handleErrorSync(new FileSystemError(
      `File watcher error: ${error.message}`,
      'watch',
      this.claudeProjectsDir,
      { component: 'jsonl-monitor', recoverable: true }
    ), 'File watcher error');
  }

  private async handleError(error: unknown, context: string): Promise<void> {
    this.stats.errors++;
    
    // Convert to structured error if needed
    let structuredError = error;
    if (!(error instanceof Error)) {
      structuredError = new FileSystemError(
        `${context}: ${String(error)}`,
        'unknown',
        undefined,
        { component: 'jsonl-monitor' }
      );
    }
    
    // Handle with centralized error system
    const result = await ErrorHelpers.handle(structuredError, {
      component: 'jsonl-monitor',
      logError: true,
      attemptRecovery: true
    });
    
    // Emit error event for listeners
    this.emit('error', {
      type: 'error' as const,
      timestamp: new Date(),
      message: result.userMessage,
      context,
      error: structuredError,
      filePath: '',
      recoverable: result.recoverable,
      shouldRetry: result.shouldRetry
    });
  }

  // Synchronous error handler for backwards compatibility
  private handleErrorSync(error: unknown, context: string): void {
    this.stats.errors++;
    
    // Convert to structured error if needed
    let structuredError = error;
    if (!(error instanceof Error)) {
      structuredError = new FileSystemError(
        `${context}: ${String(error)}`,
        'unknown',
        undefined,
        { component: 'jsonl-monitor' }
      );
    }
    
    // Log synchronously
    LogHelpers.error('jsonl-monitor', structuredError, { context });
    
    // Emit error event for listeners
    this.emit('error', {
      type: 'error' as const,
      timestamp: new Date(),
      message: context,
      context,
      error: structuredError,
      filePath: '',
      recoverable: false,
      shouldRetry: false
    });
  }

  /**
   * Validate session ID format (should be UUID)
   */
  private isValidSessionId(sessionId: string): boolean {
    // Simple UUID v4 validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(sessionId);
  }

  /**
   * Get monitoring statistics
   */
  getStatistics() {
    const now = new Date();
    const runtime = this.stats.startTime 
      ? (now.getTime() - this.stats.startTime.getTime()) / 1000 
      : 0;
    
    return {
      ...this.stats,
      runtime,
      processingRate: runtime > 0 ? this.stats.totalLines / runtime : 0,
      monitoredProjects: this.monitoredProjects.size,
      activeFiles: this.fileMonitors.size,
      isMonitoring: this.isMonitoring
    };
  }

  /**
   * Get list of monitored projects
   */
  getMonitoredProjects(): ProjectMonitoringInfo[] {
    return Array.from(this.monitoredProjects.values());
  }

  /**
   * Reset statistics
   */
  resetStatistics(): void {
    this.stats = {
      startTime: this.isMonitoring ? new Date() : null,
      totalFiles: 0,
      totalLines: 0,
      totalEvents: 0,
      errors: 0,
      lastActivity: null,
      processingRate: 0
    };
  }

  /**
   * Clean shutdown
   */
  async shutdown(): Promise<void> {
    await this.stopGlobalMonitoring();
    this.removeAllListeners();
  }
}

// Export types and main class
export { JSONLFileSystemMonitor as default };