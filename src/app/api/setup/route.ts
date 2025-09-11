/**
 * Setup API Route
 * 
 * Provides API endpoints for the startup configuration middleware to
 * handle setup status checks, initiation, and progress monitoring.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runStandaloneSetup, getStandaloneSetupStatus, SetupOptions } from '@/lib/setup/setup-assistant';
import { checkStandaloneSetup } from '@/lib/config/standalone-generator';

// Setup process state
let setupProcess: {
  inProgress: boolean;
  startTime?: number;
  lastResult?: any;
} = {
  inProgress: false
};

/**
 * Handle GET requests - status checking
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'status';
  
  try {
    switch (action) {
      case 'status':
        return await handleGetStatus();
      case 'check':
        return await handleQuickCheck();
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: status or check' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: `Setup API error: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

/**
 * Handle POST requests - setup initiation
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'start';
  
  try {
    switch (action) {
      case 'start':
        return await handleStartSetup(request);
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: start' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: `Setup API error: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

/**
 * Get comprehensive setup status
 */
async function handleGetStatus() {
  try {
    const status = await getStandaloneSetupStatus();
    const standaloneCheck = await checkStandaloneSetup();
    
    if (setupProcess.inProgress) {
      return NextResponse.json({
        status: 'in-progress',
        message: 'Setup is currently running',
        startTime: setupProcess.startTime,
        elapsed: setupProcess.startTime ? Date.now() - setupProcess.startTime : 0,
        progress: {
          currentStep: 'Configuring standalone mode',
          stepNumber: 2,
          totalSteps: 4
        }
      });
    }
    
    if (status.isSetup) {
      return NextResponse.json({
        status: 'complete',
        message: 'Standalone mode is configured and ready',
        details: {
          configExists: status.configExists,
          databaseExists: status.databaseExists,
          isStandalone: status.isStandalone,
          messages: status.messages
        },
        nextSteps: [
          'Application is running in standalone mode',
          'Using SQLite database and in-memory caching',
          'Check the logs for detailed startup information'
        ],
        configPath: status.configExists ? '.env.local' : undefined,
        databasePath: status.databaseExists ? 'prisma/dev.db' : undefined
      });
    }
    
    return NextResponse.json({
      status: 'required',
      message: 'Standalone setup is required',
      details: {
        configExists: status.configExists,
        databaseExists: status.databaseExists,
        isStandalone: status.isStandalone,
        messages: status.messages
      },
      nextSteps: [
        'Setup will configure SQLite database',
        'Generate .env.local with development settings',
        'Enable debug logging and monitoring',
        'Start the application automatically'
      ]
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: `Setup status check failed: ${(error as Error).message}`,
      error: (error as Error).message
    }, { status: 500 });
  }
}

/**
 * Quick check for polling
 */
async function handleQuickCheck() {
  try {
    if (setupProcess.inProgress) {
      return NextResponse.json({
        isComplete: false,
        inProgress: true,
        message: 'Setup in progress',
        elapsed: setupProcess.startTime ? Date.now() - setupProcess.startTime : 0
      });
    }
    
    const status = await getStandaloneSetupStatus();
    
    return NextResponse.json({
      isComplete: status.isSetup,
      inProgress: false,
      message: status.isSetup 
        ? 'Setup is complete' 
        : 'Setup required',
      details: {
        configExists: status.configExists,
        databaseExists: status.databaseExists,
        isStandalone: status.isStandalone
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      isComplete: false,
      inProgress: false,
      message: `Check failed: ${(error as Error).message}`,
      error: (error as Error).message
    }, { status: 500 });
  }
}

/**
 * Start the setup process
 */
async function handleStartSetup(request: NextRequest) {
  try {
    if (setupProcess.inProgress) {
      return NextResponse.json({
        status: 'conflict',
        message: 'Setup is already in progress',
        startTime: setupProcess.startTime,
        elapsed: setupProcess.startTime ? Date.now() - setupProcess.startTime : 0
      }, { status: 409 });
    }
    
    // Parse setup options from request body
    let body = {};
    try {
      body = await request.json();
    } catch {
      // Use defaults if no body or invalid JSON
    }
    
    const options: SetupOptions = {
      force: (body as any).force || false,
      debugMode: (body as any).debugMode !== undefined ? (body as any).debugMode : true,
      port: (body as any).port || 3000,
      skipChecks: (body as any).skipChecks || false,
      interactive: false // Always non-interactive in API
    };
    
    // Set process state
    setupProcess = {
      inProgress: true,
      startTime: Date.now(),
      lastResult: undefined
    };
    
    // Run setup asynchronously
    runStandaloneSetup(options)
      .then(result => {
        setupProcess.inProgress = false;
        setupProcess.lastResult = result;
        
        if (result.success) {
          console.log('✅ Standalone setup completed successfully');
          console.log('📁 Configuration:', result.configPath);
          console.log('🗄️ Database:', result.databasePath);
          console.log('📋 Setup steps completed:', result.steps.length);
          console.log('🚀 Next steps:');
          result.nextSteps.forEach(step => console.log('   -', step));
          
          if (result.warnings.length > 0) {
            console.log('⚠️  Warnings:');
            result.warnings.forEach(warning => console.log('   -', warning));
          }
        } else {
          console.error('❌ Setup failed:');
          result.errors.forEach(error => console.error('   -', error));
          
          if (result.steps.length > 0) {
            console.log('📋 Setup steps attempted:');
            result.steps.forEach(step => {
              const status = step.status === 'completed' ? '✅' : 
                           step.status === 'failed' ? '❌' : 
                           step.status === 'running' ? '🔄' : '⏳';
              console.log(`   ${status} ${step.name}: ${step.message || step.description}`);
            });
          }
        }
      })
      .catch(error => {
        setupProcess.inProgress = false;
        setupProcess.lastResult = {
          success: false,
          errors: [`Setup process error: ${error.message}`],
          steps: [],
          nextSteps: [],
          warnings: []
        };
        console.error('❌ Setup process crashed:', error);
      });
    
    return NextResponse.json({
      status: 'started',
      message: 'Setup process initiated',
      startTime: setupProcess.startTime,
      options: {
        debugMode: options.debugMode,
        port: options.port,
        force: options.force
      },
      progress: {
        currentStep: 'Initializing setup',
        stepNumber: 1,
        totalSteps: 4
      }
    });
    
  } catch (error) {
    setupProcess.inProgress = false;
    
    return NextResponse.json({
      status: 'error',
      message: `Failed to start setup: ${(error as Error).message}`,
      error: (error as Error).message
    }, { status: 500 });
  }
}

/**
 * Health check endpoint
 */
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}