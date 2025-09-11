/**
 * Unit tests for TTY Bridge Service
 * 
 * Tests cover:
 * - TTY bridge initialization and configuration
 * - TCP server startup and client connections
 * - Claude Code process spawning and management
 * - Command execution and validation
 * - Event emission and error handling
 * - Health checks and bridge management
 * - Resource cleanup and graceful shutdown
 * - Edge cases and error scenarios
 */

import { EventEmitter } from 'events';
import { Server, Socket } from 'net';
import { ChildProcess } from 'child_process';
import { 
  TTYBridge, 
  TTYBridgeOptions, 
  createTTYBridge, 
  findAvailablePort, 
  TTYBridgeManager, 
  bridgeManager 
} from '../../lib/services/tty-bridge';
import { 
  TCPCommand, 
  TCPResponse, 
  BridgeServerInfo, 
  validateTCPCommand 
} from '../../lib/types/launcher';

// Mock dependencies
jest.mock('net');
jest.mock('child_process');
jest.mock('../../lib/utils/logger');
jest.mock('../../lib/utils/errors');

const mockedNet = jest.mocked(jest.requireMock('net'));
const mockedChildProcess = jest.mocked(jest.requireMock('child_process'));

describe('TTYBridge', () => {
  let bridge: TTYBridge;
  let mockOptions: TTYBridgeOptions;
  let mockServer: jest.Mocked<Server> & { connectionHandler?: any };
  let mockSocket: jest.Mocked<Socket>;
  let mockClaudeProcess: jest.Mocked<ChildProcess> & { killed: boolean; stdout: any; stderr: any; stdin: any };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockOptions = {
      port: 9999,
      instanceId: '123e4567-e89b-12d3-a456-426614174000',
      projectPath: '/test/project',
      claudePath: 'claude-code',
      claudeArgs: ['--test'],
      timeout: 5000,
      logLevel: 'debug'
    };

    // Mock server
    mockServer = {
      listen: jest.fn((port, host, callback) => {
        setTimeout(() => callback?.(), 0);
        return mockServer;
      }),
      close: jest.fn((callback) => {
        setTimeout(() => callback?.(), 0);
        return mockServer;
      }),
      on: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      removeAllListeners: jest.fn().mockReturnThis()
    } as any;

    // Mock socket
    mockSocket = {
      write: jest.fn(),
      end: jest.fn(),
      on: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      remoteAddress: '127.0.0.1',
      destroy: jest.fn()
    } as any;

    // Mock Claude process
    mockClaudeProcess = {
      stdout: {
        on: jest.fn().mockReturnThis()
      },
      stderr: {
        on: jest.fn().mockReturnThis()
      },
      stdin: {
        write: jest.fn()
      },
      on: jest.fn().mockReturnThis(),
      kill: jest.fn(),
      killed: false,
      pid: 12345
    } as any;

    // Setup net module mocks
    mockedNet.createServer.mockImplementation((connectionHandler) => {
      // Store the connection handler to simulate client connections
      mockServer.connectionHandler = connectionHandler;
      return mockServer;
    });

    // Setup child_process mocks
    mockedChildProcess.spawn.mockReturnValue(mockClaudeProcess);

    bridge = new TTYBridge(mockOptions);
  });

  afterEach(async () => {
    try {
      await bridge.stop();
    } catch (error) {
      // Ignore cleanup errors in tests
    }
  });

  describe('Initialization and Configuration', () => {
    it('should create bridge with provided options', () => {
      expect(bridge).toBeInstanceOf(TTYBridge);
      expect(bridge).toBeInstanceOf(EventEmitter);
    });

    it('should apply default options when not provided', () => {
      const minimalOptions: TTYBridgeOptions = {
        port: 9999,
        instanceId: '123e4567-e89b-12d3-a456-426614174000',
        projectPath: '/test/project'
      };
      
      const bridgeWithDefaults = new TTYBridge(minimalOptions);
      expect(bridgeWithDefaults).toBeInstanceOf(TTYBridge);
    });

    it('should extend EventEmitter properly', () => {
      const eventSpy = jest.fn();
      bridge.on('bridge_ready', eventSpy);
      
      const testInfo: BridgeServerInfo = {
        port: 9999,
        instanceId: mockOptions.instanceId,
        isListening: true,
        clientCount: 0,
        startTime: new Date(),
        errorCount: 0
      };
      
      bridge.emit('bridge_ready', testInfo);
      expect(eventSpy).toHaveBeenCalledWith(testInfo);
    });
  });

  describe('Bridge Startup', () => {
    it('should start successfully with valid configuration', async () => {
      // Mock successful Claude process start
      setTimeout(() => {
        const processOnCalls = mockClaudeProcess.on.mock.calls;
        // Don't trigger error or exit events during startup
      }, 10);

      const bridgeInfo = await bridge.start();
      
      expect(bridgeInfo).toEqual({
        port: mockOptions.port,
        instanceId: mockOptions.instanceId,
        isListening: true,
        clientCount: 0,
        startTime: expect.any(Date),
        errorCount: 0
      });
      
      expect(mockedChildProcess.spawn).toHaveBeenCalledWith(
        'claude-code',
        ['/test/project', '--test'],
        expect.objectContaining({
          cwd: '/test/project',
          stdio: ['pipe', 'pipe', 'pipe'],
          env: expect.objectContaining({
            CLAUDE_TCP_PORT: '9999'
          })
        })
      );
      
      expect(mockedNet.createServer).toHaveBeenCalled();
      expect(mockServer.listen).toHaveBeenCalledWith(9999, 'localhost', expect.any(Function));
    });

    it('should emit bridge_ready event when started', async () => {
      const readySpy = jest.fn();
      bridge.on('bridge_ready', readySpy);
      
      await bridge.start();
      
      expect(readySpy).toHaveBeenCalledWith(expect.objectContaining({
        port: 9999,
        instanceId: mockOptions.instanceId,
        isListening: true
      }));
    });

    it('should handle Claude process startup errors', async () => {
      // Simulate process error during startup
      setTimeout(() => {
        const errorHandler = (mockClaudeProcess.on as jest.Mock).mock.calls.find(
          (call: any[]) => call[0] === 'error'
        )?.[1];
        if (errorHandler) {
          errorHandler(new Error('Process spawn failed'));
        }
      }, 10);

      await expect(bridge.start()).rejects.toThrow();
    });

    it('should handle TCP server startup errors', async () => {
      // Mock server error
      mockServer.listen.mockImplementation((...args: any[]) => {
        setTimeout(() => {
          const errorHandler = (mockServer.on as jest.Mock).mock.calls.find(
            (call: any[]) => call[0] === 'error'
          )?.[1];
          if (errorHandler) {
            errorHandler(new Error('Address already in use'));
          }
        }, 10);
        return mockServer;
      });

      await expect(bridge.start()).rejects.toThrow();
    });
  });

  describe('Client Connection Handling', () => {
    beforeEach(async () => {
      await bridge.start();
    });

    it('should handle client connections', () => {
      const clientConnectedSpy = jest.fn();
      bridge.on('client_connected', clientConnectedSpy);
      
      // Simulate client connection
      if (mockServer.connectionHandler) {
        mockServer.connectionHandler(mockSocket);
      }
      
      expect(clientConnectedSpy).toHaveBeenCalledWith(mockSocket);
    });

    it('should handle client disconnections', () => {
      const clientDisconnectedSpy = jest.fn();
      bridge.on('client_disconnected', clientDisconnectedSpy);
      
      // Simulate client connection and disconnection
      if (mockServer.connectionHandler) {
        mockServer.connectionHandler(mockSocket);
        
        // Trigger close event
        const closeHandler = (mockSocket.on as jest.Mock).mock.calls.find(
          (call: any[]) => call[0] === 'close'
        )?.[1];
        if (closeHandler) {
          closeHandler();
        }
      }
      
      expect(clientDisconnectedSpy).toHaveBeenCalledWith(mockSocket);
    });

    it('should handle client socket errors', () => {
      // Simulate client connection
      if (mockServer.connectionHandler) {
        mockServer.connectionHandler(mockSocket);
        
        // Trigger error event
        const errorHandler = (mockSocket.on as jest.Mock).mock.calls.find(
          (call: any[]) => call[0] === 'error'
        )?.[1];
        if (errorHandler) {
          errorHandler(new Error('Socket error'));
        }
      }
      
      // Should not throw, just handle gracefully
      expect(mockSocket.end).not.toHaveBeenCalled(); // Error handling shouldn't end socket
    });
  });

  describe('Command Processing', () => {
    beforeEach(async () => {
      await bridge.start();
    });

    it('should validate commands before execution', async () => {
      const invalidCommand = {
        type: 'invalid_type',
        instanceId: 'invalid-uuid',
        timestamp: new Date()
      } as any;
      
      await expect(bridge.sendCommand(invalidCommand)).rejects.toThrow();
    });

    it('should execute send command correctly', async () => {
      const command: TCPCommand = {
        type: 'send',
        content: 'test message',
        instanceId: mockOptions.instanceId,
        timestamp: new Date(),
        sequenceId: '550e8400-e29b-41d4-a716-446655440001'
      };
      
      const response = await bridge.sendCommand(command);
      
      expect(response).toEqual({
        success: true,
        message: 'Command send executed',
        timestamp: expect.any(Date),
        sequenceId: command.sequenceId
      });
      
      expect(mockClaudeProcess.stdin.write).toHaveBeenCalledWith('test message');
    });

    it('should execute special key commands correctly', async () => {
      const testCases = [
        { type: 'enter' as const, expectedInput: '\n' },
        { type: 'up' as const, expectedInput: '\u001b[A' },
        { type: 'down' as const, expectedInput: '\u001b[B' },
        { type: 'ctrl-c' as const, expectedInput: '\u0003' },
        { type: 'tab' as const, expectedInput: '\t' }
      ];
      
      for (const testCase of testCases) {
        const command: TCPCommand = {
          type: testCase.type,
          instanceId: mockOptions.instanceId,
          timestamp: new Date()
        };
        
        const response = await bridge.sendCommand(command);
        
        expect(response.success).toBe(true);
        expect(mockClaudeProcess.stdin.write).toHaveBeenCalledWith(testCase.expectedInput);
      }
    });

    it('should handle ping command without sending input', async () => {
      const command: TCPCommand = {
        type: 'ping',
        instanceId: mockOptions.instanceId,
        timestamp: new Date(),
        sequenceId: '550e8400-e29b-41d4-a716-446655440002'
      };
      
      const response = await bridge.sendCommand(command);
      
      expect(response).toEqual({
        success: true,
        message: 'pong',
        timestamp: expect.any(Date),
        sequenceId: command.sequenceId
      });
      
      expect(mockClaudeProcess.stdin.write).not.toHaveBeenCalled();
    });

    it('should handle status command correctly', async () => {
      const command: TCPCommand = {
        type: 'status',
        instanceId: mockOptions.instanceId,
        timestamp: new Date(),
        sequenceId: '550e8400-e29b-41d4-a716-446655440003'
      };
      
      const response = await bridge.sendCommand(command);
      
      expect(response).toEqual({
        success: true,
        data: {
          processAlive: true,
          clientCount: 0,
          isListening: true
        },
        timestamp: expect.any(Date),
        sequenceId: command.sequenceId
      });
    });

    it('should handle command timeout', async () => {
      // Create bridge with very short timeout
      const shortTimeoutBridge = new TTYBridge({
        ...mockOptions,
        timeout: 10
      });
      
      await shortTimeoutBridge.start();
      
      const command: TCPCommand = {
        type: 'send',
        content: 'test',
        instanceId: mockOptions.instanceId,
        timestamp: new Date()
      };
      
      await expect(shortTimeoutBridge.sendCommand(command)).rejects.toThrow();
      await shortTimeoutBridge.stop();
    });

    it('should emit command events', async () => {
      const receivedSpy = jest.fn();
      const executedSpy = jest.fn();
      
      bridge.on('command_received', receivedSpy);
      bridge.on('command_executed', executedSpy);
      
      const command: TCPCommand = {
        type: 'ping',
        instanceId: mockOptions.instanceId,
        timestamp: new Date()
      };
      
      const response = await bridge.sendCommand(command);
      
      expect(receivedSpy).toHaveBeenCalledWith(command);
      expect(executedSpy).toHaveBeenCalledWith(command, response);
    });
  });

  describe('Claude Process Management', () => {
    it('should handle Claude process output', async () => {
      const outputSpy = jest.fn();
      bridge.on('claude_output', outputSpy);
      
      await bridge.start();
      
      // Simulate stdout data
      const dataHandler = (mockClaudeProcess.stdout.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'data'
      )?.[1];
      if (dataHandler) {
        dataHandler(Buffer.from('Claude output'));
      }
      
      expect(outputSpy).toHaveBeenCalledWith('Claude output');
    });

    it('should handle Claude process errors', async () => {
      const errorSpy = jest.fn();
      bridge.on('claude_error', errorSpy);
      
      await bridge.start();
      
      // Simulate stderr data
      const errorHandler = (mockClaudeProcess.stderr.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'data'
      )?.[1];
      if (errorHandler) {
        errorHandler(Buffer.from('Claude error'));
      }
      
      expect(errorSpy).toHaveBeenCalledWith('Claude error');
    });

    it('should handle Claude process exit', async () => {
      const exitSpy = jest.fn();
      bridge.on('claude_exit', exitSpy);
      
      await bridge.start();
      
      // Simulate process exit
      const exitHandler = (mockClaudeProcess.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'exit'
      )?.[1];
      if (exitHandler) {
        exitHandler(0);
      }
      
      expect(exitSpy).toHaveBeenCalledWith(0);
    });
  });

  describe('Health Checks', () => {
    it('should return true for healthy bridge', async () => {
      await bridge.start();
      
      const isHealthy = await bridge.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('should return false when not listening', async () => {
      const isHealthy = await bridge.healthCheck();
      expect(isHealthy).toBe(false);
    });

    it('should return false when Claude process is dead', async () => {
      await bridge.start();
      (mockClaudeProcess as any).killed = true;
      
      const isHealthy = await bridge.healthCheck();
      expect(isHealthy).toBe(false);
    });
  });

  describe('Bridge Information', () => {
    it('should return null when bridge not started', () => {
      const info = bridge.getBridgeInfo();
      expect(info).toBeNull();
    });

    it('should return current bridge info when running', async () => {
      await bridge.start();
      
      const info = bridge.getBridgeInfo();
      expect(info).toEqual({
        port: mockOptions.port,
        instanceId: mockOptions.instanceId,
        isListening: true,
        clientCount: 0,
        startTime: expect.any(Date),
        errorCount: 0,
        lastActivity: expect.any(Date)
      });
    });
  });

  describe('Bridge Shutdown', () => {
    it('should stop gracefully when running', async () => {
      await bridge.start();
      await bridge.stop();
      
      expect(mockServer.close).toHaveBeenCalled();
      expect(mockClaudeProcess.kill).toHaveBeenCalledWith('SIGTERM');
    });

    it('should handle shutdown when not running', async () => {
      await expect(bridge.stop()).resolves.not.toThrow();
    });

    it('should force kill Claude process if graceful shutdown fails', async () => {
      await bridge.start();
      
      // Don't trigger the exit event to simulate hanging process
      (mockClaudeProcess.on as jest.Mock).mockImplementation((event: string, handler: any) => {
        if (event !== 'exit') {
          return mockClaudeProcess;
        }
        // Don't call the exit handler
        return mockClaudeProcess;
      });
      
      // Mock the timeout behavior
      jest.useFakeTimers();
      
      const stopPromise = bridge.stop();
      
      // Fast-forward time to trigger force kill
      jest.advanceTimersByTime(6000);
      
      await stopPromise;
      
      expect(mockClaudeProcess.kill).toHaveBeenCalledWith('SIGKILL');
      
      jest.useRealTimers();
    });

    it('should close all client connections on shutdown', async () => {
      await bridge.start();
      
      // Simulate client connection
      if (mockServer.connectionHandler) {
        mockServer.connectionHandler(mockSocket);
      }
      
      await bridge.stop();
      
      expect(mockSocket.end).toHaveBeenCalled();
    });
  });
});

