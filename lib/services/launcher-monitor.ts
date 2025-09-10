/**
 * Launcher Monitor Service
 * 
 * Modern JSONL monitoring integration specifically for launcher-created Claude Code sessions.
 * Provides clean integration between launcher orchestrator and JSONL file monitoring
 * with real-time updates and efficient event handling.
 */

import { EventEmitter } from 'events';
import * as path from 'path';
import * as os from 'os';
import { LauncherOrchestrator, LauncherEvents } from './claude-launcher';
import { JSONLFileSystemMonitor, JSONLEvent, SessionInfo, ProjectMonitoringInfo } from './jsonl-monitor';
import { InstanceInfo, InstanceStatus } from '../types/launcher';
import { LogHelpers } from '../utils/logger';
import { ErrorFactory } from '../utils/errors';

// Launcher-specific monitoring events
export interface LauncherMonitorEvents {
  'launcher_session_started': [LauncherSessionInfo];
  'launcher_session_activity': [LauncherSessionInfo, JSONLEvent];
  'launcher_session_ended': [LauncherSessionInfo];
  'launcher_instance_ready': [string, InstanceInfo];
  'launcher_instance_failed': [string, Error];
  'monitoring_status_changed': [boolean];
  'error': [Error];
}

// Enhanced session info for launcher monitoring
export interface LauncherSessionInfo extends SessionInfo {
  instanceId: string;
  launcherManaged: boolean;
  tcpPort: number;
  lastCommand?: Date;
  commandCount: number;
}

// Configuration for launcher monitoring
export interface LauncherMonitorConfig {
  autoDetectSessions?: boolean;
  sessionTimeout?: number;
  maxIdleSessions?: number;
  performanceTracking?: boolean;
  claudeProjectsDir?: string;
}

/**
 * LauncherMonitor - Specialized monitoring for launcher-created sessions
 * 
 * Integrates launcher orchestrator with JSONL file monitoring to provide:
 * - Automatic detection of launcher-created sessions
 * - Real-time JSONL monitoring for active launcher instances
 * - Session lifecycle tracking with launcher context
 * - Performance monitoring with minimal overhead
 */
export class LauncherMonitor extends EventEmitter {
  // Type-safe event emitter methods
  on<K extends keyof LauncherMonitorEvents>(event: K, listener: (...args: LauncherMonitorEvents[K]) => void): this {
    return super.on(event, listener);
  }

  emit<K extends keyof LauncherMonitorEvents>(event: K, ...args: LauncherMonitorEvents[K]): boolean {
    return super.emit(event, ...args);
  }

  private config: Required<LauncherMonitorConfig>;
  private launcher: LauncherOrchestrator;
  private jsonlMonitor: JSONLFileSystemMonitor;
  private launcherSessions = new Map<string, LauncherSessionInfo>();
  private instanceSessionMap = new Map<string, Set<string>>(); // instanceId -> sessionIds
  private isMonitoring = false;
  private sessionTimeoutInterval: NodeJS.Timeout | null = null;
  private stats = {
    totalSessions: 0,
    activeSessions: 0,
    totalEvents: 0,
    startTime: null as Date | null
  };

  constructor(
    launcher: LauncherOrchestrator,
    jsonlMonitor: JSONLFileSystemMonitor,
    config: LauncherMonitorConfig = {}
  ) {
    super();

    this.config = {
      autoDetectSessions: config.autoDetectSessions ?? true,
      sessionTimeout: config.sessionTimeout ?? 300000, // 5 minutes
      maxIdleSessions: config.maxIdleSessions ?? 10,
      performanceTracking: config.performanceTracking ?? true,
      claudeProjectsDir: config.claudeProjectsDir ?? path.join(os.homedir(), '.claude', 'projects')
    };

    this.launcher = launcher;
    this.jsonlMonitor = jsonlMonitor;

    // Bind event handlers
    this.setupLauncherEventHandlers();
    this.setupJSONLEventHandlers();
  }

