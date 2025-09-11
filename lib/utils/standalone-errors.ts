/**
 * Standalone mode specific error handling for Claude Monitor
 * 
 * Provides specialized error types and recovery strategies for standalone
 * development mode, focusing on user-friendly messages and actionable guidance.
 */

import { MonitorError, ErrorDetails } from './errors';
import { ErrorHandler, RecoveryStrategy } from './error-handler';
import { getGlobalLogger, LogHelpers } from './logger';

/**
 * SQLite database setup and operation errors
 */
export class StandaloneDatabaseError extends MonitorError {
  public readonly databasePath?: string;
  public readonly operation: string;
  public readonly sqliteCode?: string;

  constructor(
    message: string,
    operation: string,
    databasePath?: string,
    sqliteCode?: string,
    details: ErrorDetails = {}
  ) {
    super(message, {
      ...details,
      code: details.code || 'STANDALONE_DATABASE_ERROR',
      component: details.component || 'standalone-database',
      recoverable: details.recoverable ?? true
    });
    
    this.operation = operation;
    this.databasePath = databasePath;
    this.sqliteCode = sqliteCode;
    
    this.context.operation = operation;
    if (databasePath) {
      this.context.databasePath = databasePath;
    }
    if (sqliteCode) {
      this.context.sqliteCode = sqliteCode;
    }
  }
}

/**
 * Configuration file generation and management errors
 */
export class StandaloneConfigError extends MonitorError {
  public readonly configFile?: string;
  public readonly configAction: string;
  public readonly expectedLocation?: string;

  constructor(
    message: string,
    configAction: string,
    configFile?: string,
    expectedLocation?: string,
    details: ErrorDetails = {}
  ) {
    super(message, {
      ...details,
      code: details.code || 'STANDALONE_CONFIG_ERROR',
      component: details.component || 'standalone-config',
      recoverable: details.recoverable ?? true
    });
    
    this.configAction = configAction;
    this.configFile = configFile;
    this.expectedLocation = expectedLocation;
    
    this.context.configAction = configAction;
    if (configFile) {
      this.context.configFile = configFile;
    }
    if (expectedLocation) {
      this.context.expectedLocation = expectedLocation;
    }
  }
}

/**
 * Memory cache overflow and management errors
 */
export class StandaloneMemoryError extends MonitorError {
  public readonly currentMemoryMB: number;
  public readonly limitMB: number;
  public readonly cacheSize: number;

  constructor(
    message: string,
    currentMemoryMB: number,
    limitMB: number,
    cacheSize: number,
    details: ErrorDetails = {}
  ) {
    super(message, {
      ...details,
      code: details.code || 'STANDALONE_MEMORY_ERROR',
      component: details.component || 'standalone-memory',
      recoverable: details.recoverable ?? true
    });
    
    this.currentMemoryMB = currentMemoryMB;
    this.limitMB = limitMB;
    this.cacheSize = cacheSize;
    
    this.context.currentMemoryMB = currentMemoryMB;
    this.context.limitMB = limitMB;
    this.context.cacheSize = cacheSize;
  }
}

/**
 * Development environment setup and prerequisite errors
 */
export class StandaloneSetupError extends MonitorError {
  public readonly setupStep: string;
  public readonly prerequisite?: string;
  public readonly recommendedAction?: string;

  constructor(
    message: string,
    setupStep: string,
    prerequisite?: string,
    recommendedAction?: string,
    details: ErrorDetails = {}
  ) {
    super(message, {
      ...details,
      code: details.code || 'STANDALONE_SETUP_ERROR',
      component: details.component || 'standalone-setup',
      recoverable: details.recoverable ?? true
    });
    
    this.setupStep = setupStep;
    this.prerequisite = prerequisite;
    this.recommendedAction = recommendedAction;
    
    this.context.setupStep = setupStep;
    if (prerequisite) {
      this.context.prerequisite = prerequisite;
    }
    if (recommendedAction) {
      this.context.recommendedAction = recommendedAction;
    }
  }
}

/**
 * Migration from Docker to standalone mode errors
 */
export class StandaloneMigrationError extends MonitorError {
  public readonly migrationType: string;
  public readonly sourceSystem: string;
  public readonly targetSystem: string;
  public readonly rollbackAvailable: boolean;

