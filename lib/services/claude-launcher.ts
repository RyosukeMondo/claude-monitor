/**
 * Claude Code Launcher Orchestrator
 * 
 * Main launcher service that orchestrates Claude Code process lifecycle with TTY bridge and TCP server integration.
 * Provides core launcher functionality with modern architecture, process isolation, and comprehensive monitoring.
 * 
 * Architecture: Launcher Orchestrator -> TTY Bridge -> TCP Server -> Claude Code Process
 */

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import { TTYBridge, TTYBridgeOptions, createTTYBridge, findAvailablePort } from './tty-bridge';
import { TCPServer, TCPServerOptions, createTCPServer, CommandHandler } from './tcp-server';
import { 
  LauncherConfig, 
  InstanceInfo, 
  InstanceStatus, 
  TCPCommand, 
  TCPResponse,
  validateLauncherConfig 
} from '../types/launcher';
import { LogHelpers } from '../utils/logger';
import { ErrorFactory } from '../utils/errors';

export interface LauncherEvents {
  'instance_created': [InstanceInfo];
  'instance_started': [InstanceInfo];
  'instance_stopped': [string];
  'instance_error': [string, Error];
  'instance_status_changed': [string, InstanceStatus, InstanceStatus];
  'launcher_ready': [LauncherOrchestrator];
  'launcher_error': [Error];
}

/**
 * Claude Code Launcher Orchestrator
 * Manages the complete lifecycle of Claude Code instances with integrated TCP command interface
 */
export class LauncherOrchestrator extends EventEmitter {
  // Type-safe event emitter methods
  on<K extends keyof LauncherEvents>(event: K, listener: (...args: LauncherEvents[K]) => void): this {
    return super.on(event, listener);
  }

  emit<K extends keyof LauncherEvents>(event: K, ...args: LauncherEvents[K]): boolean {
    return super.emit(event, ...args);
  }

  private instances = new Map<string, InstanceInfo>();
  private ttyBridges = new Map<string, TTYBridge>();
  private tcpServers = new Map<string, TCPServer>();
  private isInitialized = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  
  private readonly DEFAULT_HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly DEFAULT_CLAUDE_PATH = 'claude-code';
  private readonly DEFAULT_TCP_PORT_START = 9999;

  constructor() {
    super();
  }

  /**
   * Initialize the launcher orchestrator
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      LogHelpers.warning('claude-launcher', 'Launcher already initialized');
      return;
    }

    try {
      LogHelpers.info('claude-launcher', 'Initializing Claude Code launcher orchestrator');

      // Start health monitoring
      this.startHealthMonitoring();

      this.isInitialized = true;
      this.emit('launcher_ready', this);
      
      LogHelpers.info('claude-launcher', 'Claude Code launcher orchestrator initialized successfully');
    } catch (error) {
      const initError = ErrorFactory.configurationMissing(
        'LAUNCHER_INITIALIZATION_FAILED',
        'object'
      );
      this.emit('launcher_error', initError);
      throw initError;
    }
  }

  /**
   * Create and start a new Claude Code instance
   */
  async createInstance(config: LauncherConfig): Promise<InstanceInfo> {
    if (!this.isInitialized) {
      throw ErrorFactory.configurationMissing(
        'LAUNCHER_NOT_INITIALIZED',
        'object'
      );
    }

    // Validate configuration
    const validation = validateLauncherConfig(config);
    if (!validation.success) {
      throw new Error('Invalid launcher configuration: ' + JSON.stringify(validation.error.issues));
    }

    const instanceId = randomUUID();
    const startTime = new Date();

    try {
      LogHelpers.info('claude-launcher', 'Creating Claude Code instance', {
        instanceId,
        projectPath: config.projectPath,
        displayName: config.displayName
      });

      // Find available TCP port
      const tcpPort = await findAvailablePort(
        config.tcpPort || this.DEFAULT_TCP_PORT_START,
        (config.tcpPort || this.DEFAULT_TCP_PORT_START) + 100
      );

      // Create instance info
      const instanceInfo: InstanceInfo = {
        id: instanceId,
        config: {
          ...config,
          tcpPort
        },
        processId: 0, // Will be set when TTY bridge starts
        tcpPort,
        status: 'starting',
        startTime,
        lastActivity: startTime,
        sessionIds: []
      };

      this.instances.set(instanceId, instanceInfo);
      this.emit('instance_created', instanceInfo);

      // Start the instance components
      await this.startInstance(instanceId);

      LogHelpers.info('claude-launcher', 'Claude Code instance created successfully', {
        instanceId,
        tcpPort,
        status: instanceInfo.status
      });

      return instanceInfo;
    } catch (error) {
      // Cleanup on failure
      await this.cleanupInstance(instanceId);
      
      const createError = ErrorFactory.recoveryActionFailed(
        'create_claude_instance',
        config.projectPath,
        1,
        (error as Error).message
      );
      this.emit('instance_error', instanceId, createError);
      throw createError;
    }
  }

