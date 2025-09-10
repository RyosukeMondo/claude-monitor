/**
 * TCP Command Server
 * 
 * Modern TCP server implementation for forwarding commands to TTY bridge instances.
 * Provides network interface for programmatic Claude Code interaction with connection management,
 * rate limiting, and comprehensive error handling.
 * 
 * Architecture: TCP Client -> Command Validation -> Rate Limiting -> TTY Bridge -> Claude Code Process
 */

import { EventEmitter } from 'events';
import { Server, Socket, createServer } from 'net';
import { 
  TCPCommand, 
  TCPResponse, 
  validateTCPCommand 
} from '../types/launcher';
import { LogHelpers } from '../utils/logger';
import { ErrorFactory } from '../utils/errors';

export interface TCPServerOptions {
  port: number;
  instanceId: string;
  maxConnections?: number;
  rateLimitRequests?: number;
  rateLimitWindow?: number;
  connectionTimeout?: number;
  commandTimeout?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export interface TCPServerInfo {
  port: number;
  instanceId: string;
  isListening: boolean;
  connectionCount: number;
  totalRequests: number;
  startTime: Date;
  lastActivity?: Date;
}

export interface CommandHandler {
  (command: TCPCommand): Promise<TCPResponse>;
}

export interface ClientConnection {
  socket: Socket;
  id: string;
  connectedAt: Date;
  requestCount: number;
  lastRequest: Date;
  rateLimitBucket: number[];
}

export interface TCPServerEvents {
  'server_ready': [TCPServerInfo];
  'server_error': [Error];
  'client_connected': [ClientConnection];
  'client_disconnected': [string];
  'command_received': [TCPCommand, string];
  'command_processed': [TCPCommand, TCPResponse, string];
  'rate_limit_exceeded': [string, number];
  'connection_timeout': [string];
}

/**
 * TCP Command Server
 * Manages TCP connections and forwards commands to registered handler
 */
export class TCPServer extends EventEmitter {
  // Type-safe event emitter methods
  on<K extends keyof TCPServerEvents>(event: K, listener: (...args: TCPServerEvents[K]) => void): this {
    return super.on(event, listener);
  }

  emit<K extends keyof TCPServerEvents>(event: K, ...args: TCPServerEvents[K]): boolean {
    return super.emit(event, ...args);
  }

  private server: Server | null = null;
  private connections = new Map<string, ClientConnection>();
  private isListening = false;
  private options: Required<TCPServerOptions>;
  private commandHandler: CommandHandler | null = null;
  private totalRequests = 0;
  private startTime: Date | null = null;
  private rateLimitCleanupInterval: NodeJS.Timeout | null = null;

  constructor(options: TCPServerOptions) {
    super();
    this.options = {
      maxConnections: 10,
      rateLimitRequests: 100,
      rateLimitWindow: 60000, // 1 minute
      connectionTimeout: 300000, // 5 minutes
      commandTimeout: 5000,
      logLevel: 'info',
      ...options
    };
  }

  /**
   * Start the TCP server
   */
  async start(commandHandler: CommandHandler): Promise<TCPServerInfo> {
    if (this.isListening) {
      throw ErrorFactory.configurationMissing(
        'TCP_SERVER_ALREADY_RUNNING',
        'object'
      );
    }

    this.commandHandler = commandHandler;

    try {
      LogHelpers.info('tcp-server', 'Starting TCP command server', {
        port: this.options.port,
        instanceId: this.options.instanceId,
        maxConnections: this.options.maxConnections
      });

      await this.startServer();
      this.startRateLimitCleanup();

      const serverInfo: TCPServerInfo = {
        port: this.options.port,
        instanceId: this.options.instanceId,
        isListening: this.isListening,
        connectionCount: this.connections.size,
        totalRequests: this.totalRequests,
        startTime: this.startTime!
      };

      this.emit('server_ready', serverInfo);
      LogHelpers.info('tcp-server', 'TCP server started successfully', serverInfo);

      return serverInfo;
    } catch (error) {
      const serverError = ErrorFactory.configurationMissing(
        'TCP_SERVER_START_FAILED',
        'object'
      );
      this.emit('server_error', serverError);
      throw serverError;
    }
  }

  /**
   * Stop the TCP server and cleanup resources
   */
  async stop(): Promise<void> {
    try {
      LogHelpers.info('tcp-server', 'Stopping TCP server', { 
        instanceId: this.options.instanceId,
        connectionCount: this.connections.size
      });

      // Clear rate limit cleanup
      if (this.rateLimitCleanupInterval) {
        clearInterval(this.rateLimitCleanupInterval);
        this.rateLimitCleanupInterval = null;
      }

      // Close all client connections
      for (const [clientId, connection] of this.connections) {
        connection.socket.end();
        this.connections.delete(clientId);
      }

      // Close the server
      if (this.server) {
        await new Promise<void>((resolve) => {
          this.server!.close(() => {
            this.isListening = false;
            resolve();
          });
        });
        this.server = null;
      }

      this.commandHandler = null;
      this.startTime = null;

      LogHelpers.info('tcp-server', 'TCP server stopped successfully', { 
        instanceId: this.options.instanceId 
      });
    } catch (error) {
      const stopError = ErrorFactory.recoveryActionFailed(
        'stop_tcp_server',
        'cleanup',
        1,
        (error as Error).message
      );
      LogHelpers.error('tcp-server', stopError);
      throw stopError;
    }
  }

