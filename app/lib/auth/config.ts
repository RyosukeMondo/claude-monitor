/**
 * Authentication configuration and validation system.
 * 
 * Implements secure authentication patterns adapted from Python src/config/config.py
 * with comprehensive validation, secure defaults, and environment variable support.
 */

import { z } from 'zod';

// Validation schemas following Python config validation patterns
export const AuthConfigSchema = z.object({
  tokenSecret: z.string().min(32, 'Token secret must be at least 32 characters'),
  tokenExpiry: z.number().int().min(300).max(86400), // 5 minutes to 24 hours
  sessionTimeout: z.number().int().min(900).max(28800), // 15 minutes to 8 hours
  maxLoginAttempts: z.number().int().min(3).max(10),
  lockoutDuration: z.number().int().min(300).max(3600), // 5 minutes to 1 hour
  rateLimitRequests: z.number().int().min(10).max(1000),
  rateLimitWindow: z.number().int().min(60).max(3600), // 1 minute to 1 hour
  csrfProtection: z.boolean(),
  secureHeaders: z.boolean(),
});

export const SecurityConfigSchema = z.object({
  auth: AuthConfigSchema,
  cors: z.object({
    enabled: z.boolean(),
    origins: z.array(z.string()).optional(),
    credentials: z.boolean(),
  }),
  contentSecurityPolicy: z.object({
    enabled: z.boolean(),
    reportOnly: z.boolean(),
    directives: z.record(z.string(), z.string()).optional(),
  }),
});

export type AuthConfig = z.infer<typeof AuthConfigSchema>;
export type SecurityConfig = z.infer<typeof SecurityConfigSchema>;

// Default configuration following Python patterns
const DEFAULT_AUTH_CONFIG: AuthConfig = {
  tokenSecret: process.env.AUTH_TOKEN_SECRET || '',
  tokenExpiry: parseInt(process.env.AUTH_TOKEN_EXPIRY || '3600'), // 1 hour
  sessionTimeout: parseInt(process.env.AUTH_SESSION_TIMEOUT || '1800'), // 30 minutes
  maxLoginAttempts: parseInt(process.env.AUTH_MAX_LOGIN_ATTEMPTS || '5'),
  lockoutDuration: parseInt(process.env.AUTH_LOCKOUT_DURATION || '900'), // 15 minutes
  rateLimitRequests: parseInt(process.env.AUTH_RATE_LIMIT_REQUESTS || '100'),
  rateLimitWindow: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW || '900'), // 15 minutes
  csrfProtection: process.env.AUTH_CSRF_PROTECTION !== 'false',
  secureHeaders: process.env.AUTH_SECURE_HEADERS !== 'false',
};

const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  auth: DEFAULT_AUTH_CONFIG,
  cors: {
    enabled: process.env.CORS_ENABLED !== 'false',
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: process.env.CORS_CREDENTIALS !== 'false',
  },
  contentSecurityPolicy: {
    enabled: process.env.CSP_ENABLED !== 'false',
    reportOnly: process.env.CSP_REPORT_ONLY === 'true',
    directives: {
      'default-src': "'self'",
      'script-src': "'self' 'unsafe-inline' 'unsafe-eval'",
      'style-src': "'self' 'unsafe-inline'",
      'connect-src': "'self' ws: wss:",
      'img-src': "'self' data: blob:",
      'font-src': "'self'",
      'object-src': "'none'",
      'frame-src': "'none'",
    },
  },
};

/**
 * Configuration validation errors similar to Python config system
 */
export class AuthConfigError extends Error {
  constructor(message: string, public validationErrors?: string[]) {
    super(message);
    this.name = 'AuthConfigError';
  }
}

/**
 * Configuration manager following Python patterns
 */
export class AuthConfigManager {
  private static instance: AuthConfigManager;
  private config: SecurityConfig;
  
  private constructor() {
    this.config = this.loadAndValidateConfig();
  }
  
