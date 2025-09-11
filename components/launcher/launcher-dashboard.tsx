'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Play, 
  Square, 
  Terminal, 
  Settings, 
  Plus, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Wifi, 
  WifiOff,
  Folder,
  ChevronDown,
  ChevronRight,
  ExternalLink 
} from 'lucide-react';

// Types for launcher functionality
interface LauncherConfig {
  projectPath: string;
  tcpPort: number;
  displayName?: string;
  autoRestart: boolean;
  environment: Record<string, string>;
  claudeArgs: string[];
}

interface InstanceInfo {
  id: string;
  config: LauncherConfig;
  processId: number;
  tcpPort: number;
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  startTime: Date;
  lastActivity: Date;
  sessionIds: string[];
  errorMessage?: string;
}

interface TCPCommand {
  type: 'send' | 'enter' | 'up' | 'down' | 'ctrl-c' | 'tab' | 'raw';
  content?: string;
  instanceId: string;
}

interface InstallationStatus {
  claudeInstalled: boolean;
  claudeVersion?: string;
  mcpToolsInstalled: boolean;
  authenticationRequired: boolean;
  errorMessages: string[];
}

interface LauncherDashboardProps {
  realTimeUpdates?: boolean;
  onInstanceChange?: (instances: InstanceInfo[]) => void;
}