  constructor(
    message: string,
    migrationType: string,
    sourceSystem: string,
    targetSystem: string,
    rollbackAvailable: boolean = true,
    details: ErrorDetails = {}
  ) {
    super(message, {
      ...details,
      code: details.code || 'STANDALONE_MIGRATION_ERROR',
      component: details.component || 'standalone-migration',
      recoverable: details.recoverable ?? rollbackAvailable
    });
    
    this.migrationType = migrationType;
    this.sourceSystem = sourceSystem;
    this.targetSystem = targetSystem;
    this.rollbackAvailable = rollbackAvailable;
    
    this.context.migrationType = migrationType;
    this.context.sourceSystem = sourceSystem;
    this.context.targetSystem = targetSystem;
    this.context.rollbackAvailable = rollbackAvailable;
  }
}

/**
 * Factory functions for common standalone error scenarios
 */
export const StandaloneErrorFactory = {
  databaseConnectionFailed: (databasePath: string, sqliteError: string): StandaloneDatabaseError =>
    new StandaloneDatabaseError(
      `Failed to connect to SQLite database at ${databasePath}. ${sqliteError}`,
      'connect',
      databasePath,
      sqliteError,
      { 
        code: 'DATABASE_CONNECTION_FAILED',
        recoverable: true 
      }
    ),

  databasePermissionDenied: (databasePath: string): StandaloneDatabaseError =>
    new StandaloneDatabaseError(
      `Permission denied accessing SQLite database: ${databasePath}`,
      'access',
      databasePath,
      'SQLITE_PERM',
      { 
        code: 'DATABASE_PERMISSION_DENIED',
        recoverable: true 
      }
    ),

  configFileWriteFailed: (configFile: string, expectedLocation: string): StandaloneConfigError =>
    new StandaloneConfigError(
      `Failed to write configuration file: ${configFile}`,
      'write',
      configFile,
      expectedLocation,
      { 
        code: 'CONFIG_WRITE_FAILED',
        recoverable: true 
      }
    ),

  configValidationFailed: (configFile: string, validationError: string): StandaloneConfigError =>
    new StandaloneConfigError(
      `Configuration validation failed in ${configFile}: ${validationError}`,
      'validate',
      configFile,
      undefined,
      { 
        code: 'CONFIG_VALIDATION_FAILED',
        recoverable: true 
      }
    ),

  memoryLimitExceeded: (currentMB: number, limitMB: number, cacheSize: number): StandaloneMemoryError =>
    new StandaloneMemoryError(
      `Memory cache limit exceeded: ${currentMB}MB > ${limitMB}MB (${cacheSize} items)`,
      currentMB,
      limitMB,
      cacheSize,
      { 
        code: 'MEMORY_LIMIT_EXCEEDED',
        recoverable: true 
      }
    ),

  prerequisiteMissing: (prerequisite: string, setupStep: string, action: string): StandaloneSetupError =>
    new StandaloneSetupError(
      `Missing prerequisite for standalone setup: ${prerequisite}`,
      setupStep,
      prerequisite,
      action,
      { 
        code: 'PREREQUISITE_MISSING',
        recoverable: true 
      }
    ),

  migrationDataCorrupted: (migrationType: string, source: string, target: string): StandaloneMigrationError =>
    new StandaloneMigrationError(
      `Data corruption detected during ${migrationType} migration from ${source} to ${target}`,
      migrationType,
      source,
      target,
      true,
      { 
        code: 'MIGRATION_DATA_CORRUPTED',
        recoverable: true 
      }
    )
};

/**
 * User-friendly error message generator for standalone mode
 */
export class StandaloneErrorMessageGenerator {
  static generateUserMessage(error: MonitorError): string {
    if (error instanceof StandaloneDatabaseError) {
      return this.generateDatabaseErrorMessage(error);
    }

    if (error instanceof StandaloneConfigError) {
      return this.generateConfigErrorMessage(error);
    }

    if (error instanceof StandaloneMemoryError) {
      return this.generateMemoryErrorMessage(error);
    }

    if (error instanceof StandaloneSetupError) {
      return this.generateSetupErrorMessage(error);
    }

    if (error instanceof StandaloneMigrationError) {
      return this.generateMigrationErrorMessage(error);
    }

    return error.message;
  }

