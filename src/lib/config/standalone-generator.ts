/**
 * Standalone Configuration Generator
 * 
 * Automatically creates .env.local files with SQLite configuration and 
 * development defaults for standalone mode operation without Docker containers.
 * 
 * Features:
 * - Auto-generates .env.local with SQLite settings
 * - Creates secure development defaults
 * - Validates configuration using existing Zod schemas
 * - Provides clear setup feedback to users
 * - Prevents overwriting existing files without confirmation
 */

import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import * as path from 'path';
import { ConfigurationError, getConfig } from './settings';

export interface StandaloneConfigOptions {
  /** Override existing .env.local file without confirmation */
  force?: boolean;
  /** Custom database file path (relative to project root) */
  databasePath?: string;
  /** Custom log file path (relative to project root) */
  logPath?: string;
  /** Enable debug mode logging */
  debugMode?: boolean;
  /** Custom port for development server */
  port?: number;
}

export interface ConfigGenerationResult {
  /** Whether configuration was successfully generated */
  success: boolean;
  /** Path to the generated .env.local file */
  envPath?: string;
  /** Path to the SQLite database file */
  databasePath?: string;
  /** Any warnings or informational messages */
  messages: string[];
  /** Error message if generation failed */
  error?: string;
}

/**
 * Standalone Configuration Generator Class
 * 
 * Handles the creation and validation of configuration files for
 * running Claude Monitor in standalone mode without Docker.
 */
