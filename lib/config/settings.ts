/**
 * Configuration management system for Claude Monitor Next.js Application.
 * 
 * Supports environment variable configuration with validation, default values,
 * and type safety. Converted from Python configuration patterns.
 */

import { z } from 'zod';

// Configuration schemas using Zod for runtime validation
const MonitoringConfigSchema = z.object({
  idleTimeout: z.number().min(10).max(300).default(30), // seconds
  inputTimeout: z.number().min(5).max(60).default(5), // seconds
  contextPressureTimeout: z.number().min(5).max(60).default(10), // seconds
  taskCheckInterval: z.number().min(10).max(300).default(30), // seconds
  completionCooldown: z.number().min(30).max(600).default(60), // seconds
});

const RecoveryConfigSchema = z.object({
  maxRetries: z.number().min(1).max(10).default(3),
  retryBackoff: z.number().min(1.0).max(10.0).default(2.0), // multiplier for exponential backoff
  compactTimeout: z.number().min(10).max(120).default(30), // seconds
});

const LoggingConfigSchema = z.object({
  level: z.enum(['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']).default('INFO'),
  console: z.boolean().default(true),
  maxSizeMb: z.number().min(1).max(1000).default(100),
  file: z.string().optional(),
});

const NotificationsConfigSchema = z.object({
  desktop: z.boolean().default(true),
  logActions: z.boolean().default(true),
  rateLimitSeconds: z.number().min(10).max(3600).default(60), // minimum seconds between similar notifications
});

const ServerConfigSchema = z.object({
  port: z.number().min(1).max(65535).default(3000),
  host: z.string().default('localhost'),
  corsOrigins: z.array(z.string()).default(['http://localhost:3000']),
});

const DatabaseConfigSchema = z.object({
  url: z.string().default('file:./prisma/dev.db'),
  type: z.enum(['sqlite', 'postgresql']).default('sqlite'),
  maxConnections: z.number().min(1).max(100).default(10),
  connectionTimeout: z.number().min(1000).max(60000).default(5000), // milliseconds
  sqlitePath: z.string().default('./prisma/dev.db'),
});

const CacheConfigSchema = z.object({
  type: z.enum(['memory', 'redis']).default('memory'),
  redisUrl: z.string().optional(),
  maxSessions: z.number().min(1).max(1000).default(100),
  ttl: z.number().min(60).max(86400).default(3600), // seconds
});

const StandaloneConfigSchema = z.object({
  mode: z.enum(['standalone', 'docker']).default('standalone'),
  autoSetup: z.boolean().default(true),
  developmentMode: z.boolean().default(true),
  enableDebugLogging: z.boolean().default(true),
  configDirectory: z.string().default('./.claude-monitor'),
  dataDirectory: z.string().default('./data'),
});

const ClaudeConfigSchema = z.object({
  projectsPath: z.string().default('~/.claude/projects'),
  sessionTimeout: z.number().min(300).max(86400).default(3600), // seconds
  maxConcurrentSessions: z.number().min(1).max(50).default(10),
});

// Main configuration schema
const ConfigSchema = z.object({
  monitoring: MonitoringConfigSchema,
  recovery: RecoveryConfigSchema,
  logging: LoggingConfigSchema,
  notifications: NotificationsConfigSchema,
  server: ServerConfigSchema,
  database: DatabaseConfigSchema,
  cache: CacheConfigSchema,
  standalone: StandaloneConfigSchema,
  claude: ClaudeConfigSchema,
});

// TypeScript types derived from schemas
export type MonitoringConfig = z.infer<typeof MonitoringConfigSchema>;
export type RecoveryConfig = z.infer<typeof RecoveryConfigSchema>;
export type LoggingConfig = z.infer<typeof LoggingConfigSchema>;
export type NotificationsConfig = z.infer<typeof NotificationsConfigSchema>;
export type ServerConfig = z.infer<typeof ServerConfigSchema>;
export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;
export type CacheConfig = z.infer<typeof CacheConfigSchema>;
export type StandaloneConfig = z.infer<typeof StandaloneConfigSchema>;
export type ClaudeConfig = z.infer<typeof ClaudeConfigSchema>;
export type AppConfig = z.infer<typeof ConfigSchema>;

// Environment variable helpers
const parseBoolean = (value: string | undefined): boolean => {
  if (!value) return false;
  return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
};

