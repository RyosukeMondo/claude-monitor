/**
 * Startup initialization API endpoint
 * 
 * Handles setup status checking and configuration validation
 * that was moved out of middleware for Edge Runtime compatibility
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStandaloneSetupStatus } from '../../../../lib/setup/setup-assistant';

export async function GET() {
  try {
    const status = await getStandaloneSetupStatus();
    
    return NextResponse.json({
      success: true,
      isSetup: status.isSetup,
      isStandalone: status.isStandalone,
      configExists: status.configExists,
      databaseExists: status.databaseExists,
      messages: status.messages
    });
  } catch (error) {
    console.error('Setup status check failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      isSetup: false,
      isStandalone: false,
      configExists: false,
      databaseExists: false,
      messages: ['Error checking setup status']
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action = 'check' } = body;
    
    if (action === 'check') {
      const status = await getStandaloneSetupStatus();
      
      return NextResponse.json({
        success: true,
        status: status.isSetup ? 'complete' : 'incomplete',
        isSetup: status.isSetup,
        details: status
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });
    
  } catch (error) {
    console.error('Startup initialization failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}