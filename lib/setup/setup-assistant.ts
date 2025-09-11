/**
 * Development Setup Assistant
 * 
 * Provides user-friendly guidance through initial standalone setup process.
 * Validates prerequisites, dependencies, and guides users through configuration
 * with clear feedback and error handling for non-technical users.
 */

import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import * as path from 'path';
import { StandaloneConfigGenerator, generateStandaloneConfig, checkStandaloneSetup } from '../config/standalone-generator';
import { getGlobalLogger, LogHelpers } from '../utils/logger';

export interface PrerequisiteCheck {
  name: string;
  required: boolean;
  status: 'checking' | 'passed' | 'failed' | 'warning';
  message: string;
  instruction?: string;
}

export interface SetupStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message?: string;
  error?: string;
}

export interface SetupResult {
  success: boolean;
  steps: SetupStep[];
  configPath?: string;
  databasePath?: string;
  nextSteps: string[];
  errors: string[];
  warnings: string[];
}

export interface SetupOptions {
  /** Force overwrite existing configuration */
  force?: boolean;
  /** Enable debug mode with verbose logging */
  debugMode?: boolean;
  /** Custom port for development server */
  port?: number;
  /** Skip prerequisite checks (not recommended) */
  skipChecks?: boolean;
  /** Interactive mode for user prompts */
  interactive?: boolean;
}

/**
 * Development Setup Assistant Class
 * 
 * Guides users through standalone setup process with validation,
 * clear feedback, and graceful error handling.
 */
