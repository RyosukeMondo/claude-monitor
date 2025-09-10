/**
 * Project information and monitoring types
 * Defines structures for project-level analysis and tracking
 */
import { z } from 'zod';
import { ConversationSession, ConversationSessionSchema } from './conversation';
import { StateAnalysis, StateAnalysisSchema } from './state';

// Project technology stack information
export interface TechnologyStack {
  languages: Array<{
    name: string;
    version?: string;
    fileCount: number;
    linesOfCode: number;
    percentage: number; // 0-100
  }>;
  frameworks: Array<{
    name: string;
    version?: string;
    type: 'frontend' | 'backend' | 'fullstack' | 'testing' | 'build' | 'other';
  }>;
  dependencies: Array<{
    name: string;
    version: string;
    type: 'production' | 'development';
    security: {
      vulnerabilities: number;
      severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
    };
  }>;
  buildSystems: string[];
  databases: string[];
  cloudServices: string[];
}

// Zod schema for TechnologyStack
export const TechnologyStackSchema = z.object({
  languages: z.array(z.object({
    name: z.string(),
    version: z.string().optional(),
    fileCount: z.number().int().min(0),
    linesOfCode: z.number().int().min(0),
    percentage: z.number().min(0).max(100)
  })),
  frameworks: z.array(z.object({
    name: z.string(),
    version: z.string().optional(),
    type: z.enum(['frontend', 'backend', 'fullstack', 'testing', 'build', 'other'])
  })),
  dependencies: z.array(z.object({
    name: z.string(),
    version: z.string(),
    type: z.enum(['production', 'development']),
    security: z.object({
      vulnerabilities: z.number().int().min(0),
      severity: z.enum(['none', 'low', 'medium', 'high', 'critical'])
    })
  })),
  buildSystems: z.array(z.string()),
  databases: z.array(z.string()),
  cloudServices: z.array(z.string())
});

// File system structure analysis
export interface FileSystemAnalysis {
  rootPath: string;
  totalFiles: number;
  totalDirectories: number;
  totalSize: number; // bytes
  fileTypes: Record<string, {
    count: number;
    totalSize: number;
    averageSize: number;
  }>;
  largestFiles: Array<{
    path: string;
    size: number;
    type: string;
  }>;
  deepestPaths: Array<{
    path: string;
    depth: number;
  }>;
  gitInfo?: {
    branch: string;
    commits: number;
    contributors: number;
    lastCommit: Date;
    isDirty: boolean;
    unstagedFiles: number;
    stagedFiles: number;
  };
}

// Zod schema for FileSystemAnalysis
export const FileSystemAnalysisSchema = z.object({
  rootPath: z.string(),
  totalFiles: z.number().int().min(0),
  totalDirectories: z.number().int().min(0),
  totalSize: z.number().int().min(0),
  fileTypes: z.record(z.string(), z.object({
    count: z.number().int().min(0),
    totalSize: z.number().int().min(0),
    averageSize: z.number().min(0)
  })),
  largestFiles: z.array(z.object({
    path: z.string(),
    size: z.number().int().min(0),
    type: z.string()
  })),
  deepestPaths: z.array(z.object({
    path: z.string(),
    depth: z.number().int().min(0)
  })),
  gitInfo: z.object({
    branch: z.string(),
    commits: z.number().int().min(0),
    contributors: z.number().int().min(0),
    lastCommit: z.date(),
    isDirty: z.boolean(),
    unstagedFiles: z.number().int().min(0),
    stagedFiles: z.number().int().min(0)
  }).optional()
});

// Development activity patterns
export interface DevelopmentActivity {
  sessionsPerDay: number;
  averageSessionDuration: number; // minutes
  peakActivityHours: number[]; // 0-23 hours
  mostActiveFiles: Array<{
    path: string;
    accessCount: number;
    lastAccessed: Date;
    operationType: 'read' | 'write' | 'edit' | 'create' | 'delete';
  }>;
  toolUsageFrequency: Record<string, {
    count: number;
    successRate: number;
    averageExecutionTime: number;
  }>;
  errorFrequency: Record<string, {
    count: number;
    category: 'syntax' | 'runtime' | 'logic' | 'system' | 'network';
    trend: 'increasing' | 'decreasing' | 'stable';
  }>;
  productivityMetrics: {
    codeGenerationRate: number; // lines per hour
    problemSolutionRate: number; // problems per session
    contextSwitchFrequency: number; // switches per hour
  };
}

// Zod schema for DevelopmentActivity
export const DevelopmentActivitySchema = z.object({
  sessionsPerDay: z.number().min(0),
  averageSessionDuration: z.number().min(0),
  peakActivityHours: z.array(z.number().int().min(0).max(23)),
  mostActiveFiles: z.array(z.object({
    path: z.string(),
    accessCount: z.number().int().min(0),
    lastAccessed: z.date(),
    operationType: z.enum(['read', 'write', 'edit', 'create', 'delete'])
  })),
  toolUsageFrequency: z.record(z.string(), z.object({
    count: z.number().int().min(0),
    successRate: z.number().min(0).max(1),
    averageExecutionTime: z.number().min(0)
  })),
  errorFrequency: z.record(z.string(), z.object({
    count: z.number().int().min(0),
    category: z.enum(['syntax', 'runtime', 'logic', 'system', 'network']),
    trend: z.enum(['increasing', 'decreasing', 'stable'])
  })),
  productivityMetrics: z.object({
    codeGenerationRate: z.number().min(0),
    problemSolutionRate: z.number().min(0),
    contextSwitchFrequency: z.number().min(0)
  })
});

