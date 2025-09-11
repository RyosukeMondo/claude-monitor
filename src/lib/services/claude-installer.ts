/**
 * Claude Code CLI Installer Service
 * 
 * Handles automated Claude Code CLI setup within containerized environment.
 * Provides detection, installation, and validation of Claude Code CLI with
 * authentication status checking and MCP tools installation.
 */

import { promises as fs } from 'fs';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as os from 'os';
import { LogHelpers } from '../utils/logger';
import { ErrorHelpers } from '../utils/error-handler';
import { ErrorFactory, MonitorError } from '../utils/errors';
import { 
  InstallationStatus, 
  AuthStatus, 
  InstallationStatusSchema,
  AuthStatusSchema 
} from '../types/launcher';

const execAsync = promisify(exec);

/**
 * Claude Code Installation Error
 */
export class ClaudeInstallationError extends MonitorError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, {
      code: 'CLAUDE_INSTALL_ERROR',
      component: 'claude-installer',
      context,
      recoverable: true
    });
  }
}

/**
 * Claude Code CLI Installer Service
 */
export class ClaudeInstallerService {
  private readonly logger = LogHelpers.createLogger('claude-installer');
  private readonly homeDir: string;
  private readonly claudeDir: string;
  private installationCache: InstallationStatus | null = null;
  private lastCheckTime: number = 0;
  private readonly CACHE_TTL = 30000; // 30 seconds

  constructor() {
    this.homeDir = os.homedir();
    this.claudeDir = path.join(this.homeDir, '.claude');
  }

  /**
   * Check Claude Code CLI installation status
   */
  async checkClaude(): Promise<InstallationStatus> {
    const now = Date.now();
    
    // Return cached result if recent
    if (this.installationCache && (now - this.lastCheckTime) < this.CACHE_TTL) {
      return this.installationCache;
    }

    try {
      this.logger.info('Checking Claude Code CLI installation status');
      
      const status: InstallationStatus = {
        claudeInstalled: false,
        mcpToolsInstalled: false,
        authenticationStatus: 'unknown' as AuthStatus,
        errorMessages: [],
        warnings: [],
        lastChecked: new Date(),
        installationMethods: []
      };

      // Check if Claude Code is installed and get version
      const claudeCheck = await this.checkClaudeInstallation();
      status.claudeInstalled = claudeCheck.installed;
      status.claudeVersion = claudeCheck.version;
      status.claudePath = claudeCheck.path;
      status.installationMethods = claudeCheck.methods;

      if (!claudeCheck.installed) {
        status.errorMessages.push('Claude Code CLI not found in system PATH');
        status.warnings.push('Claude Code CLI installation required for launcher functionality');
      }

      // Check MCP tools installation
      const mcpCheck = await this.checkMCPToolsInstallation();
      status.mcpToolsInstalled = mcpCheck.installed;
      status.mcpToolsVersion = mcpCheck.version;

      if (!mcpCheck.installed && claudeCheck.installed) {
        status.warnings.push('Spec-workflow MCP tools not detected - enhanced functionality may be limited');
      }

      // Check authentication status
      if (claudeCheck.installed) {
        const authCheck = await this.checkAuthenticationStatus();
        status.authenticationStatus = authCheck.status;
        status.authenticationUrl = authCheck.url;
        
        if (authCheck.status === 'required') {
          status.warnings.push('Claude Code authentication required for first-time setup');
        }
      }

      // Cache the result
      this.installationCache = status;
      this.lastCheckTime = now;

      this.logger.info('Claude Code installation check completed', {
        installed: status.claudeInstalled,
        version: status.claudeVersion,
        authStatus: status.authenticationStatus,
        warnings: status.warnings.length,
        errors: status.errorMessages.length
      });

      return status;

    } catch (error) {
      const errorMsg = 'Failed to check Claude Code installation status';
      this.logger.error(errorMsg, { error: ErrorHelpers.toSerializable(error) });
      
      throw new ClaudeInstallationError(errorMsg, {
        originalError: error,
        operation: 'check'
      });
    }
  }