  /**
   * Stop and remove a Claude Code instance
   */
  async stopInstance(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error('Instance not found: ' + instanceId);
    }

    try {
      LogHelpers.info('claude-launcher', 'Stopping Claude Code instance', {
        instanceId,
        currentStatus: instance.status
      });

      const oldStatus = instance.status;
      instance.status = 'stopping';
      this.emit('instance_status_changed', instanceId, oldStatus, 'stopping');

      // Stop TCP server first
      const tcpServer = this.tcpServers.get(instanceId);
      if (tcpServer) {
        await tcpServer.stop();
        this.tcpServers.delete(instanceId);
      }

      // Stop TTY bridge
      const ttyBridge = this.ttyBridges.get(instanceId);
      if (ttyBridge) {
        await ttyBridge.stop();
        this.ttyBridges.delete(instanceId);
      }

      // Update status and cleanup
      instance.status = 'stopped';
      this.emit('instance_status_changed', instanceId, 'stopping', 'stopped');
      this.emit('instance_stopped', instanceId);

      // Remove from instances map
      this.instances.delete(instanceId);

      LogHelpers.info('claude-launcher', 'Claude Code instance stopped successfully', { instanceId });
    } catch (error) {
      const stopError = ErrorFactory.recoveryActionFailed(
        'stop_claude_instance',
        instanceId,
        1,
        (error as Error).message
      );
      this.emit('instance_error', instanceId, stopError);
      throw stopError;
    }
  }

  /**
   * Get instance information
   */
  getInstanceInfo(instanceId: string): InstanceInfo | undefined {
    const instance = this.instances.get(instanceId);
    if (!instance) return undefined;

    // Update last activity
    instance.lastActivity = new Date();
    
    // Get current session IDs from JSONL monitoring (to be implemented)
    // For now, return current instance info
    return { ...instance };
  }

  /**
   * Get all instances
   */
  getAllInstances(): InstanceInfo[] {
    return Array.from(this.instances.values()).map(instance => ({ ...instance }));
  }

  /**
   * Get instance status
   */
  getInstanceStatus(instanceId: string): InstanceStatus | undefined {
    const instance = this.instances.get(instanceId);
    return instance?.status;
  }

  /**
   * Send command to specific instance
   */
  async sendCommand(instanceId: string, command: TCPCommand): Promise<TCPResponse> {
    const ttyBridge = this.ttyBridges.get(instanceId);
    if (!ttyBridge) {
      throw new Error('Instance not found or not running: ' + instanceId);
    }

    // Ensure command has correct instance ID
    command.instanceId = instanceId;

    try {
      const response = await ttyBridge.sendCommand(command);
      
      // Update last activity
      const instance = this.instances.get(instanceId);
      if (instance) {
        instance.lastActivity = new Date();
      }

      return response;
    } catch (error) {
      const cmdError = ErrorFactory.recoveryActionFailed(
        'send_instance_command',
        command.type,
        1,
        (error as Error).message
      );
      this.emit('instance_error', instanceId, cmdError);
      throw cmdError;
    }
  }

  /**
   * Check health of all instances
   */
  async checkInstancesHealth(): Promise<{ [instanceId: string]: boolean }> {
    const healthResults: { [instanceId: string]: boolean } = {};

    for (const [instanceId, _] of this.instances) {
      try {
        const ttyBridge = this.ttyBridges.get(instanceId);
        if (ttyBridge) {
          healthResults[instanceId] = await ttyBridge.healthCheck();
        } else {
          healthResults[instanceId] = false;
        }
      } catch {
        healthResults[instanceId] = false;
      }
    }

    return healthResults;
  }

  /**
   * Shutdown the launcher and cleanup all instances
   */
  async shutdown(): Promise<void> {
    try {
      LogHelpers.info('claude-launcher', 'Shutting down Claude Code launcher', {
        instanceCount: this.instances.size
      });

      // Stop health monitoring
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }

      // Stop all instances
      const stopPromises = Array.from(this.instances.keys()).map(instanceId => 
        this.stopInstance(instanceId).catch(error => {
          LogHelpers.error('claude-launcher', error, { instanceId });
        })
      );

      await Promise.all(stopPromises);

      this.isInitialized = false;
      LogHelpers.info('claude-launcher', 'Claude Code launcher shutdown complete');
    } catch (error) {
      const shutdownError = ErrorFactory.recoveryActionFailed(
        'shutdown_launcher',
        'cleanup',
        1,
        (error as Error).message
      );
      this.emit('launcher_error', shutdownError);
      throw shutdownError;
    }
  }

  /**
   * Start an instance (internal method)
   */
  private async startInstance(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error('Instance not found: ' + instanceId);
    }

    try {
      // Create TTY bridge options
      const ttyOptions: TTYBridgeOptions = {
        port: instance.tcpPort,
        instanceId,
        claudePath: this.DEFAULT_CLAUDE_PATH,
        claudeArgs: instance.config.claudeArgs || [],
        projectPath: instance.config.projectPath,
        timeout: 10000,
        logLevel: 'info'
      };

      // Create and start TTY bridge
      const ttyBridge = createTTYBridge(ttyOptions);
      this.ttyBridges.set(instanceId, ttyBridge);

      // Setup TTY bridge event handlers
      ttyBridge.on('bridge_ready', (bridgeInfo) => {
        LogHelpers.info('claude-launcher', 'TTY bridge ready for instance', {
          instanceId,
          port: bridgeInfo.port
        });
      });

      ttyBridge.on('bridge_error', (error) => {
        LogHelpers.error('claude-launcher', error, { instanceId });
        this.emit('instance_error', instanceId, error);
      });

      ttyBridge.on('claude_exit', (code) => {
        LogHelpers.warning('claude-launcher', 'Claude process exited', { instanceId, code });
        this.handleInstanceFailure(instanceId);
      });

      // Start TTY bridge
      const bridgeInfo = await ttyBridge.start();
      
      // Update instance with process ID (if available)
      // Note: TTY bridge doesn't expose process ID directly, but we can track it
      instance.processId = 1; // Placeholder - actual PID would need TTY bridge enhancement

      // Create TCP server for command interface
      const tcpOptions: TCPServerOptions = {
        port: instance.tcpPort + 1000, // Use different port for TCP server
        instanceId,
        maxConnections: 5,
        rateLimitRequests: 100,
        rateLimitWindow: 60000,
        commandTimeout: 5000,
        logLevel: 'info'
      };

      // Create command handler that forwards to TTY bridge
      const commandHandler: CommandHandler = async (command: TCPCommand) => {
        return await ttyBridge.sendCommand(command);
      };

      const tcpServer = createTCPServer(tcpOptions);
      this.tcpServers.set(instanceId, tcpServer);

      // Setup TCP server event handlers
      tcpServer.on('server_ready', (serverInfo) => {
        LogHelpers.info('claude-launcher', 'TCP server ready for instance', {
          instanceId,
          port: serverInfo.port
        });
      });

      tcpServer.on('server_error', (error) => {
        LogHelpers.error('claude-launcher', error, { instanceId });
        this.emit('instance_error', instanceId, error);
      });

      // Start TCP server
      await tcpServer.start(commandHandler);

      // Update instance status
      const oldStatus = instance.status;
      instance.status = 'running';
      instance.lastActivity = new Date();
      
      this.emit('instance_status_changed', instanceId, oldStatus, 'running');
      this.emit('instance_started', instance);

      LogHelpers.info('claude-launcher', 'Instance started successfully', {
        instanceId,
        ttyPort: bridgeInfo.port,
        tcpPort: tcpOptions.port,
        status: instance.status
      });

    } catch (error) {
      await this.cleanupInstance(instanceId);
      throw error;
    }
  }

  /**
   * Handle instance failure and attempt recovery
   */
  private async handleInstanceFailure(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    try {
      LogHelpers.warning('claude-launcher', 'Handling instance failure', { instanceId });

      const oldStatus = instance.status;
      instance.status = 'error';
      this.emit('instance_status_changed', instanceId, oldStatus, 'error');

      // Attempt automatic restart if configured
      if (instance.config.autoRestart) {
        LogHelpers.info('claude-launcher', 'Attempting automatic instance restart', { instanceId });
        
        // Cleanup current resources
        await this.cleanupInstance(instanceId, false); // Don't remove from instances map
        
        // Wait a bit before restart
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Restart instance
        await this.startInstance(instanceId);
      } else {
        // Mark as failed
        this.emit('instance_error', instanceId, new Error('Instance failed and auto-restart disabled'));
      }
    } catch (error) {
      LogHelpers.error('claude-launcher', error as Error, { instanceId });
      this.emit('instance_error', instanceId, error as Error);
    }
  }

  /**
   * Cleanup instance resources
   */
  private async cleanupInstance(instanceId: string, removeFromMap: boolean = true): Promise<void> {
    try {
      // Stop TCP server
      const tcpServer = this.tcpServers.get(instanceId);
      if (tcpServer) {
        await tcpServer.stop().catch(error => {
          LogHelpers.error('claude-launcher', error, { instanceId, component: 'tcp-server' });
        });
        this.tcpServers.delete(instanceId);
      }

      // Stop TTY bridge
      const ttyBridge = this.ttyBridges.get(instanceId);
      if (ttyBridge) {
        await ttyBridge.stop().catch(error => {
          LogHelpers.error('claude-launcher', error, { instanceId, component: 'tty-bridge' });
        });
        this.ttyBridges.delete(instanceId);
      }

      // Remove from instances if requested
      if (removeFromMap) {
        this.instances.delete(instanceId);
      }

    } catch (error) {
      LogHelpers.error('claude-launcher', error as Error, { instanceId, operation: 'cleanup' });
    }
  }

  /**
   * Start periodic health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const healthResults = await this.checkInstancesHealth();
        
        for (const [instanceId, isHealthy] of Object.entries(healthResults)) {
          const instance = this.instances.get(instanceId);
          if (!instance) continue;

          if (!isHealthy && instance.status === 'running') {
            LogHelpers.warning('claude-launcher', 'Instance health check failed', { instanceId });
            await this.handleInstanceFailure(instanceId);
          }
        }
      } catch (error) {
        LogHelpers.error('claude-launcher', error as Error, { operation: 'health-monitoring' });
      }
    }, this.DEFAULT_HEALTH_CHECK_INTERVAL);
  }
}

/**
 * Factory function to create launcher orchestrator
 */
export function createLauncherOrchestrator(): LauncherOrchestrator {
  return new LauncherOrchestrator();
}

/**
 * Singleton launcher orchestrator instance
 */
export const launcherOrchestrator = createLauncherOrchestrator();

/**
 * Utility function to get launcher statistics
 */
export function getLauncherStats(): {
  totalInstances: number;
  runningInstances: number;
  errorInstances: number;
  stoppedInstances: number;
} {
  const instances = launcherOrchestrator.getAllInstances();
  
  return {
    totalInstances: instances.length,
    runningInstances: instances.filter(i => i.status === 'running').length,
    errorInstances: instances.filter(i => i.status === 'error').length,
    stoppedInstances: instances.filter(i => i.status === 'stopped').length
  };
}