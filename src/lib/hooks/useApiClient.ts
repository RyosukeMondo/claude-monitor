'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
  message?: string;
  timestamp?: string;
}

export interface ApiState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
}

export interface UseApiOptions {
  immediate?: boolean;
  cacheTime?: number;
  retryCount?: number;
  retryDelay?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export interface InstanceInfo {
  id: string;
  config: {
    projectPath: string;
    tcpPort: number;
    displayName?: string;
    autoRestart: boolean;
    environment: Record<string, string>;
    claudeArgs: string[];
  };
  processId: number;
  tcpPort: number;
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  startTime: Date;
  lastActivity: Date;
  sessionIds: string[];
  restartCount?: number;
  metadata?: Record<string, any>;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  mode: string;
  services: Record<string, any>;
}

export interface SetupStatus {
  status: 'required' | 'in-progress' | 'complete' | 'error';
  message: string;
  details?: any;
  progress?: {
    currentStep: string;
    stepNumber: number;
    totalSteps: number;
  };
  nextSteps?: string[];
}

// ============================================================================
// Cache Management
// ============================================================================

class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = 30000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(pattern?: string): void {
    if (pattern) {
      const keys = Array.from(this.cache.keys()).filter(key => key.includes(pattern));
      keys.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  invalidate(keys: string[]): void {
    keys.forEach(key => this.cache.delete(key));
  }
}

const apiCache = new ApiCache();

// ============================================================================
// Base API Client
// ============================================================================

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: { ...this.defaultHeaders, ...options.headers },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
          details: data.details || data,
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
        timestamp: data.timestamp,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        details: error,
      };
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint;
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint;
    return this.request<T>(url, { method: 'DELETE' });
  }
}

const apiClient = new ApiClient();

// ============================================================================
// Base Hook
// ============================================================================

export function useApiState<T>(
  initialData: T | null = null
): [ApiState<T>, (state: Partial<ApiState<T>>) => void] {
  const [state, setState] = useState<ApiState<T>>({
    data: initialData,
    loading: false,
    error: null,
    lastFetch: null,
  });

  const updateState = useCallback((newState: Partial<ApiState<T>>) => {
    setState(prev => ({ ...prev, ...newState }));
  }, []);

  return [state, updateState];
}

