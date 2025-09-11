import { NextRequest, NextResponse } from 'next/server';
import { detectEnvironment, generateConfiguration } from 'lib/services/environment-detector';
import { generateStandaloneConfig, checkStandaloneSetup } from 'lib/config/standalone-generator';
import { getConfig } from 'lib/config/settings';

export async function POST(_request: NextRequest) {
  try {
    // Detect the runtime environment
    const detection = await detectEnvironment();
    const environment = detection.environment;
    
    // Initialize messages array
    const messages: string[] = [];
    let configured = true;
    let error: string | undefined;

    // Log detection results
    messages.push(`Environment detected: ${environment} (confidence: ${Math.round(detection.confidence * 100)}%)`);
    
    // Add key detection indicators
    if (detection.indicators.length > 0) {
      messages.push(`Key indicators: ${detection.indicators.slice(0, 2).join(', ')}`);
    }

    try {
      if (environment === 'standalone') {
        // Check if standalone setup exists
        const setupStatus = await checkStandaloneSetup();
        
        if (!setupStatus.hasConfig) {
          // Auto-generate .env.local for standalone mode
          messages.push('No standalone configuration found, generating .env.local...');
          
          const configResult = await generateStandaloneConfig({
            force: false,
            debugMode: process.env.NODE_ENV === 'development'
          });
          
          if (configResult.success) {
            messages.push(...configResult.messages);
          } else {
            configured = false;
            error = configResult.error;
            messages.push(configResult.error || 'Failed to generate configuration');
          }
        } else {
          messages.push('Existing standalone configuration found');
          messages.push(...setupStatus.messages);
        }

        // Generate configuration for services
        const config = await generateConfiguration(environment);
        messages.push(`Database: ${config.database.type} (${config.database.url})`);
        messages.push(`Cache: ${config.cache.type}`);
        messages.push(`Logging: ${config.logging.level} level`);
        
        if (config.development.autoSetup) {
          messages.push('Auto-setup enabled for development');
        }
      } else {
        // Docker mode
        messages.push('Docker environment detected');
        const config = await generateConfiguration(environment);
        messages.push(`Database: ${config.database.type}`);
        messages.push(`Cache: ${config.cache.type} service`);
      }

      // Validate final configuration
      getConfig();
      messages.push(`Configuration validated successfully`);
      
      // Add recommendations if available
      if (detection.recommendations && detection.recommendations.length > 0) {
        messages.push('Recommendations:');
        detection.recommendations.slice(0, 2).forEach(rec => {
          messages.push(`  • ${rec}`);
        });
      }

    } catch (configError) {
      configured = false;
      error = `Configuration failed: ${(configError as Error).message}`;
      messages.push(error);
    }

    return NextResponse.json({
      success: true,
      environment,
      confidence: detection.confidence,
      configured,
      messages,
      error,
      indicators: detection.indicators.slice(0, 3), // Limit indicators for brevity
      recommendations: detection.recommendations?.slice(0, 2)
    });

  } catch (error) {
    console.error('Startup initialization error:', error);
    
    return NextResponse.json({
      success: false,
      environment: 'standalone', // fallback
      configured: false,
      error: `Initialization failed: ${(error as Error).message}`,
      messages: [
        'Environment detection failed',
        'Falling back to standalone mode',
        'Check console for detailed error information'
      ]
    }, { status: 500 });
  }
}