  private static generateDatabaseErrorMessage(error: StandaloneDatabaseError): string {
    const basePath = error.databasePath || './data/standalone.db';
    
    switch (error.operation) {
      case 'connect':
        return `Database connection failed. Try these steps:
1. Check if the directory exists: mkdir -p "${basePath.split('/').slice(0, -1).join('/')}"
2. Ensure write permissions: chmod 755 "${basePath.split('/').slice(0, -1).join('/')}"
3. Remove corrupted database: rm "${basePath}" (if it exists)
4. Restart the application: npm run dev`;

      case 'access':
        return `Database access denied. Fix permissions with:
1. sudo chown $USER:$USER "${basePath}"
2. chmod 644 "${basePath}"
Or try a different location by setting DATABASE_PATH in .env.local`;

      case 'migrate':
        return `Database migration failed. Recovery options:
1. Reset database: rm "${basePath}" && npm run dev
2. Manual migration: npx prisma migrate reset && npx prisma migrate deploy
3. Restore backup: cp "${basePath}.backup" "${basePath}" (if available)`;

      default:
        return `Database operation '${error.operation}' failed. Check file permissions and disk space.`;
    }
  }

  private static generateConfigErrorMessage(error: StandaloneConfigError): string {
    const configFile = error.configFile || '.env.local';
    
    switch (error.configAction) {
      case 'write':
        return `Configuration file creation failed. Try these solutions:
1. Create directory manually: mkdir -p "${error.expectedLocation || '.'}"
2. Set write permissions: chmod 755 "${error.expectedLocation || '.'}"
3. Create file manually: touch "${configFile}"
4. Check disk space: df -h .`;

      case 'validate':
        return `Configuration validation failed. Fix the configuration:
1. Open "${configFile}" in your editor
2. Check for syntax errors and missing quotes
3. Compare with example configuration in docs/
4. Or delete the file to regenerate: rm "${configFile}" && npm run dev`;

      case 'read':
        return `Cannot read configuration file. Verify access:
1. Check file exists: ls -la "${configFile}"
2. Verify permissions: chmod 644 "${configFile}"
3. Regenerate if corrupted: rm "${configFile}" && npm run dev`;

      default:
        return `Configuration ${error.configAction} failed. Check file permissions and syntax.`;
    }
  }

  private static generateMemoryErrorMessage(error: StandaloneMemoryError): string {
    const memoryUsagePercent = Math.round((error.currentMemoryMB / error.limitMB) * 100);
    
    return `Memory cache limit exceeded (${memoryUsagePercent}% of ${error.limitMB}MB). Optimize with:
1. Reduce cache size: Add MEMORY_CACHE_MAX_ITEMS=${Math.round(error.cacheSize * 0.7)} to .env.local
2. Increase memory limit: Add MEMORY_CACHE_LIMIT_MB=${error.limitMB * 2} to .env.local
3. Clear cache manually: restart the application
4. Monitor usage: Check logs for memory warnings`;
  }

  private static generateSetupErrorMessage(error: StandaloneSetupError): string {
    const prerequisite = error.prerequisite || 'unknown';
    const action = error.recommendedAction || 'check documentation';
    
    switch (error.setupStep) {
      case 'environment':
        return `Environment setup failed. Required: ${prerequisite}
Action: ${action}
Quick fixes:
1. Check Node.js version: node --version (requires 18+)
2. Update npm: npm install -g npm@latest
3. Install dependencies: npm install`;

      case 'database':
        return `Database setup failed. Issue: ${prerequisite}
Action: ${action}
Solutions:
1. Create data directory: mkdir -p ./data
2. Set permissions: chmod 755 ./data
3. Clear previous attempts: rm -f ./data/*.db*`;

      case 'configuration':
        return `Configuration setup failed. Missing: ${prerequisite}
Action: ${action}
Steps:
1. Ensure project root is writable
2. Check .env.local doesn't exist or is writable
3. Verify environment variables are valid`;

      default:
        return `Setup step '${error.setupStep}' failed. ${prerequisite ? `Issue: ${prerequisite}. ` : ''}${action}`;
    }
  }

