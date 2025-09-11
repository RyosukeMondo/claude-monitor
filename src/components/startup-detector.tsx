'use client';

import { useEffect, useState } from 'react';

interface StartupStatus {
  environment: 'docker' | 'standalone' | 'detecting';
  configured: boolean;
  messages: string[];
  error?: string;
}

export function StartupDetector() {
  const [status, setStatus] = useState<StartupStatus>({
    environment: 'detecting',
    configured: false,
    messages: ['Initializing Claude Monitor...']
  });

  useEffect(() => {
    async function initializeApplication() {
      try {
        // Detect environment and initialize services
        const response = await fetch('/api/startup/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          throw new Error(`Initialization failed: ${response.status}`);
        }

        const result = await response.json();
        
        setStatus({
          environment: result.environment,
          configured: result.configured,
          messages: result.messages,
          error: result.error
        });

      } catch (error) {
        setStatus(prev => ({
          ...prev,
          environment: 'standalone', // fallback
          error: `Startup initialization failed: ${(error as Error).message}`,
          messages: [...prev.messages, 'Falling back to standalone mode']
        }));
      }
    }

    // Initialize on mount
    initializeApplication();
  }, []);

  // Don't render anything in production or when fully configured
  if (status.environment !== 'detecting' && status.configured && !status.error) {
    return null;
  }

  // Only show startup messages in development or when there are issues
  if (process.env.NODE_ENV !== 'development' && !status.error) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm bg-gray-900 text-white rounded-lg shadow-lg p-4 text-sm">
      <div className="flex items-center gap-2 mb-2">
        {status.environment === 'detecting' ? (
          <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
        ) : status.error ? (
          <div className="w-3 h-3 bg-red-400 rounded-full" />
        ) : (
          <div className="w-3 h-3 bg-green-400 rounded-full" />
        )}
        <span className="font-medium">
          {status.environment === 'detecting' 
            ? 'Detecting Environment...' 
            : `${status.environment.charAt(0).toUpperCase() + status.environment.slice(1)} Mode`
          }
        </span>
      </div>
      
      <div className="space-y-1 text-xs text-gray-300">
        {status.messages.map((message, index) => (
          <div key={index}>• {message}</div>
        ))}
        {status.error && (
          <div className="text-red-300 font-medium">⚠ {status.error}</div>
        )}
      </div>
      
      {status.configured && !status.error && (
        <div className="mt-2 text-xs text-green-300">
          ✓ Ready for development
        </div>
      )}
    </div>
  );
}