  /**
   * Start monitoring launcher sessions
   */
  async startMonitoring(): Promise<boolean> {
    if (this.isMonitoring) {
      LogHelpers.warning('launcher-monitor', 'Launcher monitoring is already active');
      return false;
    }

    try {
      LogHelpers.info('launcher-monitor', 'Starting launcher session monitoring', {
        config: this.config
      });

      // Ensure JSONL monitor is running
      if (!this.jsonlMonitor.getStatistics().isMonitoring) {
        const started = await this.jsonlMonitor.startGlobalMonitoring();
        if (!started) {
          throw new Error('Failed to start JSONL monitoring');
        }
      }

      // Start session timeout monitoring
      this.startSessionTimeoutMonitoring();

      // Initialize with existing launcher instances
      await this.initializeExistingInstances();

      this.isMonitoring = true;
      this.stats.startTime = new Date();
      
      this.emit('monitoring_status_changed', true);
      
      LogHelpers.systemEvent('launcher-monitor', 'monitoring_started', 'Launcher monitoring started successfully', {
        startTime: this.stats.startTime,
        autoDetect: this.config.autoDetectSessions
      });

      return true;
    } catch (error) {
      LogHelpers.error('launcher-monitor', error as Error, { operation: 'start_monitoring' });
      this.emit('error', error as Error);
      return false;
    }
  }

