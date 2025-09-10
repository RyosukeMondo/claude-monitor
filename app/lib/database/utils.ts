import { prisma } from './client';
import type { 
  MonitorSession, 
  DaemonStatistics, 
  ComponentStatus, 
  RecoveryAction,
  ConfigurationHistory 
} from './generated';

/**
 * Database utilities for Claude Monitor
 * 
 * These utilities provide high-level functions for managing
 * monitoring sessions, statistics, and component status.
 */

// Session Management
export class SessionManager {
  /**
   * Create a new monitoring session
   */
  static async createSession(data: {
    configPath?: string;
    debugMode?: boolean;
  }) {
    return await prisma.monitorSession.create({
      data: {
        configPath: data.configPath,
        debugMode: data.debugMode || false,
        statistics: {
          create: {
            startTime: new Date(),
          }
        }
      },
      include: {
        statistics: true,
        components: true,
      }
    });
  }

  /**
   * Get the current active session (most recent without endTime)
   */
  static async getCurrentSession() {
    return await prisma.monitorSession.findFirst({
      where: {
        endTime: null
      },
      orderBy: {
        startTime: 'desc'
      },
      include: {
        statistics: true,
        components: true,
        recoveryActions: {
          orderBy: { timestamp: 'desc' },
          take: 10 // Latest 10 recovery actions
        }
      }
    });
  }

  /**
   * End a monitoring session
   */
  static async endSession(sessionId: string) {
    return await prisma.monitorSession.update({
      where: { id: sessionId },
      data: { endTime: new Date() }
    });
  }

  /**
   * Update session state tracking variables
   */
  static async updateSessionState(sessionId: string, updates: {
    lastDetectedState?: string;
    lastIdleClearAt?: Date | null;
    lastIdlePromptAt?: Date | null;
    pendingBootstrap?: boolean;
    clearCompletedAt?: Date | null;
    bootstrapCleared?: boolean;
    lastActiveSeenAt?: Date | null;
    lastPostrunActionAt?: Date | null;
    lastDecisionTs?: Date | null;
    idlePeriodCleared?: boolean;
    consecIdleCount?: number;
    consecActiveCount?: number;
  }) {
    return await prisma.monitorSession.update({
      where: { id: sessionId },
      data: updates
    });
  }
}

// Statistics Management
export class StatisticsManager {
  /**
   * Update daemon statistics
   */
  static async updateStatistics(sessionId: string, updates: {
    uptimeSeconds?: number;
    restarts?: number;
    configReloads?: number;
    totalDetections?: number;
    totalRecoveries?: number;
    errors?: number;
    decisionMinIntervalSec?: number;
    clearCompletionFallbackSec?: number;
    consecIdleRequired?: number;
    inactivityIdleSec?: number;
    minRecoveryIntervalSec?: number;
  }) {
    return await prisma.daemonStatistics.update({
      where: { sessionId },
      data: updates
    });
  }

  /**
   * Get current statistics
   */
  static async getStatistics(sessionId: string) {
    return await prisma.daemonStatistics.findUnique({
      where: { sessionId }
    });
  }

  /**
   * Increment a counter in statistics
   */
  static async incrementCounter(sessionId: string, field: 'restarts' | 'configReloads' | 'totalDetections' | 'totalRecoveries' | 'errors') {
    return await prisma.daemonStatistics.update({
      where: { sessionId },
      data: {
        [field]: { increment: 1 }
      }
    });
  }
}

// Component Management  
export class ComponentManager {
  /**
   * Register a component
   */
  static async registerComponent(sessionId: string, name: string, status: string = 'initializing') {
    return await prisma.componentStatus.upsert({
      where: {
        sessionId_name: {
          sessionId,
          name
        }
      },
      create: {
        sessionId,
        name,
        status,
        isRunning: false,
        startedAt: new Date()
      },
      update: {
        status,
        startedAt: new Date(),
        isRunning: status === 'running'
      }
    });
  }

  /**
   * Update component status
   */
  static async updateComponentStatus(sessionId: string, name: string, updates: {
    status?: string;
    isRunning?: boolean;
    lastError?: string | null;
    statistics?: any;
  }) {
    const data: any = { ...updates };
    if (updates.isRunning === false) {
      data.stoppedAt = new Date();
    } else if (updates.isRunning === true) {
      data.startedAt = new Date();
      data.stoppedAt = null;
    }

    return await prisma.componentStatus.update({
      where: {
        sessionId_name: {
          sessionId,
          name
        }
      },
      data
    });
  }

  /**
   * Get all components for a session
   */
  static async getComponents(sessionId: string) {
    return await prisma.componentStatus.findMany({
      where: { sessionId },
      orderBy: { name: 'asc' }
    });
  }
}

// Recovery Action Management
export class RecoveryManager {
  /**
   * Log a recovery action
   */
  static async logRecoveryAction(sessionId: string, data: {
    state: string;
    actionType: string;
    success?: boolean;
    errorMessage?: string;
    throttledUntil?: Date;
  }) {
    return await prisma.recoveryAction.create({
      data: {
        sessionId,
        ...data
      }
    });
  }

  /**
   * Check if recovery is throttled for a state
   */
  static async isRecoveryThrottled(sessionId: string, state: string): Promise<boolean> {
    const lastAction = await prisma.recoveryAction.findFirst({
      where: {
        sessionId,
        state,
        throttledUntil: {
          gt: new Date()
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    return !!lastAction;
  }

  /**
   * Get recovery actions for a session
   */
  static async getRecoveryActions(sessionId: string, limit: number = 50) {
    return await prisma.recoveryAction.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'desc' },
      take: limit
    });
  }
}

// Configuration Management
export class ConfigManager {
  /**
   * Save configuration
   */
  static async saveConfiguration(configData: any, configPath?: string, configHash?: string) {
    // Mark all previous configs as inactive
    await prisma.configurationHistory.updateMany({
      data: { isActive: false }
    });

    // Create new active config
    return await prisma.configurationHistory.create({
      data: {
        configPath,
        configHash: configHash || JSON.stringify(configData),
        configData,
        isActive: true
      }
    });
  }

  /**
   * Get current active configuration
   */
  static async getCurrentConfiguration() {
    return await prisma.configurationHistory.findFirst({
      where: { isActive: true },
      orderBy: { loadedAt: 'desc' }
    });
  }

  /**
   * Get configuration history
   */
  static async getConfigurationHistory(limit: number = 20) {
    return await prisma.configurationHistory.findMany({
      orderBy: { loadedAt: 'desc' },
      take: limit
    });
  }
}