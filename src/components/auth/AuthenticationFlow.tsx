'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

interface User {
  username: string;
  role: string;
  authenticated: boolean;
}

interface LoginFormData {
  username: string;
  password: string;
  rememberMe: boolean;
}

interface AuthenticationFlowProps {
  onAuthSuccess?: (user: User) => void;
  onAuthError?: (error: string) => void;
  redirectAfterLogin?: string;
  showWelcomeMessage?: boolean;
}

interface AuthState {
  loading: boolean;
  error: string | null;
  sessionExpired: boolean;
  user: User | null;
}

function AuthenticationFlowInner({
  onAuthSuccess,
  onAuthError,
  redirectAfterLogin,
  showWelcomeMessage = true
}: AuthenticationFlowProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = redirectAfterLogin || searchParams.get("redirect") || "/";

  const [formData, setFormData] = useState<LoginFormData>({
    username: "",
    password: "",
    rememberMe: false,
  });

  const [authState, setAuthState] = useState<AuthState>({
    loading: false,
    error: null,
    sessionExpired: false,
    user: null,
  });

  const [showPassword, setShowPassword] = useState(false);

  // Check if session expired from URL params
  useEffect(() => {
    const expired = searchParams.get("session") === "expired";
    if (expired) {
      setAuthState(prev => ({
        ...prev,
        sessionExpired: true,
        error: "Your session has expired. Please sign in again."
      }));
    }
  }, [searchParams]);

  // Pre-fill username from environment if available
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_AUTH_USERNAME) {
      setFormData(prev => ({
        ...prev,
        username: process.env.NEXT_PUBLIC_AUTH_USERNAME || ""
      }));
    }
  }, []);

  const handleInputChange = useCallback((field: keyof LoginFormData) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = field === 'rememberMe' ? e.target.checked : e.target.value;
      setFormData(prev => ({ ...prev, [field]: value }));
      
      // Clear errors when user starts typing
      if (authState.error) {
        setAuthState(prev => ({ ...prev, error: null }));
      }
    }, [authState.error]);

  const validateForm = useCallback((): string | null => {
    if (!formData.username.trim()) {
      return "Username is required";
    }
    if (!formData.password.trim()) {
      return "Password is required";
    }
    if (formData.username.length > 100) {
      return "Username is too long";
    }
    if (formData.password.length > 1000) {
      return "Password is too long";
    }
    return null;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setAuthState(prev => ({ ...prev, error: validationError }));
      return;
    }

    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest" // Helps with CSRF protection
        },
        body: JSON.stringify(formData),
        credentials: 'same-origin' // Ensure cookies are sent
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        const errorMessage = data?.error || `Login failed (${response.status})`;
        throw new Error(errorMessage);
      }

      // Extract user info from response
      const user: User = {
        username: data.user?.username || formData.username,
        role: data.user?.role || 'user',
        authenticated: true
      };

      setAuthState(prev => ({ 
        ...prev, 
        user,
        sessionExpired: false,
        error: null 
      }));

      // Call success callback if provided
      if (onAuthSuccess) {
        onAuthSuccess(user);
      }

      // Show success message briefly before redirect
      if (showWelcomeMessage) {
        setTimeout(() => {
          router.push(redirect);
        }, 800);
      } else {
        router.push(redirect);
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setAuthState(prev => ({ ...prev, error: message }));
      
      if (onAuthError) {
        onAuthError(message);
      }
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  }, [formData, validateForm, onAuthSuccess, onAuthError, router, redirect, showWelcomeMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !authState.loading) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  }, [handleSubmit, authState.loading]);

  // Success state
  if (authState.user && showWelcomeMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-sm text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold mb-2 text-green-800">Welcome back!</h1>
          <p className="text-sm text-gray-600 mb-4">
            Signed in as <strong>{authState.user.username}</strong>
          </p>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-500">Redirecting...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-sm">
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold mb-1">
            {authState.sessionExpired ? 'Session Expired' : 'Sign in'}
          </h1>
          <p className="text-sm text-gray-600">
            {authState.sessionExpired 
              ? 'Please sign in again to continue.' 
              : 'Access your Claude Monitor dashboard.'
            }
          </p>
        </div>

        {authState.error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-start">
            <svg className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              {authState.error}
              {authState.sessionExpired && (
                <div className="mt-1 text-xs text-red-600">
                  Your work has been preserved and will be available after signing in.
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              className="w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={formData.username}
              onChange={handleInputChange('username')}
              onKeyPress={handleKeyPress}
              disabled={authState.loading}
              required
              aria-describedby={authState.error ? "auth-error" : undefined}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="w-full rounded border px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={formData.password}
                onChange={handleInputChange('password')}
                onKeyPress={handleKeyPress}
                disabled={authState.loading}
                required
                aria-describedby={authState.error ? "auth-error" : undefined}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
                disabled={authState.loading}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                checked={formData.rememberMe}
                onChange={handleInputChange('rememberMe')}
                disabled={authState.loading}
              />
              <span className={authState.loading ? "text-gray-400" : ""}>Remember me</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={authState.loading}
            className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {authState.loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        {/* Redirect info */}
        {redirect !== "/" && (
          <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-800 border border-blue-200">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>You'll be redirected to: <strong>{redirect}</strong></span>
            </div>
          </div>
        )}

        <p className="mt-4 text-xs text-gray-500 text-center">
          Tip: Defaults can be configured via environment variables `AUTH_USERNAME` and `AUTH_PASSWORD`.
        </p>
      </div>
    </div>
  );
}

export function AuthenticationFlow(props: AuthenticationFlowProps) {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading...</span>
          </div>
        </div>
      }
    >
      <AuthenticationFlowInner {...props} />
    </Suspense>
  );
}

export default AuthenticationFlow;