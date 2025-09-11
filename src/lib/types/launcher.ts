/**
 * Claude Code Launcher Type Definitions
 * Comprehensive TypeScript interfaces for launcher config, instance info, TCP commands, and installation status
 * Optimized for Docker integration with modern TypeScript features
 */

import { z } from 'zod';

// ============================================================================
// Launcher Configuration Types
// ============================================================================

export const LauncherConfigSchema = z.object({
  projectPath: z.string().min(1, 'Project path is required'),
  tcpPort: z.number().int().min(1024).max(65535).default(9999),
  displayName: z.string().optional(),
  autoRestart: z.boolean().default(false),
  environment: z.record(z.string(), z.string()).default({}),
  claudeArgs: z.array(z.string()).default([])
});

export type LauncherConfig = z.infer<typeof LauncherConfigSchema>;

// ============================================================================
// Instance Management Types
// ============================================================================

export const InstanceStatusSchema = z.enum([
  'starting',
  'running', 
  'stopping',
  'stopped',
  'error'
]);

export type InstanceStatus = z.infer<typeof InstanceStatusSchema>;

export const InstanceInfoSchema = z.object({
  id: z.string().uuid(),
  config: LauncherConfigSchema,
  processId: z.number().int().positive().optional(),
  tcpPort: z.number().int().min(1024).max(65535),
  status: InstanceStatusSchema,
  startTime: z.date(),
  lastActivity: z.date(),
  sessionIds: z.array(z.string()),
  errorMessage: z.string().optional(),
  restartCount: z.number().int().min(0).default(0),
  metadata: z.record(z.string(), z.unknown()).default({})
});

export type InstanceInfo = z.infer<typeof InstanceInfoSchema>;

// ============================================================================
// TCP Bridge Command Types
// ============================================================================

export const TCPCommandTypeSchema = z.enum([
  'send',
  'enter',
  'up',
  'down',
  'ctrl-c',
  'tab',
  'raw',
  'status',
  'ping'
]);

export type TCPCommandType = z.infer<typeof TCPCommandTypeSchema>;

export const TCPCommandSchema = z.object({
  type: TCPCommandTypeSchema,
  content: z.string().optional(),
  instanceId: z.string().uuid(),
  timestamp: z.date().default(() => new Date()),
  sequenceId: z.string().uuid().optional()
});

export type TCPCommand = z.infer<typeof TCPCommandSchema>;

export const TCPResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.unknown().optional(),
  timestamp: z.date().default(() => new Date()),
  sequenceId: z.string().uuid().optional()
});

export type TCPResponse = z.infer<typeof TCPResponseSchema>;

// ============================================================================
// Installation Status Types  
// ============================================================================

export const AuthStatusSchema = z.enum([
  'authenticated',
  'required',
  'invalid',
  'unknown'
]);

export type AuthStatus = z.infer<typeof AuthStatusSchema>;

export const InstallationStatusSchema = z.object({
  claudeInstalled: z.boolean(),
  claudeVersion: z.string().optional(),
  claudePath: z.string().optional(),
  mcpToolsInstalled: z.boolean(),
  mcpToolsVersion: z.string().optional(),
  authenticationStatus: AuthStatusSchema,
  authenticationUrl: z.string().url().optional(),
  errorMessages: z.array(z.string()),
  warnings: z.array(z.string()).default([]),
  lastChecked: z.date().default(() => new Date()),
  installationMethods: z.array(z.string()).default([])
});

export type InstallationStatus = z.infer<typeof InstallationStatusSchema>;

// ============================================================================
// Bridge Server Types
// ============================================================================

export const BridgeServerInfoSchema = z.object({
  port: z.number().int().min(1024).max(65535),
  instanceId: z.string().uuid(),
  isListening: z.boolean(),
  clientCount: z.number().int().min(0).default(0),
  startTime: z.date(),
  lastActivity: z.date().optional(),
  errorCount: z.number().int().min(0).default(0)
});

export type BridgeServerInfo = z.infer<typeof BridgeServerInfoSchema>;

// ============================================================================
// Health and Monitoring Types
// ============================================================================

export const InstanceHealthSchema = z.object({
  instanceId: z.string().uuid(),
  status: InstanceStatusSchema,
  processAlive: z.boolean(),
  tcpBridgeResponsive: z.boolean(),
  memoryUsage: z.number().min(0).optional(),
  cpuUsage: z.number().min(0).max(100).optional(),
  uptime: z.number().min(0),
  lastHealthCheck: z.date().default(() => new Date()),
  issues: z.array(z.string()).default([])
});

export type InstanceHealth = z.infer<typeof InstanceHealthSchema>;

export const LauncherHealthReportSchema = z.object({
  overallStatus: z.enum(['healthy', 'degraded', 'critical']),
  activeInstances: z.number().int().min(0),
  totalInstances: z.number().int().min(0),
  instances: z.array(InstanceHealthSchema),
  systemMetrics: z.object({
    memoryUsage: z.number().min(0).max(100),
    cpuUsage: z.number().min(0).max(100),
    availablePorts: z.array(z.number().int().min(1024).max(65535))
  }).optional(),
  timestamp: z.date().default(() => new Date())
});