describe('TTY Bridge Factory Functions', () => {
  describe('createTTYBridge', () => {
    it('should create TTYBridge instance', () => {
      const options: TTYBridgeOptions = {
        port: 9999,
        instanceId: '123e4567-e89b-12d3-a456-426614174000',
        projectPath: '/test/project'
      };
      
      const bridge = createTTYBridge(options);
      expect(bridge).toBeInstanceOf(TTYBridge);
    });
  });

  describe('findAvailablePort', () => {
    it('should find available port in range', async () => {
      // Mock createServer to return available port
      const mockTestServer = {
        listen: jest.fn((...args: any[]) => {
          const callback = args[args.length - 1];
          if (typeof callback === 'function') {
            callback();
          }
          return mockTestServer;
        }),
        close: jest.fn((callback?: any) => {
          if (typeof callback === 'function') {
            callback();
          }
          return mockTestServer;
        }),
        on: jest.fn().mockReturnThis()
      };
      
      mockedNet.createServer.mockReturnValue(mockTestServer as any);
      
      const port = await findAvailablePort(9999, 10001);
      expect(port).toBe(9999);
      expect(mockTestServer.listen).toHaveBeenCalledWith(9999, 'localhost', expect.any(Function));
    });

    it('should throw error when no ports available', async () => {
      // Mock createServer to always fail
      const mockTestServer = {
        listen: jest.fn((...args: any[]) => {
          return mockTestServer;
        }),
        close: jest.fn((callback?: any) => {
          if (typeof callback === 'function') {
            callback();
          }
          return mockTestServer;
        }),
        on: jest.fn((event: string, handler: any) => {
          if (event === 'error') {
            setTimeout(() => handler(new Error('Port in use')), 0);
          }
          return mockTestServer;
        })
      };
      
      mockedNet.createServer.mockReturnValue(mockTestServer as any);
      
      await expect(findAvailablePort(9999, 9999)).rejects.toThrow();
    });
  });
});

