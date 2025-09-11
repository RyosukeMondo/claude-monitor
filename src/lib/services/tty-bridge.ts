/**
 * TTY Bridge Service
 * 
 * Provides reliable TTY interface to Claude Code sessions using native Node.js capabilities.
 * Implements TCP server for command forwarding with support for send, enter, up, down, ctrl-c, tab operations.
 * 
 * Architecture: TCP Server -> Command Parser -> Process Manager -> Claude Code Process
 */

import { EventEmitter } from 'events';
import { Server, Socket, createServer } from 'net';
import { spawn, ChildProcess } from 'child_process';
import { 
  TCPCommand, 
  TCPResponse, 
  BridgeServerInfo, 
  validateTCPCommand 
} from '../types/launcher';
import { LogHelpers } from '../utils/logger';
import { ErrorFactory } from '../utils/errors';

export interface TTYBridgeOptions {
  port: number;
  instanceId: string;
  claudePath?: string;
  claudeArgs?: string[];
  projectPath: string;
  timeout?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export interface TTYBridgeEvents {
  'command_received': [TCPCommand];
  'command_executed': [TCPCommand, TCPResponse];
  'claude_output': [string];
  'claude_error': [string];
  'claude_exit': [number | null];
  'client_connected': [Socket];
  'client_disconnected': [Socket];
  'bridge_ready': [BridgeServerInfo];
  'bridge_error': [Error];
}

/**
 * TTY Bridge Service
 * Manages TCP server for Claude Code process interaction
 */
export class TTYBridge extends EventEmitter {
  // Type-safe event emitter methods
  on<K extends keyof TTYBridgeEvents>(event: K, listener: (...args: TTYBridgeEvents[K]) => void): this {
    return super.on(event, listener);
  }

  emit<K extends keyof TTYBridgeEvents>(event: K, ...args: TTYBridgeEvents[K]): boolean {
    return super.emit(event, ...args);
  }

  private server: Server | null = null;
  private claudeProcess: ChildProcess | null = null;
  private clients: Set<Socket> = new Set();
  private isListening = false;
  private options: Required<TTYBridgeOptions>;
  private bridgeInfo: BridgeServerInfo | null = null;
  private commandQueue: TCPCommand[] = [];
  private isProcessing = false;

  constructor(options: TTYBridgeOptions) {
    super();
    this.options = {
      timeout: 5000,
      logLevel: 'info',
      claudePath: 'claude-code',
      claudeArgs: [],
      ...options
    };
  }

  /**
   * Start the TTY bridge server and Claude Code process
   */
  async start(): Promise<BridgeServerInfo> {
    try {
      LogHelpers.info('tty-bridge', 'Starting TTY bridge', { 
        port: this.options.port, 
        instanceId: this.options.instanceId 
      });

      // Start Claude Code process first
      await this.startClaudeProcess();

      // Start TCP server
      await this.startTCPServer();

      this.bridgeInfo = {
        port: this.options.port,
        instanceId: this.options.instanceId,
        isListening: this.isListening,
        clientCount: this.clients.size,
        startTime: new Date(),
        errorCount: 0
      };

      this.emit('bridge_ready', this.bridgeInfo);
      LogHelpers.info('tty-bridge', 'TTY bridge started successfully', this.bridgeInfo);

      return this.bridgeInfo;
    } catch {
      const bridgeError = ErrorFactory.configurationMissing(
        'TTY_BRIDGE_START_FAILED',
        'object'
      );
      this.emit('bridge_error', bridgeError);
      throw bridgeError;
    }
  }

  /**
   * Stop the TTY bridge and cleanup resources
   */
  async stop(): Promise<void> {
    try {
      LogHelpers.info('tty-bridge', 'Stopping TTY bridge', { instanceId: this.options.instanceId });

      // Close all client connections
      this.clients.forEach(client => client.end());
      this.clients.clear();

      // Close TCP server
      if (this.server) {
        await new Promise<void>((resolve) => {
          this.server!.close(() => resolve());
        });
        this.server = null;
        this.isListening = false;
      }

      // Terminate Claude process
      if (this.claudeProcess) {
        this.claudeProcess.kill('SIGTERM');
        
        // Wait for graceful shutdown or force kill
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            if (this.claudeProcess && !this.claudeProcess.killed) {
              this.claudeProcess.kill('SIGKILL');
            }
            resolve();
          }, 5000);

          this.claudeProcess!.on('exit', () => {
            clearTimeout(timeout);
            resolve();
          });
        });