export function useApiRequest<T>(
  requestFn: () => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
) {
  const {
    immediate = false,
    cacheTime = 30000,
    retryCount = 0,
    retryDelay = 1000,
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useApiState<T>();
  const retryCountRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const execute = useCallback(async (skipCache = false): Promise<T | null> => {
    setState({ loading: true, error: null });

    try {
      const response = await requestFn();

      if (response.success && response.data) {
        setState({
          data: response.data,
          loading: false,
          error: null,
          lastFetch: Date.now(),
        });
        onSuccess?.(response.data);
        retryCountRef.current = 0;
        return response.data;
      } else {
        const errorMessage = response.error || 'Request failed';
        setState({ loading: false, error: errorMessage });
        onError?.(errorMessage);
        
        // Retry logic
        if (retryCountRef.current < retryCount) {
          retryCountRef.current++;
          timeoutRef.current = setTimeout(() => {
            execute(skipCache);
          }, retryDelay);
        }
        
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState({ loading: false, error: errorMessage });
      onError?.(errorMessage);
      return null;
    }
  }, [requestFn, retryCount, retryDelay, onSuccess, onError, setState]);

  const refresh = useCallback(() => execute(true), [execute]);

  useEffect(() => {
    if (immediate) {
      execute();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [immediate, execute]);

  return {
    ...state,
    execute,
    refresh,
    isStale: state.lastFetch ? Date.now() - state.lastFetch > cacheTime : true,
  };
}

// ============================================================================
// Health API Hooks
// ============================================================================

export function useHealth(options: UseApiOptions = {}) {
  const requestFn = useCallback(async () => {
    const cacheKey = 'health';
    const cached = apiCache.get(cacheKey);
    if (cached && !options.immediate) {
      return { success: true, data: cached };
    }

    const response = await apiClient.get<HealthStatus>('/health');
    if (response.success && response.data) {
      apiCache.set(cacheKey, response.data, 10000); // 10s cache
    }
    return response;
  }, [options.immediate]);

  return useApiRequest<HealthStatus>(requestFn, {
    immediate: true,
    cacheTime: 10000,
    ...options,
  });
}

// ============================================================================
// Setup API Hooks
// ============================================================================

export function useSetupStatus(options: UseApiOptions = {}) {
  const requestFn = useCallback(async () => {
    return apiClient.get<SetupStatus>('/setup', { action: 'status' });
  }, []);

  return useApiRequest<SetupStatus>(requestFn, {
    immediate: true,
    cacheTime: 5000,
    ...options,
  });
}

export function useSetupQuickCheck(options: UseApiOptions = {}) {
  const requestFn = useCallback(async () => {
    return apiClient.get<{ isComplete: boolean; inProgress: boolean; message: string }>('/setup', { action: 'check' });
  }, []);

  return useApiRequest(requestFn, {
    immediate: false,
    cacheTime: 2000,
    ...options,
  });
}

export function useSetupActions() {
  const [state, setState] = useApiState();

  const startSetup = useCallback(async (options: {
    force?: boolean;
    debugMode?: boolean;
    port?: number;
    skipChecks?: boolean;
  } = {}) => {
    setState({ loading: true, error: null });

    try {
      const response = await apiClient.post('/setup', {
        action: 'start',
        ...options,
      });

      if (response.success) {
        setState({ 
          data: response.data, 
          loading: false, 
          error: null,
          lastFetch: Date.now(),
        });
        apiCache.clear('setup');
        return response.data;
      } else {
        setState({ loading: false, error: response.error || 'Setup failed' });
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Setup error';
      setState({ loading: false, error: errorMessage });
      return null;
    }
  }, [setState]);

  return {
    ...state,
    startSetup,
  };
}

// ============================================================================
// Launcher API Hooks
// ============================================================================

export function useLauncherInstances(options: UseApiOptions = {}) {
  const requestFn = useCallback(async () => {
    const cacheKey = 'launcher:instances';
    const cached = apiCache.get(cacheKey);
    if (cached && !options.immediate) {
      return { success: true, data: cached };
    }

    const response = await apiClient.get<{
      instances: InstanceInfo[];
      totalCount: number;
      runningCount: number;
    }>('/launcher/instances', {
      health: 'true',
      cache: 'false',
    });

    if (response.success && response.data) {
      apiCache.set(cacheKey, response.data, 10000);
    }
    return response;
  }, [options.immediate]);

  return useApiRequest(requestFn, {
    immediate: true,
    cacheTime: 10000,
    retryCount: 2,
    retryDelay: 2000,
    ...options,
  });
}

export function useLauncherActions() {
  const [state, setState] = useApiState();

  const createInstance = useCallback(async (config: {
    projectPath: string;
    tcpPort?: number;
    displayName?: string;
    autoRestart?: boolean;
    environment?: Record<string, string>;
    claudeArgs?: string[];
    startImmediately?: boolean;
  }) => {
    setState({ loading: true, error: null });

    try {
      const response = await apiClient.post('/launcher/instances', { config });

      if (response.success) {
        setState({ 
          data: response.data, 
          loading: false, 
          error: null,
          lastFetch: Date.now(),
        });
        apiCache.clear('launcher:instances');
        return response.data;
      } else {
        setState({ loading: false, error: response.error || 'Instance creation failed' });
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Creation error';
      setState({ loading: false, error: errorMessage });
      return null;
    }
  }, [setState]);

  const deleteInstance = useCallback(async (instanceId: string) => {
    setState({ loading: true, error: null });

    try {
      const response = await apiClient.delete('/launcher/instances', { id: instanceId });

      if (response.success) {
        setState({ 
          data: response.data, 
          loading: false, 
          error: null,
          lastFetch: Date.now(),
        });
        apiCache.clear('launcher:instances');
        return response.data;
      } else {
        setState({ loading: false, error: response.error || 'Instance deletion failed' });
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Deletion error';
      setState({ loading: false, error: errorMessage });
      return null;
    }
  }, [setState]);

  const performInstanceAction = useCallback(async (
    instanceId: string,
    action: 'start' | 'stop' | 'restart',
    params?: any
  ) => {
    setState({ loading: true, error: null });

    try {
      const response = await apiClient.post(`/launcher/instances/${instanceId}/commands`, {
        action,
        ...params,
      });

      if (response.success) {
        setState({ 
          data: response.data, 
          loading: false, 
          error: null,
          lastFetch: Date.now(),
        });
        apiCache.clear('launcher:instances');
        return response.data;
      } else {
        setState({ loading: false, error: response.error || `Action ${action} failed` });
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Action error';
      setState({ loading: false, error: errorMessage });
      return null;
    }
  }, [setState]);

  return {
    ...state,
    createInstance,
    deleteInstance,
    performInstanceAction,
  };
}

export function useInstanceDetails(instanceId: string, options: UseApiOptions = {}) {
  const requestFn = useCallback(async () => {
    if (!instanceId) {
      return { success: false, error: 'Instance ID required' };
    }

    const cacheKey = `launcher:instance:${instanceId}`;
    const cached = apiCache.get(cacheKey);
    if (cached && !options.immediate) {
      return { success: true, data: cached };
    }

    const response = await apiClient.get<InstanceInfo>(`/launcher/instances/${instanceId}`);
    if (response.success && response.data) {
      apiCache.set(cacheKey, response.data, 5000);
    }
    return response;
  }, [instanceId, options.immediate]);

  return useApiRequest<InstanceInfo>(requestFn, {
    immediate: !!instanceId,
    cacheTime: 5000,
    ...options,
  });
}

// ============================================================================
// Startup API Hooks
// ============================================================================

export function useStartupInitialize(options: UseApiOptions = {}) {
  const [state, setState] = useApiState();

  const initialize = useCallback(async (initOptions: any = {}) => {
    setState({ loading: true, error: null });

    try {
      const response = await apiClient.post('/startup/initialize', initOptions);

      if (response.success) {
        setState({ 
          data: response.data, 
          loading: false, 
          error: null,
          lastFetch: Date.now(),
        });
        return response.data;
      } else {
        setState({ loading: false, error: response.error || 'Initialization failed' });
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Initialization error';
      setState({ loading: false, error: errorMessage });
      return null;
    }
  }, [setState]);

  return {
    ...state,
    initialize,
  };
}

// ============================================================================
// Generic Data Fetching Hook
// ============================================================================

export function useFetch<T>(
  endpoint: string,
  options: UseApiOptions & {
    params?: Record<string, any>;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
  } = {}
) {
  const { params, method = 'GET', body, ...hookOptions } = options;

  const requestFn = useCallback(async () => {
    const cacheKey = `${method}:${endpoint}:${JSON.stringify(params || {})}`;
    const cached = apiCache.get(cacheKey);
    if (cached && method === 'GET' && !hookOptions.immediate) {
      return { success: true, data: cached };
    }

    let response: ApiResponse<T>;
    
    switch (method) {
      case 'GET':
        response = await apiClient.get<T>(endpoint, params);
        break;
      case 'POST':
        response = await apiClient.post<T>(endpoint, body);
        break;
      case 'PUT':
        response = await apiClient.put<T>(endpoint, body);
        break;
      case 'DELETE':
        response = await apiClient.delete<T>(endpoint, params);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }

    if (response.success && response.data && method === 'GET') {
      apiCache.set(cacheKey, response.data);
    }

    return response;
  }, [endpoint, params, method, body, hookOptions.immediate]);

  return useApiRequest<T>(requestFn, hookOptions);
}

// ============================================================================
// Cache Management Hook
// ============================================================================

export function useApiCache() {
  const clearCache = useCallback((pattern?: string) => {
    apiCache.clear(pattern);
  }, []);

  const invalidateCache = useCallback((keys: string[]) => {
    apiCache.invalidate(keys);
  }, []);

  return {
    clearCache,
    invalidateCache,
  };
}

// ============================================================================
// Real-time Data Hook
// ============================================================================

export function useRealTimeData<T>(
  endpoint: string,
  interval: number = 5000,
  options: UseApiOptions = {}
) {
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  const requestFn = useCallback(async () => {
    return apiClient.get<T>(endpoint);
  }, [endpoint]);

  const result = useApiRequest<T>(requestFn, {
    immediate: true,
    ...options,
  });

  const startPolling = useCallback(() => {
    if (isPolling) return;
    
    setIsPolling(true);
    intervalRef.current = setInterval(() => {
      result.refresh();
    }, interval);
  }, [isPolling, interval, result]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...result,
    isPolling,
    startPolling,
    stopPolling,
  };
}

// ============================================================================
// Export all hooks
// ============================================================================

export {
  apiClient,
  apiCache,
};

export default {
  useHealth,
  useSetupStatus,
  useSetupQuickCheck,
  useSetupActions,
  useLauncherInstances,
  useLauncherActions,
  useInstanceDetails,
  useStartupInitialize,
  useFetch,
  useApiCache,
  useRealTimeData,
  useApiState,
  useApiRequest,
};