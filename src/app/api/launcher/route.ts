/**
 * Simple launcher API endpoint for testing Docker integration
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Docker Integration launcher API is working',
    timestamp: new Date().toISOString(),
    status: 'integrated'
  });
}