        this.claudeProcess = null;
      }

      LogHelpers.info('tty-bridge', 'TTY bridge stopped successfully', { instanceId: this.options.instanceId });
    } catch (error) {
      const stopError = ErrorFactory.recoveryActionFailed(
        'stop_tty_bridge',
        'stop',
        1,
        (error as Error).message
      );
      LogHelpers.error('tty-bridge', stopError);
      throw stopError;
    }
  }

  /**
   * Send command to Claude Code process
   */
  async sendCommand(command: TCPCommand): Promise<TCPResponse> {
    const validation = validateTCPCommand(command);
    if (!validation.success) {
      throw new Error('Invalid TCP command: ' + JSON.stringify(validation.error.issues));
    }

    this.emit('command_received', command);
    LogHelpers.debug('tty-bridge', 'Received TCP command', { command });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(ErrorFactory.configurationMissing(
          'COMMAND_TIMEOUT',
          'number'
        ));
      }, this.options.timeout);

      try {
        const response = this.executeCommand(command);
        clearTimeout(timeout);
        this.emit('command_executed', command, response);
        resolve(response);
      } catch (error) {
        clearTimeout(timeout);
        const cmdError = ErrorFactory.recoveryActionFailed(
          'execute_command',
          command.type,
          1,
          (error as Error).message
        );
        reject(cmdError);
      }
    });
  }

  /**
   * Get current bridge server information
   */
  getBridgeInfo(): BridgeServerInfo | null {
    if (!this.bridgeInfo) return null;

    return {
      ...this.bridgeInfo,
      isListening: this.isListening,
      clientCount: this.clients.size,
      lastActivity: new Date()
    };
  }

  /**
   * Check if bridge is healthy and responsive
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isListening || !this.claudeProcess) {
        return false;
      }

      // Send ping command to verify responsiveness
      const pingCommand: TCPCommand = {
        type: 'ping',
        instanceId: this.options.instanceId,
        timestamp: new Date()
      };

      const response = await this.sendCommand(pingCommand);
      return response.success;
    } catch {
      return false;
    }
  }

  /**
   * Start Claude Code process
   */
  private async startClaudeProcess(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const args = [...this.options.claudeArgs];
        if (this.options.projectPath) {
          args.unshift(this.options.projectPath);
        }

        LogHelpers.debug('tty-bridge', 'Starting Claude Code process', {
          command: this.options.claudePath,
          args,
          projectPath: this.options.projectPath
        });

        this.claudeProcess = spawn(this.options.claudePath, args, {
          cwd: this.options.projectPath,
          stdio: ['pipe', 'pipe', 'pipe'],
          env: {
            ...process.env,
            CLAUDE_TCP_PORT: this.options.port.toString()
          }
        });

        // Setup process event handlers
        this.claudeProcess.on('error', (error) => {
          const processError = ErrorFactory.recoveryActionFailed(
            'start_claude_process',
            this.options.claudePath,
            1,
            error.message
          );
          this.emit('bridge_error', processError);
          reject(processError);
        });

        this.claudeProcess.on('exit', (code) => {
          LogHelpers.warning('tty-bridge', 'Claude process exited', { code, instanceId: this.options.instanceId });
          this.emit('claude_exit', code);
        });

        // Setup stdout/stderr handling
        if (this.claudeProcess.stdout) {
          this.claudeProcess.stdout.on('data', (data) => {
            const output = data.toString();
            LogHelpers.debug('tty-bridge', 'Claude stdout', { output });
            this.emit('claude_output', output);
          });
        }

        if (this.claudeProcess.stderr) {
          this.claudeProcess.stderr.on('data', (data) => {
            const error = data.toString();
            LogHelpers.debug('tty-bridge', 'Claude stderr', { error });
            this.emit('claude_error', error);
          });
        }

        // Wait for process to be ready
        setTimeout(() => {
          if (this.claudeProcess && !this.claudeProcess.killed) {
            resolve();
          } else {
            reject(ErrorFactory.recoveryActionFailed(
              'start_claude_process',
              this.options.claudePath,
              1,
              'Process failed to start'
            ));
          }
        }, 1000);

      } catch (error) {
        reject(ErrorFactory.recoveryActionFailed(
          'spawn_claude_process',
          this.options.claudePath,
          1,
          (error as Error).message
        ));
      }
    });
  }

  /**
   * Start TCP server for command forwarding
   */
  private async startTCPServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = createServer((socket) => {
          this.handleClientConnection(socket);
        });

        this.server.on('error', (error) => {
          LogHelpers.error('tty-bridge', error);
          const serverError = ErrorFactory.configurationMissing(
            'TCP_SERVER_PORT',
            'number'
          );
          this.emit('bridge_error', serverError);
          reject(serverError);
        });

        this.server.listen(this.options.port, 'localhost', () => {
          this.isListening = true;
          LogHelpers.info('tty-bridge', 'TCP server listening', { port: this.options.port });
          resolve();
        });

      } catch {
        reject(ErrorFactory.configurationMissing(
          'TCP_SERVER_START_FAILED',
          'object'
        ));
      }
    });
  }

  /**
   * Handle new client connection
   */
  private handleClientConnection(socket: Socket): void {
    this.clients.add(socket);
    LogHelpers.debug('tty-bridge', 'Client connected', { 
      clientCount: this.clients.size,
      remoteAddress: socket.remoteAddress 
    });
    this.emit('client_connected', socket);

    socket.on('data', (data) => {
      try {
        const commandStr = data.toString().trim();
        const command = JSON.parse(commandStr) as TCPCommand;
        
        this.sendCommand(command)
          .then((response) => {
            socket.write(JSON.stringify(response) + '\n');
          })
          .catch((error) => {
            const errorResponse: TCPResponse = {
              success: false,
              message: error.message,
              timestamp: new Date()
            };
            socket.write(JSON.stringify(errorResponse) + '\n');
          });
      } catch (error) {
        LogHelpers.error('tty-bridge', error as Error, { data: data.toString() });
        const errorResponse: TCPResponse = {
          success: false,
          message: 'Invalid command format',
          timestamp: new Date()
        };
        socket.write(JSON.stringify(errorResponse) + '\n');
      }
    });

    socket.on('close', () => {
      this.clients.delete(socket);
      LogHelpers.debug('tty-bridge', 'Client disconnected', { clientCount: this.clients.size });
      this.emit('client_disconnected', socket);
    });

    socket.on('error', (error) => {
      LogHelpers.error('tty-bridge', error);
      this.clients.delete(socket);
    });
  }

  /**
   * Execute command on Claude Code process
   */
  private executeCommand(command: TCPCommand): TCPResponse {
    if (!this.claudeProcess || !this.claudeProcess.stdin) {
      throw ErrorFactory.recoveryActionFailed(
        'execute_command',
        'claude_process_check',
        1,
        'Claude process not available'
      );
    }

    try {
      let input = '';

      switch (command.type) {
        case 'send':
          input = command.content || '';
          break;
        case 'enter':
          input = '\n';
          break;
        case 'up':
          input = '\u001b[A'; // Up arrow
          break;
        case 'down':
          input = '\u001b[B'; // Down arrow
          break;
        case 'ctrl-c':
          input = '\u0003'; // Ctrl+C
          break;
        case 'tab':
          input = '\t';
          break;
        case 'raw':
          input = command.content || '';
          break;
        case 'ping':
          // Ping doesn't send input, just returns success
          return {
            success: true,
            message: 'pong',
            timestamp: new Date(),
            sequenceId: command.sequenceId
          };
        case 'status':
          return {
            success: true,
            data: {
              processAlive: !this.claudeProcess.killed,
              clientCount: this.clients.size,
              isListening: this.isListening
            },
            timestamp: new Date(),
            sequenceId: command.sequenceId
          };
        default:
          throw new Error('Unsupported command type: ' + command.type);
      }

      // Send input to Claude process
      if (input) {
        this.claudeProcess.stdin.write(input);
      }

      return {
        success: true,
        message: `Command ${command.type} executed`,
        timestamp: new Date(),
        sequenceId: command.sequenceId
      };

    } catch (error) {
      throw ErrorFactory.recoveryActionFailed(
        'execute_command',
        command.type,
        1,
        (error as Error).message
      );
    }
  }
}

