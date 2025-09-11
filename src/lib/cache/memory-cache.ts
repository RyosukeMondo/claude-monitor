/**
 * Memory Session Cache
 * 
 * Replaces Redis functionality with in-memory data structures for session management.
 * Implements LRU eviction and memory management for standalone development mode.
 * Integrates with WebSocket event patterns for real-time session updates.
 */

import { MonitoringEvent, MonitoringWebSocketServer } from '../websocket/server'

export interface SessionCacheEntry {
  id: string
  projectId: string
  data: unknown
  timestamp: number
  ttl: number
  accessCount: number
  lastAccessed: number
  connections: string[] // WebSocket connection IDs
}

export interface CacheStats {
  totalEntries: number
  memoryUsage: number
  hitRate: number
  evictionCount: number
  lastEviction: number
}

export interface MemoryCacheConfig {
  maxEntries: number
  defaultTtl: number
  maxMemoryMB: number
  evictionBatchSize: number
  cleanupInterval: number
}

/**
 * Memory-based cache system with LRU eviction for session management
 * Replaces Redis in standalone mode while maintaining WebSocket integration
 */
export class MemorySessionCache {
  private cache = new Map<string, SessionCacheEntry>()
  private accessOrder = new Map<string, number>() // key -> access timestamp for LRU
  private stats: CacheStats = {
    totalEntries: 0,
    memoryUsage: 0,
    hitRate: 0,
    evictionCount: 0,
    lastEviction: 0
  }
  private accessCounter = 0
  private hitCounter = 0
  private cleanupTimer: NodeJS.Timeout | null = null
  private wsServer: MonitoringWebSocketServer | null = null

  constructor(
    private config: MemoryCacheConfig = {
      maxEntries: 1000,
      defaultTtl: 3600000, // 1 hour in ms
      maxMemoryMB: 100,
      evictionBatchSize: 50,
      cleanupInterval: 300000 // 5 minutes
    }
  ) {
    this.startCleanupInterval()
  }

  /**
   * Set WebSocket server for event broadcasting
   * Integrates with existing WebSocket event patterns
   */
  setWebSocketServer(wsServer: MonitoringWebSocketServer): void {
    this.wsServer = wsServer
  }

  /**
   * Store data in cache with TTL and session tracking
   */
  set(key: string, value: unknown, ttl?: number, projectId?: string, connectionId?: string): void {
    const now = Date.now()
    const entryTtl = ttl || this.config.defaultTtl
    
    // Create or update cache entry
    const entry: SessionCacheEntry = {
      id: key,
      projectId: projectId || 'default',
      data: value,
      timestamp: now,
      ttl: entryTtl,
      accessCount: 1,
      lastAccessed: now,
      connections: connectionId ? [connectionId] : []
    }

    // Update existing entry connections if it exists
    const existing = this.cache.get(key)
    if (existing && connectionId && !existing.connections.includes(connectionId)) {
      entry.connections = [...existing.connections, connectionId]
    }

    this.cache.set(key, entry)
    this.accessOrder.set(key, now)
    this.stats.totalEntries = this.cache.size
    this.updateMemoryUsage()

    // Check if eviction is needed
    this.checkEvictionNeeded()

    // Broadcast cache update event via WebSocket
    this.broadcastCacheEvent('cache_set', key, projectId, { size: this.cache.size })
  }

  /**
   * Retrieve data from cache
   */
  get(key: string): unknown {
    this.accessCounter++
    const entry = this.cache.get(key)
    
    if (!entry) {
      // Update hit rate
      this.stats.hitRate = this.accessCounter > 0 ? this.hitCounter / this.accessCounter : 0
      return null
    }

    const now = Date.now()
    
    // Check TTL expiration
    if (now > entry.timestamp + entry.ttl) {
      this.delete(key)
      // Update hit rate
      this.stats.hitRate = this.accessCounter > 0 ? this.hitCounter / this.accessCounter : 0
      return null
    }

    // Update access tracking for LRU
    entry.lastAccessed = now
    entry.accessCount++
    this.accessOrder.set(key, now)
    this.hitCounter++

    // Update hit rate
    this.stats.hitRate = this.accessCounter > 0 ? this.hitCounter / this.accessCounter : 0

    return entry.data
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) {
      return false
    }

