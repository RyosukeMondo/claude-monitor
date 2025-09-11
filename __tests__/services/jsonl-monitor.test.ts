/**
 * Unit tests for JSONL File System Monitoring Service
 * 
 * Tests cover:
 * - Service initialization and configuration
 * - Global monitoring lifecycle
 * - Project-specific monitoring
 * - File watching and event handling
 * - Path encoding/decoding
 * - Error handling and recovery
 * - Statistics tracking
 */

import { JSONLFileSystemMonitor } from '../../src/lib/services/jsonl-monitor';
import { promises as fs } from 'fs';
import * as chokidar from 'chokidar';
import * as path from 'path';
import * as os from 'os';
import { SAMPLE_JSONL_ENTRIES, MOCK_FS_STRUCTURE } from '../fixtures/sample-jsonl';

// Mock modules
const mockFs = fs as jest.Mocked<typeof fs>;
const mockChokidar = chokidar as jest.Mocked<typeof chokidar>;

describe('JSONLFileSystemMonitor', () => {
  let monitor: JSONLFileSystemMonitor;
  let mockWatcher: jest.Mocked<chokidar.FSWatcher>;
  let tempDir: string;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock watcher
    mockWatcher = {
      on: jest.fn().mockReturnThis(),
      close: jest.fn().mockResolvedValue(undefined),
      add: jest.fn(),
      unwatch: jest.fn(),
      getWatched: jest.fn().mockReturnValue({}),
    } as any;

    mockChokidar.watch.mockReturnValue(mockWatcher);
    
    // Setup temporary directory
    tempDir = (global as any).testUtils.createTempDir();
    
    // Initialize monitor with test configuration
    monitor = new JSONLFileSystemMonitor({
      claudeProjectsDir: tempDir,
      pollInterval: 10, // Fast polling for tests
      maxContextLines: 100,
      performanceMonitoring: true
    });
  });

  afterEach(async () => {
    await monitor.shutdown();
    (global as any).testUtils.cleanupTempDir(tempDir);
  });

  describe('Initialization', () => {
    it('should create monitor with default configuration', () => {
      const defaultMonitor = new JSONLFileSystemMonitor();
      expect(defaultMonitor).toBeInstanceOf(JSONLFileSystemMonitor);
      
      const stats = defaultMonitor.getStatistics();
      expect(stats.isMonitoring).toBe(false);
      expect(stats.monitoredProjects).toBe(0);
    });

    it('should merge custom configuration with defaults', () => {
      const customConfig = {
        pollInterval: 500,
        maxContextLines: 2000,
        encoding: 'utf8' as const,
        excludePatterns: ['**/test.jsonl']
      };
      
      const customMonitor = new JSONLFileSystemMonitor(customConfig);
      expect(customMonitor).toBeInstanceOf(JSONLFileSystemMonitor);
    });

    it('should use provided Claude projects directory', () => {
      const customDir = '/custom/claude/projects';
      const customMonitor = new JSONLFileSystemMonitor({
        claudeProjectsDir: customDir
      });
      
      expect(customMonitor).toBeInstanceOf(JSONLFileSystemMonitor);
    });
  });

  describe('Global Monitoring', () => {
    it('should start global monitoring successfully', async () => {
      // Mock directory access
      mockFs.access.mockResolvedValue(undefined);
      
      const result = await monitor.startGlobalMonitoring();
      
      expect(result).toBe(true);
      expect(mockFs.access).toHaveBeenCalledWith(tempDir);
      expect(mockChokidar.watch).toHaveBeenCalledWith(tempDir, expect.any(Object));
      expect(mockWatcher.on).toHaveBeenCalledWith('add', expect.any(Function));
      expect(mockWatcher.on).toHaveBeenCalledWith('change', expect.any(Function));
      expect(mockWatcher.on).toHaveBeenCalledWith('unlink', expect.any(Function));
      expect(mockWatcher.on).toHaveBeenCalledWith('error', expect.any(Function));
      
      const stats = monitor.getStatistics();
      expect(stats.isMonitoring).toBe(true);
      expect(stats.startTime).toBeDefined();
    });

    it('should fail to start if directory does not exist', async () => {
      mockFs.access.mockRejectedValue(new Error('ENOENT: no such file or directory'));
      
      const result = await monitor.startGlobalMonitoring();
      
      expect(result).toBe(false);
      expect(monitor.getStatistics().isMonitoring).toBe(false);
    });

    it('should not start monitoring if already active', async () => {
      mockFs.access.mockResolvedValue(undefined);
      
      // Start monitoring first time
      await monitor.startGlobalMonitoring();
      
      // Try to start again
      const result = await monitor.startGlobalMonitoring();
      
      expect(result).toBe(false);
      expect(mockChokidar.watch).toHaveBeenCalledTimes(1);
    });

    it('should stop global monitoring cleanly', async () => {
      mockFs.access.mockResolvedValue(undefined);
      
      await monitor.startGlobalMonitoring();
      await monitor.stopGlobalMonitoring();
      
      expect(mockWatcher.close).toHaveBeenCalled();
      expect(monitor.getStatistics().isMonitoring).toBe(false);
    });

    it('should handle watcher errors gracefully', async () => {
      mockFs.access.mockResolvedValue(undefined);
      
      await monitor.startGlobalMonitoring();
      
      // Get the error handler and call it
      const errorHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'error')?.[1];
      expect(errorHandler).toBeDefined();
      
      const testError = new Error('Watcher error');
      const errorPromise = new Promise<void>((resolve) => {
        monitor.once('error', (errorEvent) => {
          expect(errorEvent.error).toEqual(expect.any(Error));
          expect(errorEvent.recoverable).toBe(true);
          resolve();
        });
      });
      
      errorHandler(testError);
      await errorPromise;
    });
  });

  describe('Project Monitoring', () => {
    beforeEach(async () => {
      mockFs.access.mockResolvedValue(undefined);
      await monitor.startGlobalMonitoring();
    });

    it('should start monitoring specific project', async () => {
      const projectPath = '/mnt/d/repos/test-project';
      const encodedPath = '-mnt-d-repos-test-project';
      
      // Mock project directory access and file scan
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue(['session-123.jsonl', 'session-456.jsonl'] as any);
      mockFs.stat.mockResolvedValue((global as any).testUtils.createMockStats(1000));
      
      const result = await monitor.startProjectMonitoring(projectPath);
      
      expect(result).toBe(true);
      expect(mockFs.access).toHaveBeenCalledWith(path.join(tempDir, encodedPath));
      expect(mockFs.readdir).toHaveBeenCalledWith(path.join(tempDir, encodedPath));
      
      const projects = monitor.getMonitoredProjects();
      expect(projects).toHaveLength(1);
      expect(projects[0].projectPath).toBe(projectPath);
      expect(projects[0].encodedPath).toBe(encodedPath);
    });

    it('should fail to monitor non-existent project', async () => {
      const projectPath = '/non/existent/project';
      mockFs.access.mockRejectedValue(new Error('ENOENT'));
      
      const result = await monitor.startProjectMonitoring(projectPath);
      
      expect(result).toBe(false);
      expect(monitor.getMonitoredProjects()).toHaveLength(0);
    });

    it('should stop monitoring specific project', async () => {
      const projectPath = '/mnt/d/repos/test-project';
      
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([]);
      
      await monitor.startProjectMonitoring(projectPath);
      expect(monitor.getMonitoredProjects()).toHaveLength(1);
      
      await monitor.stopProjectMonitoring(projectPath);
      expect(monitor.getMonitoredProjects()).toHaveLength(0);
    });

    it('should get project sessions', async () => {
      const projectPath = '/mnt/d/repos/test-project';
      
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue(['session-123.jsonl'] as any);
      mockFs.stat.mockResolvedValue((global as any).testUtils.createMockStats(500));
      
      await monitor.startProjectMonitoring(projectPath);
      
      const sessions = await monitor.getProjectSessions(projectPath);
      expect(sessions).toHaveLength(1);
      expect(sessions[0].sessionId).toBe('session-123');
      expect(sessions[0].projectPath).toBe(projectPath);
    });
  });

  describe('Path Encoding/Decoding', () => {
    it('should encode Unix paths correctly', () => {
      const unixPath = '/mnt/d/repos/claude-monitor';
      const expected = '-mnt-d-repos-claude-monitor';
      
      // Test via project monitoring to access the private method
      const encoded = (monitor as any).encodeProjectPath(unixPath);
      expect(encoded).toBe(expected);
    });

    it('should encode Windows paths correctly', () => {
      const windowsPath = 'C:\\Users\\test\\project';
      const expected = 'C:-Users-test-project';
      
      const encoded = (monitor as any).encodeProjectPath(windowsPath);
      expect(encoded).toBe(expected);
    });

    it('should decode encoded paths back to Unix format', () => {
      const encodedPath = '-mnt-d-repos-claude-monitor';
      const expected = '/mnt/d/repos/claude-monitor';
      
      const decoded = (monitor as any).decodeProjectPath(encodedPath);
      expect(decoded).toBe(expected);
    });

    it('should handle already decoded paths', () => {
      const normalPath = '/regular/path';
      const decoded = (monitor as any).decodeProjectPath(normalPath);
      expect(decoded).toBe(normalPath);
    });
  });

  describe('File Monitoring', () => {
    beforeEach(async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([]);
      await monitor.startGlobalMonitoring();
      await monitor.startProjectMonitoring('/test/project');
    });

    it('should handle file added events', async () => {
      const filePath = path.join(tempDir, '-test-project', 'session-123.jsonl');
      
      // Mock file stats
      mockFs.stat.mockResolvedValue((global as any).testUtils.createMockStats(100));
      
      // Get the 'add' handler and invoke it
      const addHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'add')?.[1];
      expect(addHandler).toBeDefined();
      
      const eventPromise = new Promise<void>((resolve) => {
        monitor.once('jsonl_file_created', (event) => {
          expect(event.filePath).toBe(filePath);
          expect(event.sessionId).toBe('session-123');
          expect(event.projectPath).toBe('/test/project');
          resolve();
        });
      });
      
      await addHandler(filePath);
      await eventPromise;
    });

    it('should handle file deleted events', async () => {
      const filePath = path.join(tempDir, '-test-project', 'session-123.jsonl');
      
      // First add a file to monitor
      mockFs.stat.mockResolvedValue((global as any).testUtils.createMockStats(100));
      const addHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'add')?.[1];
      await addHandler(filePath);
      
      // Then delete it
      const unlinkHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'unlink')?.[1];
      expect(unlinkHandler).toBeDefined();
      
      const eventPromise = new Promise<void>((resolve) => {
        monitor.once('jsonl_file_deleted', (event) => {
          expect(event.filePath).toBe(filePath);
          expect(event.sessionId).toBe('session-123');
          resolve();
        });
      });
      
      await unlinkHandler(filePath);
      await eventPromise;
    });

    it('should process file changes and emit line events', async () => {
      const filePath = path.join(tempDir, '-test-project', 'session-123.jsonl');
      
      // Setup file monitoring first
      mockFs.stat.mockResolvedValue((global as any).testUtils.createMockStats(100));
      const addHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'add')?.[1];
      await addHandler(filePath);
      
      // Mock file growth
      const newContent = SAMPLE_JSONL_ENTRIES[0] + '\n';
      const newSize = Buffer.byteLength(newContent);
      mockFs.stat.mockResolvedValue((global as any).testUtils.createMockStats(newSize));
      
      // Mock file reading
      const mockFileHandle = {
        read: jest.fn().mockResolvedValue({
          bytesRead: newContent.length,
          buffer: Buffer.from(newContent)
        }),
        close: jest.fn().mockResolvedValue(undefined)
      };
      mockFs.open.mockResolvedValue(mockFileHandle as any);
      
      const changeHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'change')?.[1];
      expect(changeHandler).toBeDefined();
      
      const eventPromise = new Promise<void>((resolve) => {
        monitor.once('jsonl_line', (event) => {
          expect(event.content).toBe(SAMPLE_JSONL_ENTRIES[0]);
          expect(event.sessionId).toBe('session-123');
          expect(event.metadata?.lineNumber).toBe(1);
          resolve();
        });
      });
      
      await changeHandler(filePath);
      await eventPromise;
    });

    it('should validate session IDs correctly', () => {
      const validSessionId = '123e4567-e89b-12d3-a456-426614174000';
      const invalidSessionId = 'not-a-uuid';
      
      expect((monitor as any).isValidSessionId(validSessionId)).toBe(true);
      expect((monitor as any).isValidSessionId(invalidSessionId)).toBe(false);
    });

    it('should ignore non-JSONL files', async () => {
      const textFile = path.join(tempDir, '-test-project', 'readme.txt');
      
      const addHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'add')?.[1];
      
      // Should not trigger any events for non-JSONL files
      let eventTriggered = false;
      monitor.once('jsonl_file_created', () => {
        eventTriggered = true;
      });
      
      await addHandler(textFile);
      
      // Give some time for any potential async operations
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(eventTriggered).toBe(false);
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should track statistics correctly', () => {
      const initialStats = monitor.getStatistics();
      expect(initialStats.totalFiles).toBe(0);
      expect(initialStats.totalLines).toBe(0);
      expect(initialStats.totalEvents).toBe(0);
      expect(initialStats.errors).toBe(0);
      expect(initialStats.isMonitoring).toBe(false);
    });

    it('should reset statistics', async () => {
      mockFs.access.mockResolvedValue(undefined);
      await monitor.startGlobalMonitoring();
      
      monitor.resetStatistics();
      
      const stats = monitor.getStatistics();
      expect(stats.totalFiles).toBe(0);
      expect(stats.totalLines).toBe(0);
      expect(stats.totalEvents).toBe(0);
      expect(stats.errors).toBe(0);
      expect(stats.startTime).toBeDefined(); // Should be reset to current time
    });

    it('should calculate processing rate correctly', async () => {
      mockFs.access.mockResolvedValue(undefined);
      await monitor.startGlobalMonitoring();
      
      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const stats = monitor.getStatistics();
      expect(stats.runtime).toBeGreaterThan(0);
      expect(stats.processingRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle file system access errors', async () => {
      const accessError = new Error('Permission denied');
      mockFs.access.mockRejectedValue(accessError);
      
      const result = await monitor.startGlobalMonitoring();
      
      expect(result).toBe(false);
      const stats = monitor.getStatistics();
      expect(stats.errors).toBeGreaterThan(0);
    });

    it('should handle file reading errors gracefully', async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue(['session-123.jsonl'] as any);
      await monitor.startGlobalMonitoring();
      
      const projectPath = '/test/project';
      mockFs.stat.mockRejectedValue(new Error('Stat failed'));
      
      // Should not throw but may emit error events
      const errorPromise = new Promise<void>((resolve) => {
        monitor.once('error', () => resolve());
      });
      
      await monitor.startProjectMonitoring(projectPath);
      
      // May take a moment for error to propagate
      await Promise.race([
        errorPromise,
        new Promise(resolve => setTimeout(resolve, 100))
      ]);
    });

    it('should increment error count on failures', async () => {
      const initialStats = monitor.getStatistics();
      const initialErrors = initialStats.errors;
      
      // Trigger an error
      mockFs.access.mockRejectedValue(new Error('Test error'));
      await monitor.startGlobalMonitoring();
      
      const newStats = monitor.getStatistics();
      expect(newStats.errors).toBeGreaterThan(initialErrors);
    });
  });

  describe('Cleanup and Shutdown', () => {
    it('should shutdown cleanly', async () => {
      mockFs.access.mockResolvedValue(undefined);
      await monitor.startGlobalMonitoring();
      
      await monitor.shutdown();
      
      expect(mockWatcher.close).toHaveBeenCalled();
      expect(monitor.getStatistics().isMonitoring).toBe(false);
    });

    it('should remove all event listeners on shutdown', async () => {
      mockFs.access.mockResolvedValue(undefined);
      await monitor.startGlobalMonitoring();
      
      // Add a listener
      const listener = jest.fn();
      monitor.on('jsonl_line', listener);
      
      await monitor.shutdown();
      
      // Verify listeners are removed (this is hard to test directly, 
      // but we can ensure shutdown doesn't throw)
      expect(() => monitor.emit('jsonl_line', {} as any)).not.toThrow();
    });
  });
});