  /**
   * Install Claude Code CLI
   */
  async installClaude(): Promise<void> {
    try {
      this.logger.info('Starting Claude Code CLI installation');

      // Clear cache to force fresh check
      this.installationCache = null;

      // Check if already installed
      const currentStatus = await this.checkClaude();
      if (currentStatus.claudeInstalled) {
        this.logger.info('Claude Code CLI already installed', { 
          version: currentStatus.claudeVersion 
        });
        return;
      }

      // Try installation methods in order of preference
      const methods = [
        () => this.installViaCurl(),
        () => this.installViaWget(),
        () => this.installViaPackageManager()
      ];

      let lastError: Error | null = null;
      let installed = false;

      for (const method of methods) {
        try {
          await method();
          
          // Verify installation
          const verifyStatus = await this.checkClaude();
          if (verifyStatus.claudeInstalled) {
            installed = true;
            this.logger.info('Claude Code CLI installation successful', {
              version: verifyStatus.claudeVersion,
              method: method.name
            });
            break;
          }
        } catch (error) {
          lastError = error as Error;
          this.logger.warn(`Installation method ${method.name} failed`, {
            error: ErrorHelpers.toSerializable(error)
          });
        }
      }

      if (!installed) {
        throw new ClaudeInstallationError(
          'All installation methods failed',
          {
            lastError: ErrorHelpers.toSerializable(lastError),
            attemptedMethods: methods.map(m => m.name)
          }
        );
      }

    } catch (error) {
      const errorMsg = 'Claude Code CLI installation failed';
      this.logger.error(errorMsg, { error: ErrorHelpers.toSerializable(error) });
      
      if (error instanceof ClaudeInstallationError) {
        throw error;
      }
      
      throw new ClaudeInstallationError(errorMsg, {
        originalError: error,
        operation: 'install'
      });
    }
  }

  /**
   * Setup MCP tools for enhanced functionality
   */
  async setupMCPTools(): Promise<void> {
    try {
      this.logger.info('Setting up MCP tools');

      // Ensure Claude directory exists
      await fs.mkdir(this.claudeDir, { recursive: true });

      // Install spec-workflow MCP tools
      await this.installSpecWorkflowMCP();

      this.logger.info('MCP tools setup completed');

    } catch (error) {
      const errorMsg = 'MCP tools setup failed';
      this.logger.error(errorMsg, { error: ErrorHelpers.toSerializable(error) });
      
      throw new ClaudeInstallationError(errorMsg, {
        originalError: error,
        operation: 'mcp-setup'
      });
    }
  }

  /**
   * Validate authentication status
   */
  async validateAuthentication(): Promise<AuthStatus> {
    try {
      this.logger.info('Validating Claude Code authentication');

      const authCheck = await this.checkAuthenticationStatus();
      
      this.logger.info('Authentication validation completed', {
        status: authCheck.status
      });

      return authCheck.status;

    } catch (error) {
      this.logger.error('Authentication validation failed', {
        error: ErrorHelpers.toSerializable(error)
      });
      
      return 'unknown';
    }
  }

  /**
   * Get installation instructions for manual setup
   */
  getManualInstallationInstructions(): string[] {
    return [
      '# Manual Claude Code CLI Installation',
      '',
      '## Option 1: Using curl (recommended)',
      'curl -fsSL https://claude.ai/install.sh | sh',
      '',
      '## Option 2: Using wget',
      'wget -qO- https://claude.ai/install.sh | sh',
      '',
      '## Option 3: Direct download',
      '1. Visit https://claude.ai/download',
      '2. Download the appropriate binary for your platform',
      '3. Add to PATH and make executable',
      '',
      '## Verify installation',
      'claude --version',
      '',
      '## Authenticate (first time)',
      'claude auth login',
      '',
      '## Container-specific notes',
      '- Ensure the installation persists across container restarts',
      '- Consider mounting ~/.claude directory as a volume',
      '- Authentication may require browser access outside container'
    ];
  }

  // Private helper methods

  private async checkClaudeInstallation(): Promise<{
    installed: boolean;
    version?: string;
    path?: string;
    methods: string[];
  }> {
    try {
      // Check if claude command exists
      const { stdout } = await execAsync('which claude');
      const claudePath = stdout.trim();

      if (claudePath) {
        // Get version
        try {
          const { stdout: versionOutput } = await execAsync('claude --version');
          const version = versionOutput.trim();
          
          return {
            installed: true,
            version,
            path: claudePath,
            methods: ['system-path']
          };
        } catch {
          // Command exists but version check failed
          return {
            installed: true,
            path: claudePath,
            methods: ['system-path']
          };
        }
      }
    } catch {
      // Command not found
    }

    // Check common installation paths
    const commonPaths = [
      '/usr/local/bin/claude',
      '/usr/bin/claude',
      path.join(this.homeDir, '.local/bin/claude'),
      path.join(this.homeDir, 'bin/claude')
    ];

    for (const claudePath of commonPaths) {
      try {
        await fs.access(claudePath, fs.constants.X_OK);
        return {
          installed: true,
          path: claudePath,
          methods: ['direct-path']
        };
      } catch {
        // Path doesn't exist or not executable
      }
    }

    return {
      installed: false,
      methods: ['curl', 'wget', 'package-manager']
    };
  }

