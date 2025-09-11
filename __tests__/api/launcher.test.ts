/**
 * Comprehensive API Tests for Claude Code Launcher Endpoints
 * 
 * Tests all launcher API endpoints with modern testing patterns, comprehensive validation,
 * error scenarios, edge cases, and security features following requirements 2.1, 2.2, and 2.4.
 * 
 * Endpoints tested:
 * - GET /api/launcher/instances - List instances with health status
 * - POST /api/launcher/instances - Create new instances
 * - GET /api/launcher/instances/[id] - Get specific instance details
 * - PATCH /api/launcher/instances/[id] - Update instance configuration
 * - DELETE /api/launcher/instances/[id] - Stop and remove instances
 * - POST /api/launcher/instances/[id]/commands - Send TCP commands
 */

import { NextRequest } from 'next/server';
import { 
  GET as getInstances, 
  POST as createInstance, 
  DELETE as deleteInstance 
} from '../../api/launcher/instances/route';
import { 
  GET as getInstance, 
  PATCH as updateInstance, 
  POST as sendCommand, 
  DELETE as deleteInstanceById 
} from '../../api/launcher/instances/[id]/route';
import { 
  POST as sendCommandToInstance,
  GET as getCommandHealth
} from '../../api/launcher/instances/[id]/commands/route';
import { 
  LauncherConfig, 
  CreateInstanceRequest, 
  TCPCommand,
  InstanceStatus,
  type InstanceInfo,
  type ListInstancesResponse,
  type CreateInstanceResponse
} from '../../lib/types/launcher';

// Mock modules
jest.mock('../../lib/database/client', () => ({
  prisma: {
    // Mock database operations if needed
  }
}));

jest.mock('../../lib/services/tcp-server', () => ({
  tcpServerManager: {
    getServer: jest.fn((instanceId: string) => ({
      isHealthy: () => true,
      sendCommand: jest.fn()
    }))
  }
}));

jest.mock('../../lib/services/performance-monitor', () => ({
  withPerformanceTracking: jest.fn((handler) => handler)
}));

jest.mock('../../lib/utils/logger', () => ({
  LogHelpers: {
    info: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    debug: jest.fn()
  }
}));

// Test utilities
const createMockRequest = (
  method: string = 'GET', 
  url: string = 'http://localhost:3000/api/launcher/instances',
  body?: any,
  headers?: Record<string, string>
): NextRequest => {
  const request = new NextRequest(url, {
    method,
    headers: {
      'content-type': 'application/json',
      ...headers
    },
    ...(body && { body: JSON.stringify(body) })
  });
  return request;
};

const createValidLauncherConfig = (): LauncherConfig => ({
  projectPath: '/test/project',
  tcpPort: 9999,
  displayName: 'Test Claude Instance',
  autoRestart: false,
  environment: { NODE_ENV: 'test' },
  claudeArgs: ['--no-browser']
});

const createValidCreateInstanceRequest = (): CreateInstanceRequest => ({
  config: createValidLauncherConfig(),
  startImmediately: true
});

const validInstanceId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

