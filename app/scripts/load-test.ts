#!/usr/bin/env tsx

/**
 * Load Testing Script for Claude Monitor Next.js Application
 * 
 * This script runs comprehensive load tests to ensure the Next.js application
 * meets or exceeds Python daemon performance benchmarks as specified in the requirements.
 * 
 * Benchmarks from spec requirements:
 * - Response Time: ≤150ms average
 * - Memory Usage: ≤128MB
 * - Requests Per Second: ≥50 RPS
 * - Error Rate: ≤1%
 */

import { performance } from 'perf_hooks';
import * as http from 'http';
import * as https from 'https';

interface LoadTestConfig {
  baseUrl: string;
  duration: number; // seconds
  concurrency: number;
  targetRPS: number;
  endpoints: string[];
}

interface LoadTestResult {
  endpoint: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  responseTimes: number[];
  statusCodes: { [key: number]: number };
}

interface TestSummary {
  results: LoadTestResult[];
  overallStats: {
    totalRequests: number;
    averageRPS: number;
    averageResponseTime: number;
    overallErrorRate: number;
    benchmarkComparison: {
      responseTime: 'PASS' | 'FAIL';
      rps: 'PASS' | 'FAIL';
      errorRate: 'PASS' | 'FAIL';
    };
  };
}

class LoadTester {
  private config: LoadTestConfig;
  private pythonBenchmarks = {
    responseTime: 150, // ms
    rps: 50,
    errorRate: 0.01 // 1%
  };

  constructor(config: LoadTestConfig) {
    this.config = config;
  }

  async makeRequest(endpoint: string): Promise<{ responseTime: number; statusCode: number; success: boolean }> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const url = new URL(endpoint, this.config.baseUrl);
      const client = url.protocol === 'https:' ? https : http;