  /**
   * Get current server information
   */
  getServerInfo(): TCPServerInfo | null {
    if (!this.isListening || !this.startTime) {
      return null;
    }

    const lastActivity = this.connections.size > 0 
      ? new Date(Math.max(...Array.from(this.connections.values()).map(c => c.lastRequest.getTime())))
      : undefined;

    return {
      port: this.options.port,
      instanceId: this.options.instanceId,
      isListening: this.isListening,
      connectionCount: this.connections.size,
      totalRequests: this.totalRequests,
      startTime: this.startTime,
      lastActivity
    };
  }

  /**
   * Check if server is healthy and responsive
   */
  isHealthy(): boolean {
    return this.isListening && this.server !== null && this.commandHandler !== null;
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): { activeConnections: number; totalRequests: number; averageRequestsPerConnection: number } {
    const activeConnections = this.connections.size;
    const totalRequests = this.totalRequests;
    const averageRequestsPerConnection = activeConnections > 0 ? totalRequests / activeConnections : 0;

    return { activeConnections, totalRequests, averageRequestsPerConnection };
  }

  /**
   * Start the TCP server
   */
  private async startServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = createServer((socket) => {
          this.handleClientConnection(socket);
        });

        this.server.on('error', (error) => {
          LogHelpers.error('tcp-server', error);
          const serverError = ErrorFactory.configurationMissing(
            'TCP_SERVER_PORT',
            'number'
          );
          this.emit('server_error', serverError);
          reject(serverError);
        });

        this.server.listen(this.options.port, 'localhost', () => {
          this.isListening = true;
          this.startTime = new Date();
          LogHelpers.info('tcp-server', 'TCP server listening', { 
            port: this.options.port,
            bindAddress: 'localhost'
          });
          resolve();
        });

      } catch (error) {
        reject(ErrorFactory.configurationMissing(
          'TCP_SERVER_CREATE_FAILED',
          'object'
        ));
      }
    });
  }

  /**
   * Handle new client connection
   */
  private handleClientConnection(socket: Socket): void {
    // Check connection limit
    if (this.connections.size >= this.options.maxConnections) {
      LogHelpers.warning('tcp-server', 'Connection limit exceeded', {
        maxConnections: this.options.maxConnections,
        currentConnections: this.connections.size
      });
      socket.end();
      return;
    }

    const clientId = this.generateClientId();
    const connection: ClientConnection = {
      socket,
      id: clientId,
      connectedAt: new Date(),
      requestCount: 0,
      lastRequest: new Date(),
      rateLimitBucket: []
    };

    this.connections.set(clientId, connection);

    LogHelpers.debug('tcp-server', 'Client connected', {
      clientId,
      connectionCount: this.connections.size,
      remoteAddress: socket.remoteAddress
    });

    this.emit('client_connected', connection);

    // Set connection timeout
    const connectionTimer = setTimeout(() => {
      LogHelpers.debug('tcp-server', 'Client connection timeout', { clientId });
      this.emit('connection_timeout', clientId);
      this.disconnectClient(clientId);
    }, this.options.connectionTimeout);

    // Handle incoming data
    socket.on('data', async (data) => {
      try {
        // Reset connection timer on activity
        connectionTimer.refresh();
        
        const commandStr = data.toString().trim();
        if (!commandStr) return;

        // Check rate limiting
        if (!this.checkRateLimit(connection)) {
          const errorResponse: TCPResponse = {
            success: false,
            message: 'Rate limit exceeded',
            timestamp: new Date()
          };
          socket.write(JSON.stringify(errorResponse) + '\n');
          this.emit('rate_limit_exceeded', clientId, connection.requestCount);
          return;
        }

        // Parse and validate command
        const command = JSON.parse(commandStr) as TCPCommand;
        const validation = validateTCPCommand(command);
        if (!validation.success) {
          const errorResponse: TCPResponse = {
            success: false,
            message: 'Invalid command format: ' + JSON.stringify(validation.error.issues),
            timestamp: new Date()
          };
          socket.write(JSON.stringify(errorResponse) + '\n');
          return;
        }

        connection.requestCount++;
        connection.lastRequest = new Date();
        this.totalRequests++;

        this.emit('command_received', command, clientId);

        // Process command with timeout
        const response = await Promise.race([
          this.processCommand(command),
          this.createTimeoutPromise()
        ]);

        socket.write(JSON.stringify(response) + '\n');
        this.emit('command_processed', command, response, clientId);

      } catch (error) {
        LogHelpers.error('tcp-server', error as Error, { 
          clientId,
          data: data.toString()
        });
        
        const errorResponse: TCPResponse = {
          success: false,
          message: error instanceof Error ? error.message : 'Command processing failed',
          timestamp: new Date()
        };
        socket.write(JSON.stringify(errorResponse) + '\n');
      }
    });

    // Handle client disconnect
    socket.on('close', () => {
      clearTimeout(connectionTimer);
      this.disconnectClient(clientId);
    });

    socket.on('error', (error) => {
      LogHelpers.error('tcp-server', error, { clientId });
      clearTimeout(connectionTimer);
      this.disconnectClient(clientId);
    });
  }

  /**
   * Process command using registered handler
   */
  private async processCommand(command: TCPCommand): Promise<TCPResponse> {
    if (!this.commandHandler) {
      throw ErrorFactory.recoveryActionFailed(
        'process_command',
        'handler_check',
        1,
        'No command handler registered'
      );
    }

    try {
      return await this.commandHandler(command);
    } catch (error) {
      throw ErrorFactory.recoveryActionFailed(
        'process_command',
        command.type,
        1,
        (error as Error).message
      );
    }
  }

  /**
   * Create timeout promise for command processing
   */
  private createTimeoutPromise(): Promise<TCPResponse> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(ErrorFactory.configurationMissing(
          'COMMAND_TIMEOUT',
          'number'
        ));
      }, this.options.commandTimeout);
    });
  }

  /**
   * Check rate limiting for client connection
   */
  private checkRateLimit(connection: ClientConnection): boolean {
    const now = Date.now();
    const windowStart = now - this.options.rateLimitWindow;

    // Clean old requests
    connection.rateLimitBucket = connection.rateLimitBucket.filter(
      timestamp => timestamp > windowStart
    );

    // Check if under limit
    if (connection.rateLimitBucket.length >= this.options.rateLimitRequests) {
      return false;
    }

    // Add current request
    connection.rateLimitBucket.push(now);
    return true;
  }

  /**
   * Disconnect client and cleanup
   */
  private disconnectClient(clientId: string): void {
    const connection = this.connections.get(clientId);
    if (!connection) return;

    this.connections.delete(clientId);
    
    LogHelpers.debug('tcp-server', 'Client disconnected', { 
      clientId,
      connectionCount: this.connections.size,
      requestCount: connection.requestCount,
      connectionDuration: Date.now() - connection.connectedAt.getTime()
    });

    this.emit('client_disconnected', clientId);
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start periodic cleanup of rate limiting buckets
   */
  private startRateLimitCleanup(): void {
    this.rateLimitCleanupInterval = setInterval(() => {
      const now = Date.now();
      const windowStart = now - this.options.rateLimitWindow;

      for (const connection of this.connections.values()) {
        connection.rateLimitBucket = connection.rateLimitBucket.filter(
          timestamp => timestamp > windowStart
        );
      }
    }, this.options.rateLimitWindow / 4); // Cleanup every quarter of the window
  }
}