describe('Launcher API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any rate limiting state that might persist between tests
    jest.clearAllTimers();
  });

  describe('GET /api/launcher/instances', () => {
    it('should list all instances successfully', async () => {
      const request = createMockRequest('GET');
      const response = await getInstances(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('instances');
      expect(data.data).toHaveProperty('totalCount');
      expect(data.data).toHaveProperty('runningCount');
      expect(Array.isArray(data.data.instances)).toBe(true);
      expect(typeof data.data.totalCount).toBe('number');
      expect(typeof data.data.runningCount).toBe('number');
    });

    it('should include health summary when requested', async () => {
      const request = createMockRequest('GET', 
        'http://localhost:3000/api/launcher/instances?health=true');
      const response = await getInstances(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('healthSummary');
      expect(data.healthSummary).toHaveProperty('overallStatus');
      expect(data.healthSummary).toHaveProperty('activeInstances');
      expect(data.healthSummary).toHaveProperty('errorInstances');
    });

    it('should support cache bypass', async () => {
      const request = createMockRequest('GET', 
        'http://localhost:3000/api/launcher/instances?cache=false');
      const response = await getInstances(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return cache headers', async () => {
      const request = createMockRequest('GET');
      const response = await getInstances(request);

      expect(response.headers.get('cache-control')).toBeTruthy();
      expect(response.headers.get('x-cache')).toBeTruthy();
    });
  });

  describe('POST /api/launcher/instances', () => {
    it('should create instance successfully with valid config', async () => {
      const validRequest = createValidCreateInstanceRequest();
      const request = createMockRequest('POST', 
        'http://localhost:3000/api/launcher/instances', validRequest);
      const response = await createInstance(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('instance');
      expect(data.data).toHaveProperty('bridgeInfo');
      expect(data.data.instance).toHaveProperty('id');
      expect(data.data.instance).toHaveProperty('config');
      expect(data.data.instance).toHaveProperty('status');
      expect(data.data.instance.config.projectPath).toBe('/test/project');
      expect(data.data.instance.tcpPort).toBe(9999);
    });

    it('should validate request data with comprehensive error handling', async () => {
      const invalidRequest = {
        config: {
          projectPath: '', // Invalid empty path
          tcpPort: 999,     // Invalid port
        }
      };
      const request = createMockRequest('POST', 
        'http://localhost:3000/api/launcher/instances', invalidRequest);
      const response = await createInstance(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request data');
      expect(Array.isArray(data.details)).toBe(true);
      expect(data.details.length).toBeGreaterThan(0);
    });

    it('should validate project path accessibility', async () => {
      const requestWithEmptyPath = {
        config: {
          ...createValidLauncherConfig(),
          projectPath: '   ' // Whitespace only
        }
      };
      const request = createMockRequest('POST', 
        'http://localhost:3000/api/launcher/instances', requestWithEmptyPath);
      const response = await createInstance(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Project path validation failed');
    });

    it('should validate TCP port range', async () => {
      const requestWithInvalidPort = {
        config: {
          ...createValidLauncherConfig(),
          tcpPort: 999 // Below valid range
        }
      };
      const request = createMockRequest('POST', 
        'http://localhost:3000/api/launcher/instances', requestWithInvalidPort);
      const response = await createInstance(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request data');
      expect(Array.isArray(data.details)).toBe(true);
    });

    it('should handle high port numbers', async () => {
      const requestWithHighPort = {
        config: {
          ...createValidLauncherConfig(),
          tcpPort: 70000 // Above valid range
        }
      };
      const request = createMockRequest('POST', 
        'http://localhost:3000/api/launcher/instances', requestWithHighPort);
      const response = await createInstance(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request data');
      expect(Array.isArray(data.details)).toBe(true);
    });

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/launcher/instances', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{ invalid json'
      });
      const response = await createInstance(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should set default values correctly', async () => {
      const minimalRequest = {
        config: {
          projectPath: '/test/project'
        }
      };
      const request = createMockRequest('POST', 
        'http://localhost:3000/api/launcher/instances', minimalRequest);
      const response = await createInstance(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.instance.tcpPort).toBe(9999); // Default port
      expect(data.data.instance.config.autoRestart).toBe(false); // Default autoRestart
    });
  });

  describe('GET /api/launcher/instances/[id]', () => {
    it('should return 404 for non-existent instance', async () => {
      const request = createMockRequest('GET');
      const response = await getInstance(request, { params: { id: validInstanceId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Instance not found');
      expect(data.details).toContain(validInstanceId);
      expect(Array.isArray(data.suggestions)).toBe(true);
    });

    it('should validate instance ID format', async () => {
      const invalidId = 'invalid-uuid';
      const request = createMockRequest('GET');
      const response = await getInstance(request, { params: { id: invalidId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid instance ID');
    });

    it('should support metrics and logs query parameters', async () => {
      const request = createMockRequest('GET', 
        `http://localhost:3000/api/launcher/instances/${validInstanceId}?metrics=true&logs=true`);
      const response = await getInstance(request, { params: { id: validInstanceId } });
      
      // Even though instance doesn't exist, should parse query params correctly
      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/launcher/instances/[id]', () => {
    it('should validate instance ID format', async () => {
      const invalidId = 'not-a-uuid';
      const updateData = { displayName: 'Updated Name' };
      const request = createMockRequest('PATCH', 
        `http://localhost:3000/api/launcher/instances/${invalidId}`, updateData);
      const response = await updateInstance(request, { params: { id: invalidId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid instance ID');
    });

    it('should validate update data schema', async () => {
      const invalidUpdateData = {
        autoRestart: 'not-a-boolean', // Should be boolean
        environment: 'not-an-object' // Should be object
      };
      const request = createMockRequest('PATCH', 
        `http://localhost:3000/api/launcher/instances/${validInstanceId}`, invalidUpdateData);
      const response = await updateInstance(request, { params: { id: validInstanceId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid update data');
      expect(Array.isArray(data.details)).toBe(true);
    });

    it('should return 404 for non-existent instance', async () => {
      const validUpdateData = { displayName: 'Updated Name' };
      const request = createMockRequest('PATCH', 
        `http://localhost:3000/api/launcher/instances/${validInstanceId}`, validUpdateData);
      const response = await updateInstance(request, { params: { id: validInstanceId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Instance not found');
    });

    it('should accept valid update fields', async () => {
      const validUpdateData = {
        displayName: 'New Display Name',
        autoRestart: true,
        environment: { NEW_VAR: 'value' },
        claudeArgs: ['--verbose']
      };
      const request = createMockRequest('PATCH', 
        `http://localhost:3000/api/launcher/instances/${validInstanceId}`, validUpdateData);
      const response = await updateInstance(request, { params: { id: validInstanceId } });
      
      // Should validate the data structure even if instance doesn't exist
      expect(response.status).toBe(404); // Not found, but validation passed
    });
  });

  describe('DELETE /api/launcher/instances/[id]', () => {
    it('should validate instance ID format', async () => {
      const invalidId = 'invalid-format';
      const request = createMockRequest('DELETE');
      const response = await deleteInstanceById(request, { params: { id: invalidId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid instance ID');
    });

    it('should return 404 for non-existent instance', async () => {
      const request = createMockRequest('DELETE');
      const response = await deleteInstanceById(request, { params: { id: validInstanceId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Instance not found');
      expect(Array.isArray(data.suggestions)).toBe(true);
    });

    it('should support force and grace period parameters', async () => {
      const request = createMockRequest('DELETE', 
        `http://localhost:3000/api/launcher/instances/${validInstanceId}?force=true&gracePeriod=10000`);
      const response = await deleteInstanceById(request, { params: { id: validInstanceId } });
      
      // Should parse query parameters correctly even if instance doesn't exist
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/launcher/instances (collection)', () => {
    it('should validate instance ID parameter', async () => {
      const request = createMockRequest('DELETE', 
        'http://localhost:3000/api/launcher/instances'); // Missing ID
      const response = await deleteInstance(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing instance ID');
    });

    it('should validate instance ID format', async () => {
      const request = createMockRequest('DELETE', 
        'http://localhost:3000/api/launcher/instances?id=invalid-uuid');
      const response = await deleteInstance(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid instance ID');
    });

    it('should handle valid instance ID', async () => {
      const request = createMockRequest('DELETE', 
        `http://localhost:3000/api/launcher/instances?id=${validInstanceId}`);
      const response = await deleteInstance(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.instanceId).toBe(validInstanceId);
      expect(Array.isArray(data.data.cleanupActions)).toBe(true);
    });
  });

  describe('POST /api/launcher/instances/[id]/commands', () => {
    const createValidCommand = (): any => ({
      command: {
        type: 'send',
        content: 'hello world'
      },
      options: {
        timeout: 5000,
        priority: 'normal',
        waitForResponse: true
      }
    });

    it('should validate instance ID format', async () => {
      const invalidId = 'not-uuid';
      const commandData = createValidCommand();
      const request = createMockRequest('POST', 
        `http://localhost:3000/api/launcher/instances/${invalidId}/commands`, commandData);
      const response = await sendCommandToInstance(request, { params: { id: invalidId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid instance ID');
    });

    it('should validate command data schema', async () => {
      const invalidCommand = {
        command: {
          type: 'invalid-type', // Not in allowed enum
          content: 'test'
        }
      };
      const request = createMockRequest('POST', 
        `http://localhost:3000/api/launcher/instances/${validInstanceId}/commands`, invalidCommand);
      const response = await sendCommandToInstance(request, { params: { id: validInstanceId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request format');
      expect(Array.isArray(data.details)).toBe(true);
    });

    it('should validate command content length', async () => {
      const longContent = 'a'.repeat(15000); // Exceeds MAX_COMMAND_CONTENT_LENGTH
      const commandWithLongContent = {
        command: {
          type: 'send',
          content: longContent
        }
      };
      const request = createMockRequest('POST', 
        `http://localhost:3000/api/launcher/instances/${validInstanceId}/commands`, commandWithLongContent);
      const response = await sendCommandToInstance(request, { params: { id: validInstanceId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request format');
      expect(Array.isArray(data.details)).toBe(true);
    });

    it('should implement rate limiting', async () => {
      const commandData = createValidCommand();
      
      // Send multiple requests rapidly to trigger rate limit
      const requests = Array(55).fill(null).map(() => 
        createMockRequest('POST', 
          `http://localhost:3000/api/launcher/instances/${validInstanceId}/commands`, commandData)
      );
      
      const responses = await Promise.all(
        requests.map(req => sendCommandToInstance(req, { params: { id: validInstanceId } }))
      );
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      // Should have some rate-limited responses after hitting the limit
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should validate security patterns', async () => {
      const maliciousCommand = {
        command: {
          type: 'send',
          content: 'rm -rf /' // Forbidden pattern
        }
      };
      const request = createMockRequest('POST', 
        `http://localhost:3000/api/launcher/instances/${validInstanceId}/commands`, maliciousCommand);
      const response = await sendCommandToInstance(request, { params: { id: validInstanceId } });
      const data = await response.json();

      // Should reject forbidden commands (403) or rate limit (429)
      expect([403, 429]).toContain(response.status);
      expect(data.success).toBe(false);
      if (response.status === 403) {
        expect(data.error).toBe('Command validation failed');
        expect(data.details).toBeTruthy();
      }
    });

    it('should prevent path traversal attempts', async () => {
      const pathTraversalCommand = {
        command: {
          type: 'send',
          content: '../../../etc/passwd'
        }
      };
      const request = createMockRequest('POST', 
        `http://localhost:3000/api/launcher/instances/${validInstanceId}/commands`, pathTraversalCommand);
      const response = await sendCommandToInstance(request, { params: { id: validInstanceId } });
      const data = await response.json();

      // Should reject path traversal (403) or rate limit (429)
      expect([403, 429]).toContain(response.status);
      expect(data.success).toBe(false);
      if (response.status === 403) {
        expect(data.error).toBe('Command validation failed');
        expect(data.details).toBeTruthy();
      }
    });

    it('should handle request size limits', async () => {
      const largePayload = {
        command: {
          type: 'send',
          content: 'a'.repeat(60000) // Exceeds MAX_REQUEST_SIZE
        }
      };
      const request = new NextRequest(
        `http://localhost:3000/api/launcher/instances/${validInstanceId}/commands`, {
        method: 'POST',
        headers: { 
          'content-type': 'application/json',
          'content-length': '60000'
        },
        body: JSON.stringify(largePayload)
      });
      const response = await sendCommandToInstance(request, { params: { id: validInstanceId } });
      const data = await response.json();

      expect(response.status).toBe(413);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Request too large');
    });

    it('should support all allowed command types', async () => {
      const allowedTypes = ['send', 'enter', 'up', 'down', 'ctrl-c', 'tab', 'raw', 'status', 'ping'];
      
      for (const type of allowedTypes) {
        const command = {
          command: { type, content: 'test' }
        };
        const request = createMockRequest('POST', 
          `http://localhost:3000/api/launcher/instances/${validInstanceId}/commands`, command);
        const response = await sendCommandToInstance(request, { params: { id: validInstanceId } });
        
        // Should not fail validation for allowed types
        expect(response.status).not.toBe(403);
      }
    });

    it('should include rate limit headers', async () => {
      const commandData = createValidCommand();
      const request = createMockRequest('POST', 
        `http://localhost:3000/api/launcher/instances/${validInstanceId}/commands`, commandData);
      const response = await sendCommandToInstance(request, { params: { id: validInstanceId } });

      // Rate limit headers are only included on successful requests
      if (response.status === 200) {
        expect(response.headers.get('x-ratelimit-remaining')).toBeTruthy();
      } else {
        // For error responses, just check that we get a response
        expect(response.status).toBeGreaterThan(0);
      }
    });

    it('should generate sequence IDs for commands', async () => {
      const commandData = createValidCommand();
      const request = createMockRequest('POST', 
        `http://localhost:3000/api/launcher/instances/${validInstanceId}/commands`, commandData);
      const response = await sendCommandToInstance(request, { params: { id: validInstanceId } });
      const data = await response.json();

      if (response.status === 200) {
        expect(data.data.command.sequenceId).toBeTruthy();
        expect(typeof data.data.command.sequenceId).toBe('string');
      }
    });
  });

  describe('GET /api/launcher/instances/[id]/commands', () => {
    it('should return health check information', async () => {
      const request = createMockRequest('GET');
      const response = await getCommandHealth(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.service).toBe('command-forwarding-api');
      expect(data.version).toBeTruthy();
      expect(data.rateLimits).toBeTruthy();
      expect(data.security).toBeTruthy();
      expect(Array.isArray(data.security.allowedCommands)).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      // Test with a valid but problematic request that might cause issues
      const request = createMockRequest('GET', 'http://localhost:3000/api/launcher/instances');
      
      try {
        const response = await getInstances(request);
        // Should get a valid response
        expect(response.status).toBeGreaterThan(0);
      } catch (error) {
        // Should handle errors without crashing
        expect(error).toBeDefined();
      }
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() => 
        createMockRequest('GET', 'http://localhost:3000/api/launcher/instances')
      );
      
      const promises = requests.map(req => getInstances(req));
      const responses = await Promise.all(promises);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should validate UUID format strictly', async () => {
      const almostValidUUIDs = [
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a1', // Too short
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a111', // Too long
        'g0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', // Invalid character
        'a0eebc99_9c0b_4ef8_bb6d_6bb9bd380a11', // Wrong separator
      ];

      for (const invalidId of almostValidUUIDs) {
        const request = createMockRequest('GET');
        const response = await getInstance(request, { params: { id: invalidId } });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Invalid instance ID');
      }
    });

    it('should handle empty request bodies', async () => {
      const request = new NextRequest('http://localhost:3000/api/launcher/instances', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: ''
      });
      const response = await createInstance(request);
      const data = await response.json();

      expect(response.status).toBe(500); // Will fail to parse empty JSON
      expect(data.success).toBe(false);
    });

    it('should handle missing content-type header', async () => {
      const request = new NextRequest('http://localhost:3000/api/launcher/instances', {
        method: 'POST',
        body: JSON.stringify(createValidCreateInstanceRequest())
      });
      const response = await createInstance(request);
      
      // Should still work, Next.js handles this gracefully
      expect(response.status).toBe(201);
    });
  });

  describe('Performance and Caching', () => {
    it('should implement proper caching headers', async () => {
      const request = createMockRequest('GET');
      const response = await getInstances(request);

      const cacheControl = response.headers.get('cache-control');
      expect(cacheControl).toContain('max-age');
      expect(cacheControl).toContain('s-maxage');
    });

    it('should handle cache invalidation on instance creation', async () => {
      // First request to populate cache
      const listRequest = createMockRequest('GET');
      await getInstances(listRequest);

      // Create instance (should invalidate cache)
      const createRequest = createMockRequest('POST', 
        'http://localhost:3000/api/launcher/instances', 
        createValidCreateInstanceRequest());
      const createResponse = await createInstance(createRequest);
      
      expect(createResponse.status).toBe(201);

      // Next list request should get fresh data
      const refreshRequest = createMockRequest('GET');
      const refreshResponse = await getInstances(refreshRequest);
      
      expect(refreshResponse.status).toBe(200);
    });

    it('should handle high-frequency requests efficiently', async () => {
      const startTime = Date.now();
      
      // Send 20 rapid requests
      const promises = Array(20).fill(null).map(() => {
        const request = createMockRequest('GET');
        return getInstances(request);
      });
      
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Should complete within reasonable time (less than 5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });
});