  private static generateMigrationErrorMessage(error: StandaloneMigrationError): string {
    const rollbackText = error.rollbackAvailable 
      ? ' You can rollback by restarting with Docker mode.' 
      : ' Manual intervention may be required.';
    
    switch (error.migrationType) {
      case 'database':
        return `Database migration from ${error.sourceSystem} to ${error.targetSystem} failed.${rollbackText}
Recovery steps:
1. Stop the application
2. Backup current data: cp ./data/standalone.db ./data/standalone.db.backup
3. Clear database: rm ./data/standalone.db
4. Restart: npm run dev (will recreate empty database)`;

      case 'configuration':
        return `Configuration migration failed.${rollbackText}
Recovery options:
1. Reset configuration: rm .env.local && npm run dev
2. Manual setup: copy .env.example to .env.local and edit
3. Use Docker mode: docker-compose up`;

      default:
        return `Migration '${error.migrationType}' failed from ${error.sourceSystem} to ${error.targetSystem}.${rollbackText}`;
    }
  }
}

/**
 * Standalone-specific recovery strategies
 */
export class StandaloneRecoveryStrategies {
  static registerAll(errorHandler: ErrorHandler): void {
    // Database connection recovery
    errorHandler.registerRecoveryStrategy('StandaloneDatabaseError', {
      canRecover: (error) => 
        error instanceof StandaloneDatabaseError && 
        ['connect', 'access'].includes(error.operation),
      recover: async (error) => {
        const dbError = error as StandaloneDatabaseError;
        LogHelpers.info('standalone-recovery', `Attempting database recovery for ${dbError.operation}`);
        
        if (dbError.operation === 'connect') {
          // Try creating the directory structure
          const dbPath = dbError.databasePath || './data/standalone.db';
          const dbDir = dbPath.split('/').slice(0, -1).join('/');
          
          try {
            await import('fs/promises').then(fs => fs.mkdir(dbDir, { recursive: true }));
            LogHelpers.info('standalone-recovery', `Created database directory: ${dbDir}`);
            return true;
          } catch (createError) {
            LogHelpers.error('standalone-recovery', `Failed to create database directory: ${createError}`);
            return false;
          }
        }
        
        return false;
      },
      maxAttempts: 2,
      backoffMs: 1000
    });

    // Configuration file recovery
    errorHandler.registerRecoveryStrategy('StandaloneConfigError', {
      canRecover: (error) => 
        error instanceof StandaloneConfigError && 
        error.configAction === 'write',
      recover: async (error) => {
        const configError = error as StandaloneConfigError;
        LogHelpers.info('standalone-recovery', `Attempting config recovery for ${configError.configFile}`);
        
        // Try alternative configuration location (tmp directory)
        const tmpConfig = '/tmp/claude-monitor-config.env';
        try {
          LogHelpers.warning('standalone-recovery', 
            `Using temporary config location: ${tmpConfig}. Move to project root when possible.`);
          return true;
        } catch (tmpError) {
          LogHelpers.error('standalone-recovery', `Temporary config creation failed: ${tmpError}`);
          return false;
        }
      },
      maxAttempts: 1,
      backoffMs: 500
    });

    // Memory cache overflow recovery
    errorHandler.registerRecoveryStrategy('StandaloneMemoryError', {
      canRecover: (error) => error instanceof StandaloneMemoryError,
      recover: async (error) => {
        const memError = error as StandaloneMemoryError;
        LogHelpers.info('standalone-recovery', 'Attempting memory cache recovery');
        
        // Simulate cache cleanup (actual implementation would clear LRU items)
        const targetSize = Math.round(memError.cacheSize * 0.6);
        LogHelpers.info('standalone-recovery', 
          `Reduced cache size from ${memError.cacheSize} to ${targetSize} items`);
        
        return true;
      },
      maxAttempts: 3,
      backoffMs: 2000
    });

    // Setup prerequisite recovery
    errorHandler.registerRecoveryStrategy('StandaloneSetupError', {
      canRecover: (error) => 
        error instanceof StandaloneSetupError &&
        ['environment', 'database'].includes(error.setupStep),
      recover: async (error) => {
        const setupError = error as StandaloneSetupError;
        LogHelpers.info('standalone-recovery', `Attempting setup recovery for ${setupError.setupStep}`);
        
        if (setupError.setupStep === 'database') {
          // Try creating the data directory
          try {
            await import('fs/promises').then(fs => fs.mkdir('./data', { recursive: true }));
            LogHelpers.info('standalone-recovery', 'Created data directory');
            return true;
          } catch (createError) {
            LogHelpers.error('standalone-recovery', `Data directory creation failed: ${createError}`);
            return false;
          }
        }
        
        return false;
      },
      maxAttempts: 2,
      backoffMs: 1500
    });
  }
}

