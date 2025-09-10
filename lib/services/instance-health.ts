/**
 * Instance Health Monitoring Service
 * 
 * Modern real-time health monitoring service for launcher instances following requirements 2.3 and 3.3.
 * Implements comprehensive health checks, circuit breakers, and WebSocket integration for real-time updates.
 * 
 * Features:
 * - Real-time instance health monitoring with efficient polling strategies
 * - Circuit breaker pattern for resilient monitoring
 * - WebSocket integration for live dashboard updates
 * - Performance metrics collection and analysis
 * - Automatic failure detection and recovery coordination
 */

import { EventEmitter } from 'events';
import { LauncherOrchestrator, LauncherEvents } from './claude-launcher';
import { getWebSocketServer } from '../websocket/server';
import { 
  InstanceInfo, 
  InstanceStatus, 
  InstanceHealth,
  LauncherHealthReport 
} from '../types/launcher';
import { LogHelpers } from '../utils/logger';
import { ErrorFactory } from '../utils/errors';

// Health monitoring events
export interface InstanceHealthEvents {
  'health_check_completed': [string, InstanceHealth];
  'instance_health_degraded': [string, InstanceHealth];
  'instance_health_critical': [string, InstanceHealth];
  'instance_health_recovered': [string, InstanceHealth];
  'health_report_generated': [LauncherHealthReport];
  'circuit_breaker_opened': [string, string];
  'circuit_breaker_closed': [string];
  'monitoring_error': [Error];
}

// Circuit breaker states
export type CircuitBreakerState = 'closed' | 'open' | 'half-open';

// Circuit breaker configuration
export interface CircuitBreakerConfig {
  failureThreshold: number;
  timeoutMs: number;
  retryTimeoutMs: number;
  monitorWindowMs: number;
}

// Health monitoring configuration
export interface InstanceHealthConfig {
  healthCheckInterval: number;
  healthCheckTimeout: number;
  processCheckEnabled: boolean;
  tcpBridgeCheckEnabled: boolean;
  memoryCheckEnabled: boolean;
  cpuCheckEnabled: boolean;
  circuitBreaker: CircuitBreakerConfig;
  realTimeUpdates: boolean;
}

// Circuit breaker implementation for resilient health checks
class CircuitBreaker {
  private state: CircuitBreakerState = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;
  private nextAttemptTime = 0;

  constructor(
    private instanceId: string,
    private config: CircuitBreakerConfig,
    private healthMonitor: InstanceHealthMonitor
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() < this.nextAttemptTime) {
        throw new Error(`Circuit breaker open for instance ${this.instanceId}`);
      }
      this.state = 'half-open';
    }

    try {
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), this.config.timeoutMs)
        )
      ]);

      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    if (this.state === 'half-open') {
      this.state = 'closed';
      this.healthMonitor.emit('circuit_breaker_closed', this.instanceId);
      LogHelpers.info('instance-health', `Circuit breaker closed for instance ${this.instanceId}`);
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'open';
      this.nextAttemptTime = Date.now() + this.config.retryTimeoutMs;
      this.healthMonitor.emit('circuit_breaker_opened', this.instanceId, `Failure threshold exceeded: ${this.failureCount}`);
      LogHelpers.warning('instance-health', `Circuit breaker opened for instance ${this.instanceId}`, {
        failureCount: this.failureCount,
        threshold: this.config.failureThreshold
      });
    }
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }

  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.nextAttemptTime = 0;
  }
}

/**
 * Instance Health Monitor - Comprehensive real-time health monitoring
 * 
 * Provides robust health monitoring for launcher instances with:
 * - Efficient polling strategies with configurable intervals
 * - Circuit breaker pattern for resilient monitoring
 * - Real-time WebSocket updates for dashboard
 * - Performance metrics collection
 * - Automatic failure detection and recovery coordination
 */
