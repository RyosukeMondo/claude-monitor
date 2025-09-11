/**
 * Next.js middleware for authentication, security, rate limiting, and startup configuration.
 * 
 * Implements security patterns adapted from Python daemon initialization
 * with comprehensive request protection, rate limiting, input validation,
 * and automatic standalone mode setup for first-time users.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthConfig, validateInput } from './lib/auth/config';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number; blocked: boolean; blockUntil?: number }>();

// Login attempt tracking (in production, use Redis or similar)
const loginAttempts = new Map<string, { attempts: number; blockUntil?: number }>();

// Edge Runtime compatible setup check
let setupStatusCache: {
  isSetup: boolean;
  lastCheck: number;
  ttl: number;
} = {
  isSetup: true, // Default to setup complete for Edge Runtime
  lastCheck: 0,
  ttl: 5 * 60 * 1000, // 5 minutes TTL
};

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
 * Check if we're in standalone mode and need setup
 * Edge Runtime compatible version - delegates to API route
 */
async function needsStandaloneSetup(): Promise<boolean> {
  const now = Date.now();
  
  // Use cached result if still valid
  if (setupStatusCache.lastCheck > 0 && 
      (now - setupStatusCache.lastCheck) < setupStatusCache.ttl) {
    return !setupStatusCache.isSetup;
  }
  
  try {
    // For Edge Runtime, we'll check via environment variables
    // and delegate detailed setup checking to API routes
    const hasEnvConfig = process.env.CLAUDE_MONITOR_STANDALONE_MODE === 'true' ||
                        process.env.DATABASE_URL?.includes('file:');
    
    setupStatusCache = {
      isSetup: hasEnvConfig,
      lastCheck: now,
      ttl: setupStatusCache.ttl
    };
    
    return !hasEnvConfig;
  } catch (error) {
    // On error, assume setup is not needed to avoid blocking the app
    console.error('Error checking setup status:', error);
    return false;
  }
}

/**
 * Show setup requirement page for first-time users
 */
function showSetupRequiredPage(): NextResponse {
  const setupPageHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claude Monitor - Setup Required</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background: #f8fafc;
            color: #334155;
        }
        .container {
            background: white;
            border-radius: 8px;
            padding: 2rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .logo {
            font-size: 1.5rem;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 1rem;
        }
        .setup-status {
            padding: 1rem;
            border-radius: 6px;
            margin: 1rem 0;
            border-left: 4px solid #3b82f6;
            background: #f0f9ff;
        }
        .btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1rem;
            margin: 0.5rem 0.5rem 0.5rem 0;
            text-decoration: none;
            display: inline-block;
        }
        .btn:hover {
            background: #2563eb;
        }
        .btn:disabled {
            background: #94a3b8;
            cursor: not-allowed;
        }
        .progress {
            margin: 1rem 0;
            padding: 1rem;
            background: #f1f5f9;
            border-radius: 6px;
            display: none;
        }
        .progress.active {
            display: block;
        }
        .spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            animation: spin 2s linear infinite;
            margin-right: 0.5rem;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .success {
            color: #059669;
            background: #ecfdf5;
            border-color: #059669;
        }
        .error {
            color: #dc2626;
            background: #fef2f2;
            border-color: #dc2626;
        }
        pre {
            background: #f1f5f9;
            padding: 1rem;
            border-radius: 6px;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🔧 Claude Monitor Setup</div>
        <h1>Welcome to Claude Monitor</h1>
        <p>This is your first time running Claude Monitor in standalone mode. We need to set up a few things to get you started:</p>
        
        <div class="setup-status" id="status">
            <h3>Setup Requirements:</h3>
            <ul>
                <li>✅ Create SQLite database configuration</li>
                <li>✅ Generate development environment settings</li>
                <li>✅ Set up logging and monitoring</li>
                <li>✅ Validate system requirements</li>
            </ul>
            <p>This process is automatic and takes less than 30 seconds.</p>
        </div>
        
        <div class="progress" id="progress">
            <div class="spinner"></div>
            <span id="progress-text">Starting setup...</span>
        </div>
        
        <button class="btn" id="setup-btn" onclick="startSetup()">Start Automatic Setup</button>
        <button class="btn" onclick="checkStatus()">Check Status</button>
        <a href="/api/setup?action=status" class="btn" style="background: #6b7280;">View Setup API</a>
        
        <h3>What happens during setup?</h3>
        <ul>
            <li><strong>Configuration:</strong> Creates .env.local with SQLite and development settings</li>
            <li><strong>Database:</strong> Sets up SQLite database in prisma/dev.db</li>
            <li><strong>Logging:</strong> Enables debug logging for development</li>
            <li><strong>Validation:</strong> Checks permissions and dependencies</li>
        </ul>
        
        <h3>Manual Setup (Advanced)</h3>
        <p>If you prefer to set up manually, create a .env.local file with SQLite configuration.</p>
        
        <div id="debug" style="margin-top: 2rem; font-size: 0.9rem; color: #64748b;"></div>
    </div>
    
    <script>
        let pollInterval;
        
        async function startSetup() {
            const btn = document.getElementById('setup-btn');
            const progress = document.getElementById('progress');
            
            btn.disabled = true;
            btn.textContent = 'Setting up...';
            progress.classList.add('active');
            
            try {
                const response = await fetch('/api/setup?action=start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ debugMode: true })
                });
                
                const result = await response.json();
                
                if (result.status === 'started' || result.status === 'in-progress') {
                    updateProgress('Setup started successfully');
                    startPolling();
                } else if (result.status === 'error') {
                    showError('Setup failed: ' + result.message);
                } else {
                    showSuccess('Setup completed!');
                }
            } catch (error) {
                showError('Failed to start setup: ' + error.message);
            }
        }
        
        async function checkStatus() {
            try {
                const response = await fetch('/api/setup?action=status');
                const result = await response.json();
                
                const debug = document.getElementById('debug');
                debug.innerHTML = '<strong>Status:</strong><pre>' + JSON.stringify(result, null, 2) + '</pre>';
                
                if (result.status === 'complete') {
                    showSuccess('Setup is complete! Refreshing page...');
                    setTimeout(() => window.location.reload(), 2000);
                }
            } catch (error) {
                showError('Status check failed: ' + error.message);
            }
        }
        
        function startPolling() {
            pollInterval = setInterval(async () => {
                try {
                    const response = await fetch('/api/setup?action=check');
                    const result = await response.json();
                    
                    if (result.isComplete) {
                        clearInterval(pollInterval);
                        showSuccess('Setup completed! Redirecting...');
                        setTimeout(() => window.location.href = '/', 3000);
                    } else if (!result.inProgress) {
                        clearInterval(pollInterval);
                        showError('Setup stopped unexpectedly. Please try again.');
                    } else {
                        updateProgress('Setup in progress...');
                    }
                } catch (error) {
                    console.error('Polling error:', error);
                }
            }, 2000);
        }
        
        function updateProgress(text) {
            document.getElementById('progress-text').textContent = text;
        }
        
        function showSuccess(message) {
            const btn = document.getElementById('setup-btn');
            const progress = document.getElementById('progress');
            const status = document.getElementById('status');
            
            btn.disabled = false;
            btn.textContent = 'Setup Complete ✅';
            btn.className = 'btn success';
            progress.classList.remove('active');
            status.className = 'setup-status success';
            status.innerHTML = '<h3>✅ ' + message + '</h3>';
            
            if (pollInterval) clearInterval(pollInterval);
        }
        
        function showError(message) {
            const btn = document.getElementById('setup-btn');
            const progress = document.getElementById('progress');
            const status = document.getElementById('status');
            
            btn.disabled = false;
            btn.textContent = 'Retry Setup';
            progress.classList.remove('active');
            status.className = 'setup-status error';
            status.innerHTML = '<h3>❌ ' + message + '</h3>';
            
            if (pollInterval) clearInterval(pollInterval);
        }
        
        // Auto-check status on page load
        setTimeout(checkStatus, 1000);
    </script>
