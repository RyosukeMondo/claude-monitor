/**
 * Authentication login endpoint.
 * 
 * Implements secure login with rate limiting and input validation
 * following Python security patterns.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthConfig, validateInput } from '@/lib/auth/config';
import { trackFailedLogin, clearLoginAttempts } from '@/middleware';
import { z } from 'zod';

const LoginRequestSchema = z.object({
  username: z.string().min(1, 'Username is required').max(100),
  password: z.string().min(1, 'Password is required').max(1000),
  rememberMe: z.boolean().optional().default(false)
});

const DEFAULT_USERNAME = process.env.AUTH_USERNAME || 'admin';
const DEFAULT_PASSWORD = process.env.AUTH_PASSWORD || 'claude-monitor-2024';

/**
 * Generate a simple session token
 * In production, use proper JWT with signing
 */
function generateSessionToken(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash password for comparison
 * In production, use proper bcrypt hashing
 */
function hashPassword(password: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(password + process.env.AUTH_SALT || 'default-salt').digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const authConfig = getAuthConfig();
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = LoginRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: validationResult.error.issues.map(issue => issue.message)
        },
        { status: 400 }
      );
    }
    
    const { username, password, rememberMe } = validationResult.data;
    
    // Sanitize inputs
    const sanitizedUsername = validateInput.sanitizeString(username, 100);
    const sanitizedPassword = validateInput.sanitizeString(password, 1000);
    
    // Simple authentication check
    // In production, implement proper user database lookup and bcrypt comparison
    const isValidUsername = sanitizedUsername === DEFAULT_USERNAME;
    const isValidPassword = hashPassword(sanitizedPassword) === hashPassword(DEFAULT_PASSWORD);
    
    if (!isValidUsername || !isValidPassword) {
      // Track failed login attempt
      trackFailedLogin(request);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid username or password' 
        },
        { status: 401 }
      );
    }
    
    // Clear any previous failed attempts
    clearLoginAttempts(request);
    
    // Generate session token
    const sessionToken = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + authConfig.tokenExpiry);
    
    // Create response with session token
    const response = NextResponse.json({
      success: true,
      token: sessionToken,
      expiresAt: expiresAt.toISOString(),
      user: {
        username: sanitizedUsername,
        role: 'admin' // Simple role system
      }
    });
    
    // Set secure cookie
    const cookieOptions = [
      `auth-token=${sessionToken}`,
      `Max-Age=${authConfig.tokenExpiry}`,
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
    console.error('Login error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}