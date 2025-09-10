/**
 * TypeScript types for project monitoring based on Python daemon statistics
 */

export enum ClaudeState {
  UNKNOWN = 'UNKNOWN',
  IDLE = 'IDLE', 
  ACTIVE = 'ACTIVE',
  WAITING_INPUT = 'WAITING_INPUT',
  ERROR = 'ERROR'
}

export interface ComponentStats {
  [key: string]: unknown;
}

export interface DaemonStatistics {
  start_time: Date;
  uptime_seconds: number;
  restarts: number;
  config_reloads: number;
  total_detections: number;
  total_recoveries: number;
  errors: number;
  components: Record<string, ComponentStats>;
}

export interface ProjectInfo {
  projectPath: string;
  encodedPath: string;
  displayName: string;
  activeSessions: SessionInfo[];
  currentState: ClaudeState;
  lastActivity: Date;
  monitoring: boolean;
  recoverySettings: RecoverySettings;
}

export interface SessionInfo {
  sessionId: string;
  jsonlFilePath: string;
  isActive: boolean;
  eventCount: number;
  startTime: Date;
  lastActivity: Date;
}

export interface RecoverySettings {
  autoRecovery: boolean;
  clearOnIdle: boolean;
  promptAfterClear: boolean;
  idleThresholdSeconds: number;
}

export interface StateTransition {
  fromState: ClaudeState;
  toState: ClaudeState;
  timestamp: Date;
  confidence: number;
  reason: string;
}

export interface StateAnalysis {
  currentState: ClaudeState;
  confidence: number;
  stateHistory: StateTransition[];
  activeCommands: CommandInfo[];
  lastActivity: Date;
  contextSummary: string;
}

export interface CommandInfo {
  command: string;
  args: string[];
  timestamp: Date;
  context: string;
}

export interface ConversationEvent {
  uuid: string;
  parentUuid: string | null;
  sessionId: string;
  timestamp: Date;
  eventType: 'user' | 'assistant';
  cwd: string;
  messageContent: string;
  commands: CommandInfo[];
  toolCalls: ToolCall[];
  usageStats: UsageStats | null;
  rawData: Record<string, unknown>;
}

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
  timestamp: Date;
}

export interface UsageStats {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cacheWriteTokens?: number;
  cacheReadTokens?: number;
}

export interface RecoveryAction {
  type: 'clear' | 'custom_command' | 'restart_session';
  command?: string;
  projectPath: string;
  timestamp: Date;
  reason: string;
}

export interface RecoveryResult {
  success: boolean;
  message: string;
  timestamp: Date;
  action: RecoveryAction;
}

export interface MonitoringMetrics {
  responseTime: number;
  activeProjects: number;
  totalSessions: number;
  errorsPerHour: number;
  recoveriesPerHour: number;
  systemLoad: number;
}