/**
 * Factory function to create TTY bridge instances
 */
export function createTTYBridge(options: TTYBridgeOptions): TTYBridge {
  return new TTYBridge(options);
}

/**
 * Utility function to find available port
 */
export async function findAvailablePort(startPort: number = 9999, endPort: number = 10099): Promise<number> {
  const { createServer } = await import('net');
  
  for (let port = startPort; port <= endPort; port++) {
    const available = await new Promise<boolean>((resolve) => {
      const server = createServer();
      server.listen(port, 'localhost', () => {
        server.close(() => resolve(true));
      });
      server.on('error', () => resolve(false));
    });
    
    if (available) {
      return port;
    }
  }
  
  throw ErrorFactory.configurationMissing(
    'AVAILABLE_PORT',
    'number'
  );
}

/**
 * Bridge manager for handling multiple TTY bridge instances
 */
export class TTYBridgeManager {
  private bridges = new Map<string, TTYBridge>();

  async createBridge(options: TTYBridgeOptions): Promise<TTYBridge> {
    if (this.bridges.has(options.instanceId)) {
      throw ErrorFactory.configurationMissing(
        'BRIDGE_INSTANCE_ID',
        'string'
      );
    }

    const bridge = createTTYBridge(options);
    this.bridges.set(options.instanceId, bridge);

    bridge.on('bridge_error', (error) => {
      LogHelpers.error('tty-bridge-manager', error, { 
        instanceId: options.instanceId
      });
      this.bridges.delete(options.instanceId);
    });

    return bridge;
  }

  async destroyBridge(instanceId: string): Promise<void> {
    const bridge = this.bridges.get(instanceId);
    if (!bridge) {
      throw new Error('Bridge not found: ' + instanceId);
    }

    await bridge.stop();
    this.bridges.delete(instanceId);
  }

  getBridge(instanceId: string): TTYBridge | undefined {
    return this.bridges.get(instanceId);
  }

  getAllBridges(): TTYBridge[] {
    return Array.from(this.bridges.values());
  }

  async stopAll(): Promise<void> {
    const stopPromises = Array.from(this.bridges.values()).map(bridge => bridge.stop());
    await Promise.all(stopPromises);
    this.bridges.clear();
  }
}

// Export singleton bridge manager
export const bridgeManager = new TTYBridgeManager();