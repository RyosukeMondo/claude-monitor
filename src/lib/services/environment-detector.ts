/**
 * Environment Detection Service
 * 
 * Automatically detects whether the application is running in Docker container
 * or standalone mode to enable appropriate configuration and service selection.
 * 
 * Detection methods:
 * 1. Docker-specific filesystem indicators
 * 2. Container environment variables
 * 3. Process and cgroup analysis
 * 4. Network configuration patterns
 */

import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import { hostname } from 'os';

export type RuntimeEnvironment = 'docker' | 'standalone';

export interface EnvironmentDetectionResult {
  environment: RuntimeEnvironment;
  confidence: number; // 0-1 confidence score
  indicators: string[]; // List of detection indicators found
  recommendations?: string[]; // Optional setup recommendations
}

export interface EnvironmentConfiguration {
  database: {
    type: 'sqlite' | 'postgresql';
    url: string;
  };
  cache: {
    type: 'memory' | 'redis';
    url?: string;
  };
  logging: {
    level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';
    enableFileLogging: boolean;
  };
  development: {
    autoSetup: boolean;
    showStartupInfo: boolean;
  };
}

class EnvironmentDetector {
  private static instance: EnvironmentDetector;
  private detectionResult: EnvironmentDetectionResult | null = null;
  private configuration: EnvironmentConfiguration | null = null;

  private constructor() {}

  public static getInstance(): EnvironmentDetector {
    if (!EnvironmentDetector.instance) {
      EnvironmentDetector.instance = new EnvironmentDetector();
    }
    return EnvironmentDetector.instance;
  }

  /**
   * Detect the current runtime environment
   */
  public async detectEnvironment(): Promise<EnvironmentDetectionResult> {
    if (this.detectionResult) {
      return this.detectionResult;
    }

    const indicators: string[] = [];
    let dockerScore = 0;
    let standaloneScore = 0;

    // 1. Check for Docker-specific filesystem indicators
    const dockerfsChecks = await this.checkDockerFilesystem();
    dockerScore += dockerfsChecks.score;
    indicators.push(...dockerfsChecks.indicators);

    // 2. Check environment variables
    const envChecks = this.checkEnvironmentVariables();
    dockerScore += envChecks.dockerScore;
    standaloneScore += envChecks.standaloneScore;
    indicators.push(...envChecks.indicators);

    // 3. Check process and cgroup information
    const processChecks = await this.checkProcessInfo();
    dockerScore += processChecks.score;
    indicators.push(...processChecks.indicators);

    // 4. Check network configuration
    const networkChecks = this.checkNetworkConfiguration();
    dockerScore += networkChecks.dockerScore;
    standaloneScore += networkChecks.standaloneScore;
    indicators.push(...networkChecks.indicators);

    // 5. Check for development vs production patterns
    const devChecks = this.checkDevelopmentPatterns();
    standaloneScore += devChecks.score;
    indicators.push(...devChecks.indicators);

    // Determine environment based on scores
    const totalDockerScore = Math.min(dockerScore, 10);
    const totalStandaloneScore = Math.min(standaloneScore, 10);
    
    const environment: RuntimeEnvironment = totalDockerScore > totalStandaloneScore ? 'docker' : 'standalone';
    const confidence = Math.max(totalDockerScore, totalStandaloneScore) / 10;

    this.detectionResult = {
      environment,
      confidence,
      indicators,
      recommendations: this.generateRecommendations(environment, indicators)
    };

    return this.detectionResult;
  }

  /**
   * Generate environment-appropriate configuration
   */
  public async generateConfiguration(environment?: RuntimeEnvironment): Promise<EnvironmentConfiguration> {
    if (this.configuration && !environment) {
      return this.configuration;
    }

    const detectedEnv = environment || (await this.detectEnvironment()).environment;
    
    if (detectedEnv === 'docker') {
      this.configuration = {
        database: {
          type: 'postgresql',
          url: process.env.DATABASE_URL || 'postgresql://postgres:password@postgres:5432/claude_monitor'
        },
        cache: {
          type: 'redis',
          url: process.env.REDIS_URL || 'redis://redis:6379'
        },
        logging: {
          level: (process.env.LOG_LEVEL as any) || 'INFO',
          enableFileLogging: false // Container logs go to stdout
        },
        development: {
          autoSetup: false,
          showStartupInfo: true
        }
      };
    } else {
      this.configuration = {
        database: {
          type: 'sqlite',
          url: process.env.DATABASE_URL || 'file:./data/claude-monitor.db'
        },
        cache: {
          type: 'memory'
        },
        logging: {
          level: 'DEBUG',
          enableFileLogging: true
        },
        development: {
          autoSetup: true,
          showStartupInfo: true
        }
      };
    }

    return this.configuration;
  }

