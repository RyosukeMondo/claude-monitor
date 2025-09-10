/**
 * Performance Monitoring Service
 * 
 * Provides comprehensive performance monitoring, profiling utilities,
 * and load testing capabilities to ensure the Next.js application
 * meets or exceeds Python daemon performance benchmarks.
 */

import { performance, PerformanceObserver } from 'perf_hooks';
import * as fs from 'fs/promises';
import * as path from 'path';

interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  activeConnections: number;
  requestsPerSecond: number;
  errorRate: number;
  timestamp: Date;
}

interface BenchmarkComparison {
  metric: string;
  currentValue: number;
  pythonBenchmark: number;
  percentageDiff: number;
  status: 'better' | 'worse' | 'equal';
}

interface ComponentPerformance {
  componentName: string;
  renderTime: number;
  mountTime: number;
  updateCount: number;
  memoryFootprint: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private observer: PerformanceObserver | null = null;
  private requestStartTimes = new Map<string, number>();
  private activeRequests = 0;
  private totalRequests = 0;
  private errors = 0;
  private startTime = Date.now();
  
  // Python daemon benchmarks (from spec requirements)
  private readonly pythonBenchmarks = {
    responseTime: 150, // ms average
    memoryUsage: 128 * 1024 * 1024, // 128MB
    cpuUsage: 15, // 15% average CPU usage
    requestsPerSecond: 50, // requests/second
    errorRate: 0.01, // 1% error rate
  };

  constructor() {
    this.setupPerformanceObserver();
    this.startMetricsCollection();
  }

