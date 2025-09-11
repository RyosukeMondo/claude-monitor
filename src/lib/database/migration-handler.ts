import { spawn } from 'child_process';
import { access, constants } from 'fs/promises';
import { resolve } from 'path';
import { prisma } from './client';

/**
 * Database Migration Handler for SQLite
 * 
 * Handles automatic migration execution for SQLite in standalone mode.
 * Provides migration status tracking and rollback capabilities.
 */

export interface MigrationStatus {
  id: string;
  checksum: string;
  finished_at: Date | null;
  migration_name: string;
  logs: string | null;
  rolled_back_at: Date | null;
  started_at: Date;
  applied_steps_count: number;
}

export interface MigrationResult {
  success: boolean;
  message: string;
  migrationsApplied?: string[];
  error?: string;
}

export class MigrationHandler {
  private readonly projectRoot: string;
  private readonly prismaSchema: string;

  constructor() {
    this.projectRoot = process.cwd();
    this.prismaSchema = resolve(this.projectRoot, 'prisma', 'schema.prisma');
  }

  /**
   * Run all pending migrations automatically
   */
  async runMigrations(): Promise<MigrationResult> {
    try {
      console.log('🔄 Checking for pending database migrations...');

      // Check if schema file exists
      if (!(await this.schemaExists())) {
        return {
          success: false,
          message: 'Prisma schema file not found',
          error: `Schema file not found at ${this.prismaSchema}`
        };
      }

      // Check if database file exists and is accessible
      const dbStatus = await this.checkDatabaseAccess();
      if (!dbStatus.accessible) {
        console.log('📁 Database file not found, will be created during migration...');
      }

      // Run migrations
      const migrationResult = await this.executePrismaMigrate();
      
      if (migrationResult.success) {
        console.log('✅ Database migrations completed successfully');
        if (migrationResult.migrationsApplied && migrationResult.migrationsApplied.length > 0) {
          console.log(`📝 Applied migrations: ${migrationResult.migrationsApplied.join(', ')}`);
        } else {
          console.log('📋 No pending migrations found');
        }
      } else {
        console.error('❌ Migration failed:', migrationResult.error);
      }

      return migrationResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('💥 Migration handler error:', errorMessage);
      
      return {
        success: false,
        message: 'Migration handler encountered an unexpected error',
        error: errorMessage
      };
    }
  }

  /**
   * Get current migration status
   */
  async getMigrationStatus(): Promise<MigrationStatus[]> {
    try {
      // Query the _prisma_migrations table for status
      const migrations = await prisma.$queryRaw<MigrationStatus[]>`
        SELECT * FROM _prisma_migrations ORDER BY started_at DESC
      `;
      
      return migrations;
    } catch (error) {
      console.warn('⚠️ Could not fetch migration status (database may not exist yet):', error);
      return [];
    }
  }

  /**
   * Check if there are pending migrations
   */
  async hasPendingMigrations(): Promise<boolean> {
    try {
      const result = await this.executePrismaCommand(['migrate', 'status', '--format', 'json']);
      
      if (result.success && result.stdout) {
        try {
          const statusData = JSON.parse(result.stdout);
          return statusData.pendingMigrations?.length > 0 || false;
        } catch (parseError) {
          // Fallback: check for text indicators
          return result.stdout.includes('pending') || result.stdout.includes('Database schema is not up to date');
        }
      }
      
      return false;
    } catch (error) {
      console.warn('⚠️ Could not check pending migrations status:', error);
      return true; // Assume true to be safe
    }
  }