export class SetupAssistant {
  private projectRoot: string;
  private logger = getGlobalLogger().getLogger('setup-assistant');
  private configGenerator: StandaloneConfigGenerator;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = path.resolve(projectRoot);
    this.configGenerator = new StandaloneConfigGenerator(this.projectRoot);
  }

  /**
   * Run complete setup process with guided assistance
   */
  async runSetupWizard(options: SetupOptions = {}): Promise<SetupResult> {
    const result: SetupResult = {
      success: false,
      steps: [],
      nextSteps: [],
      errors: [],
      warnings: []
    };

    LogHelpers.systemEvent('setup-assistant', 'setup_start', 'Starting standalone setup wizard', { options });

    try {
      // Step 1: Check prerequisites
      if (!options.skipChecks) {
        const prereqStep = this.createStep('prerequisites', 'Checking Prerequisites', 'Validating Node.js, npm, and project requirements');
        result.steps.push(prereqStep);
        this.updateStep(prereqStep, 'running');

        const prereqResult = await this.checkPrerequisites();
        const failedPrereqs = prereqResult.filter(p => p.status === 'failed');
        
        if (failedPrereqs.length > 0) {
          this.updateStep(prereqStep, 'failed', 'Some prerequisites failed validation');
          result.errors.push(...failedPrereqs.map(p => p.message));
          return result;
        }

        const warningPrereqs = prereqResult.filter(p => p.status === 'warning');
        if (warningPrereqs.length > 0) {
          result.warnings.push(...warningPrereqs.map(p => p.message));
        }

        this.updateStep(prereqStep, 'completed', 'All prerequisites validated successfully');
      }

      // Step 2: Check existing setup
      const checkStep = this.createStep('check-existing', 'Checking Existing Setup', 'Scanning for existing configuration and database files');
      result.steps.push(checkStep);
      this.updateStep(checkStep, 'running');

      const existingSetup = await checkStandaloneSetup();
      if (existingSetup.hasConfig && !options.force) {
        this.updateStep(checkStep, 'completed', 'Existing configuration found');
        
        if (existingSetup.isStandalone) {
          result.success = true;
          result.nextSteps = [
            'Your standalone setup is already configured',
            'Run "npm run dev" to start the application',
            'Use --force flag to regenerate configuration if needed'
          ];
          return result;
        } else {
          result.warnings.push('Configuration exists but may not be for standalone mode');
        }
      } else {
        this.updateStep(checkStep, 'completed', 'Ready for new configuration');
      }

      // Step 3: Generate configuration
      const configStep = this.createStep('generate-config', 'Generating Configuration', 'Creating .env.local with SQLite and development settings');
      result.steps.push(configStep);
      this.updateStep(configStep, 'running');

      const configResult = await generateStandaloneConfig({
        force: options.force,
        debugMode: options.debugMode,
        port: options.port
      });

      if (!configResult.success) {
        this.updateStep(configStep, 'failed', configResult.error || 'Configuration generation failed');
        result.errors.push(configResult.error || 'Unknown configuration error');
        return result;
      }

      this.updateStep(configStep, 'completed', 'Configuration generated successfully');
      result.configPath = configResult.envPath;
      result.databasePath = configResult.databasePath;

      // Step 4: Validate setup
      const validateStep = this.createStep('validate-setup', 'Validating Setup', 'Testing configuration and database connectivity');
      result.steps.push(validateStep);
      this.updateStep(validateStep, 'running');

      const validationResult = await this.validateSetup();
      if (!validationResult.isValid) {
        this.updateStep(validateStep, 'failed', 'Setup validation failed');
        result.errors.push(...validationResult.errors);
        return result;
      }

      this.updateStep(validateStep, 'completed', 'Setup validation passed');

      // Step 5: Provide next steps
      result.success = true;
      result.nextSteps = [
        'Setup completed successfully! 🎉',
        '',
        'Next steps:',
        '1. Run "npm run dev" to start the application',
        '2. Open http://localhost:' + (options.port || 3000) + ' in your browser',
        '3. The application will use SQLite for data and in-memory caching',
        '',
        'Configuration files:',
        `- Environment: ${result.configPath}`,
        `- Database: ${result.databasePath}`,
        '',
        'For debugging, check the logs directory for detailed information.',
        options.debugMode ? 'Debug mode is enabled - you\'ll see verbose logging.' : 'Enable debug mode with --debug for more detailed logs.'
      ];

      LogHelpers.systemEvent('setup-assistant', 'setup_complete', 'Standalone setup completed successfully');

    } catch (error) {
      const errorMessage = `Setup failed: ${(error as Error).message}`;
      LogHelpers.error('setup-assistant', error as Error);
      result.errors.push(errorMessage);
      
      // Mark last running step as failed
      const runningStep = result.steps.find(s => s.status === 'running');
      if (runningStep) {
        this.updateStep(runningStep, 'failed', errorMessage);
      }
    }

    return result;
  }

  /**
   * Check system prerequisites and dependencies
   */
  async checkPrerequisites(): Promise<PrerequisiteCheck[]> {
    const checks: PrerequisiteCheck[] = [
      {
        name: 'Node.js Version',
        required: true,
        status: 'checking',
        message: 'Checking Node.js version...'
      },
      {
        name: 'npm Package Manager',
        required: true,
        status: 'checking',
        message: 'Checking npm availability...'
      },
      {
        name: 'Project Dependencies',
        required: true,
        status: 'checking',
        message: 'Checking package.json and node_modules...'
      },
      {
        name: 'File System Permissions',
        required: true,
        status: 'checking',
        message: 'Checking write permissions...'
      },
      {
        name: 'Project Structure',
        required: false,
        status: 'checking',
        message: 'Validating project structure...'
      }
    ];

    for (const check of checks) {
      try {
        switch (check.name) {
          case 'Node.js Version':
            await this.checkNodeVersion(check);
            break;
          case 'npm Package Manager':
            await this.checkNpmAvailable(check);
            break;
          case 'Project Dependencies':
            await this.checkProjectDependencies(check);
            break;
          case 'File System Permissions':
            await this.checkFileSystemPermissions(check);
            break;
          case 'Project Structure':
            await this.checkProjectStructure(check);
            break;
        }
      } catch (error) {
        check.status = 'failed';
        check.message = `Failed: ${(error as Error).message}`;
        LogHelpers.error('setup-assistant', error as Error, { check: check.name });
      }
    }

    return checks;
  }

  /**
   * Check if setup is valid and ready to use
   */
  async validateSetup(): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Check configuration file exists and is valid
      const envPath = path.join(this.projectRoot, '.env.local');
      if (!existsSync(envPath)) {
        errors.push('Configuration file .env.local not found');
        return { isValid: false, errors };
      }

      // Check configuration content
      const envContent = await fs.readFile(envPath, 'utf8');
      if (!envContent.includes('CLAUDE_MONITOR_STANDALONE_MODE=true')) {
        errors.push('Configuration is not set for standalone mode');
      }

      if (!envContent.includes('DATABASE_URL=file:')) {
        errors.push('Database is not configured for SQLite');
      }

      // Check database directory is writable
      const dbUrlMatch = envContent.match(/DATABASE_URL=file:(.+)/);
      if (dbUrlMatch) {
        const dbPath = dbUrlMatch[1];
        const dbDir = path.dirname(path.resolve(this.projectRoot, dbPath));
        
        try {
          await fs.access(dbDir, fs.constants.W_OK);
        } catch {
          try {
            await fs.mkdir(dbDir, { recursive: true });
          } catch (error) {
            errors.push(`Cannot create database directory: ${(error as Error).message}`);
          }
        }
      }

      // Check logs directory is writable
      const logPathMatch = envContent.match(/CLAUDE_MONITOR_LOG_FILE=(.+)/);
      if (logPathMatch) {
        const logPath = logPathMatch[1];
        const logDir = path.dirname(path.resolve(this.projectRoot, logPath));
        
        try {
          await fs.access(logDir, fs.constants.W_OK);
        } catch {
          try {
            await fs.mkdir(logDir, { recursive: true });
          } catch (error) {
            errors.push(`Cannot create logs directory: ${(error as Error).message}`);
          }
        }
      }

    } catch (error) {
      errors.push(`Validation error: ${(error as Error).message}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get current setup status
   */
  async getSetupStatus(): Promise<{
    isSetup: boolean;
    isStandalone: boolean;
    configExists: boolean;
    databaseExists: boolean;
    messages: string[];
  }> {
    const setup = await checkStandaloneSetup();
    const envPath = path.join(this.projectRoot, '.env.local');
    
    let databaseExists = false;
    if (setup.hasConfig) {
      try {
        const envContent = await fs.readFile(envPath, 'utf8');
        const dbUrlMatch = envContent.match(/DATABASE_URL=file:(.+)/);
        if (dbUrlMatch) {
          const dbPath = dbUrlMatch[1];
          const fullDbPath = path.isAbsolute(dbPath) ? dbPath : path.join(this.projectRoot, dbPath);
          databaseExists = existsSync(fullDbPath);
        }
      } catch {
        // Ignore errors reading config file
      }
    }

    return {
      isSetup: setup.isStandalone && setup.hasConfig,
      isStandalone: setup.isStandalone,
      configExists: setup.hasConfig,
      databaseExists,
      messages: setup.messages
    };
  }

  // Private helper methods

  private createStep(id: string, name: string, description: string): SetupStep {
    return {
      id,
      name,
      description,
      status: 'pending'
    };
  }

  private updateStep(step: SetupStep, status: SetupStep['status'], message?: string, error?: string): void {
    step.status = status;
    if (message) step.message = message;
    if (error) step.error = error;
  }

  private async checkNodeVersion(check: PrerequisiteCheck): Promise<void> {
    const version = process.version;
    const majorVersion = parseInt(version.substring(1).split('.')[0]);
    
    if (majorVersion < 18) {
      check.status = 'failed';
      check.message = `Node.js ${version} is too old. Requires Node.js 18 or later.`;
      check.instruction = 'Please upgrade Node.js to version 18 or later from https://nodejs.org/';
    } else {
      check.status = 'passed';
      check.message = `Node.js ${version} ✓`;
    }
  }

  private async checkNpmAvailable(check: PrerequisiteCheck): Promise<void> {
    try {
      const { spawn } = await import('child_process');
      
      await new Promise<void>((resolve, reject) => {
        const npm = spawn('npm', ['--version'], { stdio: 'pipe' });
        npm.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`npm command failed with code ${code}`));
          }
        });
        npm.on('error', reject);
      });

      check.status = 'passed';
      check.message = 'npm is available ✓';
    } catch (error) {
      check.status = 'failed';
      check.message = 'npm is not available or not working';
      check.instruction = 'Please install npm or ensure it\'s in your PATH';
    }
  }

  private async checkProjectDependencies(check: PrerequisiteCheck): Promise<void> {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const nodeModulesPath = path.join(this.projectRoot, 'node_modules');

    if (!existsSync(packageJsonPath)) {
      check.status = 'failed';
      check.message = 'package.json not found in project root';
      check.instruction = 'Ensure you\'re running this from the correct project directory';
      return;
    }

    if (!existsSync(nodeModulesPath)) {
      check.status = 'warning';
      check.message = 'node_modules not found - run "npm install" first';
      check.instruction = 'Run "npm install" to install dependencies before setup';
      return;
    }

    check.status = 'passed';
    check.message = 'Project dependencies available ✓';
  }

  private async checkFileSystemPermissions(check: PrerequisiteCheck): Promise<void> {
    try {
      // Test writing to project root
      const testFile = path.join(this.projectRoot, '.setup-test');
      await fs.writeFile(testFile, 'test', 'utf8');
      await fs.unlink(testFile);

      // Test creating directories
      const testDir = path.join(this.projectRoot, '.setup-test-dir');
      await fs.mkdir(testDir);
      await fs.rmdir(testDir);

      check.status = 'passed';
      check.message = 'File system permissions OK ✓';
    } catch (error) {
      check.status = 'failed';
      check.message = `Insufficient file system permissions: ${(error as Error).message}`;
      check.instruction = 'Ensure you have write permissions to the project directory';
    }
  }

  private async checkProjectStructure(check: PrerequisiteCheck): Promise<void> {
    const requiredDirs = ['lib', 'prisma'];
    const missingDirs = [];

    for (const dir of requiredDirs) {
      if (!existsSync(path.join(this.projectRoot, dir))) {
        missingDirs.push(dir);
      }
    }

    if (missingDirs.length > 0) {
      check.status = 'warning';
      check.message = `Some expected directories missing: ${missingDirs.join(', ')}`;
    } else {
      check.status = 'passed';
      check.message = 'Project structure looks good ✓';
    }
  }
}

/**
 * Convenience function to run setup wizard
 */
export async function runStandaloneSetup(options: SetupOptions = {}): Promise<SetupResult> {
  const assistant = new SetupAssistant();
  return await assistant.runSetupWizard(options);
}

/**
 * Convenience function to check setup status
 */
export async function getStandaloneSetupStatus() {
  const assistant = new SetupAssistant();
  return await assistant.getSetupStatus();
}

/**
 * Convenience function to validate existing setup
 */
export async function validateStandaloneSetup(): Promise<boolean> {
  try {
    const assistant = new SetupAssistant();
    const validation = await assistant.validateSetup();
    return validation.isValid;
  } catch (error) {
    LogHelpers.error('setup-assistant', error as Error);
    return false;
  }
}