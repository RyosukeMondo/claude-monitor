'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Play, 
  Square, 
  Terminal, 
  Trash2, 
  RotateCcw, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  HardDrive,
  Network,
  Monitor,
  Zap,
  RefreshCw,
  Filter,
  Search,
  MoreVertical,
  TrendingUp,
  XCircle
} from 'lucide-react';

// Core types for instance management
export interface InstanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  networkConnections: number;
  uptime: number;
  responseTime: number;
  errorRate: number;
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
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error' | 'restarting';
  startTime: Date;
  lastActivity: Date;
  sessionIds: string[];
  errorMessage?: string;
  metrics?: InstanceMetrics;
  restartCount: number;
  lastRestart?: Date;
}

export interface InstanceAction {
  id: string;
  type: 'start' | 'stop' | 'restart' | 'remove' | 'view-logs' | 'view-sessions';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  dangerous?: boolean;
  requiresConfirmation?: boolean;
}

interface InstanceManagerProps {
  instances: InstanceInfo[];
  onInstanceAction: (instanceId: string, action: string, params?: any) => Promise<void>;
  onRefresh?: () => Promise<void>;
  showMetrics?: boolean;
  enableBulkActions?: boolean;
  filterOptions?: string[];
  sortOptions?: string[];
}

// Performance metrics component
const InstanceMetrics: React.FC<{ metrics: InstanceMetrics; compact?: boolean }> = ({ 
  metrics, 
  compact = false 
}) => {
  const getMetricColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-3 text-xs">
        <div className="flex items-center space-x-1">
          <Cpu className="w-3 h-3" />
          <span className={getMetricColor(metrics.cpuUsage, { warning: 70, critical: 90 })}>
            {metrics.cpuUsage.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <HardDrive className="w-3 h-3" />
          <span className={getMetricColor(metrics.memoryUsage, { warning: 80, critical: 95 })}>
            {metrics.memoryUsage.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <Network className="w-3 h-3" />
          <span>{metrics.networkConnections}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-1 mb-1">
          <Cpu className="w-4 h-4" />
          <span className="font-medium">CPU</span>
        </div>
        <div className={`text-lg font-bold ${getMetricColor(metrics.cpuUsage, { warning: 70, critical: 90 })}`}>
          {metrics.cpuUsage.toFixed(1)}%
        </div>
      </div>
      <div className="text-center">
        <div className="flex items-center justify-center space-x-1 mb-1">
          <HardDrive className="w-4 h-4" />
          <span className="font-medium">Memory</span>
        </div>
        <div className={`text-lg font-bold ${getMetricColor(metrics.memoryUsage, { warning: 80, critical: 95 })}`}>
          {metrics.memoryUsage.toFixed(1)}%
        </div>
      </div>
      <div className="text-center">
        <div className="flex items-center justify-center space-x-1 mb-1">
          <Network className="w-4 h-4" />
          <span className="font-medium">Connections</span>
        </div>
        <div className="text-lg font-bold text-blue-600">
          {metrics.networkConnections}
        </div>
      </div>
      <div className="text-center">
        <div className="flex items-center justify-center space-x-1 mb-1">
          <Clock className="w-4 h-4" />
          <span className="font-medium">Response</span>
        </div>
        <div className="text-lg font-bold text-purple-600">
          {metrics.responseTime}ms
        </div>
      </div>
      <div className="text-center">
        <div className="flex items-center justify-center space-x-1 mb-1">
          <TrendingUp className="w-4 h-4" />
          <span className="font-medium">Error Rate</span>
        </div>
        <div className={`text-lg font-bold ${getMetricColor(metrics.errorRate, { warning: 5, critical: 10 })}`}>
          {metrics.errorRate.toFixed(2)}%
        </div>
      </div>
      <div className="text-center">
        <div className="flex items-center justify-center space-x-1 mb-1">
          <Activity className="w-4 h-4" />
          <span className="font-medium">Uptime</span>
        </div>
        <div className="text-lg font-bold text-green-600">
          {Math.floor(metrics.uptime / 3600)}h
        </div>
      </div>
    </div>
  );
};

// Status indicator with enhanced animations
const StatusIndicator: React.FC<{ 
  status: InstanceInfo['status']; 
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ status, showText = true, size = 'md' }) => {
  const getStatusConfig = (status: InstanceInfo['status']) => {
    switch (status) {
      case 'running':
        return { 
          color: 'bg-green-500', 
          textColor: 'text-green-700 dark:text-green-300',
          text: 'Running', 
          icon: CheckCircle, 
          animate: 'animate-pulse' 
        };
      case 'starting':
        return { 
          color: 'bg-blue-500', 
          textColor: 'text-blue-700 dark:text-blue-300',
          text: 'Starting', 
          icon: RefreshCw, 
          animate: 'animate-spin' 
        };
      case 'stopping':
        return { 
          color: 'bg-orange-500', 
          textColor: 'text-orange-700 dark:text-orange-300',
          text: 'Stopping', 
          icon: RefreshCw, 
          animate: 'animate-spin' 
        };
      case 'restarting':
        return { 
          color: 'bg-purple-500', 
          textColor: 'text-purple-700 dark:text-purple-300',
          text: 'Restarting', 
          icon: RotateCcw, 
          animate: 'animate-spin' 
        };
      case 'stopped':
        return { 
          color: 'bg-gray-500', 
          textColor: 'text-gray-700 dark:text-gray-300',
          text: 'Stopped', 
          icon: Square, 
          animate: '' 
        };
      case 'error':
        return { 
          color: 'bg-red-500', 
          textColor: 'text-red-700 dark:text-red-300',
          text: 'Error', 
          icon: XCircle, 
          animate: '' 
        };
      default:
        return { 
          color: 'bg-gray-400', 
          textColor: 'text-gray-700 dark:text-gray-300',
          text: 'Unknown', 
          icon: AlertTriangle, 
          animate: '' 
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: { dot: 'w-2 h-2', icon: 'w-3 h-3', text: 'text-xs' },
    md: { dot: 'w-3 h-3', icon: 'w-4 h-4', text: 'text-sm' },
    lg: { dot: 'w-4 h-4', icon: 'w-5 h-5', text: 'text-base' }
  };

  return (
    <div className="flex items-center space-x-2" role="status" aria-label={`Instance status: ${config.text}`}>
      <div className={`${sizeClasses[size].dot} rounded-full ${config.color} ${config.animate}`} />
      <Icon className={`${sizeClasses[size].icon} ${config.animate} ${config.textColor}`} />
      {showText && (
        <span className={`font-medium ${sizeClasses[size].text} ${config.textColor}`}>
          {config.text}
        </span>
      )}
    </div>
  );
};

// Individual instance management card
const InstanceManagementCard: React.FC<{
  instance: InstanceInfo;
  onAction: (action: string, params?: any) => Promise<void>;
  showMetrics?: boolean;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
}> = ({ instance, onAction, showMetrics = false, isSelected = false, onSelect }) => {
  const [showActions, setShowActions] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [isPerformingAction, setIsPerformingAction] = useState(false);

  const formatUptime = useCallback((startTime: Date) => {
    const seconds = Math.floor((Date.now() - startTime.getTime()) / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }, []);

  const handleAction = async (action: string, params?: any) => {
    if (isPerformingAction) return;
    
    setIsPerformingAction(true);
    try {
      await onAction(action, params);
    } catch (error) {
      console.error(`Failed to perform action ${action}:`, error);
    } finally {
      setIsPerformingAction(false);
      setConfirmAction(null);
    }
  };

  const getAvailableActions = (): InstanceAction[] => {
    const actions: InstanceAction[] = [];
    
    if (instance.status === 'stopped' || instance.status === 'error') {
      actions.push({
        id: 'start',
        type: 'start',
        label: 'Start',
        icon: Play
      });
    }
    
    if (instance.status === 'running' || instance.status === 'starting') {
      actions.push({
        id: 'stop',
        type: 'stop',
        label: 'Stop',
        icon: Square,
        requiresConfirmation: true
      });
    }
    
    if (instance.status === 'running' || instance.status === 'error') {
      actions.push({
        id: 'restart',
        type: 'restart',
        label: 'Restart',
        icon: RotateCcw,
        requiresConfirmation: true
      });
    }
    
    actions.push(
      {
        id: 'view-logs',
        type: 'view-logs',
        label: 'View Logs',
        icon: Terminal
      },
      {
        id: 'view-sessions',
        type: 'view-sessions',
        label: 'Sessions',
        icon: Monitor
      },
      {
        id: 'remove',
        type: 'remove',
        label: 'Remove',
        icon: Trash2,
        dangerous: true,
        requiresConfirmation: true
      }
    );
    
    return actions;
  };

  const isHealthy = instance.status === 'running' && 
    (!instance.metrics || (
      instance.metrics.cpuUsage < 90 && 
      instance.metrics.memoryUsage < 95 && 
      instance.metrics.errorRate < 10
    ));

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border transition-all duration-200 hover:shadow-xl ${
      isSelected ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-20' : 'border-gray-200 dark:border-gray-700'
    } ${!isHealthy ? 'border-red-200 dark:border-red-800' : ''}`}>
      <div className="p-6">
        {/* Header with selection and actions */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-start space-x-3 flex-1">
            {onSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onSelect(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {instance.config.displayName || `Instance ${instance.id.slice(-8)}`}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-mono truncate">
                {instance.config.projectPath}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <StatusIndicator status={instance.status} size="sm" />
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Instance actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              {showActions && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                  {getAvailableActions().map((action) => (
                    <button
                      key={action.id}
                      onClick={() => {
                        setShowActions(false);
                        if (action.requiresConfirmation) {
                          setConfirmAction(action.id);
                        } else {
                          handleAction(action.type);
                        }
                      }}
                      disabled={isPerformingAction}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2 ${
                        action.dangerous ? 'text-red-600 hover:text-red-700' : 'text-gray-700 dark:text-gray-300'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <action.icon className="w-4 h-4" />
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instance details */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">TCP Port:</span>
            <span className="ml-2 font-mono font-medium">{instance.tcpPort}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">PID:</span>
            <span className="ml-2 font-mono font-medium">{instance.processId || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Sessions:</span>
            <span className="ml-2 font-medium">{instance.sessionIds.length}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Uptime:</span>
            <span className="ml-2 font-medium">
              {instance.status === 'running' ? formatUptime(instance.startTime) : 'N/A'}
            </span>
          </div>
          {instance.restartCount > 0 && (
            <div className="col-span-2">
              <span className="text-gray-600 dark:text-gray-400">Restarts:</span>
              <span className="ml-2 font-medium text-orange-600">{instance.restartCount}</span>
              {instance.lastRestart && (
                <span className="ml-2 text-xs text-gray-500">
                  (last: {new Date(instance.lastRestart).toLocaleString()})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Error message */}
        {instance.status === 'error' && instance.errorMessage && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-red-700 dark:text-red-300">{instance.errorMessage}</span>
            </div>
          </div>
        )}

        {/* Metrics display */}
        {showMetrics && instance.metrics && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
              <Zap className="w-4 h-4 mr-1" />
              Performance Metrics
            </h4>
            <InstanceMetrics metrics={instance.metrics} />
          </div>
        )}

        {/* Quick metrics for running instances */}
        {instance.status === 'running' && instance.metrics && !showMetrics && (
          <div className="mb-4">
            <InstanceMetrics metrics={instance.metrics} compact />
          </div>
        )}
      </div>

      {/* Confirmation dialog */}
      {confirmAction && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            Are you sure you want to {confirmAction} this instance?
            {confirmAction === 'remove' && ' This action cannot be undone.'}
          </p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setConfirmAction(null)}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleAction(confirmAction)}
              disabled={isPerformingAction}
              className={`px-3 py-1 text-sm text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                confirmAction === 'remove' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isPerformingAction ? 'Processing...' : 'Confirm'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Main instance manager component
export const InstanceManager: React.FC<InstanceManagerProps> = ({
  instances,
  onInstanceAction,
  onRefresh,
  showMetrics = false,
  enableBulkActions = false,
  filterOptions = ['all', 'running', 'stopped', 'error'],
  sortOptions = ['name', 'status', 'uptime', 'sessions']
}) => {
  const [selectedInstances, setSelectedInstances] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter and sort instances
  const filteredAndSortedInstances = useMemo(() => {
    let filtered = instances.filter(instance => {
      // Apply status filter
      if (filter !== 'all' && instance.status !== filter) return false;
      
      // Apply search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          instance.config.displayName?.toLowerCase().includes(query) ||
          instance.config.projectPath.toLowerCase().includes(query) ||
          instance.id.toLowerCase().includes(query)
        );
      }
      
      return true;
    });

    // Sort instances
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.config.displayName || a.id).localeCompare(b.config.displayName || b.id);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'uptime':
          if (a.status === 'running' && b.status === 'running') {
            return a.startTime.getTime() - b.startTime.getTime();
          }
          return a.status === 'running' ? -1 : b.status === 'running' ? 1 : 0;
        case 'sessions':
          return b.sessionIds.length - a.sessionIds.length;
        default:
          return 0;
      }
    });

    return filtered;
  }, [instances, filter, sortBy, searchQuery]);

  const handleInstanceAction = async (instanceId: string, action: string, params?: any) => {
    await onInstanceAction(instanceId, action, params);
  };

  const handleBulkAction = async (action: string) => {
    const promises = Array.from(selectedInstances).map(instanceId => 
      onInstanceAction(instanceId, action)
    );
    
    try {
      await Promise.all(promises);
      setSelectedInstances(new Set());
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  const handleSelectInstance = (instanceId: string, selected: boolean) => {
    const newSelected = new Set(selectedInstances);
    if (selected) {
      newSelected.add(instanceId);
    } else {
      newSelected.delete(instanceId);
    }
    setSelectedInstances(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedInstances(new Set(filteredAndSortedInstances.map(i => i.id)));
    } else {
      setSelectedInstances(new Set());
    }
  };

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const statusCounts = useMemo(() => {
    return instances.reduce((acc, instance) => {
      acc[instance.status] = (acc[instance.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [instances]);

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Instance Management
          </h2>
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <span>Total: {instances.length}</span>
            <span>Running: {statusCounts.running || 0}</span>
            <span>Stopped: {statusCounts.stopped || 0}</span>
            {statusCounts.error && (
              <span className="text-red-600">Errors: {statusCounts.error}</span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search instances..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm min-w-[200px]"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm appearance-none"
            >
              {filterOptions.map(option => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
          >
            {sortOptions.map(option => (
              <option key={option} value={option}>
                Sort by {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>

          {/* Refresh */}
          {onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-1 px-3 py-2 bg-gray-500 hover:bg-gray-600 focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          )}
        </div>
      </div>

      {/* Bulk actions */}
      {enableBulkActions && selectedInstances.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {selectedInstances.size} instance(s) selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('start')}
                className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
              >
                Start All
              </button>
              <button
                onClick={() => handleBulkAction('stop')}
                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
              >
                Stop All
              </button>
              <button
                onClick={() => setSelectedInstances(new Set())}
                className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk selection toggle */}
      {enableBulkActions && filteredAndSortedInstances.length > 0 && (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={selectedInstances.size === filteredAndSortedInstances.length}
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Select all visible instances
          </span>
        </div>
      )}

      {/* Instances grid */}
      <div>
        {filteredAndSortedInstances.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <Terminal className="w-12 h-12 mx-auto mb-4 opacity-50" />
            {instances.length === 0 ? (
              <>
                <p className="text-lg mb-2">No instances found</p>
                <p className="text-sm">Create your first instance to get started</p>
              </>
            ) : (
              <>
                <p className="text-lg mb-2">No instances match your filters</p>
                <p className="text-sm">Try adjusting your search or filter criteria</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredAndSortedInstances.map((instance) => (
              <InstanceManagementCard
                key={instance.id}
                instance={instance}
                onAction={(action, params) => handleInstanceAction(instance.id, action, params)}
                showMetrics={showMetrics}
                isSelected={enableBulkActions && selectedInstances.has(instance.id)}
                onSelect={enableBulkActions ? (selected) => handleSelectInstance(instance.id, selected) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

InstanceManager.displayName = 'InstanceManager';

export default InstanceManager;