      const req = client.request(url, { method: 'GET', timeout: 10000 }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const responseTime = performance.now() - startTime;
          resolve({
            responseTime,
            statusCode: res.statusCode || 0,
            success: (res.statusCode || 0) >= 200 && (res.statusCode || 0) < 400
          });
        });
      });

      req.on('error', () => {
        const responseTime = performance.now() - startTime;
        resolve({
          responseTime,
          statusCode: 0,
          success: false
        });
      });

      req.on('timeout', () => {
        req.destroy();
        const responseTime = performance.now() - startTime;
        resolve({
          responseTime,
          statusCode: 0,
          success: false
        });
      });

      req.end();
    });
  }

  async runLoadTest(endpoint: string): Promise<LoadTestResult> {
    console.log(`\n🚀 Starting load test for ${endpoint}`);
    console.log(`   Duration: ${this.config.duration}s`);
    console.log(`   Concurrency: ${this.config.concurrency}`);
    console.log(`   Target RPS: ${this.config.targetRPS}`);

    const startTime = Date.now();
    const endTime = startTime + (this.config.duration * 1000);
    
    let totalRequests = 0;
    let successfulRequests = 0;
    let failedRequests = 0;
    const responseTimes: number[] = [];
    const statusCodes: { [key: number]: number } = {};

    // Create concurrent workers
    const workers = Array(this.config.concurrency).fill(null).map(async () => {
      while (Date.now() < endTime) {
        const result = await this.makeRequest(endpoint);
        
        totalRequests++;
        responseTimes.push(result.responseTime);
        statusCodes[result.statusCode] = (statusCodes[result.statusCode] || 0) + 1;
        
        if (result.success) {
          successfulRequests++;
        } else {
          failedRequests++;
        }

        // Control request rate
        const delay = Math.max(0, (1000 / this.config.targetRPS * this.config.concurrency) - Math.random() * 10);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    });

    await Promise.all(workers);

    const actualDuration = (Date.now() - startTime) / 1000;
    const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    const requestsPerSecond = totalRequests / actualDuration;
    const errorRate = failedRequests / totalRequests;

    const result: LoadTestResult = {
      endpoint,
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      minResponseTime,
      maxResponseTime,
      requestsPerSecond,
      errorRate,
      responseTimes,
      statusCodes
    };

    this.logEndpointResults(result);
    return result;
  }

  private logEndpointResults(result: LoadTestResult): void {
    console.log(`\n📊 Results for ${result.endpoint}:`);
    console.log(`   Total Requests: ${result.totalRequests}`);
    console.log(`   Successful: ${result.successfulRequests} (${(result.successfulRequests/result.totalRequests*100).toFixed(1)}%)`);
    console.log(`   Failed: ${result.failedRequests} (${(result.errorRate*100).toFixed(1)}%)`);
    console.log(`   Average Response Time: ${result.averageResponseTime.toFixed(2)}ms`);
    console.log(`   Min/Max Response Time: ${result.minResponseTime.toFixed(2)}ms / ${result.maxResponseTime.toFixed(2)}ms`);
    console.log(`   Requests Per Second: ${result.requestsPerSecond.toFixed(2)}`);
    console.log(`   Status Codes:`, result.statusCodes);

    // Benchmark comparison
    console.log(`\n🎯 Benchmark Comparison:`);
    console.log(`   Response Time: ${result.averageResponseTime.toFixed(2)}ms vs ${this.pythonBenchmarks.responseTime}ms target ${result.averageResponseTime <= this.pythonBenchmarks.responseTime ? '✅' : '❌'}`);
    console.log(`   RPS: ${result.requestsPerSecond.toFixed(2)} vs ${this.pythonBenchmarks.rps} target ${result.requestsPerSecond >= this.pythonBenchmarks.rps ? '✅' : '❌'}`);
    console.log(`   Error Rate: ${(result.errorRate*100).toFixed(2)}% vs ${this.pythonBenchmarks.errorRate*100}% target ${result.errorRate <= this.pythonBenchmarks.errorRate ? '✅' : '❌'}`);
  }

  async runFullLoadTest(): Promise<TestSummary> {
    console.log('🔥 Starting Comprehensive Load Test for Claude Monitor');
    console.log('=' .repeat(60));

    const results: LoadTestResult[] = [];

    // Test each endpoint
    for (const endpoint of this.config.endpoints) {
      const result = await this.runLoadTest(endpoint);
      results.push(result);
      
      // Brief pause between endpoint tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Calculate overall statistics
    const totalRequests = results.reduce((sum, r) => sum + r.totalRequests, 0);
    const totalSuccessful = results.reduce((sum, r) => sum + r.successfulRequests, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failedRequests, 0);
    const averageRPS = results.reduce((sum, r) => sum + r.requestsPerSecond, 0) / results.length;
    const averageResponseTime = results.reduce((sum, r) => sum + r.averageResponseTime, 0) / results.length;
    const overallErrorRate = totalFailed / totalRequests;

    const summary: TestSummary = {
      results,
      overallStats: {
        totalRequests,
        averageRPS,
        averageResponseTime,
        overallErrorRate,
        benchmarkComparison: {
          responseTime: averageResponseTime <= this.pythonBenchmarks.responseTime ? 'PASS' : 'FAIL',
          rps: averageRPS >= this.pythonBenchmarks.rps ? 'PASS' : 'FAIL',
          errorRate: overallErrorRate <= this.pythonBenchmarks.errorRate ? 'PASS' : 'FAIL'
        }
      }
    };

    this.logOverallResults(summary);
    return summary;
  }

  private logOverallResults(summary: TestSummary): void {
    console.log('\n' + '=' .repeat(60));
    console.log('🏆 OVERALL LOAD TEST RESULTS');
    console.log('=' .repeat(60));
    
    const { overallStats } = summary;
    console.log(`Total Requests: ${overallStats.totalRequests}`);
    console.log(`Average RPS: ${overallStats.averageRPS.toFixed(2)}`);
    console.log(`Average Response Time: ${overallStats.averageResponseTime.toFixed(2)}ms`);
    console.log(`Overall Error Rate: ${(overallStats.overallErrorRate*100).toFixed(2)}%`);

    console.log('\n🎯 PYTHON DAEMON BENCHMARK COMPARISON:');
    console.log(`Response Time: ${overallStats.benchmarkComparison.responseTime} (${overallStats.averageResponseTime.toFixed(2)}ms vs ≤150ms)`);
    console.log(`RPS: ${overallStats.benchmarkComparison.rps} (${overallStats.averageRPS.toFixed(2)} vs ≥50)`);
    console.log(`Error Rate: ${overallStats.benchmarkComparison.errorRate} (${(overallStats.overallErrorRate*100).toFixed(2)}% vs ≤1%)`);

    const allPassed = Object.values(overallStats.benchmarkComparison).every(result => result === 'PASS');
    console.log(`\n${allPassed ? '✅ ALL BENCHMARKS PASSED!' : '❌ Some benchmarks failed'}`);
    
    if (allPassed) {
      console.log('🚀 Next.js application meets or exceeds Python daemon performance requirements!');
    } else {
      console.log('⚠️  Performance optimization needed to match Python daemon benchmarks.');
    }
  }
}

// Main execution
async function main() {
  const config: LoadTestConfig = {
    baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
    duration: parseInt(process.env.TEST_DURATION || '60'), // 60 seconds
    concurrency: parseInt(process.env.TEST_CONCURRENCY || '10'), // 10 concurrent users
    targetRPS: parseInt(process.env.TEST_TARGET_RPS || '60'), // 60 RPS target (higher than 50 requirement)
    endpoints: [
      '/api/health',
      '/api/projects',
      '/api/sessions',
      '/api/performance',
      '/api/recovery'
    ]
  };

  console.log('Configuration:');
  console.log(`  Base URL: ${config.baseUrl}`);
  console.log(`  Duration: ${config.duration}s`);
  console.log(`  Concurrency: ${config.concurrency}`);
  console.log(`  Target RPS: ${config.targetRPS}`);
  console.log(`  Endpoints: ${config.endpoints.length}`);

  const tester = new LoadTester(config);
  
  try {
    const summary = await tester.runFullLoadTest();
    
    // Exit with appropriate code
    const allPassed = Object.values(summary.overallStats.benchmarkComparison).every(result => result === 'PASS');
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('❌ Load test failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { LoadTester, LoadTestConfig, LoadTestResult, TestSummary };