export class StandaloneConfigGenerator {
  private projectRoot: string;
  private envPath: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = path.resolve(projectRoot);
    this.envPath = path.join(this.projectRoot, '.env.local');
  }

  /**
   * Generate complete standalone configuration
   */
  async generateConfig(options: StandaloneConfigOptions = {}): Promise<ConfigGenerationResult> {
    const result: ConfigGenerationResult = {
      success: false,
      messages: []
    };

    try {
      // Check if .env.local already exists
      if (existsSync(this.envPath) && !options.force) {
        return {
          success: false,
          error: `.env.local already exists at ${this.envPath}. Use force: true to overwrite.`,
          messages: ['Configuration file already exists']
        };
      }

      // Generate configuration content
      const envContent = await this.generateEnvContent(options);
      
      // Validate the configuration before writing
      const validation = await this.validateConfiguration(envContent);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Configuration validation failed: ${validation.errors.join(', ')}`,
          messages: validation.errors
        };
      }

      // Ensure directories exist
      await this.ensureDirectoriesExist(options);

      // Write .env.local file
      await fs.writeFile(this.envPath, envContent, { encoding: 'utf8', mode: 0o600 });
      
      // Get database path for result
      const databasePath = this.getDatabasePath(options);
      
      result.success = true;
      result.envPath = this.envPath;
      result.databasePath = databasePath;
      result.messages = [
        'Successfully generated .env.local for standalone mode',
        `Database will be created at: ${databasePath}`,
        'Run "npm run dev" to start in standalone mode',
        'Configuration uses SQLite and in-memory caching'
      ];

      if (options.debugMode) {
        result.messages.push('Debug mode enabled - verbose logging active');
      }

      return result;

    } catch (error) {
      return {
        success: false,
        error: `Failed to generate configuration: ${(error as Error).message}`,
        messages: [`Error: ${(error as Error).message}`]
      };
    }
  }

  /**
   * Generate .env.local file content with standalone settings
   */
  private async generateEnvContent(options: StandaloneConfigOptions): Promise<string> {
    const databasePath = this.getDatabasePath(options);
    const logPath = options.logPath || './logs/claude-monitor.log';
    const port = options.port || 3000;
    const debugMode = options.debugMode || false;

    const envContent = [
      '# Claude Monitor Standalone Configuration',
      '# Generated automatically for development without Docker',
      '# Edit these values as needed for your environment',
      '',
      '# Application Environment',
      'NODE_ENV=development',
      '',
      '# Server Configuration',
      `PORT=${port}`,
      'CLAUDE_MONITOR_HOST=localhost',
      `CLAUDE_MONITOR_CORS_ORIGINS=http://localhost:${port}`,
      '',
      '# Database Configuration (SQLite for standalone mode)',
      `DATABASE_URL=file:${databasePath}`,
      'CLAUDE_MONITOR_DB_MAX_CONNECTIONS=5',
      'CLAUDE_MONITOR_DB_CONNECTION_TIMEOUT=5000',
      '',
      '# Logging Configuration',
      `CLAUDE_MONITOR_LOG_LEVEL=${debugMode ? 'DEBUG' : 'INFO'}`,
      'CLAUDE_MONITOR_LOG_CONSOLE=true',
      `CLAUDE_MONITOR_LOG_FILE=${logPath}`,
      'CLAUDE_MONITOR_LOG_MAX_SIZE_MB=100',
      '',
      '# Monitoring Configuration',
      'CLAUDE_MONITOR_IDLE_TIMEOUT=30',
      'CLAUDE_MONITOR_INPUT_TIMEOUT=5',
      'CLAUDE_MONITOR_CONTEXT_PRESSURE_TIMEOUT=10',
      'CLAUDE_MONITOR_TASK_CHECK_INTERVAL=30',
      'CLAUDE_MONITOR_COMPLETION_COOLDOWN=60',
      '',
      '# Recovery Configuration',
      'CLAUDE_MONITOR_MAX_RETRIES=3',
      'CLAUDE_MONITOR_RETRY_BACKOFF=2.0',
      'CLAUDE_MONITOR_COMPACT_TIMEOUT=30',
      '',
      '# Notifications Configuration',
      'CLAUDE_MONITOR_DESKTOP_NOTIFICATIONS=true',
      'CLAUDE_MONITOR_LOG_ACTIONS=true',
      'CLAUDE_MONITOR_NOTIFICATION_RATE_LIMIT=60',
      '',
      '# Claude Configuration',
      'CLAUDE_MONITOR_PROJECTS_PATH=~/.claude/projects',
      'CLAUDE_MONITOR_SESSION_TIMEOUT=3600',
      'CLAUDE_MONITOR_MAX_CONCURRENT_SESSIONS=10',
      '',
      '# Development Mode Indicators',
      'CLAUDE_MONITOR_STANDALONE_MODE=true',
      'CLAUDE_MONITOR_DEVELOPMENT_MODE=true',
      ''
    ];

    return envContent.join('\n');
  }

  /**
   * Get the SQLite database file path
   */
  private getDatabasePath(options: StandaloneConfigOptions): string {
    if (options.databasePath) {
      return path.isAbsolute(options.databasePath) 
        ? options.databasePath 
        : path.join(this.projectRoot, options.databasePath);
    }
    return path.join(this.projectRoot, 'prisma', 'dev.db');
  }

  /**
   * Ensure required directories exist
   */
  private async ensureDirectoriesExist(options: StandaloneConfigOptions): Promise<void> {
    const databasePath = this.getDatabasePath(options);
    const logPath = options.logPath || './logs/claude-monitor.log';

    // Ensure database directory exists
    const dbDir = path.dirname(databasePath);
    await fs.mkdir(dbDir, { recursive: true });

    // Ensure logs directory exists
    const logDir = path.dirname(path.resolve(this.projectRoot, logPath));
    await fs.mkdir(logDir, { recursive: true });
  }

  /**
   * Validate configuration using existing Zod schemas
   */
  private async validateConfiguration(envContent: string): Promise<{ isValid: boolean; errors: string[] }> {
    try {
      // Parse environment variables from content
      const envVars = this.parseEnvContent(envContent);
      
      // Temporarily set environment variables for validation
      const originalEnv = { ...process.env };
      Object.entries(envVars).forEach(([key, value]) => {
        process.env[key] = value;
      });

      // Validate using existing config schema
      try {
        // This will throw if validation fails
        getConfig();
        
        // Restore original environment
        process.env = originalEnv;
        
        return { isValid: true, errors: [] };
      } catch (error) {
        // Restore original environment
        process.env = originalEnv;
        
        if (error instanceof ConfigurationError) {
          return { isValid: false, errors: [error.message] };
        }
        return { isValid: false, errors: [`Validation error: ${(error as Error).message}`] };
      }
    } catch (error) {
      return { isValid: false, errors: [`Configuration parsing error: ${(error as Error).message}`] };
    }
  }

  /**
   * Parse environment variables from .env content
   */
  private parseEnvContent(content: string): Record<string, string> {
    const envVars: Record<string, string> = {};
    
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
        envVars[key.trim()] = value.trim();
      }
    });
    
    return envVars;
  }

  /**
   * Check if the current environment is already configured for standalone mode
   */
  async checkStandaloneSetup(): Promise<{ isStandalone: boolean; hasConfig: boolean; messages: string[] }> {
    const messages: string[] = [];
    
    // Check if .env.local exists
    const hasConfig = existsSync(this.envPath);
    
    // Check environment indicators
    const isStandalone = process.env.CLAUDE_MONITOR_STANDALONE_MODE === 'true' ||
                        process.env.DATABASE_URL?.includes('file:') ||
                        false;

    if (hasConfig) {
      messages.push(`.env.local found at ${this.envPath}`);
    } else {
      messages.push('No .env.local configuration found');
    }

    if (isStandalone) {
      messages.push('Environment configured for standalone mode');
    } else {
      messages.push('Environment not configured for standalone mode');
    }

    // Check database file
    if (hasConfig) {
      try {
        const content = await fs.readFile(this.envPath, 'utf8');
        const envVars = this.parseEnvContent(content);
        const dbUrl = envVars.DATABASE_URL;
        
        if (dbUrl?.startsWith('file:')) {
          const dbPath = dbUrl.replace('file:', '');
          const fullDbPath = path.isAbsolute(dbPath) ? dbPath : path.join(this.projectRoot, dbPath);
          
          if (existsSync(fullDbPath)) {
            messages.push(`SQLite database found at ${fullDbPath}`);
          } else {
            messages.push(`SQLite database will be created at ${fullDbPath}`);
          }
        }
      } catch (error) {
        messages.push(`Warning: Could not read configuration file: ${(error as Error).message}`);
      }
    }

    return {
      isStandalone,
      hasConfig,
      messages
    };
  }

  /**
   * Remove generated standalone configuration
   */
  async removeConfig(): Promise<{ success: boolean; message: string }> {
    try {
      if (!existsSync(this.envPath)) {
        return {
          success: true,
          message: 'No .env.local file found to remove'
        };
      }

      await fs.unlink(this.envPath);
      return {
        success: true,
        message: `Successfully removed .env.local from ${this.envPath}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to remove configuration: ${(error as Error).message}`
      };
    }
  }
}

/**
 * Convenience function to generate standalone configuration
 */
export async function generateStandaloneConfig(
  options: StandaloneConfigOptions = {}
): Promise<ConfigGenerationResult> {
  const generator = new StandaloneConfigGenerator();
  return await generator.generateConfig(options);
}

/**
 * Convenience function to check standalone setup status
 */
export async function checkStandaloneSetup() {
  const generator = new StandaloneConfigGenerator();
  return await generator.checkStandaloneSetup();
}

/**
 * Convenience function to validate existing standalone setup
 */
export async function validateStandaloneSetup(): Promise<boolean> {
  try {
    const generator = new StandaloneConfigGenerator();
    const setup = await generator.checkStandaloneSetup();
    
    if (!setup.hasConfig) {
      console.log('❌ No standalone configuration found');
      return false;
    }

    // Try to load and validate current config
    getConfig();
    console.log('✅ Standalone configuration is valid');
    return true;
  } catch (error) {
    console.log(`❌ Configuration validation failed: ${(error as Error).message}`);
    return false;
  }
}

// Note: Types are already exported above with their interface definitions