  /**
   * Stop monitoring launcher sessions
   */
  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    try {
      LogHelpers.info('launcher-monitor', 'Stopping launcher session monitoring');

      // Stop session timeout monitoring
      if (this.sessionTimeoutInterval) {
        clearInterval(this.sessionTimeoutInterval);
        this.sessionTimeoutInterval = null;
      }

      // Clear session tracking
      this.launcherSessions.clear();
      this.instanceSessionMap.clear();

      this.isMonitoring = false;
      this.emit('monitoring_status_changed', false);

      LogHelpers.systemEvent('launcher-monitor', 'monitoring_stopped', 'Launcher monitoring stopped', {
        totalSessions: this.stats.totalSessions,
        totalEvents: this.stats.totalEvents
      });
    } catch (error) {
      LogHelpers.error('launcher-monitor', error as Error, { operation: 'stop_monitoring' });
      this.emit('error', error as Error);
    }
  }

  /**
   * Get launcher-managed sessions for a specific instance
   */
  getInstanceSessions(instanceId: string): LauncherSessionInfo[] {
    const sessionIds = this.instanceSessionMap.get(instanceId) || new Set();
    return Array.from(sessionIds)
      .map(sessionId => this.launcherSessions.get(sessionId))
      .filter((session): session is LauncherSessionInfo => session !== undefined);
  }

  /**
   * Get all launcher-managed sessions
   */
  getAllLauncherSessions(): LauncherSessionInfo[] {
    return Array.from(this.launcherSessions.values());
  }

  /**
   * Get launcher monitoring statistics
   */
  getStats() {
    const now = new Date();
    const runtime = this.stats.startTime 
      ? (now.getTime() - this.stats.startTime.getTime()) / 1000 
      : 0;

    return {
      ...this.stats,
      runtime,
      eventsPerSecond: runtime > 0 ? this.stats.totalEvents / runtime : 0,
      isMonitoring: this.isMonitoring,
      sessionCount: this.launcherSessions.size,
      instanceCount: this.instanceSessionMap.size
    };
  }

  /**
   * Setup launcher orchestrator event handlers
   */
  private setupLauncherEventHandlers(): void {
    this.launcher.on('instance_started', (instance: InstanceInfo) => {
      this.handleInstanceStarted(instance);
    });

    this.launcher.on('instance_stopped', (instanceId: string) => {
      this.handleInstanceStopped(instanceId);
    });

    this.launcher.on('instance_error', (instanceId: string, error: Error) => {
      this.handleInstanceError(instanceId, error);
    });

    this.launcher.on('instance_status_changed', (instanceId: string, oldStatus: InstanceStatus, newStatus: InstanceStatus) => {
      this.handleInstanceStatusChanged(instanceId, oldStatus, newStatus);
    });
  }

  /**
   * Setup JSONL monitor event handlers
   */
  private setupJSONLEventHandlers(): void {
    this.jsonlMonitor.on('jsonl_line', (event: JSONLEvent) => {
      this.handleJSONLEvent(event);
    });

    this.jsonlMonitor.on('jsonl_file_created', (event: JSONLEvent) => {
      this.handleJSONLFileCreated(event);
    });

    this.jsonlMonitor.on('jsonl_file_deleted', (event: JSONLEvent) => {
      this.handleJSONLFileDeleted(event);
    });
  }

  /**
   * Initialize monitoring for existing launcher instances
   */
  private async initializeExistingInstances(): Promise<void> {
    const instances = this.launcher.getAllInstances();
    
    for (const instance of instances) {
      if (instance.status === 'running') {
        await this.handleInstanceStarted(instance);
      }
    }
  }

  /**
   * Handle launcher instance started
   */
  private async handleInstanceStarted(instance: InstanceInfo): Promise<void> {
    try {
      LogHelpers.info('launcher-monitor', 'Launcher instance started', {
        instanceId: instance.id,
        projectPath: instance.config.projectPath,
        tcpPort: instance.tcpPort
      });

      // Start monitoring the project path for JSONL files
      if (this.config.autoDetectSessions) {
        await this.jsonlMonitor.startProjectMonitoring(instance.config.projectPath);
      }

      // Initialize session tracking for this instance
      if (!this.instanceSessionMap.has(instance.id)) {
        this.instanceSessionMap.set(instance.id, new Set());
      }

      this.emit('launcher_instance_ready', instance.id, instance);
    } catch (error) {
      LogHelpers.error('launcher-monitor', error as Error, { 
        instanceId: instance.id, 
        operation: 'handle_instance_started' 
      });
      this.emit('launcher_instance_failed', instance.id, error as Error);
    }
  }

  /**
   * Handle launcher instance stopped
   */
  private handleInstanceStopped(instanceId: string): void {
    try {
      LogHelpers.info('launcher-monitor', 'Launcher instance stopped', { instanceId });

      // End all sessions for this instance
      const sessionIds = this.instanceSessionMap.get(instanceId) || new Set();
      for (const sessionId of sessionIds) {
        const session = this.launcherSessions.get(sessionId);
        if (session) {
          session.isActive = false;
          this.emit('launcher_session_ended', session);
          this.launcherSessions.delete(sessionId);
        }
      }

      // Clean up instance tracking
      this.instanceSessionMap.delete(instanceId);
      this.stats.activeSessions = this.launcherSessions.size;
    } catch (error) {
      LogHelpers.error('launcher-monitor', error as Error, { 
        instanceId, 
        operation: 'handle_instance_stopped' 
      });
    }
  }

  /**
   * Handle launcher instance error
   */
  private handleInstanceError(instanceId: string, error: Error): void {
    LogHelpers.error('launcher-monitor', error, { 
      instanceId, 
      operation: 'handle_instance_error' 
    });
    this.emit('launcher_instance_failed', instanceId, error);
  }

  /**
   * Handle launcher instance status change
   */
  private handleInstanceStatusChanged(instanceId: string, oldStatus: InstanceStatus, newStatus: InstanceStatus): void {
    LogHelpers.debug('launcher-monitor', 'Instance status changed', {
      instanceId,
      oldStatus,
      newStatus
    });

    // Update session activity based on status
    const sessionIds = this.instanceSessionMap.get(instanceId) || new Set();
    for (const sessionId of sessionIds) {
      const session = this.launcherSessions.get(sessionId);
      if (session) {
        session.isActive = newStatus === 'running';
        session.lastActivity = new Date();
      }
    }
  }

  /**
   * Handle JSONL line event
   */
  private handleJSONLEvent(event: JSONLEvent): void {
    if (event.type !== 'new_line' || !event.sessionId || !event.projectPath) {
      return;
    }

    try {
      // Find associated launcher instance
      const instanceId = this.findInstanceForProject(event.projectPath);
      if (!instanceId) {
        return; // Not a launcher-managed session
      }

      // Get or create launcher session info
      let session = this.launcherSessions.get(event.sessionId);
      if (!session) {
        session = this.createLauncherSession(event, instanceId);
        this.launcherSessions.set(event.sessionId, session);
        this.instanceSessionMap.get(instanceId)?.add(event.sessionId);
        this.stats.totalSessions++;
        this.emit('launcher_session_started', session);
      }

      // Update session activity
      session.lastActivity = event.timestamp;
      session.eventCount++;
      session.fileSize = event.metadata?.fileSize || session.fileSize;

      this.stats.totalEvents++;
      this.stats.activeSessions = this.launcherSessions.size;

      this.emit('launcher_session_activity', session, event);

      if (this.config.performanceTracking) {
        LogHelpers.debug('launcher-monitor', 'Session activity', {
          sessionId: event.sessionId,
          instanceId,
          eventCount: session.eventCount,
          fileSize: session.fileSize
        });
      }
    } catch (error) {
      LogHelpers.error('launcher-monitor', error as Error, { 
        sessionId: event.sessionId,
        operation: 'handle_jsonl_event' 
      });
    }
  }

  /**
   * Handle JSONL file created
   */
  private handleJSONLFileCreated(event: JSONLEvent): void {
    if (!event.sessionId || !event.projectPath) {
      return;
    }

    LogHelpers.info('launcher-monitor', 'New JSONL file detected for launcher session', {
      sessionId: event.sessionId,
      projectPath: event.projectPath,
      filePath: event.filePath
    });
  }

  /**
   * Handle JSONL file deleted
   */
  private handleJSONLFileDeleted(event: JSONLEvent): void {
    if (!event.sessionId) {
      return;
    }

    const session = this.launcherSessions.get(event.sessionId);
    if (session && session.launcherManaged) {
      session.isActive = false;
      this.emit('launcher_session_ended', session);
      this.launcherSessions.delete(event.sessionId);
      
      // Remove from instance mapping
      const instanceSessions = this.instanceSessionMap.get(session.instanceId);
      if (instanceSessions) {
        instanceSessions.delete(event.sessionId);
      }

      this.stats.activeSessions = this.launcherSessions.size;

      LogHelpers.info('launcher-monitor', 'Launcher session ended', {
        sessionId: event.sessionId,
        instanceId: session.instanceId
      });
    }
  }

  /**
   * Find launcher instance for project path
   */
  private findInstanceForProject(projectPath: string): string | undefined {
    const instances = this.launcher.getAllInstances();
    return instances.find(instance => 
      instance.config.projectPath === projectPath && instance.status === 'running'
    )?.id;
  }

  /**
   * Create launcher session info from JSONL event
   */
  private createLauncherSession(event: JSONLEvent, instanceId: string): LauncherSessionInfo {
    const instance = this.launcher.getInstanceInfo(instanceId);
    
    return {
      sessionId: event.sessionId!,
      jsonlFilePath: event.filePath,
      projectPath: event.projectPath!,
      isActive: true,
      eventCount: 0,
      startTime: event.timestamp,
      lastActivity: event.timestamp,
      fileSize: event.metadata?.fileSize || 0,
      instanceId,
      launcherManaged: true,
      tcpPort: instance?.tcpPort || 0,
      commandCount: 0
    };
  }

  /**
   * Start session timeout monitoring
   */
  private startSessionTimeoutMonitoring(): void {
    this.sessionTimeoutInterval = setInterval(() => {
      this.checkSessionTimeouts();
    }, this.config.sessionTimeout / 2); // Check at half the timeout interval
  }

  /**
   * Check for timed out sessions
   */
  private checkSessionTimeouts(): void {
    const now = new Date();
    const timeoutMs = this.config.sessionTimeout;

    for (const [sessionId, session] of this.launcherSessions.entries()) {
      const timeSinceActivity = now.getTime() - session.lastActivity.getTime();
      
      if (timeSinceActivity > timeoutMs && session.isActive) {
        LogHelpers.info('launcher-monitor', 'Session timed out due to inactivity', {
          sessionId,
          instanceId: session.instanceId,
          timeSinceActivity: Math.round(timeSinceActivity / 1000)
        });

        session.isActive = false;
        this.emit('launcher_session_ended', session);
        this.launcherSessions.delete(sessionId);

        // Remove from instance mapping
        const instanceSessions = this.instanceSessionMap.get(session.instanceId);
        if (instanceSessions) {
          instanceSessions.delete(sessionId);
        }
      }
    }

    this.stats.activeSessions = this.launcherSessions.size;

    // Clean up idle sessions if we exceed max
    if (this.launcherSessions.size > this.config.maxIdleSessions) {
      this.cleanupIdleSessions();
    }
  }

  /**
   * Clean up oldest idle sessions
   */
  private cleanupIdleSessions(): void {
    const sessions = Array.from(this.launcherSessions.values())
      .filter(s => !s.isActive)
      .sort((a, b) => a.lastActivity.getTime() - b.lastActivity.getTime());

    const excess = sessions.length - Math.floor(this.config.maxIdleSessions * 0.8);
    if (excess > 0) {
      const toRemove = sessions.slice(0, excess);
      
      for (const session of toRemove) {
        this.launcherSessions.delete(session.sessionId);
        
        const instanceSessions = this.instanceSessionMap.get(session.instanceId);
        if (instanceSessions) {
          instanceSessions.delete(session.sessionId);
        }
      }

      LogHelpers.info('launcher-monitor', 'Cleaned up idle sessions', {
        removedCount: toRemove.length,
        remainingCount: this.launcherSessions.size
      });
    }
  }

  /**
   * Shutdown monitoring and cleanup
   */
  async shutdown(): Promise<void> {
    await this.stopMonitoring();
    this.removeAllListeners();
  }
}

/**
 * Factory function to create launcher monitor
 */
export function createLauncherMonitor(
  launcher: LauncherOrchestrator,
  jsonlMonitor: JSONLFileSystemMonitor,
  config?: LauncherMonitorConfig
): LauncherMonitor {
  return new LauncherMonitor(launcher, jsonlMonitor, config);
}

/**
 * Export types and main class
 */
export { LauncherMonitor as default };