  /**
   * Rollback the last migration (if supported by Prisma)
   */
  async rollbackLastMigration(): Promise<MigrationResult> {
    try {
      console.log('🔄 Attempting to rollback last migration...');
      
      // Get current migration status
      const currentMigrations = await this.getMigrationStatus();
      const lastMigration = currentMigrations.find(m => m.finished_at && !m.rolled_back_at);
      
      if (!lastMigration) {
        return {
          success: false,
          message: 'No applied migrations found to rollback',
          error: 'No migrations available for rollback'
        };
      }

      console.log(`⚠️ Note: Prisma doesn't support automatic rollbacks.`);
      console.log(`💡 To rollback migration '${lastMigration.migration_name}', you would need to:`);
      console.log('   1. Manually create a new migration that reverses the changes');
      console.log('   2. Or restore from a database backup');
      console.log('   3. Or use `prisma migrate reset` to reset the entire database');

      return {
        success: false,
        message: 'Automatic rollback not supported by Prisma',
        error: 'Prisma requires manual rollback procedures'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Rollback error:', errorMessage);
      
      return {
        success: false,
        message: 'Rollback operation failed',
        error: errorMessage
      };
    }
  }

  /**
   * Reset database and run all migrations from scratch
   */
  async resetAndMigrate(): Promise<MigrationResult> {
    try {
      console.log('🗑️ Resetting database and running all migrations...');
      
      const result = await this.executePrismaCommand(['migrate', 'reset', '--force']);
      
      if (result.success) {
        console.log('✅ Database reset and migrations completed successfully');
        return {
          success: true,
          message: 'Database reset and all migrations applied successfully'
        };
      } else {
        return {
          success: false,
          message: 'Database reset failed',
          error: result.stderr || result.stdout
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Reset and migrate error:', errorMessage);
      
      return {
        success: false,
        message: 'Reset and migrate operation failed',
        error: errorMessage
      };
    }
  }

  /**
   * Execute Prisma migrate command
   */
  private async executePrismaMigrate(): Promise<MigrationResult> {
    try {
      const result = await this.executePrismaCommand(['migrate', 'deploy']);
      
      if (result.success) {
        // Parse output to extract applied migrations
        const appliedMigrations = this.extractAppliedMigrations(result.stdout);
        
        return {
          success: true,
          message: 'Migrations applied successfully',
          migrationsApplied: appliedMigrations
        };
      } else {
        return {
          success: false,
          message: 'Migration command failed',
          error: result.stderr || result.stdout
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: 'Failed to execute migration command',
        error: errorMessage
      };
    }
  }

  /**
   * Execute a Prisma CLI command
   */
  private async executePrismaCommand(args: string[]): Promise<{
    success: boolean;
    stdout: string;
    stderr: string;
  }> {
    return new Promise((resolve) => {
      const npxProcess = spawn('npx', ['prisma', ...args], {
        cwd: this.projectRoot,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env }
      });

      let stdout = '';
      let stderr = '';

      npxProcess.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      npxProcess.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      npxProcess.on('close', (code) => {
        resolve({
          success: code === 0,
          stdout,
          stderr
        });
      });

      npxProcess.on('error', (error) => {
        resolve({
          success: false,
          stdout,
          stderr: error.message
        });
      });
    });
  }

  /**
   * Extract applied migration names from Prisma output
   */
  private extractAppliedMigrations(output: string): string[] {
    const migrations: string[] = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      // Look for lines indicating applied migrations
      if (line.includes('Applied migration') || line.includes('Migration') && line.includes('applied')) {
        // Extract migration name from the line
        const match = line.match(/(\d{14}_\w+)/);
        if (match) {
          migrations.push(match[1]);
        }
      }
    }
    
    return migrations;
  }

  /**
   * Check if Prisma schema file exists
   */
  private async schemaExists(): Promise<boolean> {
    try {
      await access(this.prismaSchema, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check database file access and permissions
   */
  private async checkDatabaseAccess(): Promise<{
    accessible: boolean;
    writable: boolean;
    error?: string;
  }> {
    try {
      const databaseUrl = process.env.DATABASE_URL || '';
      
      // Extract file path from SQLite URL (format: file:./prisma/dev.db)
      const fileMatch = databaseUrl.match(/file:(.+)/);
      if (!fileMatch) {
        return {
          accessible: false,
          writable: false,
          error: 'Invalid DATABASE_URL format'
        };
      }

      const dbPath = resolve(this.projectRoot, fileMatch[1]);
      
      try {
        await access(dbPath, constants.F_OK);
        
        try {
          await access(dbPath, constants.R_OK | constants.W_OK);
          return { accessible: true, writable: true };
        } catch {
          return { 
            accessible: true, 
            writable: false, 
            error: 'Database file exists but is not writable'
          };
        }
      } catch {
        return { 
          accessible: false, 
          writable: false, 
          error: 'Database file does not exist'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        accessible: false,
        writable: false,
        error: errorMessage
      };
    }
  }
}

/**
 * Singleton instance for easy access
 */
export const migrationHandler = new MigrationHandler();

/**
 * Convenience function to run migrations
 */
export async function runDatabaseMigrations(): Promise<MigrationResult> {
  return migrationHandler.runMigrations();
}

/**
 * Convenience function to check migration status
 */
export async function checkMigrationStatus(): Promise<MigrationStatus[]> {
  return migrationHandler.getMigrationStatus();
}

/**
 * Convenience function to check for pending migrations
 */
export async function checkPendingMigrations(): Promise<boolean> {
  return migrationHandler.hasPendingMigrations();
}