  /**
   * Check for Docker-specific filesystem indicators
   */
  private async checkDockerFilesystem(): Promise<{ score: number; indicators: string[] }> {
    const indicators: string[] = [];
    let score = 0;

    try {
      // Check for /.dockerenv file (most reliable indicator)
      if (existsSync('/.dockerenv')) {
        indicators.push('Docker environment file found (/.dockerenv)');
        score += 4;
      }

      // Check for Docker-specific mount points
      const mountsContent = await fs.readFile('/proc/mounts', 'utf8').catch(() => '');
      if (mountsContent.includes('overlay')) {
        indicators.push('Docker overlay filesystem detected');
        score += 2;
      }

      // Check for container ID in hostname
      const containerHostname = hostname();
      if (containerHostname.length === 12 && /^[0-9a-f]{12}$/.test(containerHostname)) {
        indicators.push('Container-style hostname detected');
        score += 2;
      }

      // Check for Docker socket
      if (existsSync('/var/run/docker.sock')) {
        indicators.push('Docker socket found');
        score += 1;
      }

    } catch (error) {
      // Filesystem checks failed - likely not Linux or restricted environment
      indicators.push('Filesystem checks failed - possibly non-Linux environment');
    }

    return { score, indicators };
  }

  /**
   * Check environment variables for Docker/container indicators
   */
  private checkEnvironmentVariables(): { dockerScore: number; standaloneScore: number; indicators: string[] } {
    const indicators: string[] = [];
    let dockerScore = 0;
    let standaloneScore = 0;

    // Docker-specific environment variables
    const dockerEnvVars = [
      'DOCKER_CONTAINER',
      'CONTAINER',
      'KUBERNETES_SERVICE_HOST',
      'DOCKER_HOST'
    ];

    for (const envVar of dockerEnvVars) {
      if (process.env[envVar]) {
        indicators.push(`Docker environment variable found: ${envVar}`);
        dockerScore += 1;
      }
    }

    // Check for Docker Compose service names
    const composeServices = ['postgres', 'redis', 'web'];
    for (const service of composeServices) {
      const serviceHost = process.env[`${service.toUpperCase()}_SERVICE_HOST`];
      if (serviceHost) {
        indicators.push(`Docker Compose service detected: ${service}`);
        dockerScore += 1;
      }
    }

    // Standalone development indicators
    if (process.env.NODE_ENV === 'development') {
      indicators.push('Development environment detected');
      standaloneScore += 1;
    }

    // Check for npm/yarn in path (development environment)
    if (process.env.npm_execpath || process.env.YARN_WRAP_OUTPUT) {
      indicators.push('NPM/Yarn execution detected');
      standaloneScore += 2;
    }

    // Check for local development database URL
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl && dbUrl.includes('file:')) {
      indicators.push('SQLite database URL detected');
      standaloneScore += 2;
    }

