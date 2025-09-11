/**
 * Health check endpoint (public, no authentication required).
 * Provides comprehensive health monitoring for standalone mode including
 * SQLite database and memory cache status.
 */

import { NextRequest, NextResponse } from 'next/server';
// import sqliteAdapter from '../../../../lib/database/adapters/sqlite-adapter';
import { getMemoryCache } from '@/lib/cache/memory-cache';

export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString();
  const version = process.env.npm_package_version || '1.0.0';
  
  // Basic health status
  let overallStatus = 'healthy';
  const services: Record<string, any> = {};

  try {
    // Check SQLite database status (placeholder for future SQLite adapter)
    services.database = {
      status: 'pending',
      type: 'sqlite',
      initialized: false,
      note: 'SQLite adapter not yet implemented'
    };

    // Check memory cache status
    try {
      const memoryCache = getMemoryCache();
      const cacheStats = memoryCache.getStats();
      services.cache = {
        status: 'healthy',
        type: 'memory',
        totalEntries: cacheStats.totalEntries,
        memoryUsageMB: Math.round(cacheStats.memoryUsage / (1024 * 1024) * 100) / 100,
        hitRate: Math.round(cacheStats.hitRate * 100 * 100) / 100,
        evictionCount: cacheStats.evictionCount
      };
    } catch (error) {
      services.cache = {
        status: 'unhealthy',
        type: 'memory',
        error: error instanceof Error ? error.message : 'Unknown cache error'
      };
      overallStatus = 'degraded';
    }

    // Check if any critical services are down
    const criticalServicesDown = Object.values(services).some(service => service.status === 'unhealthy');
    if (criticalServicesDown) {
      overallStatus = 'unhealthy';
    }

  } catch (error) {
    overallStatus = 'unhealthy';
    services.error = error instanceof Error ? error.message : 'Unknown system error';
  }

  return NextResponse.json({
    status: overallStatus,
    timestamp,
    version,
    mode: 'standalone',
    services
  });
}