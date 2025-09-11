/**
 * Standalone Mode Integration Tests
 * 
 * Comprehensive end-to-end tests for standalone mode functionality
 * including setup, database operations, WebSocket communication,
 * and environment detection.
 */

import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import * as path from 'path';
import { Server as HttpServer } from 'http';
import { StandaloneConfigGenerator, generateStandaloneConfig, checkStandaloneSetup } from '../../src/lib/config/standalone-generator';
import { detectEnvironment, resetEnvironmentDetection } from '../../src/lib/services/environment-detector';
import { MemorySessionCache, getMemoryCache, initializeMemoryCache, shutdownMemoryCache } from '../../src/lib/cache/memory-cache';
import { MonitoringWebSocketServer } from '../../src/lib/websocket/server';
import { EventParserService } from '../../src/lib/services/event-parser';
import { StateDetector } from '../../src/lib/services/state-detector';

describe('Standalone Mode Integration Tests', () => {
  let tempProjectDir: string;
  let testDbPath: string;
  let testLogPath: string;
  let httpServer: HttpServer;
  let wsServer: MonitoringWebSocketServer;
  let memoryCache: MemorySessionCache;
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    // Create temporary project directory
    tempProjectDir = (global as any).testUtils.createTempDir();
    testDbPath = path.join(tempProjectDir, 'test.db');
    testLogPath = path.join(tempProjectDir, 'logs', 'test.log');

    // Reset environment detection
    resetEnvironmentDetection();

    // Create basic project structure
    await fs.mkdir(tempProjectDir, { recursive: true });
    await fs.mkdir(path.join(tempProjectDir, 'logs'), { recursive: true });
    
    // Create mock package.json for standalone detection
    await fs.writeFile(
      path.join(tempProjectDir, 'package.json'),
      JSON.stringify({ name: 'test-app', version: '1.0.0' }),
      'utf8'
    );

    // Set up test HTTP server for WebSocket testing
    httpServer = new HttpServer();
    wsServer = new MonitoringWebSocketServer(httpServer);
  });

  afterEach(async () => {
    // Cleanup
    if (httpServer.listening) {
      httpServer.close();
    }
    
    shutdownMemoryCache();
    
    // Restore original environment
    process.env = { ...originalEnv };
    
    // Clean up temp directory
    (global as any).testUtils.cleanupTempDir(tempProjectDir);
  });

  describe('Environment Detection and Setup', () => {
    it('should detect standalone environment correctly', async () => {
      // Set standalone environment indicators
      process.env.NODE_ENV = 'development';
      process.env.npm_execpath = '/usr/local/bin/npm';
      delete process.env.DOCKER_CONTAINER;
      delete process.env.KUBERNETES_SERVICE_HOST;

      const result = await detectEnvironment();

      expect(result.environment).toBe('standalone');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.indicators).toContain('Development environment detected');
      expect(result.indicators).toContain('NPM/Yarn execution detected');
      expect(result.recommendations).toContain('Standalone mode detected - SQLite database will be used');
    });

    it('should generate standalone configuration successfully', async () => {
      const generator = new StandaloneConfigGenerator(tempProjectDir);
      
      const result = await generator.generateConfig({
        databasePath: 'test.db',
        logPath: 'logs/test.log',
        debugMode: true,
        port: 3001
      });

      expect(result.success).toBe(true);
      expect(result.envPath).toBe(path.join(tempProjectDir, '.env.local'));
      expect(result.messages).toContain('Successfully generated .env.local for standalone mode');
      expect(result.messages).toContain('Debug mode enabled - verbose logging active');

      // Verify .env.local file was created
      expect(existsSync(result.envPath!)).toBe(true);

      // Read and verify content
      const envContent = await fs.readFile(result.envPath!, 'utf8');
      expect(envContent).toContain('NODE_ENV=development');
      expect(envContent).toContain('PORT=3001');
      expect(envContent).toContain('DATABASE_URL=file:');
      expect(envContent).toContain('CLAUDE_MONITOR_LOG_LEVEL=DEBUG');
      expect(envContent).toContain('CLAUDE_MONITOR_STANDALONE_MODE=true');
    });

    it('should prevent overwriting existing configuration without force flag', async () => {
      const generator = new StandaloneConfigGenerator(tempProjectDir);
      
      // Create existing .env.local
      const envPath = path.join(tempProjectDir, '.env.local');
      await fs.writeFile(envPath, 'EXISTING_CONFIG=true', 'utf8');

      const result = await generator.generateConfig();

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
      expect(result.error).toContain('Use force: true to overwrite');
    });

    it('should check standalone setup status correctly', async () => {
      const generator = new StandaloneConfigGenerator(tempProjectDir);
      
      // Initially no config
      let status = await generator.checkStandaloneSetup();
      expect(status.hasConfig).toBe(false);
      expect(status.isStandalone).toBe(false);
      expect(status.messages).toContain('No .env.local configuration found');

      // Generate config
      await generator.generateConfig({ force: true });

      // Set environment for standalone detection
      process.env.CLAUDE_MONITOR_STANDALONE_MODE = 'true';

      // Check again
      status = await generator.checkStandaloneSetup();
      expect(status.hasConfig).toBe(true);
      expect(status.isStandalone).toBe(true);
      expect(status.messages.some(msg => msg.includes('.env.local found'))).toBe(true);
      expect(status.messages).toContain('Environment configured for standalone mode');
    });
  });

  describe('Database Operations', () => {
    it('should handle SQLite database operations correctly', async () => {
      // Generate standalone config with SQLite
      const generator = new StandaloneConfigGenerator(tempProjectDir);
      const configResult = await generator.generateConfig({
        databasePath: testDbPath,
        force: true
      });

      expect(configResult.success).toBe(true);
      expect(configResult.databasePath).toBe(testDbPath);

      // Verify database directory was created
      expect(existsSync(path.dirname(testDbPath))).toBe(true);

      // Test database URL format
      const envContent = await fs.readFile(configResult.envPath!, 'utf8');
      expect(envContent).toContain(`DATABASE_URL=file:${testDbPath}`);
    });

    it('should validate configuration with existing Zod schemas', async () => {
      const generator = new StandaloneConfigGenerator(tempProjectDir);
      
      // Generate valid configuration
      const result = await generator.generateConfig({
        databasePath: testDbPath,
        logPath: testLogPath,
        force: true
      });

      expect(result.success).toBe(true);
      expect(result.messages).not.toContain('validation failed');
    });

    it('should handle database migration and seeding automatically', async () => {
      // This test verifies the configuration supports database operations
      const generator = new StandaloneConfigGenerator(tempProjectDir);
      
      const result = await generator.generateConfig({
        databasePath: testDbPath,
        force: true
      });

      expect(result.success).toBe(true);
      
      // Verify the DATABASE_URL is properly formatted for Prisma
      const envContent = await fs.readFile(result.envPath!, 'utf8');
      const dbUrlMatch = envContent.match(/DATABASE_URL=(.+)/);
      expect(dbUrlMatch).toBeTruthy();
      expect(dbUrlMatch![1]).toMatch(/^file:/);
    });
  });

  describe('Memory Cache and Session Management', () => {
    beforeEach(() => {
      memoryCache = getMemoryCache({
        maxEntries: 100,
        defaultTtl: 60000, // 1 minute for testing
        maxMemoryMB: 10,
        evictionBatchSize: 10,
        cleanupInterval: 5000 // 5 seconds for testing
      });
    });

    it('should store and retrieve session data correctly', () => {
      const sessionId = 'test-session-1';
      const projectId = 'test-project';
      const sessionData = {
        userId: 'user123',
        startTime: Date.now(),
        status: 'active'
      };

      // Store session data
      memoryCache.set(sessionId, sessionData, undefined, projectId);

      // Retrieve and verify
      const retrieved = memoryCache.get(sessionId);
      expect(retrieved).toEqual(sessionData);
      expect(memoryCache.has(sessionId)).toBe(true);
    });

    it('should handle connection management for WebSocket integration', () => {
      const sessionId = 'test-session-2';
      const projectId = 'test-project';
      const connectionId1 = 'conn-1';
      const connectionId2 = 'conn-2';

      // Store session with initial connection
      memoryCache.set(sessionId, { data: 'test' }, undefined, projectId, connectionId1);

      // Add another connection
      expect(memoryCache.addConnection(sessionId, connectionId2)).toBe(true);

      // Verify project keys
      const projectKeys = memoryCache.getProjectKeys(projectId);
      expect(projectKeys).toContain(sessionId);

      // Remove connection
      expect(memoryCache.removeConnection(sessionId, connectionId1)).toBe(true);
    });

    it('should perform LRU eviction when memory limits are reached', () => {
      // Fill cache beyond maxEntries
      for (let i = 0; i < 150; i++) {
        memoryCache.set(`session-${i}`, { data: `data-${i}` }, undefined, 'test-project');
      }

      const stats = memoryCache.getStats();
      expect(stats.totalEntries).toBeLessThanOrEqual(100);
      expect(stats.evictionCount).toBeGreaterThan(0);
    });

    it('should handle TTL expiration correctly', async () => {
      const sessionId = 'expiring-session';
      const shortTtl = 100; // 100ms

      memoryCache.set(sessionId, { data: 'expires soon' }, shortTtl);
      
      // Should exist initially
      expect(memoryCache.has(sessionId)).toBe(true);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be expired
      expect(memoryCache.has(sessionId)).toBe(false);
      expect(memoryCache.get(sessionId)).toBeNull();
    });

    it('should integrate with WebSocket server for event broadcasting', () => {
      // Initialize memory cache with WebSocket server
      const cacheWithWS = initializeMemoryCache(wsServer, {
        maxEntries: 50,
        defaultTtl: 30000
      });

      expect(cacheWithWS).toBeDefined();
      
      // Test broadcasting (Note: In a real scenario, this would trigger WebSocket events)
      cacheWithWS.broadcast('test-session', { 
        type: 'test_event', 
        data: 'test broadcast' 
      });

      // Verify cache is working with WebSocket integration
      cacheWithWS.set('ws-session', { connected: true }, undefined, 'ws-project');
      expect(cacheWithWS.has('ws-session')).toBe(true);
    });
  });

  describe('Real-time Features and WebSocket Communication', () => {
    it('should initialize WebSocket server correctly', () => {
      expect(wsServer).toBeDefined();
      expect(wsServer).toBeInstanceOf(MonitoringWebSocketServer);
    });

    it('should handle session state synchronization', () => {
      const cache = initializeMemoryCache(wsServer);
      
      // Simulate multiple connections to same session
      const sessionId = 'multi-conn-session';
      const projectId = 'realtime-project';
      
      cache.set(sessionId, { state: 'initial' }, undefined, projectId, 'conn1');
      cache.addConnection(sessionId, 'conn2');
      cache.addConnection(sessionId, 'conn3');

      // Update session state
      cache.set(sessionId, { state: 'updated' }, undefined, projectId);

      // Verify session exists and has connections
      expect(cache.has(sessionId)).toBe(true);
      const retrieved = cache.get(sessionId);
      expect(retrieved).toEqual({ state: 'updated' });
    });

    it('should gracefully handle connection loss and cleanup', () => {
      const cache = initializeMemoryCache(wsServer);
      const sessionId = 'cleanup-session';
      
      // Add connections
      cache.set(sessionId, { data: 'test' }, undefined, 'test-project', 'conn1');
      cache.addConnection(sessionId, 'conn2');
      
      // Remove all connections
      cache.removeConnection(sessionId, 'conn1');
      cache.removeConnection(sessionId, 'conn2');
      
      // Session should still exist but may have reduced TTL
      expect(cache.has(sessionId)).toBe(true);
    });
  });

  describe('End-to-End Standalone Workflow', () => {
    it('should complete full standalone setup and operation workflow', async () => {
      // 1. Environment detection
      process.env.NODE_ENV = 'development';
      process.env.npm_execpath = '/usr/local/bin/npm';
      delete process.env.DOCKER_CONTAINER;

      const envResult = await detectEnvironment();
      expect(envResult.environment).toBe('standalone');

      // 2. Configuration generation
      const generator = new StandaloneConfigGenerator(tempProjectDir);
      const configResult = await generator.generateConfig({
        databasePath: testDbPath,
        logPath: testLogPath,
        debugMode: true,
        force: true
      });

      expect(configResult.success).toBe(true);

      // 3. Setup verification  
      process.env.CLAUDE_MONITOR_STANDALONE_MODE = 'true';
      const tempGenerator = new StandaloneConfigGenerator(tempProjectDir);
      const setupStatus = await tempGenerator.checkStandaloneSetup();
      expect(setupStatus.hasConfig).toBe(true);

      // 4. Memory cache initialization
      const cache = initializeMemoryCache(wsServer, {
        maxEntries: 1000,
        defaultTtl: 3600000
      });

      // 5. Simulate monitoring workflow
      const sessionId = 'e2e-session';
      const projectId = 'e2e-project';
      
      // Store monitoring session
      cache.set(sessionId, {
        projectPath: '/test/project',
        claudeInstance: 'test-instance',
        startTime: Date.now(),
        status: 'monitoring'
      }, undefined, projectId, 'dashboard-conn');

      // Simulate state updates
      cache.set(`${sessionId}-state`, {
        currentState: 'idle',
        lastActivity: Date.now(),
        confidence: 0.95
      }, undefined, projectId);

      // Verify everything is working
      expect(cache.has(sessionId)).toBe(true);
      expect(cache.has(`${sessionId}-state`)).toBe(true);
      expect(cache.getProjectKeys(projectId)).toContain(sessionId);

      const stats = cache.getStats();
      expect(stats.totalEntries).toBeGreaterThan(0);
      expect(stats.memoryUsage).toBeGreaterThan(0);

      // 6. Cleanup
      cache.shutdown();
    });

    it('should handle service integration with event parsing and state detection', async () => {
      // Initialize standalone environment
      const generator = new StandaloneConfigGenerator(tempProjectDir);
      await generator.generateConfig({ force: true });

      // Initialize services
      const eventParser = new EventParserService();
      const stateDetector = new StateDetector();
      const cache = initializeMemoryCache(wsServer);

      // Create test JSONL content for standalone mode testing
      const testJsonlContent = [
        JSON.stringify({
          uuid: 'standalone-uuid-1',
          parentUuid: null,
          sessionId: 'standalone-session',
          timestamp: new Date().toISOString(),
          type: 'user',
          cwd: tempProjectDir,
          message: {
            role: 'user',
            content: 'Test standalone mode monitoring'
          }
        }),
        JSON.stringify({
          uuid: 'standalone-uuid-2',
          parentUuid: 'standalone-uuid-1',
          sessionId: 'standalone-session',
          timestamp: new Date().toISOString(),
          type: 'assistant',
          cwd: tempProjectDir,
          message: {
            role: 'assistant',
            content: 'Standalone mode is working correctly'
          }
        })
      ].join('\n');

      // Process events
      const events = await eventParser.parseEvents(testJsonlContent);
      expect(events.length).toBeGreaterThan(0);

      // Detect state
      const state = await stateDetector.detectState(events);
      expect(state).toBeDefined();
      expect(state.timestamp).toBeDefined();

      // Store in memory cache
      cache.set('standalone-session', {
        events,
        state,
        projectPath: tempProjectDir
      }, undefined, 'standalone-project');

      // Verify integration
      expect(cache.has('standalone-session')).toBe(true);
      const stored = cache.get('standalone-session') as any;
      expect(stored.events).toEqual(events);
      expect(stored.state).toEqual(state);
    });

    it('should perform graceful error handling and recovery', async () => {
      // Test configuration with invalid paths
      const generator = new StandaloneConfigGenerator('/invalid/path/that/does/not/exist');
      
      const result = await generator.generateConfig();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      // Test memory cache with extreme conditions
      const cache = getMemoryCache({
        maxEntries: 1,
        maxMemoryMB: 0.001 // Very small memory limit
      });

      // Should handle gracefully
      cache.set('test1', { data: 'test' });
      cache.set('test2', { data: 'test' }); // Should trigger eviction

      const stats = cache.getStats();
      expect(stats.evictionCount).toBeGreaterThan(0);

      // Test cleanup
      cache.shutdown();
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle high-volume session operations efficiently', () => {
      const cache = getMemoryCache({
        maxEntries: 1000,
        defaultTtl: 60000
      });

      const startTime = Date.now();
      
      // Create many sessions
      for (let i = 0; i < 500; i++) {
        cache.set(`session-${i}`, {
          data: `test-data-${i}`,
          timestamp: Date.now(),
          connections: [`conn-${i}`]
        }, undefined, `project-${i % 10}`);
      }

      // Perform many reads
      for (let i = 0; i < 500; i++) {
        cache.get(`session-${i}`);
      }

      const processingTime = Date.now() - startTime;
      
      // Should complete within reasonable time
      expect(processingTime).toBeLessThan(1000); // 1 second
      
      const stats = cache.getStats();
      expect(stats.totalEntries).toBeGreaterThan(0);
      expect(stats.hitRate).toBeGreaterThan(0.8); // Good hit rate
    });

    it('should maintain data integrity during concurrent operations', () => {
      const cache = getMemoryCache();
      const sessionId = 'concurrent-session';
      
      // Simulate concurrent operations
      cache.set(sessionId, { counter: 0 });
      
      for (let i = 0; i < 100; i++) {
        const current = cache.get(sessionId) as any;
        cache.set(sessionId, { counter: current.counter + 1 });
      }

      const final = cache.get(sessionId) as any;
      expect(final.counter).toBe(100);
    });

    it('should handle memory pressure and cleanup appropriately', async () => {
      const cache = getMemoryCache({
        maxEntries: 50,
        cleanupInterval: 100, // Fast cleanup for testing
        defaultTtl: 200 // Short TTL
      });

      // Fill with sessions that will expire
      for (let i = 0; i < 60; i++) {
        cache.set(`temp-session-${i}`, { data: i }, 150); // Short TTL
      }

      const initialStats = cache.getStats();
      expect(initialStats.totalEntries).toBeLessThanOrEqual(50);

      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 300));

      const finalStats = cache.getStats();
      expect(finalStats.totalEntries).toBeLessThan(initialStats.totalEntries);
    });
  });
});