import { PrismaClient } from '../generated';
import { prisma } from '../client';
import { SessionManager, StatisticsManager, ComponentManager, RecoveryManager, ConfigManager } from '../utils';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * SQLite Database Adapter
 * 
 * Provides SQLite-specific database operations with automatic initialization,
 * migration handling, and compatibility with existing Prisma patterns.
 * Maintains thread safety and supports the standalone development mode.
 */
class SQLiteAdapter {
  private static instance: SQLiteAdapter;
  private prismaClient: PrismaClient;
  private dbPath: string;
  private isInitialized: boolean = false;

  private constructor() {
    // Extract database path from DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';
    this.dbPath = databaseUrl.replace('file:', '');
    
    // Ensure absolute path
    if (!path.isAbsolute(this.dbPath)) {
      this.dbPath = path.resolve(process.cwd(), this.dbPath);
    }

    // Use the shared prisma client from client.ts for consistency
    this.prismaClient = prisma;
  }

  /**
   * Get singleton instance of SQLite adapter
   */
  public static getInstance(): SQLiteAdapter {
    if (!SQLiteAdapter.instance) {
      SQLiteAdapter.instance = new SQLiteAdapter();
    }
    return SQLiteAdapter.instance;
  }

  /**
   * Initialize SQLite database with automatic setup
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log(`[SQLite Adapter] Initializing SQLite database at: ${this.dbPath}`);

      // Set the DATABASE_URL to ensure consistency
      process.env.DATABASE_URL = `file:${this.dbPath}`;

      // Ensure database directory exists
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log(`[SQLite Adapter] Created database directory: ${dbDir}`);
      }

      // Check if database file exists
      const dbExists = fs.existsSync(this.dbPath);
      if (!dbExists) {
        console.log('[SQLite Adapter] Database file does not exist, will be created during migration');
      }

      // Run database migrations
      await this.runMigrations();

      // Test database connection
      await this.testConnection();

      // Seed database if it's new
      if (!dbExists || await this.isDatabaseEmpty()) {
        await this.seedDatabase();
      }

      this.isInitialized = true;
      console.log('[SQLite Adapter] SQLite database initialization completed successfully');

    } catch (error) {
      console.error('[SQLite Adapter] Failed to initialize SQLite database:', error);
      throw new Error(`SQLite initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Run Prisma migrations to set up database schema
   */
  public async runMigrations(): Promise<void> {
    try {
      console.log('[SQLite Adapter] Running database migrations...');
      
      // Check if migrations directory exists, if not, create initial migration
      const migrationsPath = path.join(process.cwd(), 'prisma', 'migrations');
      if (!fs.existsSync(migrationsPath)) {
        console.log('[SQLite Adapter] Creating initial migration...');
        const { stdout, stderr } = await execAsync('npx prisma migrate dev --name init', {
          cwd: process.cwd(),
          env: { ...process.env, DATABASE_URL: `file:${this.dbPath}` }
        });
        
        if (stderr && !stderr.includes('warnings') && !stderr.includes('Environment variables loaded')) {
          console.warn('[SQLite Adapter] Migration warnings:', stderr);
        }
      } else {
        // Deploy existing migrations
        console.log('[SQLite Adapter] Deploying existing migrations...');
        const { stdout, stderr } = await execAsync('npx prisma migrate deploy', {
          cwd: process.cwd(),
          env: { ...process.env, DATABASE_URL: `file:${this.dbPath}` }
        });
        
        if (stderr && !stderr.includes('warnings') && !stderr.includes('Environment variables loaded')) {
          console.warn('[SQLite Adapter] Migration warnings:', stderr);
        }
      }

      console.log('[SQLite Adapter] Database migrations completed');
      
      // Generate Prisma client if needed
      try {
        await execAsync('npx prisma generate', {
          cwd: process.cwd()
        });
        console.log('[SQLite Adapter] Prisma client generated');
      } catch (genError) {
        console.warn('[SQLite Adapter] Prisma client generation warning:', genError);
      }

    } catch (error) {
      console.error('[SQLite Adapter] Migration failed:', error);
      throw new Error(`Database migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test database connection
   */
  private async testConnection(): Promise<void> {
    try {
      await this.prismaClient.$queryRaw`SELECT 1`;
      console.log('[SQLite Adapter] Database connection test successful');
    } catch (error) {
      console.error('[SQLite Adapter] Database connection test failed:', error);
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if database is empty (needs seeding)
   */
  private async isDatabaseEmpty(): Promise<boolean> {
    try {
      const sessionCount = await this.prismaClient.monitorSession.count();
      return sessionCount === 0;
    } catch (error) {
      // If table doesn't exist, consider it empty
      return true;
    }
  }

  /**
   * Seed database with initial data if needed
   */
  private async seedDatabase(): Promise<void> {
    try {
      console.log('[SQLite Adapter] Seeding database with initial data...');
      
      // Check if there's a seed script and run it
      const seedScriptPath = path.join(process.cwd(), 'lib', 'database', 'seed.ts');
      if (fs.existsSync(seedScriptPath)) {
        // Import and run the seed function
        const { seed } = await import('../seed');
        if (typeof seed === 'function') {
          await seed();
          console.log('[SQLite Adapter] Database seeding completed');
        }
      } else {
        console.log('[SQLite Adapter] No seed script found, skipping seeding');
      }
    } catch (error) {
      console.warn('[SQLite Adapter] Database seeding failed, continuing anyway:', error);
    }
  }

  /**
   * Get Prisma client instance
   */
  public getClient(): PrismaClient {
    if (!this.isInitialized) {
      throw new Error('SQLite adapter not initialized. Call initialize() first.');
    }
    return this.prismaClient;
  }

  /**
   * Close database connection
   */
  public async close(): Promise<void> {
    try {
      await this.prismaClient.$disconnect();
      this.isInitialized = false;
      console.log('[SQLite Adapter] Database connection closed');
    } catch (error) {
      console.error('[SQLite Adapter] Error closing database connection:', error);
    }
  }

  /**
   * Get database file path
   */
  public getDatabasePath(): string {
    return this.dbPath;
  }

  /**
   * Check if database is initialized
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Backup database to specified location
   */
  public async backup(backupPath: string): Promise<void> {
    try {
      if (!fs.existsSync(this.dbPath)) {
        throw new Error('Database file does not exist');
      }

      const backupDir = path.dirname(backupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      fs.copyFileSync(this.dbPath, backupPath);
      console.log(`[SQLite Adapter] Database backed up to: ${backupPath}`);
    } catch (error) {
      console.error('[SQLite Adapter] Backup failed:', error);
      throw new Error(`Database backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get database statistics
   */
  public async getDatabaseStats(): Promise<{
    fileSize: number;
    tables: string[];
    recordCounts: Record<string, number>;
  }> {
    try {
      const stats = fs.statSync(this.dbPath);
      const fileSize = stats.size;

      // Get table names
      const tables = await this.prismaClient.$queryRaw<Array<{ name: string }>>`
        SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations'
      `;

      const tableNames = tables.map(t => t.name);
      const recordCounts: Record<string, number> = {};

      // Get record counts for each table
      for (const tableName of tableNames) {
        try {
          const count = await this.prismaClient.$queryRawUnsafe<Array<{ count: number }>>(
            `SELECT COUNT(*) as count FROM "${tableName}"`
          );
          recordCounts[tableName] = count[0]?.count || 0;
        } catch (error) {
          console.warn(`[SQLite Adapter] Could not get count for table ${tableName}:`, error);
          recordCounts[tableName] = -1;
        }
      }

      return {
        fileSize,
        tables: tableNames,
        recordCounts
      };
    } catch (error) {
      console.error('[SQLite Adapter] Error getting database stats:', error);
      throw new Error(`Could not get database statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Re-export utility managers for convenient access
  public readonly sessions = SessionManager;
  public readonly statistics = StatisticsManager;
  public readonly components = ComponentManager;
  public readonly recovery = RecoveryManager;
  public readonly config = ConfigManager;
}

/**
 * Export the class for flexibility, default export is singleton instance
 */
const sqliteAdapterInstance = SQLiteAdapter.getInstance();
export { SQLiteAdapter };
export default sqliteAdapterInstance;