    // Broadcast deletion to connected clients
    this.broadcastCacheEvent('cache_delete', key, entry.projectId, { 
      reason: 'manual_delete',
      connections: entry.connections
    })

    this.cache.delete(key)
    this.accessOrder.delete(key)
    this.stats.totalEntries = this.cache.size
    this.updateMemoryUsage()

    return true
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) {
      return false
    }

    const now = Date.now()
    if (now > entry.timestamp + entry.ttl) {
      this.delete(key)
      return false
    }

    return true
  }

  /**
   * Get all keys for a specific project
   */
  getProjectKeys(projectId: string): string[] {
    const keys: string[] = []
    for (const [key, entry] of this.cache.entries()) {
      if (entry.projectId === projectId && this.has(key)) {
        keys.push(key)
      }
    }
    return keys
  }

  /**
   * Add connection to a session
   */
  addConnection(key: string, connectionId: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) {
      return false
    }

    if (!entry.connections.includes(connectionId)) {
      entry.connections.push(connectionId)
      this.broadcastCacheEvent('connection_added', key, entry.projectId, {
        connectionId,
        totalConnections: entry.connections.length
      })
    }

    return true
  }

  /**
   * Remove connection from a session
   */
  removeConnection(key: string, connectionId: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) {
      return false
    }

    const index = entry.connections.indexOf(connectionId)
    if (index > -1) {
      entry.connections.splice(index, 1)
      this.broadcastCacheEvent('connection_removed', key, entry.projectId, {
        connectionId,
        totalConnections: entry.connections.length
      })

      // If no connections remain, consider marking for cleanup
      if (entry.connections.length === 0) {
        // Reduce TTL for orphaned sessions
        entry.ttl = Math.min(entry.ttl, 60000) // 1 minute max for orphaned
      }
    }

    return true
  }

  /**
   * Broadcast event to all connections in a session
   */
  broadcast(key: string, event: unknown): void {
    const entry = this.cache.get(key)
    if (!entry || !this.wsServer) {
      return
    }

    // Create monitoring event following existing patterns
    const monitoringEvent: MonitoringEvent = {
      type: 'new_event',
      timestamp: new Date().toISOString(),
      projectId: entry.projectId,
      data: {
        sessionId: key,
        event,
        connections: entry.connections.length
      }
    }

    this.wsServer.broadcastMonitoringEvent(monitoringEvent)
  }

  /**
   * Get current cache statistics
   */
  getStats(): CacheStats {
    this.updateMemoryUsage()
    return { ...this.stats }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const projectIds = new Set<string>()
    for (const entry of this.cache.values()) {
      projectIds.add(entry.projectId)
    }

    this.cache.clear()
    this.accessOrder.clear()
    this.stats.totalEntries = 0
    this.updateMemoryUsage()

    // Broadcast clear event for each project
    for (const projectId of projectIds) {
      this.broadcastCacheEvent('cache_clear', 'all', projectId, { cleared: true })
    }
  }

  /**
   * Check if eviction is needed and perform LRU eviction
   */
  private checkEvictionNeeded(): void {
    const memoryUsageMB = this.stats.memoryUsage / (1024 * 1024)
    
    if (this.cache.size > this.config.maxEntries || memoryUsageMB > this.config.maxMemoryMB) {
      this.performLRUEviction()
    }
  }

  /**
   * Perform LRU eviction of least recently used entries
   */
  private performLRUEviction(): void {
    // Calculate how many entries to evict
    const currentSize = this.cache.size
    const targetSize = Math.max(
      this.config.maxEntries - this.config.evictionBatchSize,
      Math.floor(this.config.maxEntries * 0.8)
    )
    const entriesToEvict = Math.min(currentSize - targetSize, this.config.evictionBatchSize)

    if (entriesToEvict <= 0) return

    const entries = Array.from(this.accessOrder.entries())
      .sort((a, b) => a[1] - b[1]) // Sort by access time (oldest first)
      .slice(0, entriesToEvict)

    const evictedKeys: string[] = []
    const evictedProjects = new Set<string>()

    for (const [key] of entries) {
      const entry = this.cache.get(key)
      if (entry) {
        evictedProjects.add(entry.projectId)
        // Notify connections before eviction
        this.broadcastCacheEvent('cache_evict', key, entry.projectId, {
          reason: 'lru_eviction',
          connections: entry.connections
        })
      }
      
      this.cache.delete(key)
      this.accessOrder.delete(key)
      evictedKeys.push(key)
    }

    this.stats.evictionCount += evictedKeys.length
    this.stats.lastEviction = Date.now()
    this.stats.totalEntries = this.cache.size
    this.updateMemoryUsage()

    console.log(`[MemoryCache] Evicted ${evictedKeys.length} entries via LRU`)
  }

  /**
   * Cleanup expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now()
    const expiredKeys: string[] = []
    const expiredProjects = new Set<string>()

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        expiredKeys.push(key)
        expiredProjects.add(entry.projectId)
      }
    }

    for (const key of expiredKeys) {
      const entry = this.cache.get(key)!
      this.broadcastCacheEvent('cache_expire', key, entry.projectId, {
        reason: 'ttl_expired',
        connections: entry.connections
      })
      this.cache.delete(key)
      this.accessOrder.delete(key)
    }

    if (expiredKeys.length > 0) {
      this.stats.totalEntries = this.cache.size
      this.updateMemoryUsage()
      console.log(`[MemoryCache] Cleaned up ${expiredKeys.length} expired entries`)
    }
  }

  /**
   * Start automatic cleanup interval
   */
  private startCleanupInterval(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired()
    }, this.config.cleanupInterval)
  }

  /**
   * Stop cleanup interval
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }

  /**
   * Update memory usage estimation
   */
  private updateMemoryUsage(): void {
    let estimatedBytes = 0
    
    for (const entry of this.cache.values()) {
      // Rough estimation of memory usage
      estimatedBytes += JSON.stringify(entry).length * 2 // UTF-16 approximation
    }
    
    this.stats.memoryUsage = estimatedBytes
  }

  /**
   * Broadcast cache events via WebSocket following existing patterns
   */
  private broadcastCacheEvent(eventType: string, key: string, projectId?: string, data?: Record<string, unknown>): void {
    if (!this.wsServer) {
      return
    }

    const event: MonitoringEvent = {
      type: 'state_change',
      timestamp: new Date().toISOString(),
      projectId,
      data: {
        cacheEvent: eventType,
        key,
        ...data,
        stats: {
          totalEntries: this.stats.totalEntries,
          memoryUsage: this.stats.memoryUsage,
          hitRate: this.stats.hitRate
        }
      }
    }

    this.wsServer.broadcastMonitoringEvent(event)
  }

  /**
   * Graceful shutdown
   */
  shutdown(): void {
    this.stopCleanup()
    
    // Notify all connections about shutdown
    for (const [key, entry] of this.cache.entries()) {
      this.broadcastCacheEvent('cache_shutdown', key, entry.projectId, {
        reason: 'server_shutdown',
        connections: entry.connections
      })
    }
    
    this.clear()
    console.log('[MemoryCache] Shutdown complete')
  }
}

// Singleton instance for app-wide access
let memoryCache: MemorySessionCache | null = null

/**
 * Get or create memory cache instance
 */
export function getMemoryCache(config?: Partial<MemoryCacheConfig>): MemorySessionCache {
  if (!memoryCache) {
    const finalConfig = config ? { ...new MemorySessionCache().config, ...config } : undefined
    memoryCache = new MemorySessionCache(finalConfig as MemoryCacheConfig)
  }
  return memoryCache
}

/**
 * Initialize memory cache with WebSocket server integration
 */
export function initializeMemoryCache(
  wsServer: MonitoringWebSocketServer, 
  config?: Partial<MemoryCacheConfig>
): MemorySessionCache {
  const cache = getMemoryCache(config)
  cache.setWebSocketServer(wsServer)
  return cache
}

/**
 * Shutdown memory cache
 */
export function shutdownMemoryCache(): void {
  if (memoryCache) {
    memoryCache.shutdown()
    memoryCache = null
  }
}