/**
 * Factory function to create TCP server instances
 */
export function createTCPServer(options: TCPServerOptions): TCPServer {
  return new TCPServer(options);
}

/**
 * Utility function to find available port for TCP server
 */
export async function findAvailableTCPPort(startPort: number = 9999, endPort: number = 10099): Promise<number> {
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
    'AVAILABLE_TCP_PORT',
    'number'
  );
}

/**
 * TCP Server Manager for handling multiple TCP server instances
 */
export class TCPServerManager {
  private servers = new Map<string, TCPServer>();

  async createServer(options: TCPServerOptions, commandHandler: CommandHandler): Promise<TCPServer> {
    if (this.servers.has(options.instanceId)) {
      throw ErrorFactory.configurationMissing(
        'TCP_SERVER_INSTANCE_ID',
        'string'
      );
    }

    const server = createTCPServer(options);
    this.servers.set(options.instanceId, server);

    server.on('server_error', (error) => {
      LogHelpers.error('tcp-server-manager', error, { 
        instanceId: options.instanceId
      });
      this.servers.delete(options.instanceId);
    });

    await server.start(commandHandler);
    return server;
  }

  async destroyServer(instanceId: string): Promise<void> {
    const server = this.servers.get(instanceId);
    if (!server) {
      throw new Error('TCP server not found: ' + instanceId);
    }

    await server.stop();
    this.servers.delete(instanceId);
  }

  getServer(instanceId: string): TCPServer | undefined {
    return this.servers.get(instanceId);
  }

  getAllServers(): TCPServer[] {
    return Array.from(this.servers.values());
  }

  async stopAll(): Promise<void> {
    const stopPromises = Array.from(this.servers.values()).map(server => server.stop());
    await Promise.all(stopPromises);
    this.servers.clear();
  }

  getManagerStats(): { totalServers: number; totalConnections: number; totalRequests: number } {
    const servers = this.getAllServers();
    const totalServers = servers.length;
    const totalConnections = servers.reduce((sum, server) => {
      const info = server.getServerInfo();
      return sum + (info?.connectionCount || 0);
    }, 0);
    const totalRequests = servers.reduce((sum, server) => {
      const info = server.getServerInfo();
      return sum + (info?.totalRequests || 0);
    }, 0);

    return { totalServers, totalConnections, totalRequests };
  }
}

// Export singleton TCP server manager
export const tcpServerManager = new TCPServerManager();