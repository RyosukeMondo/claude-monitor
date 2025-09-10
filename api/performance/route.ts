import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor, withPerformanceTracking } from '../../lib/services/performance-monitor';

/**
 * GET /api/performance - Get current performance metrics
 */
async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const minutes = parseInt(searchParams.get('minutes') || '5');

  switch (action) {
    case 'current':
      return NextResponse.json({
        success: true,
        data: performanceMonitor.getCurrentMetrics()
      });

    case 'history':
      return NextResponse.json({
        success: true,
        data: performanceMonitor.getMetricsHistory(minutes)
      });

    case 'benchmark':
      return NextResponse.json({
        success: true,
        data: performanceMonitor.compareToPythonBenchmarks()
      });

    case 'report':
      const report = await performanceMonitor.generatePerformanceReport();
      return NextResponse.json({
        success: true,
        data: JSON.parse(report)
      });

    default:
      return NextResponse.json({
        success: true,
        data: {
          current: performanceMonitor.getCurrentMetrics(),
          benchmarks: performanceMonitor.compareToPythonBenchmarks(),
          uptime: Date.now() - (performanceMonitor as any).startTime
        }
      });
  }
}

/**
 * POST /api/performance - Run performance tests or actions
 */
async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, ...params } = body;

  switch (action) {
    case 'load_test':
      const { duration = 60, concurrency = 10, targetRPS = 50 } = params;
      const result = await performanceMonitor.runLoadTest(duration, concurrency, targetRPS);
      
      return NextResponse.json({
        success: result.success,
        data: result.results,
        message: result.success ? 'Load test completed successfully' : 'Load test failed to meet benchmarks'
      });

    case 'generate_report':
      const report = await performanceMonitor.generatePerformanceReport();
      return NextResponse.json({
        success: true,
        data: JSON.parse(report),
        message: 'Performance report generated'
      });

    default:
      return NextResponse.json({
        success: false,
        error: 'Invalid action specified'
      }, { status: 400 });
  }
}

// Export handlers with performance tracking
export { GET, POST };