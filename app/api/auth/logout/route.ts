/**
 * Authentication logout endpoint.
 * 
 * Implements secure logout with session cleanup.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
    
    // Clear auth cookie
    const cookieOptions = [
      'auth-token=',
      'Max-Age=0',
      'HttpOnly',
      'SameSite=Strict',
      'Path=/',
    ];
    
    // Add Secure flag in production
    if (process.env.NODE_ENV === 'production') {
      cookieOptions.push('Secure');
    }
    
    response.headers.set('Set-Cookie', cookieOptions.join('; '));
    
    return response;
    
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}