describe('TTYBridgeManager', () => {
  let manager: TTYBridgeManager;
  
  beforeEach(() => {
    manager = new TTYBridgeManager();
  });

  afterEach(async () => {
    await manager.stopAll();
  });

  it('should create bridge instance', async () => {
    const options: TTYBridgeOptions = {
      port: 9999,
      instanceId: '123e4567-e89b-12d3-a456-426614174000',
      projectPath: '/test/project'
    };
    
    const bridge = await manager.createBridge(options);
    expect(bridge).toBeInstanceOf(TTYBridge);
    expect(manager.getBridge(options.instanceId)).toBe(bridge);
  });

  it('should prevent duplicate instance IDs', async () => {
    const options: TTYBridgeOptions = {
      port: 9999,
      instanceId: '123e4567-e89b-12d3-a456-426614174000',
      projectPath: '/test/project'
    };
    
    await manager.createBridge(options);
    await expect(manager.createBridge(options)).rejects.toThrow();
  });

  it('should destroy bridge instance', async () => {
    const options: TTYBridgeOptions = {
      port: 9999,
      instanceId: '123e4567-e89b-12d3-a456-426614174000',
      projectPath: '/test/project'
    };
    
    const bridge = await manager.createBridge(options);
    const stopSpy = jest.spyOn(bridge, 'stop').mockResolvedValue();
    
    await manager.destroyBridge(options.instanceId);
    
    expect(stopSpy).toHaveBeenCalled();
    expect(manager.getBridge(options.instanceId)).toBeUndefined();
  });

  it('should get all bridge instances', async () => {
    const options1: TTYBridgeOptions = {
      port: 9999,
      instanceId: '123e4567-e89b-12d3-a456-426614174000',
      projectPath: '/test/project1'
    };
    
    const options2: TTYBridgeOptions = {
      port: 10000,
      instanceId: '123e4567-e89b-12d3-a456-426614174001',
      projectPath: '/test/project2'
    };
    
    const bridge1 = await manager.createBridge(options1);
    const bridge2 = await manager.createBridge(options2);
    
    const allBridges = manager.getAllBridges();
    expect(allBridges).toHaveLength(2);
    expect(allBridges).toContain(bridge1);
    expect(allBridges).toContain(bridge2);
  });

  it('should stop all bridges', async () => {
    const options1: TTYBridgeOptions = {
      port: 9999,
      instanceId: '123e4567-e89b-12d3-a456-426614174000',
      projectPath: '/test/project1'
    };
    
    const options2: TTYBridgeOptions = {
      port: 10000,
      instanceId: '123e4567-e89b-12d3-a456-426614174001',
      projectPath: '/test/project2'
    };
    
    const bridge1 = await manager.createBridge(options1);
    const bridge2 = await manager.createBridge(options2);
    
    const stopSpy1 = jest.spyOn(bridge1, 'stop').mockResolvedValue();
    const stopSpy2 = jest.spyOn(bridge2, 'stop').mockResolvedValue();
    
    await manager.stopAll();
    
    expect(stopSpy1).toHaveBeenCalled();
    expect(stopSpy2).toHaveBeenCalled();
    expect(manager.getAllBridges()).toHaveLength(0);
  });

  it('should handle bridge errors and cleanup', async () => {
    const options: TTYBridgeOptions = {
      port: 9999,
      instanceId: '123e4567-e89b-12d3-a456-426614174000',
      projectPath: '/test/project'
    };
    
    const bridge = await manager.createBridge(options);
    
    // Simulate bridge error
    bridge.emit('bridge_error', new Error('Test error'));
    
    // Bridge should be removed from manager
    expect(manager.getBridge(options.instanceId)).toBeUndefined();
  });
});

describe('Singleton Bridge Manager', () => {
  it('should export singleton instance', () => {
    expect(bridgeManager).toBeInstanceOf(TTYBridgeManager);
  });
});