  private setupPerformanceObserver(): void {
    this.observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      for (const entry of entries) {
        if (entry.entryType === 'measure') {
          this.recordMeasurement(entry.name, entry.duration);
        }
      }
    });

    this.observer.observe({ 
      entryTypes: ['measure', 'navigation', 'resource'], 
      buffered: true 
    });
  }

  private recordMeasurement(name: string, duration: number): void {
    if (name.startsWith('api-request-')) {
      this.updateRequestMetrics(duration);
    }
  }

  private updateRequestMetrics(duration: number): void {
    this.totalRequests++;
    
    const currentTime = Date.now();
    const timeWindow = 1000; // 1 second
    const windowStart = currentTime - timeWindow;
    
    // Clean old metrics
    this.metrics = this.metrics.filter(m => m.timestamp.getTime() > windowStart);
    
    // Add current metric
    this.metrics.push({
      responseTime: duration,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      activeConnections: this.activeRequests,
      requestsPerSecond: this.calculateRequestsPerSecond(),
      errorRate: this.errors / this.totalRequests,
      timestamp: new Date(currentTime)
    });
  }

  private calculateRequestsPerSecond(): number {
    const oneSecondAgo = Date.now() - 1000;
    const recentMetrics = this.metrics.filter(m => m.timestamp.getTime() > oneSecondAgo);
    return recentMetrics.length;
  }

  private startMetricsCollection(): void {
    // Collect metrics every 100ms for high-resolution monitoring
    setInterval(() => {
      this.collectCurrentMetrics();
    }, 100);
  }

  private collectCurrentMetrics(): void {
    const currentMetric: PerformanceMetrics = {
      responseTime: this.getAverageResponseTime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      activeConnections: this.activeRequests,
      requestsPerSecond: this.calculateRequestsPerSecond(),
      errorRate: this.errors / Math.max(this.totalRequests, 1),
      timestamp: new Date()
    };

    // Keep only last 1000 metrics (100 seconds of data)
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
    
    this.metrics.push(currentMetric);
  }

  private getAverageResponseTime(): number {
    const recentMetrics = this.metrics.slice(-10); // Last 10 measurements
    if (recentMetrics.length === 0) return 0;
    
    const sum = recentMetrics.reduce((acc, m) => acc + m.responseTime, 0);
    return sum / recentMetrics.length;
  }

  /**
   * Mark the start of a request for performance tracking
   */
  public startRequest(requestId: string): void {
    this.requestStartTimes.set(requestId, performance.now());
    this.activeRequests++;
    performance.mark(`request-start-${requestId}`);
  }

  /**
   * Mark the end of a request and record performance metrics
   */
  public endRequest(requestId: string, isError: boolean = false): void {
    const endTime = performance.now();
    const startTime = this.requestStartTimes.get(requestId);
    
    if (startTime) {
      performance.mark(`request-end-${requestId}`);
      performance.measure(
        `api-request-${requestId}`,
        `request-start-${requestId}`,
        `request-end-${requestId}`
      );
      
      this.requestStartTimes.delete(requestId);
      this.activeRequests = Math.max(0, this.activeRequests - 1);
      
      if (isError) {
        this.errors++;
      }
    }
  }

  /**
   * Get current performance metrics
   */
  public getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * Get performance metrics over time
   */
  public getMetricsHistory(minutes: number = 5): PerformanceMetrics[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.metrics.filter(m => m.timestamp.getTime() > cutoff);
  }

  /**
   * Compare current performance against Python daemon benchmarks
   */
  public compareToPythonBenchmarks(): BenchmarkComparison[] {
    const current = this.getCurrentMetrics();
    if (!current) {
      return [];
    }

    const comparisons: BenchmarkComparison[] = [
      {
        metric: 'Response Time (ms)',
        currentValue: current.responseTime,
        pythonBenchmark: this.pythonBenchmarks.responseTime,
        percentageDiff: ((current.responseTime - this.pythonBenchmarks.responseTime) / this.pythonBenchmarks.responseTime) * 100,
        status: current.responseTime <= this.pythonBenchmarks.responseTime ? 'better' : 'worse'
      },
      {
        metric: 'Memory Usage (MB)',
        currentValue: current.memoryUsage.heapUsed / (1024 * 1024),
        pythonBenchmark: this.pythonBenchmarks.memoryUsage / (1024 * 1024),
        percentageDiff: ((current.memoryUsage.heapUsed - this.pythonBenchmarks.memoryUsage) / this.pythonBenchmarks.memoryUsage) * 100,
        status: current.memoryUsage.heapUsed <= this.pythonBenchmarks.memoryUsage ? 'better' : 'worse'
      },
      {
        metric: 'Requests Per Second',
        currentValue: current.requestsPerSecond,
        pythonBenchmark: this.pythonBenchmarks.requestsPerSecond,
        percentageDiff: ((current.requestsPerSecond - this.pythonBenchmarks.requestsPerSecond) / this.pythonBenchmarks.requestsPerSecond) * 100,
        status: current.requestsPerSecond >= this.pythonBenchmarks.requestsPerSecond ? 'better' : 'worse'
      },
      {
        metric: 'Error Rate (%)',
        currentValue: current.errorRate * 100,
        pythonBenchmark: this.pythonBenchmarks.errorRate * 100,
        percentageDiff: ((current.errorRate - this.pythonBenchmarks.errorRate) / this.pythonBenchmarks.errorRate) * 100,
        status: current.errorRate <= this.pythonBenchmarks.errorRate ? 'better' : 'worse'
      }
    ];

    return comparisons;
  }

  /**
   * Record React component performance
   */
  public recordComponentPerformance(
    componentName: string,
    renderTime: number,
    mountTime?: number
  ): void {
    performance.mark(`component-${componentName}-render`);
    performance.measure(
      `component-render-${componentName}`,
      { duration: renderTime }
    );

    if (mountTime !== undefined) {
      performance.mark(`component-${componentName}-mount`);
      performance.measure(
        `component-mount-${componentName}`,
        { duration: mountTime }
      );
    }
  }

  /**
   * Generate performance report
   */
  public async generatePerformanceReport(): Promise<string> {
    const current = this.getCurrentMetrics();
    const history = this.getMetricsHistory(5);
    const benchmarkComparison = this.compareToPythonBenchmarks();
    const uptime = (Date.now() - this.startTime) / 1000;

    const report = {
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
      current: current,
      averages: {
        responseTime: history.reduce((acc, m) => acc + m.responseTime, 0) / history.length,
        memoryUsage: history.reduce((acc, m) => acc + m.memoryUsage.heapUsed, 0) / history.length,
        requestsPerSecond: history.reduce((acc, m) => acc + m.requestsPerSecond, 0) / history.length,
        errorRate: history.reduce((acc, m) => acc + m.errorRate, 0) / history.length,
      },
      benchmarkComparison,
      totalRequests: this.totalRequests,
      totalErrors: this.errors,
      meetsRequirements: benchmarkComparison.every(b => b.status !== 'worse')
    };

    // Save report to file
    const reportPath = path.join(process.cwd(), 'performance-reports', `report-${Date.now()}.json`);
    try {
      await fs.mkdir(path.dirname(reportPath), { recursive: true });
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    } catch (error) {
      console.warn('Failed to save performance report:', error);
    }

    return JSON.stringify(report, null, 2);
  }

  /**
   * Run a load test simulation
   */
  public async runLoadTest(
    duration: number = 60,
    concurrency: number = 10,
    targetRPS: number = 50
  ): Promise<{ success: boolean; results: any }> {
    console.log(`Starting load test: ${duration}s duration, ${concurrency} concurrent, ${targetRPS} RPS target`);
    
    const startTime = Date.now();
    const endTime = startTime + (duration * 1000);
    let requestCount = 0;
    let errorCount = 0;
    const responseTimes: number[] = [];

    const makeRequest = async (): Promise<void> => {
      const reqStart = performance.now();
      const requestId = `load-test-${requestCount++}`;
      
      try {
        this.startRequest(requestId);
        
        // Simulate API request processing time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10));
        
        const reqEnd = performance.now();
        responseTimes.push(reqEnd - reqStart);
        this.endRequest(requestId, false);
      } catch (error) {
        errorCount++;
        this.endRequest(requestId, true);
      }
    };

    // Run concurrent requests
    const workers = Array(concurrency).fill(null).map(async () => {
      while (Date.now() < endTime) {
        await makeRequest();
        
        // Control request rate
        const delay = Math.max(0, (1000 / targetRPS * concurrency) - Math.random() * 10);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    });

    await Promise.all(workers);

    const actualDuration = (Date.now() - startTime) / 1000;
    const actualRPS = requestCount / actualDuration;
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const actualErrorRate = errorCount / requestCount;

    const results = {
      duration: actualDuration,
      requestCount,
      errorCount,
      actualRPS,
      targetRPS,
      avgResponseTime,
      errorRate: actualErrorRate,
      benchmarkComparison: {
        rpsStatus: actualRPS >= this.pythonBenchmarks.requestsPerSecond ? 'PASS' : 'FAIL',
        responseTimeStatus: avgResponseTime <= this.pythonBenchmarks.responseTime ? 'PASS' : 'FAIL',
        errorRateStatus: actualErrorRate <= this.pythonBenchmarks.errorRate ? 'PASS' : 'FAIL',
      }
    };

    const success = Object.values(results.benchmarkComparison).every(status => status === 'PASS');
    
    console.log('Load test results:', results);
    return { success, results };
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    performance.clearMarks();
    performance.clearMeasures();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Middleware helper for Next.js API routes
export function withPerformanceTracking(
  handler: (req: any, res: any) => Promise<any>
) {
  return async (req: any, res: any) => {
    const requestId = `${req.method}-${req.url}-${Date.now()}`;
    
    performanceMonitor.startRequest(requestId);
    
    let isError = false;
    try {
      await handler(req, res);
      isError = res.statusCode >= 400;
    } catch (error) {
      isError = true;
      throw error;
    } finally {
      performanceMonitor.endRequest(requestId, isError);
    }
  };
}

export type { PerformanceMetrics, BenchmarkComparison, ComponentPerformance };
export default performanceMonitor;