</body>
</html>`;
  
  return new NextResponse(setupPageHtml, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
    },
  });
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
 * Get friendly route name for better UX context
 */
function getRouteDisplayName(pathname: string): string {
  const routeNames: Record<string, string> = {
    '/': 'Dashboard',
    '/dashboard': 'Dashboard',
    '/performance': 'Performance Monitoring',
    '/projects': 'Project Management',
    '/sessions': 'Session Monitoring',
    '/recovery': 'Recovery Operations',
    '/settings': 'Settings'
  };
  
  // Handle dynamic routes like /sessions/[id]
  for (const [route, name] of Object.entries(routeNames)) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      return name;
    }
  }
  
  return 'Application';
}

/**
 * Check if the request requires authentication
 */
function requiresAuth(pathname: string): boolean {
  const publicPaths = ['/api/health', '/api/auth/login', '/api/setup', '/login'];
  const staticPaths = ['/_next', '/favicon.ico'];
  
  // Allow public paths and static assets (including setup API)
  if (publicPaths.some(path => pathname.startsWith(path)) ||
      staticPaths.some(path => pathname.startsWith(path))) {
    return false;
  }
  
  // Protected application routes - all main UI pages require authentication
  const protectedRoutes = [
    '/',
    '/dashboard',
    '/performance', 
    '/projects',
    '/sessions',
    '/recovery',
    '/settings'
  ];
  
  // Check if pathname exactly matches or starts with a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  // Require auth for protected routes and API routes (except public ones)
  return isProtectedRoute || pathname.startsWith('/api');
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
    
    if (token.length < 32) {
      return { valid: false, error: 'Invalid token format' };
    }
    
    // For development, accept any token with proper format
    // In production, implement proper JWT verification here
    
    return { valid: true };
  } catch (error) {
    console.error('Token validation error:', error);
    return { valid: false, error: 'Invalid token' };
  }
}

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    const response = NextResponse.next();
    
    // Add security headers
    addSecurityHeaders(response);
    
    // Skip middleware for static assets
    if (pathname.startsWith('/_next') ||
        pathname.includes('.') ||
        pathname === '/favicon.ico') {
      return response;
    }
    
    // Check if setup is needed for main application routes (before auth)
    if (pathname === '/' || pathname.startsWith('/dashboard')) {
      try {
        const needsSetup = await needsStandaloneSetup();
        if (needsSetup) {
          return showSetupRequiredPage();
        }
      } catch (error) {
        // Log error but don't block the application
        console.error('Setup check error in middleware:', error);
      }
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
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } else {
        // Enhanced redirect logic for better UX with new navigation
        const loginUrl = new URL('/login', request.url);
        
        // Preserve the original path and query parameters for better redirect experience
        const redirectPath = request.nextUrl.pathname + request.nextUrl.search;
        loginUrl.searchParams.set('redirect', redirectPath);
        
        // Add friendly route name for better UX messaging
        const routeName = getRouteDisplayName(request.nextUrl.pathname);
        loginUrl.searchParams.set('route', routeName);
        
        // Add helpful context for the UI about why user was redirected
        if (authResult.error === 'Missing authentication token') {
          loginUrl.searchParams.set('reason', 'session_required');
        } else if (authResult.error === 'Invalid token') {
          loginUrl.searchParams.set('reason', 'session_expired');
        }
        
        const response = NextResponse.redirect(loginUrl);
        
        // Clear any existing auth cookies on failed authentication
        response.cookies.delete('auth-token');
        
        return response;
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