export class InstanceHealthMonitor extends EventEmitter {
  // Type-safe event emitter methods
  on<K extends keyof InstanceHealthEvents>(event: K, listener: (...args: InstanceHealthEvents[K]) => void): this {
    return super.on(event, listener);
  }

  emit<K extends keyof InstanceHealthEvents>(event: K, ...args: InstanceHealthEvents[K]): boolean {
    return super.emit(event, ...args);
  }

  private config: Required<InstanceHealthConfig>;
  private launcher: LauncherOrchestrator;
  private circuitBreakers = new Map<string, CircuitBreaker>();
  private healthStatuses = new Map<string, InstanceHealth>();
  private isMonitoring = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private reportGenerationInterval: NodeJS.Timeout | null = null;
  
  private stats = {
    totalHealthChecks: 0,
    successfulChecks: 0,
    failedChecks: 0,
    circuitBreakerTrips: 0,
    averageCheckTime: 0,
    lastReportTime: null as Date | null,
    startTime: null as Date | null
  };

  constructor(launcher: LauncherOrchestrator, config: Partial<InstanceHealthConfig> = {}) {
    super();

    this.config = {
      healthCheckInterval: config.healthCheckInterval ?? 10000, // 10 seconds
      healthCheckTimeout: config.healthCheckTimeout ?? 5000, // 5 seconds
      processCheckEnabled: config.processCheckEnabled ?? true,
      tcpBridgeCheckEnabled: config.tcpBridgeCheckEnabled ?? true,
      memoryCheckEnabled: config.memoryCheckEnabled ?? true,
      cpuCheckEnabled: config.cpuCheckEnabled ?? false, // Disabled by default for performance
      realTimeUpdates: config.realTimeUpdates ?? true,
      circuitBreaker: {
        failureThreshold: config.circuitBreaker?.failureThreshold ?? 3,
        timeoutMs: config.circuitBreaker?.timeoutMs ?? 5000,
        retryTimeoutMs: config.circuitBreaker?.retryTimeoutMs ?? 30000,
        monitorWindowMs: config.circuitBreaker?.monitorWindowMs ?? 60000,
        ...config.circuitBreaker
      }
    };

    this.launcher = launcher;
    this.setupLauncherEventHandlers();
  }

  /**
   * Start health monitoring for all instances
   */
  async startMonitoring(): Promise<boolean> {
    if (this.isMonitoring) {
      LogHelpers.warning('instance-health', 'Health monitoring is already active');
      return false;
    }

    try {
      LogHelpers.info('instance-health', 'Starting instance health monitoring', {
        config: {
          healthCheckInterval: this.config.healthCheckInterval,
          timeout: this.config.healthCheckTimeout,
          realTimeUpdates: this.config.realTimeUpdates
        }
      });

      // Initialize circuit breakers for existing instances
      const instances = this.launcher.getAllInstances();
      for (const instance of instances) {
        this.createCircuitBreaker(instance.id);
      }

      // Start periodic health checks
      this.startPeriodicHealthChecks();

      // Start periodic report generation
      this.startPeriodicReportGeneration();

      this.isMonitoring = true;
      this.stats.startTime = new Date();
      
      LogHelpers.systemEvent('instance-health', 'monitoring_started', 'Instance health monitoring started successfully', {
        instanceCount: instances.length,
        startTime: this.stats.startTime
      });

      return true;
    } catch (error) {
      LogHelpers.error('instance-health', error as Error, { operation: 'start_monitoring' });
      this.emit('monitoring_error', error as Error);
      return false;
    }
  }

  /**
   * Stop health monitoring
   */
  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    try {
      LogHelpers.info('instance-health', 'Stopping instance health monitoring');

      // Stop periodic checks
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }

      if (this.reportGenerationInterval) {
        clearInterval(this.reportGenerationInterval);
        this.reportGenerationInterval = null;
      }

      // Clear circuit breakers and health statuses
      this.circuitBreakers.clear();
      this.healthStatuses.clear();

      this.isMonitoring = false;