// Project health and quality metrics
export interface ProjectHealth {
  overallScore: number; // 0-100
  codeQuality: {
    score: number; // 0-100
    issues: Array<{
      type: 'duplication' | 'complexity' | 'maintainability' | 'reliability' | 'security';
      severity: 'low' | 'medium' | 'high' | 'critical';
      count: number;
      examples: string[];
    }>;
  };
  testCoverage: {
    percentage: number; // 0-100
    totalLines: number;
    coveredLines: number;
    missingCoverage: string[]; // file paths
  };
  documentation: {
    completeness: number; // 0-100
    readmePresent: boolean;
    apiDocsPresent: boolean;
    codeCommentsRatio: number; // 0-1
  };
  maintenance: {
    lastUpdate: Date;
    staleDependencies: number;
    deprecationWarnings: number;
    technicalDebt: number; // estimated hours
  };
}

// Zod schema for ProjectHealth
export const ProjectHealthSchema = z.object({
  overallScore: z.number().min(0).max(100),
  codeQuality: z.object({
    score: z.number().min(0).max(100),
    issues: z.array(z.object({
      type: z.enum(['duplication', 'complexity', 'maintainability', 'reliability', 'security']),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      count: z.number().int().min(0),
      examples: z.array(z.string())
    }))
  }),
  testCoverage: z.object({
    percentage: z.number().min(0).max(100),
    totalLines: z.number().int().min(0),
    coveredLines: z.number().int().min(0),
    missingCoverage: z.array(z.string())
  }),
  documentation: z.object({
    completeness: z.number().min(0).max(100),
    readmePresent: z.boolean(),
    apiDocsPresent: z.boolean(),
    codeCommentsRatio: z.number().min(0).max(1)
  }),
  maintenance: z.object({
    lastUpdate: z.date(),
    staleDependencies: z.number().int().min(0),
    deprecationWarnings: z.number().int().min(0),
    technicalDebt: z.number().min(0)
  })
});

// Main project information interface
export interface ProjectInfo {
  id: string;
  name: string;
  description?: string;
  
  // Basic project metadata
  metadata: {
    createdAt: Date;
    lastAnalyzed: Date;
    version?: string;
    license?: string;
    repository?: string;
    owner?: string;
  };
  
  // Technical analysis
  technologyStack: TechnologyStack;
  fileSystemAnalysis: FileSystemAnalysis;
  
  // Activity and behavior analysis
  developmentActivity: DevelopmentActivity;
  sessions: ConversationSession[];
  stateAnalyses: StateAnalysis[];
  
  // Health and quality
  projectHealth: ProjectHealth;
  
  // Monitoring configuration
  monitoringConfig: {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    retentionPeriod: number; // days
    alertThresholds: {
      errorRate: number; // 0-1
      performanceDegradation: number; // 0-1
      contextPressure: number; // 0-1
    };
    excludedPaths: string[];
    watchedFilePatterns: string[];
  };
  
  // Insights and recommendations
  insights: Array<{
    type: 'optimization' | 'security' | 'performance' | 'quality' | 'maintenance';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    recommendation: string;
    estimatedImpact: 'low' | 'medium' | 'high';
    estimatedEffort: 'low' | 'medium' | 'high';
    confidence: number; // 0-1
  }>;
  
  // Comparison and benchmarking
  benchmarks?: {
    similarProjects: number;
    performancePercentile: number; // 0-100
    qualityPercentile: number; // 0-100
    industryStandards: Record<string, number>;
  };
}

// Zod schema for ProjectInfo validation
export const ProjectInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  
  metadata: z.object({
    createdAt: z.date(),
    lastAnalyzed: z.date(),
    version: z.string().optional(),
    license: z.string().optional(),
    repository: z.string().optional(),
    owner: z.string().optional()
  }),
  
  technologyStack: TechnologyStackSchema,
  fileSystemAnalysis: FileSystemAnalysisSchema,
  
  developmentActivity: DevelopmentActivitySchema,
  sessions: z.array(ConversationSessionSchema),
  stateAnalyses: z.array(StateAnalysisSchema),
  
  projectHealth: ProjectHealthSchema,
  
  monitoringConfig: z.object({
    enabled: z.boolean(),
    logLevel: z.enum(['debug', 'info', 'warn', 'error']),
    retentionPeriod: z.number().int().min(0),
    alertThresholds: z.object({
      errorRate: z.number().min(0).max(1),
      performanceDegradation: z.number().min(0).max(1),
      contextPressure: z.number().min(0).max(1)
    }),
    excludedPaths: z.array(z.string()),
    watchedFilePatterns: z.array(z.string())
  }),
  
  insights: z.array(z.object({
    type: z.enum(['optimization', 'security', 'performance', 'quality', 'maintenance']),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    title: z.string(),
    description: z.string(),
    recommendation: z.string(),
    estimatedImpact: z.enum(['low', 'medium', 'high']),
    estimatedEffort: z.enum(['low', 'medium', 'high']),
    confidence: z.number().min(0).max(1)
  })),
  
  benchmarks: z.object({
    similarProjects: z.number().int().min(0),
    performancePercentile: z.number().min(0).max(100),
    qualityPercentile: z.number().min(0).max(100),
    industryStandards: z.record(z.string(), z.number())
  }).optional()
});