const parseNumber = (value: string | undefined, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

const parseStringArray = (value: string | undefined): string[] => {
  if (!value) return [];
  return value.split(',').map(s => s.trim()).filter(Boolean);
};

// Configuration loader
class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig | null = null;

  private constructor() {}

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public getConfig(): AppConfig {
    if (!this.config) {
      this.loadConfig();
    }
    return this.config!;
  }

  private detectMode(): 'standalone' | 'docker' {
    // Check for Docker environment indicators
    const dockerIndicators = [
      process.env.DOCKER_CONTAINER,
      process.env.KUBERNETES_SERVICE_HOST,
      process.env.COMPOSE_PROJECT_NAME,
    ];
    
    // Check if we're running in a Docker container
    const isInDocker = dockerIndicators.some(indicator => indicator !== undefined);
    
    // Check for PostgreSQL and Redis URLs which indicate Docker setup
    const hasPostgresUrl = process.env.DATABASE_URL?.includes('postgresql://');
    const hasRedisUrl = process.env.REDIS_URL !== undefined;
    
    // If we have clear Docker indicators or external services, assume Docker mode
    if (isInDocker || (hasPostgresUrl && hasRedisUrl)) {
      return 'docker';
    }
    
    // Default to standalone mode for development environments
    return 'standalone';
  }

  public loadConfig(): AppConfig {
    // Load configuration from environment variables with defaults
    const rawConfig = {
      monitoring: {
        idleTimeout: parseNumber(process.env.CLAUDE_MONITOR_IDLE_TIMEOUT, 30),
        inputTimeout: parseNumber(process.env.CLAUDE_MONITOR_INPUT_TIMEOUT, 5),
        contextPressureTimeout: parseNumber(process.env.CLAUDE_MONITOR_CONTEXT_PRESSURE_TIMEOUT, 10),
        taskCheckInterval: parseNumber(process.env.CLAUDE_MONITOR_TASK_CHECK_INTERVAL, 30),
        completionCooldown: parseNumber(process.env.CLAUDE_MONITOR_COMPLETION_COOLDOWN, 60),
      },
      recovery: {
        maxRetries: parseNumber(process.env.CLAUDE_MONITOR_MAX_RETRIES, 3),
        retryBackoff: parseNumber(process.env.CLAUDE_MONITOR_RETRY_BACKOFF, 2.0),
        compactTimeout: parseNumber(process.env.CLAUDE_MONITOR_COMPACT_TIMEOUT, 30),
      },
      logging: {
        level: (process.env.CLAUDE_MONITOR_LOG_LEVEL || 'INFO') as 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL',
        console: parseBoolean(process.env.CLAUDE_MONITOR_LOG_CONSOLE) || true,
        maxSizeMb: parseNumber(process.env.CLAUDE_MONITOR_LOG_MAX_SIZE_MB, 100),
        file: process.env.CLAUDE_MONITOR_LOG_FILE,
      },
      notifications: {
        desktop: parseBoolean(process.env.CLAUDE_MONITOR_DESKTOP_NOTIFICATIONS) || true,
        logActions: parseBoolean(process.env.CLAUDE_MONITOR_LOG_ACTIONS) || true,
        rateLimitSeconds: parseNumber(process.env.CLAUDE_MONITOR_NOTIFICATION_RATE_LIMIT, 60),
      },
      server: {
        port: parseNumber(process.env.PORT || process.env.CLAUDE_MONITOR_PORT, 3000),
        host: process.env.CLAUDE_MONITOR_HOST || '0.0.0.0',
        corsOrigins: parseStringArray(process.env.CLAUDE_MONITOR_CORS_ORIGINS) || ['http://localhost:3000'],
      },
      database: {
        url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
        type: (process.env.CLAUDE_MONITOR_DB_TYPE || 'sqlite') as 'sqlite' | 'postgresql',
        maxConnections: parseNumber(process.env.CLAUDE_MONITOR_DB_MAX_CONNECTIONS, 10),
        connectionTimeout: parseNumber(process.env.CLAUDE_MONITOR_DB_CONNECTION_TIMEOUT, 5000),
        sqlitePath: process.env.CLAUDE_MONITOR_SQLITE_PATH || './prisma/dev.db',
      },
      cache: {
        type: (process.env.CLAUDE_MONITOR_CACHE_TYPE || 'memory') as 'memory' | 'redis',
        redisUrl: process.env.REDIS_URL,
        maxSessions: parseNumber(process.env.CLAUDE_MONITOR_CACHE_MAX_SESSIONS, 100),
        ttl: parseNumber(process.env.CLAUDE_MONITOR_CACHE_TTL, 3600),
      },
      standalone: {
        mode: (process.env.CLAUDE_MONITOR_MODE || this.detectMode()) as 'standalone' | 'docker',
        autoSetup: parseBoolean(process.env.CLAUDE_MONITOR_AUTO_SETUP) ?? true,
        developmentMode: parseBoolean(process.env.CLAUDE_MONITOR_DEV_MODE) ?? (process.env.NODE_ENV === 'development'),
        enableDebugLogging: parseBoolean(process.env.CLAUDE_MONITOR_DEBUG_LOGGING) ?? (process.env.NODE_ENV === 'development'),
        configDirectory: process.env.CLAUDE_MONITOR_CONFIG_DIR || './.claude-monitor',
        dataDirectory: process.env.CLAUDE_MONITOR_DATA_DIR || './data',
      },
      claude: {
        projectsPath: process.env.CLAUDE_MONITOR_PROJECTS_PATH || '~/.claude/projects',
        sessionTimeout: parseNumber(process.env.CLAUDE_MONITOR_SESSION_TIMEOUT, 3600),
        maxConcurrentSessions: parseNumber(process.env.CLAUDE_MONITOR_MAX_CONCURRENT_SESSIONS, 10),
      },
    };

    try {
      // Validate configuration using Zod schemas
      this.config = ConfigSchema.parse(rawConfig);
      return this.config;
    } catch (error) {
      console.error('Configuration validation failed:', error);
      throw new ConfigurationError('Invalid configuration: ' + (error as Error).message);
    }
  }

  public reloadConfig(): AppConfig {
    this.config = null;
    return this.getConfig();
  }

  public validateConfig(): string[] {
    try {
      ConfigSchema.parse(this.config);
      return [];
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.issues.map(e => `${e.path.join('.')}: ${e.message}`);
      }
      return ['Unknown validation error'];
    }
  }
}

