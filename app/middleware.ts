/**
 * Next.js middleware for authentication, security, and rate limiting.
 * 
 * Implements security patterns adapted from Python daemon initialization
 * with comprehensive request protection, rate limiting, and input validation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthConfig, validateInput } from './lib/auth/config';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number; blocked: boolean; blockUntil?: number }>();

// Login attempt tracking (in production, use Redis or similar)
const loginAttempts = new Map<string, { attempts: number; blockUntil?: number }>();

/**
 * Security headers based on Python config security patterns
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  const authConfig = getAuthConfig();
  
  if (!authConfig.secureHeaders) {
    return response;
  }
  
  // Security headers following OWASP recommendations
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Remove server information
  response.headers.delete('Server');
  response.headers.delete('X-Powered-By');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "connect-src 'self' ws: wss:",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "object-src 'none'",
    "frame-src 'none'"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  return response;
}

/**
 * Rate limiting implementation following Python patterns
 */
function checkRateLimit(request: NextRequest): { allowed: boolean; retryAfter?: number } {
  const authConfig = getAuthConfig();
  const clientIp = getClientIP(request);
  const now = Date.now();
  const windowMs = authConfig.rateLimitWindow * 1000;
  const maxRequests = authConfig.rateLimitRequests;
  
  const key = `rate_limit:${clientIp}`;
  const current = rateLimitStore.get(key);
  
  // Check if client is currently blocked
  if (current?.blocked && current.blockUntil && now < current.blockUntil) {
    return { allowed: false, retryAfter: Math.ceil((current.blockUntil - now) / 1000) };
  }
  
  // Reset if window expired
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
      blocked: false
    });
    return { allowed: true };
  }
  
  // Check if limit exceeded
  if (current.count >= maxRequests) {
    // Block for additional time if repeatedly hitting limits
    const blockDuration = 300000; // 5 minutes
    rateLimitStore.set(key, {
      ...current,
      blocked: true,
      blockUntil: now + blockDuration
    });
    return { allowed: false, retryAfter: blockDuration / 1000 };
  }
  
  // Increment counter
  rateLimitStore.set(key, {
    ...current,
    count: current.count + 1
  });
  
  return { allowed: true };
}

/**
 * Login attempt tracking following Python security patterns
 */
function checkLoginAttempts(request: NextRequest): { allowed: boolean; retryAfter?: number } {
  const authConfig = getAuthConfig();
  const clientIp = getClientIP(request);
  const now = Date.now();
  
  const key = `login:${clientIp}`;
  const attempts = loginAttempts.get(key);
  
  // Check if currently blocked
  if (attempts?.blockUntil && now < attempts.blockUntil) {
    return { allowed: false, retryAfter: Math.ceil((attempts.blockUntil - now) / 1000) };
  }
  
  // Allow if no previous attempts or block expired
  if (!attempts || (attempts.blockUntil && now >= attempts.blockUntil)) {
    return { allowed: true };
  }
  
  // Check if max attempts exceeded
  if (attempts.attempts >= authConfig.maxLoginAttempts) {
    const blockUntil = now + (authConfig.lockoutDuration * 1000);
    loginAttempts.set(key, {
      attempts: attempts.attempts,
      blockUntil
    });
    return { allowed: false, retryAfter: authConfig.lockoutDuration };
  }
  
  return { allowed: true };
}

/**
 * Track failed login attempt
 */
export function trackFailedLogin(request: NextRequest): void {
  const clientIp = getClientIP(request);
  const key = `login:${clientIp}`;
  const current = loginAttempts.get(key) || { attempts: 0 };
  
  loginAttempts.set(key, {
    attempts: current.attempts + 1,
    blockUntil: current.blockUntil
  });
}

/**
 * Clear login attempts on successful login
 */
export function clearLoginAttempts(request: NextRequest): void {
  const clientIp = getClientIP(request);
  loginAttempts.delete(`login:${clientIp}`);
}

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const clientIp = forwarded ? forwarded.split(',')[0].trim() : realIp;
  
  return clientIp || '127.0.0.1';
}

/**
 * Validate request data and sanitize inputs
 */
function validateRequest(request: NextRequest): { valid: boolean; error?: string } {
  try {
    const url = new URL(request.url);
    
    // Validate URL parameters
    const params = Array.from(url.searchParams.entries());
    for (const [key, value] of params) {
      if (key === 'projectPath') {
        validateInput.validateProjectPath(value);
      } else if (key === 'sessionId') {
        validateInput.validateSessionId(value);
      } else {
        validateInput.sanitizeString(value, 1000);
      }
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Invalid request' };
  }
}

/**
 * Check if the request requires authentication
 */
function requiresAuth(pathname: string): boolean {
  const publicPaths = ['/api/health', '/api/auth/login'];
  const staticPaths = ['/_next', '/favicon.ico'];
  
  // Allow public paths and static assets
  if (publicPaths.some(path => pathname.startsWith(path)) ||
      staticPaths.some(path => pathname.startsWith(path))) {
    return false;
  }
  
  // Require auth for API routes and dashboard
  return pathname.startsWith('/api') || pathname === '/' || pathname.startsWith('/dashboard');
}

/**
 * Extract and validate auth token
 */
function validateAuthToken(request: NextRequest): { valid: boolean; error?: string } {
  if (!requiresAuth(request.nextUrl.pathname)) {
    return { valid: true };
  }
  
  const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                request.cookies.get('auth-token')?.value;
  
  if (!token) {
    return { valid: false, error: 'Missing authentication token' };
  }
  
  try {
    // Simple token validation - in production, use JWT verification
    const authConfig = getAuthConfig();
    
    if (token.length < 32) {
      return { valid: false, error: 'Invalid token format' };
    }
    
    // For development, accept any token with proper format
    // In production, implement proper JWT verification here
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid token' };
  }
}

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  try {
    const response = NextResponse.next();
    
    // Add security headers
    addSecurityHeaders(response);
    
    // Skip middleware for static assets
    if (request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname.includes('.')) {
      return response;
    }
    
    // Rate limiting check
    const rateLimitResult = checkRateLimit(request);
    if (!rateLimitResult.allowed) {
      return new NextResponse('Rate limit exceeded', {
        status: 429,
        headers: {
          'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
          'X-RateLimit-Limit': getAuthConfig().rateLimitRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': (Date.now() + (rateLimitResult.retryAfter || 60) * 1000).toString()
        }
      });
    }
    
    // Login attempt check for auth endpoints
    if (request.nextUrl.pathname.startsWith('/api/auth/login')) {
      const loginCheckResult = checkLoginAttempts(request);
      if (!loginCheckResult.allowed) {
        return new NextResponse('Too many login attempts', {
          status: 429,
          headers: {
            'Retry-After': loginCheckResult.retryAfter?.toString() || '900'
          }
        });
      }
    }
    
    // Request validation
    const validationResult = validateRequest(request);
    if (!validationResult.valid) {
      return new NextResponse(validationResult.error || 'Invalid request', {
        status: 400
      });
    }
    
    // Authentication check
    const authResult = validateAuthToken(request);
    if (!authResult.valid) {
      if (request.nextUrl.pathname.startsWith('/api')) {
        return new NextResponse(authResult.error || 'Unauthorized', {
          status: 401
        });
      } else {
        // Redirect to login for web pages
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
    
    return response;
    
  } catch (error) {
    console.error('Middleware error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /_next (Next.js internals)
     * 2. Static files (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)'
  ]
};