    return { dockerScore, standaloneScore, indicators };
  }

  /**
   * Check process and cgroup information
   */
  private async checkProcessInfo(): Promise<{ score: number; indicators: string[] }> {
    const indicators: string[] = [];
    let score = 0;

    try {
      // Check cgroup information
      const cgroupContent = await fs.readFile('/proc/self/cgroup', 'utf8').catch(() => '');
      if (cgroupContent.includes('docker')) {
        indicators.push('Docker cgroup detected');
        score += 3;
      }

      // Check for container init process
      const cmdlineContent = await fs.readFile('/proc/1/cmdline', 'utf8').catch(() => '');
      if (cmdlineContent.includes('sh') || cmdlineContent.includes('bash') || cmdlineContent.includes('node')) {
        indicators.push('Container-style init process detected');
        score += 1;
      }

    } catch (error) {
      // Process checks failed - likely not Linux
      indicators.push('Process checks unavailable - possibly non-Linux environment');
    }

    return { score, indicators };
  }

  /**
   * Check network configuration patterns
   */
  private checkNetworkConfiguration(): { dockerScore: number; standaloneScore: number; indicators: string[] } {
    const indicators: string[] = [];
    let dockerScore = 0;
    let standaloneScore = 0;

    // Check for container-style network environment
    const host = process.env.HOST || process.env.HOSTNAME;
    if (host === '0.0.0.0') {
      indicators.push('Container-style host binding detected');
      dockerScore += 1;
    }

    // Check for localhost/development patterns
    if (host === 'localhost' || host === '127.0.0.1') {
      indicators.push('Localhost binding detected');
      standaloneScore += 1;
    }

    // Check for development server ports
    const port = process.env.PORT;
    if (port === '3000' || port === '3001' || port === '8080') {
      indicators.push('Development server port detected');
      standaloneScore += 1;
    }

    return { dockerScore, standaloneScore, indicators };
  }

  /**
   * Check for development environment patterns
   */
  private checkDevelopmentPatterns(): { score: number; indicators: string[] } {
    const indicators: string[] = [];
    let score = 0;

    // Check for development files
    const devFiles = ['package.json', 'package-lock.json', 'yarn.lock', '.env.local', '.env.development'];
    for (const file of devFiles) {
      if (existsSync(file)) {
        indicators.push(`Development file found: ${file}`);
        score += 0.5;
      }
    }

    // Check for node_modules (development environment)
    if (existsSync('node_modules')) {
      indicators.push('Node.js development environment detected');
      score += 1;
    }

    // Check for git repository
    if (existsSync('.git')) {
      indicators.push('Git repository detected - development environment');
      score += 1;
    }

    return { score, indicators };
  }

  /**
   * Generate setup recommendations based on detection results
   */
  private generateRecommendations(environment: RuntimeEnvironment, indicators: string[]): string[] {
    const recommendations: string[] = [];

    if (environment === 'standalone') {
      recommendations.push('Standalone mode detected - SQLite database will be used');
      recommendations.push('In-memory caching will be used instead of Redis');
      recommendations.push('Development logging enabled with file output');
      
      if (!existsSync('data')) {
        recommendations.push('Create data directory for SQLite database');
      }
      
      if (!existsSync('.env.local')) {
        recommendations.push('Auto-generate .env.local file for development settings');
      }
    } else {
      recommendations.push('Docker environment detected - PostgreSQL will be used');
      recommendations.push('Redis caching service expected to be available');
      recommendations.push('Container logging to stdout enabled');
    }

    return recommendations;
  }

  /**
   * Reset detection cache (useful for testing)
   */
  public resetDetection(): void {
    this.detectionResult = null;
    this.configuration = null;
  }

  /**
   * Get current detection result without re-detecting
   */
  public getCurrentDetection(): EnvironmentDetectionResult | null {
    return this.detectionResult;
  }

  /**
   * Get current configuration without regenerating
   */
  public getCurrentConfiguration(): EnvironmentConfiguration | null {
    return this.configuration;
  }
}

// Export singleton instance and convenience functions
const environmentDetector = EnvironmentDetector.getInstance();

export const detectEnvironment = (): Promise<EnvironmentDetectionResult> =>
  environmentDetector.detectEnvironment();

export const generateConfiguration = (environment?: RuntimeEnvironment): Promise<EnvironmentConfiguration> =>
  environmentDetector.generateConfiguration(environment);

export const getCurrentEnvironment = (): RuntimeEnvironment | null =>
  environmentDetector.getCurrentDetection()?.environment || null;

export const isDockerEnvironment = async (): Promise<boolean> =>
  (await environmentDetector.detectEnvironment()).environment === 'docker';

export const isStandaloneEnvironment = async (): Promise<boolean> =>
  (await environmentDetector.detectEnvironment()).environment === 'standalone';

export const resetEnvironmentDetection = (): void =>
  environmentDetector.resetDetection();

export default environmentDetector;