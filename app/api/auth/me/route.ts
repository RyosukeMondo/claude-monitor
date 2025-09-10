/**
 * Authentication user info endpoint.
 * 
 * Returns current user information if authenticated.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Token validation is handled by middleware
    // If we reach here, the user is authenticated
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Not authenticated' 
        },
        { status: 401 }
      );
    }
    
    // In production, decode JWT to get user info
    // For now, return default admin user
    return NextResponse.json({
      success: true,
      user: {
        username: 'admin',
        role: 'admin',
        authenticated: true
      }
    });
    
  } catch (error) {
    console.error('User info error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}