export type LauncherHealthReport = z.infer<typeof LauncherHealthReportSchema>;

// ============================================================================
// Event Types for Real-time Updates
// ============================================================================

export const LauncherEventTypeSchema = z.enum([
  'instance_created',
  'instance_started',
  'instance_stopped',
  'instance_error',
  'tcp_command_sent',
  'tcp_command_received',
  'health_check_completed',
  'authentication_required',
  'installation_status_changed'
]);

export type LauncherEventType = z.infer<typeof LauncherEventTypeSchema>;

export const LauncherEventSchema = z.object({
  type: LauncherEventTypeSchema,
  instanceId: z.string().uuid().optional(),
  data: z.unknown(),
  timestamp: z.date().default(() => new Date()),
  metadata: z.record(z.string(), z.unknown()).default({})
});

export type LauncherEvent = z.infer<typeof LauncherEventSchema>;

// ============================================================================
// Docker Integration Types
// ============================================================================

export const DockerContainerInfoSchema = z.object({
  containerId: z.string(),
  containerName: z.string(),
  claudeHomeDir: z.string().default('/app/.claude'),
  volumeMounts: z.array(z.object({
    source: z.string(),
    target: z.string(),
    readOnly: z.boolean().default(false)
  })).default([]),
  environmentVariables: z.record(z.string(), z.string()).default({}),
  networkMode: z.string().default('bridge')
});

export type DockerContainerInfo = z.infer<typeof DockerContainerInfoSchema>;

// ============================================================================
// Request/Response Types for API Routes
// ============================================================================

export const CreateInstanceRequestSchema = z.object({
  config: LauncherConfigSchema,
  startImmediately: z.boolean().default(true)
});

export type CreateInstanceRequest = z.infer<typeof CreateInstanceRequestSchema>;

export const CreateInstanceResponseSchema = z.object({
  instance: InstanceInfoSchema,
  bridgeInfo: BridgeServerInfoSchema.optional()
});

export type CreateInstanceResponse = z.infer<typeof CreateInstanceResponseSchema>;

export const SendCommandRequestSchema = z.object({
  command: TCPCommandSchema
});

export type SendCommandRequest = z.infer<typeof SendCommandRequestSchema>;

export const ListInstancesResponseSchema = z.object({
  instances: z.array(InstanceInfoSchema),
  totalCount: z.number().int().min(0),
  runningCount: z.number().int().min(0)
});

export type ListInstancesResponse = z.infer<typeof ListInstancesResponseSchema>;

// ============================================================================
// Utility Types and Constants
// ============================================================================

export const DEFAULT_LAUNCHER_CONFIG = {
  tcpPort: 9999,
  autoRestart: false,
  environment: {},
  claudeArgs: []
} as const;

export const TCP_COMMAND_TIMEOUT = 5000; // 5 seconds
export const INSTANCE_STARTUP_TIMEOUT = 30000; // 30 seconds
export const HEALTH_CHECK_INTERVAL = 10000; // 10 seconds

// Type guards for runtime validation
export const isInstanceInfo = (obj: unknown): obj is InstanceInfo => {
  try {
    InstanceInfoSchema.parse(obj);
    return true;
  } catch {
    return false;
  }
};

export const isTCPCommand = (obj: unknown): obj is TCPCommand => {
  try {
    TCPCommandSchema.parse(obj);
    return true;
  } catch {
    return false;
  }
};

export const isLauncherEvent = (obj: unknown): obj is LauncherEvent => {
  try {
    LauncherEventSchema.parse(obj);
    return true;
  } catch {
    return false;
  }
};

// Validation helper functions
export const validateLauncherConfig = (obj: unknown) => LauncherConfigSchema.safeParse(obj);
export const validateInstanceInfo = (obj: unknown) => InstanceInfoSchema.safeParse(obj);
export const validateTCPCommand = (obj: unknown) => TCPCommandSchema.safeParse(obj);
export const validateInstallationStatus = (obj: unknown) => InstallationStatusSchema.safeParse(obj);
export const validateLauncherEvent = (obj: unknown) => LauncherEventSchema.safeParse(obj);

// ============================================================================
// Advanced Types for Enhanced Functionality
// ============================================================================

export type LauncherConfigOptions = Partial<LauncherConfig> & {
  projectPath: string;
};

export type InstanceCreateOptions = {
  config: LauncherConfigOptions;
  waitForReady?: boolean;
  timeout?: number;
  retryAttempts?: number;
};

export type TCPCommandWithCallback = TCPCommand & {
  onResponse?: (response: TCPResponse) => void;
  onError?: (error: Error) => void;
  timeout?: number;
};

export type LauncherServiceConfig = {
  maxInstances: number;
  defaultTcpPortRange: [number, number];
  healthCheckInterval: number;
  enableAutoRestart: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
};