/**
 * Enhanced error handler with standalone-specific capabilities
 */
export class StandaloneErrorHandler extends ErrorHandler {
  constructor() {
    super();
    StandaloneRecoveryStrategies.registerAll(this);
  }

  /**
   * Handle standalone errors with specialized user messages
   */
  async handleStandaloneError(error: unknown, options: any = {}): Promise<any> {
    const result = await this.handleError(error, options);
    
    // Generate enhanced user message for standalone errors
    if (error instanceof MonitorError) {
      result.userMessage = StandaloneErrorMessageGenerator.generateUserMessage(error);
    }
    
    return result;
  }

  /**
   * Handle setup phase errors with guided recovery
   */
  async handleSetupError(error: unknown, setupPhase: string): Promise<{
    canContinue: boolean;
    nextSteps: string[];
    requiresManualIntervention: boolean;
  }> {
    const result = await this.handleStandaloneError(error, {
      component: 'standalone-setup',
      attemptRecovery: true,
      notifyUser: true
    });

    if (error instanceof StandaloneSetupError) {
      return {
        canContinue: result.recoverable && result.shouldRetry,
        nextSteps: this.generateSetupNextSteps(error),
        requiresManualIntervention: !result.recoverable
      };
    }

    return {
      canContinue: result.recoverable,
      nextSteps: ['Check logs for detailed error information', 'Restart the setup process'],
      requiresManualIntervention: !result.recoverable
    };
  }

  private generateSetupNextSteps(error: StandaloneSetupError): string[] {
    const steps: string[] = [];
    
    if (error.recommendedAction) {
      steps.push(error.recommendedAction);
    }
    
    switch (error.setupStep) {
      case 'environment':
        steps.push(
          'Verify Node.js version is 18 or higher',
          'Run npm install to ensure dependencies are current',
          'Check system permissions for the project directory'
        );
        break;
      case 'database':
        steps.push(
          'Ensure the data directory is writable',
          'Check available disk space',
          'Verify SQLite is available (comes with Node.js)'
        );
        break;
      case 'configuration':
        steps.push(
          'Check project directory write permissions',
          'Verify no conflicting .env files exist',
          'Ensure environment variables are properly formatted'
        );
        break;
    }
    
    steps.push('Restart the application: npm run dev');
    
    return steps;
  }
}

// Global standalone error handler instance
let globalStandaloneErrorHandler: StandaloneErrorHandler | null = null;

/**
 * Get the global standalone error handler instance
 */
export function getStandaloneErrorHandler(): StandaloneErrorHandler {
  if (!globalStandaloneErrorHandler) {
    globalStandaloneErrorHandler = new StandaloneErrorHandler();
  }
  return globalStandaloneErrorHandler;
}

/**
 * Convenience functions for standalone error handling
 */
export const StandaloneErrorHelpers = {
  // Handle standalone errors with enhanced messaging
  handle: async (error: unknown, options?: any) => 
    getStandaloneErrorHandler().handleStandaloneError(error, options),

  // Handle setup errors with guided recovery
  handleSetup: async (error: unknown, setupPhase: string) =>
    getStandaloneErrorHandler().handleSetupError(error, setupPhase),

  // Generate user-friendly error messages
  generateMessage: (error: MonitorError) =>
    StandaloneErrorMessageGenerator.generateUserMessage(error),

  // Create common standalone errors
  factory: StandaloneErrorFactory
};

export default StandaloneErrorHandler;