  private async checkMCPToolsInstallation(): Promise<{
    installed: boolean;
    version?: string;
  }> {
    try {
      // Check for spec-workflow MCP configuration
      const mcpConfigPath = path.join(this.claudeDir, 'claude_desktop_config.json');
      
      try {
        const configContent = await fs.readFile(mcpConfigPath, 'utf-8');
        const config = JSON.parse(configContent);
        
        // Check if spec-workflow MCP is configured
        if (config.mcpServers && config.mcpServers['spec-workflow']) {
          return {
            installed: true,
            version: 'configured'
          };
        }
      } catch {
        // Config file doesn't exist or invalid JSON
      }

      return { installed: false };

    } catch (error) {
      this.logger.warn('Failed to check MCP tools installation', {
        error: ErrorHelpers.toSerializable(error)
      });
      return { installed: false };
    }
  }

  private async checkAuthenticationStatus(): Promise<{
    status: AuthStatus;
    url?: string;
  }> {
    try {
      // Try to run a simple claude command that requires authentication
      const { stdout, stderr } = await execAsync('claude auth status', { timeout: 10000 });
      
      if (stdout.includes('authenticated') || stdout.includes('logged in')) {
        return { status: 'authenticated' };
      }
      
      if (stdout.includes('not authenticated') || stderr.includes('login required')) {
        return { 
          status: 'required',
          url: 'https://claude.ai/login'
        };
      }

      return { status: 'unknown' };

    } catch (error) {
      const errorStr = String(error);
      
      if (errorStr.includes('command not found')) {
        return { status: 'unknown' };
      }
      
      if (errorStr.includes('not authenticated') || errorStr.includes('login')) {
        return { 
          status: 'required',
          url: 'https://claude.ai/login'
        };
      }

      this.logger.warn('Failed to check authentication status', {
        error: ErrorHelpers.toSerializable(error)
      });
      
      return { status: 'unknown' };
    }
  }

  private async installViaCurl(): Promise<void> {
    this.logger.info('Attempting installation via curl');
    
    const { stdout, stderr } = await execAsync(
      'curl -fsSL https://claude.ai/install.sh | sh',
      { timeout: 60000 }
    );
    
    if (stderr) {
      this.logger.warn('Curl installation warnings', { stderr });
    }
    
    this.logger.info('Curl installation completed', { stdout });
  }

  private async installViaWget(): Promise<void> {
    this.logger.info('Attempting installation via wget');
    
    const { stdout, stderr } = await execAsync(
      'wget -qO- https://claude.ai/install.sh | sh',
      { timeout: 60000 }
    );
    
    if (stderr) {
      this.logger.warn('Wget installation warnings', { stderr });
    }
    
    this.logger.info('Wget installation completed', { stdout });
  }

  private async installViaPackageManager(): Promise<void> {
    this.logger.info('Attempting installation via package manager');
    
    // Try different package managers
    const packageManagers = [
      'npm install -g @anthropic/claude-cli',
      'yarn global add @anthropic/claude-cli',
      'snap install claude-cli',
      'brew install claude-cli'
    ];

    let lastError: Error | null = null;

    for (const command of packageManagers) {
      try {
        const { stdout, stderr } = await execAsync(command, { timeout: 120000 });
        
        if (stderr) {
          this.logger.warn(`Package manager warnings for ${command}`, { stderr });
        }
        
        this.logger.info(`Package manager installation completed with ${command}`, { stdout });
        return;
        
      } catch (error) {
        lastError = error as Error;
        this.logger.debug(`Package manager ${command} failed`, {
          error: ErrorHelpers.toSerializable(error)
        });
      }
    }

    throw new Error(`All package managers failed. Last error: ${lastError?.message}`);
  }

  private async installSpecWorkflowMCP(): Promise<void> {
    try {
      this.logger.info('Installing spec-workflow MCP tools');

      // Create MCP configuration if it doesn't exist
      const mcpConfigPath = path.join(this.claudeDir, 'claude_desktop_config.json');
      
      let config: any = {};
      try {
        const existingConfig = await fs.readFile(mcpConfigPath, 'utf-8');
        config = JSON.parse(existingConfig);
      } catch {
        // Config doesn't exist, start with empty
      }

      // Ensure mcpServers section exists
      if (!config.mcpServers) {
        config.mcpServers = {};
      }

      // Add spec-workflow MCP configuration
      config.mcpServers['spec-workflow'] = {
        command: 'node',
        args: [path.join(__dirname, '../../mcp-servers/spec-workflow/index.js')],
        env: {
          NODE_ENV: process.env.NODE_ENV || 'production'
        }
      };

      // Write updated configuration
      await fs.writeFile(mcpConfigPath, JSON.stringify(config, null, 2));
      
      this.logger.info('Spec-workflow MCP tools configured successfully');

    } catch (error) {
      this.logger.error('Failed to install spec-workflow MCP tools', {
        error: ErrorHelpers.toSerializable(error)
      });
      throw error;
    }
  }
}

// Export singleton instance for convenience
export const claudeInstaller = new ClaudeInstallerService();