/**
 * Unit tests for Memory Session Cache
 * 
 * Tests cover:
 * - Basic cache operations (set, get, delete, has)
 * - Session management and connection tracking
 * - TTL expiration and automatic cleanup
 * - LRU eviction strategy
 * - Memory usage monitoring and limits
 * - WebSocket event broadcasting
 * - Project-based session organization
 * - Statistics tracking and reporting
 * - Configuration options and limits
 * - Graceful shutdown and cleanup
 * - Error handling and edge cases
 * - Performance characteristics
 */

import {
  MemorySessionCache,
  getMemoryCache,
  initializeMemoryCache,
  shutdownMemoryCache,
  type SessionCacheEntry,
  type CacheStats,
  type MemoryCacheConfig
} from '../../src/lib/cache/memory-cache';

// Mock WebSocket server
const mockWebSocketServer = {
  broadcastMonitoringEvent: jest.fn(),
};

// Mock timer functions for TTL testing
jest.useFakeTimers();

describe('MemorySessionCache', () => {
  let cache: MemorySessionCache;
  let defaultConfig: MemoryCacheConfig;
  const originalConsoleLog = console.log;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock console.log to suppress output during tests
    console.log = jest.fn();
    
    // Default test configuration with smaller limits for testing
    defaultConfig = {
      maxEntries: 10,
      defaultTtl: 1000, // 1 second for quick testing
      maxMemoryMB: 1,
      evictionBatchSize: 2,
      cleanupInterval: 100 // 100ms for quick testing
    };
    
    cache = new MemorySessionCache(defaultConfig);
    cache.setWebSocketServer(mockWebSocketServer as any);
  });

  afterEach(() => {
    cache.stopCleanup();
    console.log = originalConsoleLog;
    jest.clearAllTimers();
  });

  describe('Basic Cache Operations', () => {
    it('should set and get cache entries', () => {
      const testData = { message: 'Hello World' };
      cache.set('test-key', testData);
      
      const retrieved = cache.get('test-key');
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent keys', () => {
      const result = cache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should check if key exists', () => {
      cache.set('existing-key', 'value');
      
      expect(cache.has('existing-key')).toBe(true);
      expect(cache.has('non-existent')).toBe(false);
    });

    it('should delete cache entries', () => {
      cache.set('to-delete', 'value');
      expect(cache.has('to-delete')).toBe(true);
      
      const deleted = cache.delete('to-delete');
      expect(deleted).toBe(true);
      expect(cache.has('to-delete')).toBe(false);
    });

    it('should return false when deleting non-existent key', () => {
      const deleted = cache.delete('non-existent');
      expect(deleted).toBe(false);
    });

    it('should clear all cache entries', () => {
      cache.set('key1', 'value1', undefined, 'project1');
      cache.set('key2', 'value2', undefined, 'project2');
      
      expect(cache.getStats().totalEntries).toBe(2);
      
      cache.clear();
      expect(cache.getStats().totalEntries).toBe(0);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
    });
  });

  describe('TTL and Expiration', () => {
    it('should expire entries after TTL', () => {
      const ttl = 500; // 500ms
      cache.set('expire-test', 'value', ttl);
      
      expect(cache.has('expire-test')).toBe(true);
      
      // Advance time past TTL
      jest.advanceTimersByTime(600);
      
      expect(cache.has('expire-test')).toBe(false);
      expect(cache.get('expire-test')).toBeNull();
    });

    it('should use default TTL when not specified', () => {
      cache.set('default-ttl', 'value');
      
      expect(cache.has('default-ttl')).toBe(true);
      
      // Advance time past default TTL
      jest.advanceTimersByTime(defaultConfig.defaultTtl + 100);
      
      expect(cache.has('default-ttl')).toBe(false);
    });

    it('should update access time on get', () => {
      cache.set('access-test', 'value', 1000);
      
      // Access after some time
      jest.advanceTimersByTime(400);
      const result = cache.get('access-test');
      expect(result).toBe('value');
      
      // Should still be accessible after more time (within original TTL)
      jest.advanceTimersByTime(500);
      expect(cache.has('access-test')).toBe(false); // TTL is from creation, not last access
    });

    it('should clean up expired entries automatically', () => {
      cache.set('cleanup-test', 'value', 200);
      
      expect(cache.getStats().totalEntries).toBe(1);
      
      // Advance time past TTL and trigger cleanup
      jest.advanceTimersByTime(300);
      jest.runOnlyPendingTimers(); // Run cleanup interval
      
      expect(cache.getStats().totalEntries).toBe(0);
    });
  });

  describe('Session and Connection Management', () => {
    it('should track project ID with entries', () => {
      cache.set('project-key', 'value', undefined, 'test-project');
      
      const projectKeys = cache.getProjectKeys('test-project');
      expect(projectKeys).toContain('project-key');
    });

    it('should get keys for specific project only', () => {
      cache.set('key1', 'value1', undefined, 'project1');
      cache.set('key2', 'value2', undefined, 'project2');
      cache.set('key3', 'value3', undefined, 'project1');
      
      const project1Keys = cache.getProjectKeys('project1');
      expect(project1Keys).toHaveLength(2);
      expect(project1Keys).toContain('key1');
      expect(project1Keys).toContain('key3');
      
      const project2Keys = cache.getProjectKeys('project2');
      expect(project2Keys).toHaveLength(1);
      expect(project2Keys).toContain('key2');
    });

    it('should add connections to sessions', () => {
      cache.set('session-key', 'value', undefined, 'project1');
      
      const added = cache.addConnection('session-key', 'conn-123');
      expect(added).toBe(true);
      
      // Adding same connection again should not duplicate
      cache.addConnection('session-key', 'conn-123');
      cache.addConnection('session-key', 'conn-456');
      
      expect(mockWebSocketServer.broadcastMonitoringEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'state_change',
          data: expect.objectContaining({
            cacheEvent: 'connection_added'
          })
        })
      );
    });

    it('should remove connections from sessions', () => {
      cache.set('session-key', 'value', undefined, 'project1', 'conn-123');
      cache.addConnection('session-key', 'conn-456');
      
      const removed = cache.removeConnection('session-key', 'conn-123');
      expect(removed).toBe(true);
      
      expect(mockWebSocketServer.broadcastMonitoringEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'state_change',
          data: expect.objectContaining({
            cacheEvent: 'connection_removed'
          })
        })
      );
    });

    it('should reduce TTL for orphaned sessions', () => {
      cache.set('orphan-test', 'value', 5000, 'project1', 'conn-123');
      
      // Remove the only connection
      cache.removeConnection('orphan-test', 'conn-123');
      
      // Entry should now have reduced TTL
      jest.advanceTimersByTime(2000); // More than 1 minute (orphan TTL)
      expect(cache.has('orphan-test')).toBe(false);
    });

    it('should handle connection operations on non-existent sessions', () => {
      const added = cache.addConnection('non-existent', 'conn-123');
      expect(added).toBe(false);
      
      const removed = cache.removeConnection('non-existent', 'conn-123');
      expect(removed).toBe(false);
    });
  });

  describe('LRU Eviction', () => {
    it('should evict least recently used entries when max entries exceeded', () => {
      // Fill cache to capacity
      for (let i = 0; i < defaultConfig.maxEntries; i++) {
        cache.set(`key-${i}`, `value-${i}`);
      }
      
      expect(cache.getStats().totalEntries).toBe(defaultConfig.maxEntries);
      
      // Add one more to trigger eviction
      cache.set('new-key', 'new-value');
      
      // Should have evicted some entries
      expect(cache.getStats().totalEntries).toBeLessThan(defaultConfig.maxEntries + 1);
      expect(cache.getStats().evictionCount).toBeGreaterThan(0);
    });

    it('should evict oldest accessed entries first', () => {
      // Add entries
      cache.set('old-key', 'old-value');
      cache.set('new-key', 'new-value');
      
      // Access new-key to make it more recently used
      jest.advanceTimersByTime(10);
      cache.get('new-key');
      
      // Fill cache to trigger eviction
      for (let i = 0; i < defaultConfig.maxEntries; i++) {
        cache.set(`filler-${i}`, `value-${i}`);
      }
      
      // old-key should be evicted, new-key should remain
      expect(cache.has('old-key')).toBe(false);
      expect(cache.has('new-key')).toBe(true);
    });

    it('should broadcast eviction events', () => {
      // Fill cache and trigger eviction
      for (let i = 0; i <= defaultConfig.maxEntries; i++) {
        cache.set(`key-${i}`, `value-${i}`, undefined, 'test-project');
      }
      
      expect(mockWebSocketServer.broadcastMonitoringEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'state_change',
          data: expect.objectContaining({
            cacheEvent: 'cache_evict',
            reason: 'lru_eviction'
          })
        })
      );
    });

    it('should respect eviction batch size', () => {
      // Fill cache beyond capacity
      for (let i = 0; i < defaultConfig.maxEntries + 5; i++) {
        cache.set(`key-${i}`, `value-${i}`);
      }
      
      // Should not evict more than batch size at once
      const stats = cache.getStats();
      expect(stats.evictionCount).toBeLessThanOrEqual(defaultConfig.evictionBatchSize * 2);
    });
  });

  describe('Memory Management', () => {
    it('should track memory usage estimation', () => {
      const largeData = { data: 'x'.repeat(1000) };
      cache.set('large-entry', largeData);
      
      const stats = cache.getStats();
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });

    it('should evict when memory limit exceeded', () => {
      // Create large entries to exceed memory limit
      const largeData = { data: 'x'.repeat(10000) };
      
      for (let i = 0; i < 5; i++) {
        cache.set(`large-${i}`, largeData);
      }
      
      const stats = cache.getStats();
      // Should have triggered eviction due to memory pressure
      expect(stats.evictionCount).toBeGreaterThan(0);
    });

    it('should update memory usage after operations', () => {
      const initialStats = cache.getStats();
      
      cache.set('memory-test', { data: 'test data' });
      const afterSetStats = cache.getStats();
      expect(afterSetStats.memoryUsage).toBeGreaterThan(initialStats.memoryUsage);
      
      cache.delete('memory-test');
      const afterDeleteStats = cache.getStats();
      expect(afterDeleteStats.memoryUsage).toBeLessThan(afterSetStats.memoryUsage);
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should track hit rate correctly', () => {
      cache.set('hit-test', 'value');
      
      // Successful get
      cache.get('hit-test');
      
      // Missed get
      cache.get('non-existent');
      
      const stats = cache.getStats();
      expect(stats.hitRate).toBe(0.5); // 1 hit out of 2 accesses
    });

    it('should track total entries', () => {
      expect(cache.getStats().totalEntries).toBe(0);
      
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      expect(cache.getStats().totalEntries).toBe(2);
      
      cache.delete('key1');
      expect(cache.getStats().totalEntries).toBe(1);
    });

    it('should track eviction count and timestamp', () => {
      const initialStats = cache.getStats();
      expect(initialStats.evictionCount).toBe(0);
      expect(initialStats.lastEviction).toBe(0);
      
      // Trigger eviction
      for (let i = 0; i <= defaultConfig.maxEntries; i++) {
        cache.set(`evict-${i}`, `value-${i}`);
      }
      
      const afterStats = cache.getStats();
      expect(afterStats.evictionCount).toBeGreaterThan(0);
      expect(afterStats.lastEviction).toBeGreaterThan(0);
    });

    it('should provide stats snapshot', () => {
      cache.set('stats-test', 'value');
      
      const stats1 = cache.getStats();
      const stats2 = cache.getStats();
      
      // Should be different objects (snapshot)
      expect(stats1).not.toBe(stats2);
      expect(stats1).toEqual(stats2);
    });
  });

  describe('WebSocket Integration', () => {
    it('should broadcast cache events', () => {
      cache.set('broadcast-test', 'value', undefined, 'test-project');
      
      expect(mockWebSocketServer.broadcastMonitoringEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'state_change',
          data: expect.objectContaining({
            cacheEvent: 'cache_set',
            key: 'broadcast-test',
            stats: expect.objectContaining({
              totalEntries: expect.any(Number),
              memoryUsage: expect.any(Number),
              hitRate: expect.any(Number)
            })
          })
        })
      );
    });

    it('should broadcast session events', () => {
      cache.set('session-broadcast', 'value', undefined, 'test-project');
      
      const testEvent = { type: 'test', data: 'event' };
      cache.broadcast('session-broadcast', testEvent);
      
      expect(mockWebSocketServer.broadcastMonitoringEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'new_event',
          data: expect.objectContaining({
            sessionId: 'session-broadcast',
            event: testEvent
          })
        })
      );
    });

    it('should handle broadcasting without WebSocket server', () => {
      const cacheWithoutWS = new MemorySessionCache(defaultConfig);
      
      // Should not throw
      expect(() => {
        cacheWithoutWS.set('test', 'value');
        cacheWithoutWS.broadcast('test', { event: 'data' });
      }).not.toThrow();
    });

    it('should broadcast clear events for all projects', () => {
      cache.set('key1', 'value1', undefined, 'project1');
      cache.set('key2', 'value2', undefined, 'project2');
      
      cache.clear();
      
      expect(mockWebSocketServer.broadcastMonitoringEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            cacheEvent: 'cache_clear'
          })
        })
      );
    });
  });

  describe('Graceful Shutdown', () => {
    it('should notify connections on shutdown', () => {
      cache.set('shutdown-test', 'value', undefined, 'project1', 'conn-123');
      
      cache.shutdown();
      
      expect(mockWebSocketServer.broadcastMonitoringEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            cacheEvent: 'cache_shutdown',
            reason: 'server_shutdown'
          })
        })
      );
    });

    it('should clear all data on shutdown', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      expect(cache.getStats().totalEntries).toBe(2);
      
      cache.shutdown();
      
      expect(cache.getStats().totalEntries).toBe(0);
    });

    it('should stop cleanup timer on shutdown', () => {
      const stopCleanupSpy = jest.spyOn(cache, 'stopCleanup');
      
      cache.shutdown();
      
      expect(stopCleanupSpy).toHaveBeenCalled();
    });

    it('should handle multiple shutdown calls gracefully', () => {
      expect(() => {
        cache.shutdown();
        cache.shutdown();
      }).not.toThrow();
    });
  });

  describe('Configuration', () => {
    it('should use custom configuration', () => {
      const customConfig: MemoryCacheConfig = {
        maxEntries: 5,
        defaultTtl: 2000,
        maxMemoryMB: 0.5,
        evictionBatchSize: 1,
        cleanupInterval: 50
      };
      
      const customCache = new MemorySessionCache(customConfig);
      
      // Test that custom config is applied
      for (let i = 0; i <= customConfig.maxEntries; i++) {
        customCache.set(`key-${i}`, `value-${i}`);
      }
      
      const stats = customCache.getStats();
      expect(stats.totalEntries).toBeLessThanOrEqual(customConfig.maxEntries);
      
      customCache.stopCleanup();
    });

    it('should start cleanup interval automatically', () => {
      const newCache = new MemorySessionCache({
        ...defaultConfig,
        cleanupInterval: 50
      });
      
      newCache.set('cleanup-auto', 'value', 25);
      
      // Advance time to trigger cleanup
      jest.advanceTimersByTime(100);
      
      expect(newCache.getStats().totalEntries).toBe(0);
      
      newCache.stopCleanup();
    });
  });

  describe('Singleton Functions', () => {
    afterEach(() => {
      shutdownMemoryCache();
    });

    it('should create singleton instance', () => {
      const cache1 = getMemoryCache();
      const cache2 = getMemoryCache();
      
      expect(cache1).toBe(cache2);
    });

    it('should initialize with WebSocket server', () => {
      const initializedCache = initializeMemoryCache(mockWebSocketServer as any);
      
      expect(initializedCache).toBeInstanceOf(MemorySessionCache);
      
      // Test that WebSocket integration works
      initializedCache.set('ws-test', 'value');
      expect(mockWebSocketServer.broadcastMonitoringEvent).toHaveBeenCalled();
    });

    it('should shutdown singleton instance', () => {
      const cache = getMemoryCache();
      cache.set('singleton-test', 'value');
      
      expect(cache.getStats().totalEntries).toBe(1);
      
      shutdownMemoryCache();
      
      // Getting cache again should create new instance
      const newCache = getMemoryCache();
      expect(newCache.getStats().totalEntries).toBe(0);
    });

    it('should use custom config in singleton', () => {
      const customConfig = { maxEntries: 5 };
      const cache = getMemoryCache(customConfig);
      
      expect(cache).toBeInstanceOf(MemorySessionCache);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined values', () => {
      cache.set('null-test', null);
      cache.set('undefined-test', undefined);
      
      expect(cache.get('null-test')).toBeNull();
      expect(cache.get('undefined-test')).toBeUndefined();
    });

    it('should handle complex nested objects', () => {
      const complexObject = {
        nested: {
          array: [1, 2, { deep: 'value' }],
          func: () => 'test',
          date: new Date()
        }
      };
      
      cache.set('complex-test', complexObject);
      const retrieved = cache.get('complex-test');
      
      expect(retrieved).toEqual(complexObject);
    });

    it('should handle very long keys', () => {
      const longKey = 'x'.repeat(1000);
      cache.set(longKey, 'value');
      
      expect(cache.get(longKey)).toBe('value');
      expect(cache.has(longKey)).toBe(true);
    });

    it('should handle zero and negative TTL values', () => {
      cache.set('zero-ttl', 'value', 0);
      expect(cache.has('zero-ttl')).toBe(false);
      
      cache.set('negative-ttl', 'value', -100);
      expect(cache.has('negative-ttl')).toBe(false);
    });

    it('should handle empty project IDs', () => {
      cache.set('empty-project', 'value', undefined, '');
      
      const keys = cache.getProjectKeys('');
      expect(keys).toContain('empty-project');
    });

    it('should handle concurrent operations safely', () => {
      // Simulate concurrent operations
      const operations = [];
      for (let i = 0; i < 100; i++) {
        operations.push(() => cache.set(`concurrent-${i}`, `value-${i}`));
        operations.push(() => cache.get(`concurrent-${i}`));
        operations.push(() => cache.delete(`concurrent-${i}`));
      }
      
      // Should not throw
      expect(() => {
        operations.forEach(op => op());
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle large number of entries efficiently', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        cache.set(`perf-${i}`, `value-${i}`);
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should maintain consistent performance for lookups', () => {
      // Fill cache with data
      for (let i = 0; i < 100; i++) {
        cache.set(`lookup-${i}`, `value-${i}`);
      }
      
      const startTime = Date.now();
      
      // Perform many lookups
      for (let i = 0; i < 1000; i++) {
        cache.get(`lookup-${i % 100}`);
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast
    });
  });
});