// Custom error for configuration issues
export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

// Global configuration instance and helper functions
const configManager = ConfigManager.getInstance();

export const getConfig = (): AppConfig => configManager.getConfig();
export const reloadConfig = (): AppConfig => configManager.reloadConfig();
export const validateConfig = (): string[] => configManager.validateConfig();

// Environment-specific configuration helpers
export const isDevelopment = (): boolean => process.env.NODE_ENV === 'development';
export const isProduction = (): boolean => process.env.NODE_ENV === 'production';
export const isTest = (): boolean => process.env.NODE_ENV === 'test';
export const isStandaloneMode = (): boolean => getConfig().standalone.mode === 'standalone';
export const isDockerMode = (): boolean => getConfig().standalone.mode === 'docker';
export const shouldUseMemoryCache = (): boolean => getConfig().cache.type === 'memory';
export const shouldUseSQLite = (): boolean => getConfig().database.type === 'sqlite';

// Configuration constants
export const DEFAULT_CONFIG_VALUES = {
  MONITORING: {
    IDLE_TIMEOUT: 30,
    INPUT_TIMEOUT: 5,
    CONTEXT_PRESSURE_TIMEOUT: 10,
    TASK_CHECK_INTERVAL: 30,
    COMPLETION_COOLDOWN: 60,
  },
  RECOVERY: {
    MAX_RETRIES: 3,
    RETRY_BACKOFF: 2.0,
    COMPACT_TIMEOUT: 30,
  },
  SERVER: {
    PORT: 3000,
    HOST: '0.0.0.0',
  },
  DATABASE: {
    MAX_CONNECTIONS: 10,
    CONNECTION_TIMEOUT: 5000,
    SQLITE_PATH: './prisma/dev.db',
  },
  CACHE: {
    MAX_SESSIONS: 100,
    TTL: 3600,
  },
  STANDALONE: {
    CONFIG_DIRECTORY: './.claude-monitor',
    DATA_DIRECTORY: './data',
  },
} as const;

// Export the main config instance for use throughout the application
export default configManager;