  public static getInstance(): AuthConfigManager {
    if (!AuthConfigManager.instance) {
      AuthConfigManager.instance = new AuthConfigManager();
    }
    return AuthConfigManager.instance;
  }
  
  private loadAndValidateConfig(): SecurityConfig {
    try {
      // Load configuration with defaults
      const config = {
        ...DEFAULT_SECURITY_CONFIG,
        auth: {
          ...DEFAULT_AUTH_CONFIG,
          // Generate secure token secret if not provided
          tokenSecret: DEFAULT_AUTH_CONFIG.tokenSecret || this.generateSecureSecret(),
        },
      };
      
      // Validate configuration
      const validationResult = SecurityConfigSchema.safeParse(config);
      
      if (!validationResult.success) {
        const errors = validationResult.error.issues.map(
          issue => `${issue.path.join('.')}: ${issue.message}`
        );
        throw new AuthConfigError(
          'Authentication configuration validation failed',
          errors
        );
      }
      
      return validationResult.data;
    } catch (error) {
      console.error('Failed to load authentication configuration:', error);
      throw error;
    }
  }
  
  private generateSecureSecret(): string {
    // Generate a secure random secret for development/testing
    // In production, this should be provided via environment variable
    if (process.env.NODE_ENV === 'production') {
      throw new AuthConfigError(
        'AUTH_TOKEN_SECRET must be provided in production environment'
      );
    }
    
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }
  
  public getConfig(): SecurityConfig {
    return { ...this.config };
  }
  
  public getAuthConfig(): AuthConfig {
    return { ...this.config.auth };
  }
  
  public validateConfig(config: Partial<SecurityConfig>): string[] {
    const result = SecurityConfigSchema.safeParse(config);
    if (result.success) {
      return [];
    }
    
    return result.error.issues.map(
      issue => `${issue.path.join('.')}: ${issue.message}`
    );
  }
  
  public reload(): void {
    this.config = this.loadAndValidateConfig();
  }
}

// Global configuration instance
export const getAuthConfig = (): AuthConfig => {
  return AuthConfigManager.getInstance().getAuthConfig();
};

export const getSecurityConfig = (): SecurityConfig => {
  return AuthConfigManager.getInstance().getConfig();
};

// Input validation utilities following Python patterns
export const validateInput = {
  /**
   * Sanitize string input to prevent injection attacks
   */
  sanitizeString: (input: string, maxLength: number = 1000): string => {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }
    
    // Remove potential script tags and null bytes
    const sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/\0/g, '')
      .trim()
      .slice(0, maxLength);
    
    return sanitized;
  },
  
  /**
   * Validate and sanitize project path following Python path validation
   */
  validateProjectPath: (path: string): string => {
    if (!path || typeof path !== 'string') {
      throw new Error('Project path must be a non-empty string');
    }
    
    // Basic path traversal prevention
    if (path.includes('..') || path.includes('\0')) {
      throw new Error('Invalid project path: contains dangerous characters');
    }
    
    // Ensure path is absolute and within reasonable bounds
    if (!path.startsWith('/') && !path.match(/^[A-Z]:\\/)) {
      throw new Error('Project path must be absolute');
    }
    
    if (path.length > 500) {
      throw new Error('Project path too long');
    }
    
    return path;
  },
  
  /**
   * Validate session ID format
   */
  validateSessionId: (sessionId: string): string => {
    if (!sessionId || typeof sessionId !== 'string') {
      throw new Error('Session ID must be a non-empty string');
    }
    
    // UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      throw new Error('Invalid session ID format');
    }
    
    return sessionId;
  },
  
  /**
   * Validate API endpoints and parameters
   */
  validateApiInput: (data: unknown): Record<string, unknown> => {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid API input: must be an object');
    }
    
    // Deep clone to prevent prototype pollution
    return JSON.parse(JSON.stringify(data));
  },
};