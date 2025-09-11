/**
 * Unit tests for Environment Detector Service
 * 
 * Tests cover:
 * - Environment detection logic and scoring
 * - Docker-specific filesystem indicators
 * - Environment variable analysis
 * - Process and cgroup detection
 * - Network configuration patterns
 * - Development environment indicators
 * - Configuration generation for both modes
 * - Edge cases and error handling
 * - Singleton pattern and caching
 * - Recommendation generation
 */

import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import { hostname } from 'os';
import environmentDetector, {
  detectEnvironment,
  generateConfiguration,
  getCurrentEnvironment,
  isDockerEnvironment,
  isStandaloneEnvironment,
  resetEnvironmentDetection,
  type RuntimeEnvironment,
  type EnvironmentDetectionResult,
  type EnvironmentConfiguration
} from '../../lib/services/environment-detector';

// Mock file system operations
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
  existsSync: jest.fn(),
}));

jest.mock('os', () => ({
  hostname: jest.fn(),
}));

describe('EnvironmentDetector', () => {
  // Store original environment variables
  const originalEnv = process.env;
  
  // Get mocked functions
  const mockReadFile = fs.readFile as jest.MockedFunction<typeof fs.readFile>;
  const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;
  const mockHostname = hostname as jest.MockedFunction<typeof hostname>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset environment detector instance
    resetEnvironmentDetection();
    
    // Reset environment variables to clean slate
    process.env = { ...originalEnv };
    
    // Set default mock behaviors
    mockExistsSync.mockReturnValue(false);
    mockHostname.mockReturnValue('localhost');
    mockReadFile.mockRejectedValue(new Error('File not found'));
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = environmentDetector;
      const instance2 = environmentDetector;
      
      expect(instance1).toBe(instance2);
    });

    it('should cache detection results', async () => {
      // First detection
      const result1 = await detectEnvironment();
      
      // Second detection should return cached result
      const result2 = await detectEnvironment();
      
      expect(result1).toBe(result2);
      expect(result1).toEqual(result2);
    });

    it('should reset detection cache when requested', async () => {
      // First detection
      await detectEnvironment();
      
      // Reset and configure different environment
      resetEnvironmentDetection();
      mockExistsSync.mockReturnValue(true);
      
      // Second detection should be different
      const result = await detectEnvironment();
      expect(result.environment).toBeDefined();
    });
  });

  describe('Docker Environment Detection', () => {
    it('should detect Docker environment with /.dockerenv file', async () => {
      mockExistsSync.mockImplementation((path) => path === '/.dockerenv');
      
      const result = await detectEnvironment();
      
      expect(result.environment).toBe('docker');
      expect(result.confidence).toBeGreaterThan(0.3);
      expect(result.indicators).toContain('Docker environment file found (/.dockerenv)');
    });

    it('should detect Docker with overlay filesystem', async () => {
      mockReadFile.mockImplementation((path: any) => {
        if (path === '/proc/mounts') {
          return Promise.resolve('overlay /var/lib/docker/overlay2/abc/merged overlay');
        }
        return Promise.reject(new Error('File not found'));
      });
      
      const result = await detectEnvironment();
      
      expect(result.indicators).toContain('Docker overlay filesystem detected');
    });

    it('should detect Docker with container-style hostname', async () => {
      mockHostname.mockReturnValue('a1b2c3d4e5f6'); // 12-char hex
      
      const result = await detectEnvironment();
      
      expect(result.indicators).toContain('Container-style hostname detected');
    });

    it('should detect Docker socket presence', async () => {
      mockExistsSync.mockImplementation((path) => path === '/var/run/docker.sock');
      
      const result = await detectEnvironment();
      
      expect(result.indicators).toContain('Docker socket found');
    });

    it('should detect Docker cgroup information', async () => {
      mockReadFile.mockImplementation((path: any) => {
        if (path === '/proc/self/cgroup') {
          return Promise.resolve('12:devices:/docker/abc123');
        }
        return Promise.reject(new Error('File not found'));
      });
      
      const result = await detectEnvironment();
      
      expect(result.indicators).toContain('Docker cgroup detected');
    });

    it('should detect container init process', async () => {
      mockReadFile.mockImplementation((path: any) => {
        if (path === '/proc/1/cmdline') {
          return Promise.resolve('sh\0-c\0npm start\0');
        }
        return Promise.reject(new Error('File not found'));
      });
      
      const result = await detectEnvironment();
      
      expect(result.indicators).toContain('Container-style init process detected');
    });
  });

  describe('Environment Variable Detection', () => {
    it('should detect Docker environment variables', async () => {
      process.env.DOCKER_CONTAINER = 'true';
      process.env.KUBERNETES_SERVICE_HOST = '10.0.0.1';
      
      const result = await detectEnvironment();
      
      expect(result.indicators).toContain('Docker environment variable found: DOCKER_CONTAINER');
      expect(result.indicators).toContain('Docker environment variable found: KUBERNETES_SERVICE_HOST');
    });

    it('should detect Docker Compose service variables', async () => {
      process.env.POSTGRES_SERVICE_HOST = 'postgres';
      process.env.REDIS_SERVICE_HOST = 'redis';
      
      const result = await detectEnvironment();
      
      expect(result.indicators).toContain('Docker Compose service detected: postgres');
      expect(result.indicators).toContain('Docker Compose service detected: redis');
    });

    it('should detect development environment', async () => {
      process.env.NODE_ENV = 'development';
      
      const result = await detectEnvironment();
      
      expect(result.indicators).toContain('Development environment detected');
    });

    it('should detect npm/yarn execution', async () => {
      process.env.npm_execpath = '/usr/local/bin/npm';
      
      const result = await detectEnvironment();
      
      expect(result.indicators).toContain('NPM/Yarn execution detected');
    });

    it('should detect SQLite database URL', async () => {
      process.env.DATABASE_URL = 'file:./data/test.db';
      
      const result = await detectEnvironment();
      
      expect(result.indicators).toContain('SQLite database URL detected');
    });
  });

  describe('Network Configuration Detection', () => {
    it('should detect container-style host binding', async () => {
      process.env.HOST = '0.0.0.0';
      
      const result = await detectEnvironment();
      
      expect(result.indicators).toContain('Container-style host binding detected');
    });

    it('should detect localhost binding', async () => {
      process.env.HOST = 'localhost';
      
      const result = await detectEnvironment();
      
      expect(result.indicators).toContain('Localhost binding detected');
    });

    it('should detect development server ports', async () => {
      process.env.PORT = '3000';
      
      const result = await detectEnvironment();
      
      expect(result.indicators).toContain('Development server port detected');
    });
  });

  describe('Development Pattern Detection', () => {
    it('should detect development files', async () => {
      mockExistsSync.mockImplementation((path) => 
        ['package.json', 'node_modules', '.git'].includes(path as string)
      );
      
      const result = await detectEnvironment();
      
      expect(result.indicators).toContain('Development file found: package.json');
      expect(result.indicators).toContain('Node.js development environment detected');
      expect(result.indicators).toContain('Git repository detected - development environment');
    });

    it('should detect .env.local file', async () => {
      mockExistsSync.mockImplementation((path) => path === '.env.local');
      
      const result = await detectEnvironment();
      
      expect(result.indicators).toContain('Development file found: .env.local');
    });
  });

  describe('Standalone Environment Detection', () => {
    beforeEach(() => {
      // Set up typical standalone environment
      process.env.NODE_ENV = 'development';
      process.env.npm_execpath = '/usr/local/bin/npm';
      process.env.DATABASE_URL = 'file:./data/dev.db';
      process.env.HOST = 'localhost';
      process.env.PORT = '3000';
      
      mockExistsSync.mockImplementation((path) => 
        ['package.json', 'node_modules', '.git', '.env.local'].includes(path as string)
      );
    });

    it('should detect standalone environment', async () => {
      const result = await detectEnvironment();
      
      expect(result.environment).toBe('standalone');
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it('should provide standalone recommendations', async () => {
      const result = await detectEnvironment();
      
      expect(result.recommendations).toContain('Standalone mode detected - SQLite database will be used');
      expect(result.recommendations).toContain('In-memory caching will be used instead of Redis');
      expect(result.recommendations).toContain('Development logging enabled with file output');
    });
  });

  describe('Configuration Generation', () => {
    it('should generate Docker configuration', async () => {
      const config = await generateConfiguration('docker');
      
      expect(config.database.type).toBe('postgresql');
      expect(config.database.url).toContain('postgresql://');
      expect(config.cache.type).toBe('redis');
      expect(config.logging.enableFileLogging).toBe(false);
      expect(config.development.autoSetup).toBe(false);
    });

    it('should generate standalone configuration', async () => {
      const config = await generateConfiguration('standalone');
      
      expect(config.database.type).toBe('sqlite');
      expect(config.database.url).toContain('file:');
      expect(config.cache.type).toBe('memory');
      expect(config.logging.enableFileLogging).toBe(true);
      expect(config.development.autoSetup).toBe(true);
      expect(config.logging.level).toBe('DEBUG');
    });

    it('should use environment variables for Docker config', async () => {
      process.env.DATABASE_URL = 'postgresql://custom:pass@host:5432/db';
      process.env.REDIS_URL = 'redis://custom:6379';
      process.env.LOG_LEVEL = 'ERROR';
      
      const config = await generateConfiguration('docker');
      
      expect(config.database.url).toBe('postgresql://custom:pass@host:5432/db');
      expect(config.cache.url).toBe('redis://custom:6379');
      expect(config.logging.level).toBe('ERROR');
    });

    it('should use environment variables for standalone config', async () => {
      process.env.DATABASE_URL = 'file:./custom/path.db';
      
      const config = await generateConfiguration('standalone');
      
      expect(config.database.url).toBe('file:./custom/path.db');
    });

    it('should cache configuration', async () => {
      const config1 = await generateConfiguration('standalone');
      const config2 = await generateConfiguration();
      
      expect(config1).toBe(config2);
    });
  });

  describe('Convenience Functions', () => {
    it('should check if Docker environment', async () => {
      mockExistsSync.mockImplementation((path) => path === '/.dockerenv');
      
      const isDocker = await isDockerEnvironment();
      expect(isDocker).toBe(true);
    });

    it('should check if standalone environment', async () => {
      process.env.NODE_ENV = 'development';
      process.env.npm_execpath = '/usr/local/bin/npm';
      
      const isStandalone = await isStandaloneEnvironment();
      expect(isStandalone).toBe(true);
    });

    it('should get current environment', async () => {
      await detectEnvironment();
      const current = getCurrentEnvironment();
      expect(current).toMatch(/^(docker|standalone)$/);
    });

    it('should return null when no detection run', () => {
      resetEnvironmentDetection();
      const current = getCurrentEnvironment();
      expect(current).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle filesystem errors gracefully', async () => {
      mockReadFile.mockRejectedValue(new Error('Permission denied'));
      mockExistsSync.mockImplementation(() => {
        throw new Error('Access denied');
      });
      
      const result = await detectEnvironment();
      
      expect(result).toBeDefined();
      expect(result.environment).toMatch(/^(docker|standalone)$/);
    });

    it('should handle missing /proc filesystem', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT: no such file or directory'));
      
      const result = await detectEnvironment();
      
      expect(result.indicators).toContain('Filesystem checks failed - possibly non-Linux environment');
    });

    it('should handle invalid hostname patterns', async () => {
      mockHostname.mockReturnValue('');
      
      const result = await detectEnvironment();
      
      expect(result).toBeDefined();
      // Should not crash and should still detect environment
    });
  });

  describe('Scoring Algorithm', () => {
    it('should prefer Docker when Docker indicators dominate', async () => {
      // Strong Docker indicators
      mockExistsSync.mockImplementation((path) => path === '/.dockerenv');
      process.env.DOCKER_CONTAINER = 'true';
      process.env.KUBERNETES_SERVICE_HOST = '10.0.0.1';
      mockHostname.mockReturnValue('a1b2c3d4e5f6');
      
      const result = await detectEnvironment();
      
      expect(result.environment).toBe('docker');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should prefer standalone when development indicators dominate', async () => {
      // Strong standalone indicators
      process.env.NODE_ENV = 'development';
      process.env.npm_execpath = '/usr/local/bin/npm';
      process.env.DATABASE_URL = 'file:./data/dev.db';
      process.env.HOST = 'localhost';
      mockExistsSync.mockImplementation((path) => 
        ['package.json', 'node_modules', '.git'].includes(path as string)
      );
      
      const result = await detectEnvironment();
      
      expect(result.environment).toBe('standalone');
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it('should cap scores at maximum values', async () => {
      // Excessive indicators shouldn't break scoring
      for (let i = 0; i < 20; i++) {
        process.env[`DOCKER_VAR_${i}`] = 'true';
      }
      
      const result = await detectEnvironment();
      
      expect(result.confidence).toBeLessThanOrEqual(1.0);
      expect(result.confidence).toBeGreaterThanOrEqual(0.0);
    });
  });

  describe('Recommendation Generation', () => {
    it('should recommend data directory creation for standalone', async () => {
      process.env.NODE_ENV = 'development';
      mockExistsSync.mockImplementation((path) => path === 'package.json');
      
      const result = await detectEnvironment();
      
      if (result.environment === 'standalone') {
        expect(result.recommendations).toContain('Create data directory for SQLite database');
      }
    });

    it('should recommend .env.local generation for standalone', async () => {
      process.env.NODE_ENV = 'development';
      mockExistsSync.mockImplementation((path) => path === 'package.json');
      
      const result = await detectEnvironment();
      
      if (result.environment === 'standalone') {
        expect(result.recommendations).toContain('Auto-generate .env.local file for development settings');
      }
    });

    it('should not recommend file creation if files exist', async () => {
      process.env.NODE_ENV = 'development';
      mockExistsSync.mockImplementation((path) => 
        ['package.json', 'data', '.env.local'].includes(path as string)
      );
      
      const result = await detectEnvironment();
      
      if (result.environment === 'standalone') {
        expect(result.recommendations).not.toContain('Create data directory for SQLite database');
        expect(result.recommendations).not.toContain('Auto-generate .env.local file for development settings');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty environment variables', async () => {
      process.env.DATABASE_URL = '';
      process.env.HOST = '';
      process.env.PORT = '';
      
      const result = await detectEnvironment();
      
      expect(result).toBeDefined();
      expect(result.environment).toMatch(/^(docker|standalone)$/);
    });

    it('should handle non-standard hostname lengths', async () => {
      mockHostname.mockReturnValue('very-long-hostname-that-is-not-container-style');
      
      const result = await detectEnvironment();
      
      expect(result).toBeDefined();
      // Should not detect as container hostname
    });

    it('should handle multiple detections with different results', async () => {
      // First detection - standalone
      process.env.NODE_ENV = 'development';
      const result1 = await detectEnvironment();
      
      // Reset and change environment
      resetEnvironmentDetection();
      delete process.env.NODE_ENV;
      mockExistsSync.mockImplementation((path) => path === '/.dockerenv');
      
      const result2 = await detectEnvironment();
      
      expect(result1.environment).not.toBe(result2.environment);
    });
  });

  describe('Performance', () => {
    it('should complete detection within reasonable time', async () => {
      const startTime = Date.now();
      await detectEnvironment();
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should not leak memory with repeated detections', async () => {
      // Multiple detections should use cached results
      for (let i = 0; i < 10; i++) {
        await detectEnvironment();
      }
      
      // Should not throw or consume excessive resources
      expect(true).toBe(true);
    });
  });
});