      LogHelpers.systemEvent('instance-health', 'monitoring_stopped', 'Instance health monitoring stopped', {
        totalChecks: this.stats.totalHealthChecks,
        successRate: this.stats.totalHealthChecks > 0 ? (this.stats.successfulChecks / this.stats.totalHealthChecks) * 100 : 0
      });
    } catch (error) {
      LogHelpers.error('instance-health', error as Error, { operation: 'stop_monitoring' });
      this.emit('monitoring_error', error as Error);
    }
  }

  /**
   * Perform health check for specific instance
   */
  async checkInstanceHealth(instanceId: string): Promise<InstanceHealth> {
    const startTime = Date.now();
    
    try {
      const instance = this.launcher.getInstanceInfo(instanceId);
      if (!instance) {
        throw new Error(`Instance not found: ${instanceId}`);
      }

      const circuitBreaker = this.circuitBreakers.get(instanceId);
      if (!circuitBreaker) {
        throw new Error(`Circuit breaker not found for instance: ${instanceId}`);
      }

      // Execute health check through circuit breaker
      const health = await circuitBreaker.execute(async () => {
        return await this.performHealthCheck(instance);
      });

      // Update stats
      this.stats.totalHealthChecks++;
      this.stats.successfulChecks++;
      const checkTime = Date.now() - startTime;
      this.stats.averageCheckTime = (this.stats.averageCheckTime + checkTime) / 2;

      // Store health status
      this.healthStatuses.set(instanceId, health);

      // Emit health check completed event
      this.emit('health_check_completed', instanceId, health);

      // Check for health degradation
      this.analyzeHealthStatus(instanceId, health);

      // Send real-time updates if enabled
      if (this.config.realTimeUpdates) {
        this.sendRealTimeUpdate(instanceId, health);
      }

      LogHelpers.debug('instance-health', 'Health check completed', {
        instanceId,
        status: health.processAlive && health.tcpBridgeResponsive ? 'healthy' : 'degraded',
        checkTime
      });

      return health;
    } catch (error) {
      this.stats.totalHealthChecks++;
      this.stats.failedChecks++;

      const health: InstanceHealth = {
        instanceId,
        status: 'error',
        processAlive: false,
        tcpBridgeResponsive: false,
        uptime: 0,
        lastHealthCheck: new Date(),
        issues: [(error as Error).message]
      };

      this.healthStatuses.set(instanceId, health);
      this.emit('health_check_completed', instanceId, health);

      LogHelpers.error('instance-health', error as Error, { 
        instanceId, 
        operation: 'health_check',
        checkTime: Date.now() - startTime
      });

      throw error;
    }
  }

  /**
   * Get current health status for instance
   */
  getInstanceHealth(instanceId: string): InstanceHealth | undefined {
    return this.healthStatuses.get(instanceId);
  }

  /**
   * Get health report for all instances
   */
  generateHealthReport(): LauncherHealthReport {
    const instances = Array.from(this.healthStatuses.values());
    const activeInstances = instances.filter(h => h.status === 'running').length;
    const totalInstances = instances.length;

    let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
    
    if (instances.some(h => h.issues.length > 0)) {
      overallStatus = 'degraded';
    }
    
    if (instances.some(h => !h.processAlive || !h.tcpBridgeResponsive)) {
      overallStatus = 'critical';
    }

    const report: LauncherHealthReport = {
      overallStatus,
      activeInstances,
      totalInstances,
      instances,
      timestamp: new Date()
    };

    this.stats.lastReportTime = report.timestamp;
    this.emit('health_report_generated', report);

    return report;
  }

  /**
   * Get monitoring statistics
   */
  getStats() {
    const now = new Date();
    const runtime = this.stats.startTime 
      ? (now.getTime() - this.stats.startTime.getTime()) / 1000 
      : 0;

    return {
      ...this.stats,
      runtime,
      successRate: this.stats.totalHealthChecks > 0 ? (this.stats.successfulChecks / this.stats.totalHealthChecks) * 100 : 0,
      isMonitoring: this.isMonitoring,
      activeCircuitBreakers: this.circuitBreakers.size,
      monitoredInstances: this.healthStatuses.size
    };
  }

  /**
   * Setup launcher event handlers
   */
  private setupLauncherEventHandlers(): void {
    this.launcher.on('instance_started', (instance: InstanceInfo) => {
      this.createCircuitBreaker(instance.id);
      LogHelpers.info('instance-health', `Started monitoring health for instance ${instance.id}`);
    });

    this.launcher.on('instance_stopped', (instanceId: string) => {
      this.circuitBreakers.delete(instanceId);
      this.healthStatuses.delete(instanceId);
      LogHelpers.info('instance-health', `Stopped monitoring health for instance ${instanceId}`);
    });
  }

  /**
   * Create circuit breaker for instance
   */
  private createCircuitBreaker(instanceId: string): void {
    const circuitBreaker = new CircuitBreaker(instanceId, this.config.circuitBreaker, this);
    this.circuitBreakers.set(instanceId, circuitBreaker);
  }

  /**
   * Perform actual health check
   */
  private async performHealthCheck(instance: InstanceInfo): Promise<InstanceHealth> {
    const health: InstanceHealth = {
      instanceId: instance.id,
      status: instance.status,
      processAlive: false,
      tcpBridgeResponsive: false,
      uptime: Date.now() - instance.startTime.getTime(),
      lastHealthCheck: new Date(),
      issues: []
    };

    try {
      // Check if process is alive
      if (this.config.processCheckEnabled) {
        health.processAlive = await this.checkProcessHealth(instance);
        if (!health.processAlive) {
          health.issues.push('Process not responding');
        }
      }

      // Check TCP bridge responsiveness
      if (this.config.tcpBridgeCheckEnabled) {
        health.tcpBridgeResponsive = await this.checkTCPBridgeHealth(instance);
        if (!health.tcpBridgeResponsive) {
          health.issues.push('TCP bridge not responsive');
        }
      }

      // Check memory usage if enabled
      if (this.config.memoryCheckEnabled) {
        health.memoryUsage = await this.checkMemoryUsage(instance);
        if (health.memoryUsage && health.memoryUsage > 90) {
          health.issues.push(`High memory usage: ${health.memoryUsage}%`);
        }
      }

      // Check CPU usage if enabled
      if (this.config.cpuCheckEnabled) {
        health.cpuUsage = await this.checkCPUUsage(instance);
        if (health.cpuUsage && health.cpuUsage > 80) {
          health.issues.push(`High CPU usage: ${health.cpuUsage}%`);
        }
      }

    } catch (error) {
      health.issues.push(`Health check error: ${(error as Error).message}`);
    }

    return health;
  }

  /**
   * Check if process is alive and responding
   */
  private async checkProcessHealth(instance: InstanceInfo): Promise<boolean> {
    try {
      // Try to get instance status from launcher
      const status = this.launcher.getInstanceStatus(instance.id);
      return status === 'running';
    } catch {
      return false;
    }
  }

  /**
   * Check TCP bridge responsiveness
   */
  private async checkTCPBridgeHealth(instance: InstanceInfo): Promise<boolean> {
    try {
      // Send a ping command to test TCP bridge responsiveness
      const response = await this.launcher.sendCommand(instance.id, {
        type: 'ping',
        instanceId: instance.id,
        timestamp: new Date()
      });
      return response.success;
    } catch {
      return false;
    }
  }

  /**
   * Check memory usage (placeholder implementation)
   */
  private async checkMemoryUsage(instance: InstanceInfo): Promise<number | undefined> {
    try {
      // In a real implementation, this would check actual process memory
      // For now, return a simulated value
      return Math.random() * 50 + 10; // 10-60% usage
    } catch {
      return undefined;
    }
  }

  /**
   * Check CPU usage (placeholder implementation)
   */
  private async checkCPUUsage(instance: InstanceInfo): Promise<number | undefined> {
    try {
      // In a real implementation, this would check actual process CPU
      // For now, return a simulated value
      return Math.random() * 30 + 5; // 5-35% usage
    } catch {
      return undefined;
    }
  }

  /**
   * Analyze health status and emit appropriate events
   */
  private analyzeHealthStatus(instanceId: string, health: InstanceHealth): void {
    const previousHealth = this.healthStatuses.get(instanceId);
    
    // Check for status changes
    if (previousHealth) {
      const wasHealthy = previousHealth.processAlive && previousHealth.tcpBridgeResponsive && previousHealth.issues.length === 0;
      const isHealthy = health.processAlive && health.tcpBridgeResponsive && health.issues.length === 0;
      
      if (wasHealthy && !isHealthy) {
        this.emit('instance_health_degraded', instanceId, health);
        LogHelpers.warning('instance-health', `Instance health degraded: ${instanceId}`, {
          issues: health.issues
        });
      } else if (!wasHealthy && isHealthy) {
        this.emit('instance_health_recovered', instanceId, health);
        LogHelpers.info('instance-health', `Instance health recovered: ${instanceId}`);
      }
    }

    // Check for critical issues
    if (!health.processAlive || !health.tcpBridgeResponsive) {
      this.emit('instance_health_critical', instanceId, health);
    }
  }

  /**
   * Send real-time update via WebSocket
   */
  private sendRealTimeUpdate(instanceId: string, health: InstanceHealth): void {
    try {
      const wsServer = getWebSocketServer();
      if (wsServer && wsServer.isReady()) {
        wsServer.broadcastMonitoringEvent({
          type: 'health_check',
          timestamp: new Date().toISOString(),
          data: {
            instanceId,
            health,
            stats: this.getStats()
          }
        });
      }
    } catch (error) {
      LogHelpers.error('instance-health', error as Error, { 
        instanceId, 
        operation: 'real_time_update' 
      });
    }
  }

  /**
   * Start periodic health checks
   */
  private startPeriodicHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const instances = this.launcher.getAllInstances();
        
        // Check health for all running instances
        const healthChecks = instances
          .filter(instance => instance.status === 'running')
          .map(instance => 
            this.checkInstanceHealth(instance.id).catch(error => {
              LogHelpers.error('instance-health', error as Error, { 
                instanceId: instance.id,
                operation: 'periodic_health_check'
              });
            })
          );

        await Promise.allSettled(healthChecks);
      } catch (error) {
        LogHelpers.error('instance-health', error as Error, { operation: 'periodic_health_checks' });
        this.emit('monitoring_error', error as Error);
      }
    }, this.config.healthCheckInterval);
  }

  /**
   * Start periodic report generation
   */
  private startPeriodicReportGeneration(): void {
    this.reportGenerationInterval = setInterval(() => {
      try {
        const report = this.generateHealthReport();
        
        // Send report via WebSocket if real-time updates enabled
        if (this.config.realTimeUpdates) {
          const wsServer = getWebSocketServer();
          if (wsServer && wsServer.isReady()) {
            wsServer.broadcastMonitoringEvent({
              type: 'health_check',
              timestamp: new Date().toISOString(),
              data: {
                type: 'health_report',
                report,
                stats: this.getStats()
              }
            });
          }
        }
      } catch (error) {
        LogHelpers.error('instance-health', error as Error, { operation: 'periodic_report_generation' });
      }
    }, this.config.healthCheckInterval * 3); // Generate reports every 3 health check cycles
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
 * Factory function to create instance health monitor
 */
export function createInstanceHealthMonitor(
  launcher: LauncherOrchestrator,
  config?: Partial<InstanceHealthConfig>
): InstanceHealthMonitor {
  return new InstanceHealthMonitor(launcher, config);
}

/**
 * Export types and main class
 */
export { InstanceHealthMonitor as default };