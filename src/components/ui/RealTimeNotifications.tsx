'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '@/lib/websocket/client';
import { MonitoringEvent } from '@/lib/websocket/server';
import { NotificationItem } from '@/types/ui';

interface Toast {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface RealTimeNotificationsProps {
  maxToasts?: number;
  defaultDuration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  enableWebSocket?: boolean;
  projectId?: string;
}

const DEFAULT_DURATION = 5000;
const MAX_TOASTS = 5;

export function RealTimeNotifications({
  maxToasts = MAX_TOASTS,
  defaultDuration = DEFAULT_DURATION,
  position = 'top-right',
  enableWebSocket = true,
  projectId
}: RealTimeNotificationsProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const { connectionState, subscribe } = useWebSocket({
    autoConnect: enableWebSocket,
    projectId,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  // Add a new toast notification
  const addToast = useCallback((toast: Omit<Toast, 'id' | 'timestamp'>) => {
    const newToast: Toast = {
      ...toast,
      id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      duration: toast.duration ?? defaultDuration
    };

    setToasts(prev => {
      const updated = [newToast, ...prev];
      // Keep only the most recent toasts
      return updated.slice(0, maxToasts);
    });

    // Auto-remove toast after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(newToast.id);
      }, newToast.duration);
    }
  }, [defaultDuration, maxToasts]);

  // Remove a specific toast
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Clear all toasts
  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  // Convert monitoring event to toast notification
  const handleMonitoringEvent = useCallback((event: MonitoringEvent) => {
    let toastType: Toast['type'] = 'info';
    let title = '';
    let message = '';

    switch (event.type) {
      case 'state_change':
        toastType = 'info';
        title = 'State Change';
        message = `Project state updated${event.projectId ? ` for ${event.projectId}` : ''}`;
        break;
      
      case 'new_event':
        toastType = 'success';
        title = 'New Event';
        message = `New conversation event${event.projectId ? ` in ${event.projectId}` : ''}`;
        break;
      
      case 'recovery_action':
        toastType = 'warning';
        title = 'Recovery Action';
        message = `Recovery action executed${event.projectId ? ` for ${event.projectId}` : ''}`;
        break;
      
      case 'health_check':
        const healthData = event.data as any;
        toastType = healthData?.status === 'healthy' ? 'success' : 
                   healthData?.status === 'degraded' ? 'warning' : 'error';
        title = 'Health Check';
        message = `System status: ${healthData?.status || 'unknown'}`;
        break;
      
      case 'project_update':
        toastType = 'info';
        title = 'Project Update';
        message = `Project status updated${event.projectId ? ` for ${event.projectId}` : ''}`;
        break;
      
      default:
        toastType = 'info';
        title = 'System Event';
        message = `${event.type} event received`;
    }

    addToast({
      type: toastType,
      title,
      message,
      duration: toastType === 'error' ? 0 : defaultDuration // Error toasts persist until manually dismissed
    });
  }, [addToast, defaultDuration]);

  // Subscribe to WebSocket events when enabled
  useEffect(() => {
    if (!enableWebSocket) return;

    const unsubscribers = [
      subscribe('state_change', handleMonitoringEvent),
      subscribe('new_event', handleMonitoringEvent),
      subscribe('recovery_action', handleMonitoringEvent),
      subscribe('health_check', handleMonitoringEvent),
      subscribe('project_update', handleMonitoringEvent)
    ];

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [enableWebSocket, subscribe, handleMonitoringEvent]);

  // Show connection status notifications
  useEffect(() => {
    if (!enableWebSocket) return;

    if (connectionState.connected && !connectionState.connecting) {
      addToast({
        type: 'success',
        title: 'Connected',
        message: 'Real-time monitoring connected',
        duration: 2000
      });
    } else if (connectionState.error) {
      addToast({
        type: 'error',
        title: 'Connection Error',
        message: connectionState.error,
        duration: 0
      });
    }
  }, [connectionState.connected, connectionState.error, connectionState.connecting, enableWebSocket, addToast]);

  // Get position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'top-right':
      default:
        return 'top-4 right-4';
    }
  };

  // Get icon for toast type
  const getToastIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  // Get background color for toast type
  const getToastBgColor = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'info':
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div 
      className={`fixed z-50 ${getPositionClasses()} space-y-2`}
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {/* Clear all button when multiple toasts */}
      {toasts.length > 1 && (
        <div className="mb-2">
          <button
            onClick={clearAll}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
            aria-label="Clear all notifications"
          >
            Clear all ({toasts.length})
          </button>
        </div>
      )}

      {/* Toast notifications */}
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            relative w-80 max-w-sm rounded-lg border shadow-lg p-4 transform transition-all duration-300 ease-in-out
            ${getToastBgColor(toast.type)}
            animate-in slide-in-from-right-full
          `}
          role="alert"
          aria-labelledby={`toast-title-${toast.id}`}
          aria-describedby={`toast-message-${toast.id}`}
        >
          <div className="flex items-start space-x-3">
            {/* Icon */}
            <div className="flex-shrink-0">
              {getToastIcon(toast.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 
                id={`toast-title-${toast.id}`}
                className="text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                {toast.title}
              </h4>
              <p 
                id={`toast-message-${toast.id}`}
                className="mt-1 text-sm text-gray-700 dark:text-gray-300"
              >
                {toast.message}
              </p>
              
              {/* Action button */}
              {toast.action && (
                <button
                  onClick={toast.action.onClick}
                  className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 underline"
                >
                  {toast.action.label}
                </button>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              aria-label={`Close ${toast.title} notification`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress bar for timed toasts */}
          {toast.duration && toast.duration > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-b-lg overflow-hidden">
              <div 
                className="h-full bg-current opacity-30 transition-all ease-linear"
                style={{
                  animationName: 'toast-progress',
                  animationDuration: `${toast.duration}ms`,
                  animationTimingFunction: 'linear',
                  animationFillMode: 'forwards'
                }}
              />
            </div>
          )}
        </div>
      ))}

      {/* Connection status indicator */}
      {enableWebSocket && (
        <div className="mt-4">
          <div className={`
            flex items-center space-x-2 px-2 py-1 rounded-md text-xs
            ${connectionState.connected 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
              : connectionState.connecting
              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
            }
          `}>
            <div className={`
              w-2 h-2 rounded-full
              ${connectionState.connected 
                ? 'bg-green-400 animate-pulse' 
                : connectionState.connecting
                ? 'bg-yellow-400 animate-spin'
                : 'bg-red-400'
              }
            `} />
            <span>
              {connectionState.connected 
                ? 'Live' 
                : connectionState.connecting 
                ? 'Connecting...' 
                : 'Disconnected'
              }
            </span>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
        
        .animate-in {
          animation: slideIn 0.3s ease-out;
        }
        
        .slide-in-from-right-full {
          transform: translateX(100%);
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

// Utility function to manually trigger notifications (for testing or manual use)
export function createNotification(
  type: Toast['type'],
  title: string,
  message: string,
  options?: {
    duration?: number;
    action?: { label: string; onClick: () => void };
  }
): Toast {
  return {
    id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    title,
    message,
    timestamp: new Date(),
    duration: options?.duration ?? DEFAULT_DURATION,
    action: options?.action
  };
}

export type { Toast, RealTimeNotificationsProps };