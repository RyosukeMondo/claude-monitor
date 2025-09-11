/**
 * Claude Monitor Database Module
 * 
 * Provides Prisma-based database access for session tracking,
 * statistics, and component monitoring.
 */

// Export Prisma client and types
export { prisma } from './client';
export * from './generated';

// Export utility managers
export {
  SessionManager,
  StatisticsManager,
  ComponentManager,
  RecoveryManager,
  ConfigManager
} from './utils';

// Export seed function for testing
export { seed } from './seed';