// Status indicator component
const StatusIndicator: React.FC<{ status: InstanceInfo['status'] }> = ({ status }) => {
  const getStatusConfig = (status: InstanceInfo['status']) => {
    switch (status) {
      case 'running':
        return { color: 'bg-green-500', text: 'Running', icon: CheckCircle, animate: true };
      case 'starting':
        return { color: 'bg-blue-500', text: 'Starting', icon: RefreshCw, animate: true };
      case 'stopping':
        return { color: 'bg-orange-500', text: 'Stopping', icon: RefreshCw, animate: true };
      case 'stopped':
        return { color: 'bg-gray-500', text: 'Stopped', icon: Square, animate: false };
      case 'error':
        return { color: 'bg-red-500', text: 'Error', icon: AlertCircle, animate: false };
      default:
        return { color: 'bg-gray-400', text: 'Unknown', icon: AlertCircle, animate: false };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <div className="flex items-center space-x-2" role="status" aria-label={`Instance status: ${config.text}`}>
      <div className={`w-3 h-3 rounded-full ${config.color} ${config.animate ? 'animate-pulse' : ''}`} />
      <Icon className={`w-4 h-4 ${config.animate ? 'animate-spin' : ''}`} />
      <span className="font-medium text-sm">{config.text}</span>
    </div>
  );
};

// Instance card component
const InstanceCard: React.FC<{
  instance: InstanceInfo;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onSendCommand: (command: TCPCommand) => void;
  onViewLogs: (id: string) => void;
}> = ({ instance, onStart, onStop, onSendCommand, onViewLogs }) => {
  const [commandInput, setCommandInput] = useState('');
  const [showCommandInterface, setShowCommandInterface] = useState(false);

  const formatUptime = useCallback((startTime: Date) => {
    const seconds = Math.floor((Date.now() - startTime.getTime()) / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  }, []);

  const handleSendCommand = (type: TCPCommand['type'], content?: string) => {
    onSendCommand({
      type,
      content,
      instanceId: instance.id
    });
    if (type === 'send' && content) {
      setCommandInput('');
    }
  };

  const isRunning = instance.status === 'running';
  const canStart = instance.status === 'stopped' || instance.status === 'error';
  const canStop = instance.status === 'running' || instance.status === 'starting';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-xl">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {instance.config.displayName || 'Claude Instance'}
          </h3>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 space-x-2">
            <Folder className="w-4 h-4" />
            <span className="font-mono truncate max-w-xs" title={instance.config.projectPath}>
              {instance.config.projectPath}
            </span>
          </div>
        </div>
        <StatusIndicator status={instance.status} />
      </div>

      {/* Instance details */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-600 dark:text-gray-400">TCP Port:</span>
          <div className="flex items-center space-x-1">
            {isRunning ? <Wifi className="w-3 h-3 text-green-500" /> : <WifiOff className="w-3 h-3 text-gray-400" />}
            <span className="font-mono font-medium">{instance.tcpPort}</span>
          </div>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Sessions:</span>
          <span className="ml-2 font-medium">{instance.sessionIds.length}</span>
        </div>
        {isRunning && (
          <>
            <div>
              <span className="text-gray-600 dark:text-gray-400">PID:</span>
              <span className="ml-2 font-mono font-medium">{instance.processId}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Uptime:</span>
              <span className="ml-2 font-medium">{formatUptime(instance.startTime)}</span>
            </div>
          </>
        )}
      </div>

      {/* Error message */}
      {instance.status === 'error' && instance.errorMessage && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-red-700 dark:text-red-300">{instance.errorMessage}</span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => onStart(instance.id)}
          disabled={!canStart}
          className="flex items-center space-x-1 px-3 py-2 bg-green-500 hover:bg-green-600 focus:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
          aria-label={`Start instance ${instance.config.displayName || instance.id}`}
        >
          <Play className="w-4 h-4" />
          <span>Start</span>
        </button>
        
        <button
          onClick={() => onStop(instance.id)}
          disabled={!canStop}
          className="flex items-center space-x-1 px-3 py-2 bg-red-500 hover:bg-red-600 focus:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
          aria-label={`Stop instance ${instance.config.displayName || instance.id}`}
        >
          <Square className="w-4 h-4" />
          <span>Stop</span>
        </button>

        <button
          onClick={() => setShowCommandInterface(!showCommandInterface)}
          disabled={!isRunning}
          className="flex items-center space-x-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 focus:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
          aria-label="Toggle command interface"
        >
          <Terminal className="w-4 h-4" />
          <span>Commands</span>
          {showCommandInterface ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>

        <button
          onClick={() => onViewLogs(instance.id)}
          className="flex items-center space-x-1 px-3 py-2 bg-gray-500 hover:bg-gray-600 focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-white text-sm rounded-lg transition-colors"
          aria-label="View instance logs"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Logs</span>
        </button>
      </div>

      {/* Command interface */}
      {showCommandInterface && isRunning && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
          <div className="flex space-x-2">
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && commandInput.trim()) {
                  handleSendCommand('send', commandInput.trim());
                }
              }}
              placeholder="Enter command to send..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            />
            <button
              onClick={() => commandInput.trim() && handleSendCommand('send', commandInput.trim())}
              disabled={!commandInput.trim()}
              className="px-3 py-2 bg-blue-500 hover:bg-blue-600 focus:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
            >
              Send
            </button>
          </div>
          
          {/* Quick action buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleSendCommand('enter')}
              className="px-2 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded text-xs transition-colors"
            >
              Enter
            </button>
            <button
              onClick={() => handleSendCommand('ctrl-c')}
              className="px-2 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded text-xs transition-colors"
            >
              Ctrl+C
            </button>
            <button
              onClick={() => handleSendCommand('up')}
              className="px-2 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded text-xs transition-colors"
            >
              ↑
            </button>
            <button
              onClick={() => handleSendCommand('down')}
              className="px-2 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded text-xs transition-colors"
            >
              ↓
            </button>
            <button
              onClick={() => handleSendCommand('tab')}
              className="px-2 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded text-xs transition-colors"
            >
              Tab
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// New instance form component
const NewInstanceForm: React.FC<{
  onSubmit: (config: LauncherConfig) => void;
  onCancel: () => void;
  installationStatus: InstallationStatus;
}> = ({ onSubmit, onCancel, installationStatus }) => {
  const [config, setConfig] = useState<LauncherConfig>({
    projectPath: '',
    tcpPort: 9999,
    displayName: '',
    autoRestart: true,
    environment: {},
    claudeArgs: []
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (config.projectPath.trim()) {
      onSubmit({
        ...config,
        projectPath: config.projectPath.trim(),
        displayName: config.displayName.trim() || undefined
      });
    }
  };

  const isValid = config.projectPath.trim() && installationStatus.claudeInstalled;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Create New Claude Instance
      </h3>

      {/* Installation status */}
      {!installationStatus.claudeInstalled && (
        <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-orange-800 dark:text-orange-200">Claude Code Not Installed</h4>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                Claude Code CLI must be installed before creating instances.
              </p>
              {installationStatus.errorMessages.length > 0 && (
                <ul className="text-sm text-orange-700 dark:text-orange-300 mt-2 space-y-1">
                  {installationStatus.errorMessages.map((msg, index) => (
                    <li key={index}>• {msg}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Project path */}
        <div>
          <label htmlFor="projectPath" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Project Path *
          </label>
          <input
            id="projectPath"
            type="text"
            value={config.projectPath}
            onChange={(e) => setConfig(prev => ({ ...prev, projectPath: e.target.value }))}
            placeholder="/path/to/your/project"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        {/* Display name */}
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Display Name
          </label>
          <input
            id="displayName"
            type="text"
            value={config.displayName}
            onChange={(e) => setConfig(prev => ({ ...prev, displayName: e.target.value }))}
            placeholder="My Project (optional)"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* TCP port */}
        <div>
          <label htmlFor="tcpPort" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            TCP Port
          </label>
          <input
            id="tcpPort"
            type="number"
            value={config.tcpPort}
            onChange={(e) => setConfig(prev => ({ ...prev, tcpPort: parseInt(e.target.value) || 9999 }))}
            min="1024"
            max="65535"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Port for TCP bridge communication (1024-65535)
          </p>
        </div>

        {/* Auto restart */}
        <div className="flex items-center space-x-2">
          <input
            id="autoRestart"
            type="checkbox"
            checked={config.autoRestart}
            onChange={(e) => setConfig(prev => ({ ...prev, autoRestart: e.target.checked }))}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="autoRestart" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Auto-restart on failure
          </label>
        </div>

        {/* Advanced options */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
          >
            {showAdvanced ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span>Advanced Options</span>
          </button>
        </div>

        {showAdvanced && (
          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Advanced configuration options for Claude Code execution
            </p>
            {/* Placeholder for advanced options - can be expanded later */}
            <div className="text-sm text-gray-500 dark:text-gray-400 italic">
              Environment variables and Claude arguments configuration coming soon...
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isValid}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 focus:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Create Instance
          </button>
        </div>
      </form>
    </div>
  );
};

// Main launcher dashboard component
export const LauncherDashboard: React.FC<LauncherDashboardProps> = ({ 
  realTimeUpdates = true,
  onInstanceChange 
}) => {
  const [instances, setInstances] = useState<InstanceInfo[]>([]);
  const [showNewInstanceForm, setShowNewInstanceForm] = useState(false);
  const [installationStatus, setInstallationStatus] = useState<InstallationStatus>({
    claudeInstalled: false,
    mcpToolsInstalled: false,
    authenticationRequired: false,
    errorMessages: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Mock data for development - replace with actual API calls
  const mockInstallationStatus: InstallationStatus = {
    claudeInstalled: true,
    claudeVersion: '1.2.3',
    mcpToolsInstalled: true,
    authenticationRequired: false,
    errorMessages: []
  };

  const mockInstances: InstanceInfo[] = [
    {
      id: 'instance-1',
      config: {
        projectPath: '/mnt/d/repos/claude-monitor',
        tcpPort: 9999,
        displayName: 'Claude Monitor',
        autoRestart: true,
        environment: {},
        claudeArgs: []
      },
      processId: 12345,
      tcpPort: 9999,
      status: 'running',
      startTime: new Date(Date.now() - 3600000), // 1 hour ago
      lastActivity: new Date(Date.now() - 120000), // 2 minutes ago
      sessionIds: ['session-1', 'session-2']
    }
  ];

  // Initialize with mock data
  useEffect(() => {
    const timer = setTimeout(() => {
      setInstallationStatus(mockInstallationStatus);
      setInstances(mockInstances);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Real-time updates
  useEffect(() => {
    if (!realTimeUpdates) return;

    const interval = setInterval(() => {
      setLastUpdate(new Date());
      // Update instance activity timestamps
      setInstances(prev => prev.map(instance => ({
        ...instance,
        lastActivity: instance.status === 'running' ? new Date() : instance.lastActivity
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, [realTimeUpdates]);

  // Notify parent of instance changes
  useEffect(() => {
    onInstanceChange?.(instances);
  }, [instances, onInstanceChange]);

  // Handlers
  const handleCreateInstance = useCallback(async (config: LauncherConfig) => {
    try {
      // Mock implementation - replace with actual API call
      const newInstance: InstanceInfo = {
        id: `instance-${Date.now()}`,
        config,
        processId: Math.floor(Math.random() * 10000) + 1000,
        tcpPort: config.tcpPort,
        status: 'starting',
        startTime: new Date(),
        lastActivity: new Date(),
        sessionIds: []
      };

      setInstances(prev => [...prev, newInstance]);
      setShowNewInstanceForm(false);

      // Simulate startup process
      setTimeout(() => {
        setInstances(prev => prev.map(instance => 
          instance.id === newInstance.id 
            ? { ...instance, status: 'running' as const }
            : instance
        ));
      }, 2000);
    } catch (error) {
      console.error('Failed to create instance:', error);
    }
  }, []);

  const handleStartInstance = useCallback(async (instanceId: string) => {
    setInstances(prev => prev.map(instance => 
      instance.id === instanceId 
        ? { ...instance, status: 'starting' as const, startTime: new Date() }
        : instance
    ));

    // Mock startup delay
    setTimeout(() => {
      setInstances(prev => prev.map(instance => 
        instance.id === instanceId 
          ? { ...instance, status: 'running' as const }
          : instance
      ));
    }, 2000);
  }, []);

  const handleStopInstance = useCallback(async (instanceId: string) => {
    setInstances(prev => prev.map(instance => 
      instance.id === instanceId 
        ? { ...instance, status: 'stopping' as const }
        : instance
    ));

    // Mock shutdown delay
    setTimeout(() => {
      setInstances(prev => prev.map(instance => 
        instance.id === instanceId 
          ? { ...instance, status: 'stopped' as const }
          : instance
      ));
    }, 1000);
  }, []);

  const handleSendCommand = useCallback(async (command: TCPCommand) => {
    console.log('Sending command:', command);
    // Mock implementation - replace with actual TCP bridge communication
  }, []);

  const handleViewLogs = useCallback((instanceId: string) => {
    // Navigate to logs view or open logs panel
    console.log('View logs for instance:', instanceId);
  }, []);

  const handleRefreshStatus = useCallback(async () => {
    setIsLoading(true);
    // Mock refresh delay
    setTimeout(() => {
      setIsLoading(false);
      setLastUpdate(new Date());
    }, 1000);
  }, []);

  const runningInstances = useMemo(() => instances.filter(i => i.status === 'running').length, [instances]);
  const errorInstances = useMemo(() => instances.filter(i => i.status === 'error').length, [instances]);

  if (isLoading) {
    return (
      <div className="min-h-96 bg-gray-50 dark:bg-gray-900 flex items-center justify-center rounded-xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading launcher dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Claude Code Launcher
          </h2>
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${realTimeUpdates ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span>{realTimeUpdates ? 'Live' : 'Offline'}</span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleRefreshStatus}
            disabled={isLoading}
            className="flex items-center space-x-1 px-3 py-2 bg-gray-500 hover:bg-gray-600 focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
            aria-label="Refresh installation status"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={() => setShowNewInstanceForm(true)}
            className="flex items-center space-x-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 focus:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-white text-sm rounded-lg transition-colors"
            aria-label="Create new Claude instance"
          >
            <Plus className="w-4 h-4" />
            <span>New Instance</span>
          </button>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-blue-600">{instances.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Instances</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600">{runningInstances}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Running</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
          <div className={`text-2xl font-bold ${errorInstances > 0 ? 'text-red-600' : 'text-gray-600'}`}>
            {errorInstances}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Errors</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
          <div className={`text-2xl font-bold ${installationStatus.claudeInstalled ? 'text-green-600' : 'text-red-600'}`}>
            {installationStatus.claudeInstalled ? '✓' : '✗'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Claude CLI</div>
        </div>
      </div>

      {/* New instance form */}
      {showNewInstanceForm && (
        <NewInstanceForm
          onSubmit={handleCreateInstance}
          onCancel={() => setShowNewInstanceForm(false)}
          installationStatus={installationStatus}
        />
      )}

      {/* Instances grid */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Active Instances ({instances.length})
        </h3>
        
        {instances.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <Terminal className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No Claude instances running</p>
            <p className="text-sm">Create your first instance to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {instances.map((instance) => (
              <InstanceCard
                key={instance.id}
                instance={instance}
                onStart={handleStartInstance}
                onStop={handleStopInstance}
                onSendCommand={handleSendCommand}
                onViewLogs={handleViewLogs}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

LauncherDashboard.displayName = 'LauncherDashboard';

export default LauncherDashboard;