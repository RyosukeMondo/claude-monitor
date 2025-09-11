'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RecoveryControls } from '../../components/dashboard/recovery-controls';
import { ProjectInfo, RecoveryAction, RecoveryResult, ClaudeState } from '../../types/monitoring';
import { getRecoveryActionService } from '../../../lib/services/recovery-actions';

// Mock data for development - in production this would come from an API
const mockProject: ProjectInfo = {
  projectPath: '/mnt/d/repos/claude-monitor',
  encodedPath: '-mnt-d-repos-claude-monitor',
  displayName: 'Claude Monitor',
  activeSessions: [
    {
      sessionId: '202119d9-3653-4246-a1be-00b6c0546fff',
      jsonlFilePath: '/home/user/.claude/projects/-mnt-d-repos-claude-monitor/202119d9-3653-4246-a1be-00b6c0546fff.jsonl',
      isActive: true,
      eventCount: 45,
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      lastActivity: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    }
  ],
  currentState: ClaudeState.IDLE,
  lastActivity: new Date(Date.now() - 5 * 60 * 1000),
  monitoring: true,
  recoverySettings: {
    autoRecovery: true,
    clearOnIdle: true,
    promptAfterClear: true,
    idleThresholdSeconds: 300,
  },
};

interface RecoveryHistoryItem {
  id: string;
  action: RecoveryAction;
  result?: RecoveryResult;
  timestamp: Date;
  status: 'pending' | 'executing' | 'completed' | 'failed';
}

interface ConfirmationModalProps {
  isOpen: boolean;
  action: RecoveryAction | null;
  onConfirm: () => void;
  onCancel: () => void;
  isExecuting: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  action,
  onConfirm,
  onCancel,
  isExecuting
}) => {
  if (!isOpen || !action) return null;

  const isDestructive = action.type === 'restart_session' || 
    (action.type === 'custom_command' && action.command?.includes('rm'));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isDestructive ? 'bg-red-100 dark:bg-red-900' : 'bg-yellow-100 dark:bg-yellow-900'
          }`}>
            <span className="text-lg">
              {isDestructive ? '⚠️' : '🔧'}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isDestructive ? 'Confirm Destructive Action' : 'Confirm Recovery Action'}
          </h3>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {isDestructive 
              ? 'This action could disrupt your current work. Are you sure you want to proceed?'
              : 'Are you sure you want to execute this recovery action?'
            }
          </p>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
            <div className="text-sm">
              <strong>Action Type:</strong> <span className="capitalize">{action.type.replace('_', ' ')}</span>
            </div>
            <div className="text-sm">
              <strong>Target:</strong> {action.projectPath}
            </div>
            {action.command && (
              <div className="text-sm">
                <strong>Command:</strong> 
                <code className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded ml-2 text-xs">
                  {action.command}
                </code>
              </div>
            )}
            <div className="text-sm">
              <strong>Reason:</strong> {action.reason}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            disabled={isExecuting}
            className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 focus:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isExecuting}
            className={`px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700 focus:bg-red-700 focus:ring-red-500'
                : 'bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 focus:ring-blue-500'
            }`}
          >
            {isExecuting ? (
              <span className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Executing...</span>
              </span>
            ) : (
              `${isDestructive ? 'Execute Anyway' : 'Confirm & Execute'}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function RecoveryPage() {
  const [project, setProject] = useState<ProjectInfo>(mockProject);
  const [recoveryHistory, setRecoveryHistory] = useState<RecoveryHistoryItem[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState<RecoveryAction | null>(null);
  const [currentExecution, setCurrentExecution] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected');
  const [systemHealth, setSystemHealth] = useState<'healthy' | 'warning' | 'error'>('healthy');

  // Initialize recovery service and simulate real-time updates
  useEffect(() => {
    const recoveryService = getRecoveryActionService();
    
    // Simulate connection status monitoring
    const connectionInterval = setInterval(() => {
      const isServiceConnected = recoveryService.isEnabled();
      setIsConnected(isServiceConnected);
      setConnectionStatus(isServiceConnected ? 'connected' : 'disconnected');
    }, 5000);

    // Simulate real-time state updates
    const stateInterval = setInterval(() => {
      const states = [ClaudeState.IDLE, ClaudeState.ACTIVE, ClaudeState.WAITING_INPUT];
      const randomState = states[Math.floor(Math.random() * states.length)];
      
      // Simulate system health based on state
      let health: 'healthy' | 'warning' | 'error' = 'healthy';
      if (randomState === ClaudeState.IDLE) health = 'warning';
      if (randomState === ClaudeState.ERROR) health = 'error';
      
      setProject(prev => ({
        ...prev,
        currentState: randomState,
        lastActivity: new Date(),
      }));
      setSystemHealth(health);
    }, 30000); // Update every 30 seconds

    return () => {
      clearInterval(connectionInterval);
      clearInterval(stateInterval);
    };
  }, []);

  const executeRecoveryAction = useCallback(async (action: RecoveryAction) => {
    const historyItem: RecoveryHistoryItem = {
      id: Date.now().toString(),
      action,
      timestamp: new Date(),
      status: 'executing',
    };

    setRecoveryHistory(prev => [historyItem, ...prev]);
    setCurrentExecution(historyItem.id);

    try {
      setConnectionStatus('connecting');
      const recoveryService = getRecoveryActionService();
      
      // Simulate API call to execute recovery action with enhanced error handling
      console.log('Executing recovery action:', action);
      
      // Enhanced simulation with more realistic timing
      const executionTime = action.type === 'restart_session' ? 5000 : 2000;
      await new Promise(resolve => setTimeout(resolve, executionTime));
      
      // Simulate potential failures for demonstration
      const shouldFail = Math.random() < 0.1; // 10% chance of failure
      
      let result: RecoveryResult;
      if (shouldFail) {
        result = {
          success: false,
          message: `Failed to execute ${action.type} action: Connection timeout`,
          timestamp: new Date(),
          action,
        };
      } else {
        result = {
          success: true,
          message: `Successfully executed ${action.type} action`,
          timestamp: new Date(),
          action,
        };
      }

      setRecoveryHistory(prev => 
        prev.map(item => 
          item.id === historyItem.id 
            ? { ...item, result, status: result.success ? 'completed' : 'failed' }
            : item
        )
      );

      // Update project state based on action
      if (result.success) {
        if (action.type === 'clear') {
          setProject(prev => ({
            ...prev,
            currentState: ClaudeState.ACTIVE,
            lastActivity: new Date(),
          }));
        } else if (action.type === 'restart_session') {
          setProject(prev => ({
            ...prev,
            currentState: ClaudeState.ACTIVE,
            lastActivity: new Date(),
          }));
        }
      }

      setConnectionStatus('connected');

    } catch (error) {
      console.error('Recovery action failed:', error);
      
      const result: RecoveryResult = {
        success: false,
        message: `Failed to execute ${action.type} action: ${error}`,
        timestamp: new Date(),
        action,
      };

      setRecoveryHistory(prev => 
        prev.map(item => 
          item.id === historyItem.id 
            ? { ...item, result, status: 'failed' }
            : item
        )
      );
      
      setConnectionStatus('disconnected');
    } finally {
      setCurrentExecution(null);
    }
  }, []);

  const handleRecoveryAction = useCallback(async (action: RecoveryAction) => {
    // Check if action requires confirmation based on type
    const requiresConfirmation = action.type === 'restart_session' || 
      action.type === 'custom_command' ||
      (action.command && (action.command.includes('rm') || action.command.includes('kill')));

    if (requiresConfirmation) {
      setPendingAction(action);
      setShowConfirmation(true);
    } else {
      await executeRecoveryAction(action);
    }
  }, [executeRecoveryAction]);

  const handleConfirmAction = useCallback(async () => {
    if (pendingAction) {
      setShowConfirmation(false);
      await executeRecoveryAction(pendingAction);
      setPendingAction(null);
    }
  }, [pendingAction, executeRecoveryAction]);

  const handleCancelAction = useCallback(() => {
    setShowConfirmation(false);
    setPendingAction(null);
  }, []);

  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getStateColor = (state: ClaudeState): string => {
    switch (state) {
      case ClaudeState.ACTIVE: return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case ClaudeState.IDLE: return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case ClaudeState.WAITING_INPUT: return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
      case ClaudeState.ERROR: return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: RecoveryHistoryItem['status']): string => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'executing': return 'text-blue-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Recovery Controls
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manual recovery actions and monitoring for Claude Code projects with enhanced safety controls
          </p>
        </div>

        {/* Enhanced Connection Status */}
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                'bg-red-500'
              }`} />
              <span className="font-medium text-gray-900 dark:text-white">
                {connectionStatus === 'connected' ? 'Connected to Claude Monitor' :
                 connectionStatus === 'connecting' ? 'Connecting...' :
                 'Disconnected'}
              </span>
              {currentExecution && (
                <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span className="text-sm">Executing...</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                systemHealth === 'healthy' ? 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200' :
                systemHealth === 'warning' ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200' :
                'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200'
              }`}>
                {systemHealth === 'healthy' ? '✅ Healthy' :
                 systemHealth === 'warning' ? '⚠️ Warning' :
                 '❌ Error'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: {formatTimeAgo(project.lastActivity)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Status Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Project Status
            </h2>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Project</div>
                <div className="font-medium text-gray-900 dark:text-white">{project.displayName}</div>
                <div className="text-xs text-gray-500 dark:text-gray-500 font-mono">{project.projectPath}</div>
              </div>

              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Current State</div>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStateColor(project.currentState)}`}>
                  {project.currentState}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active Sessions</div>
                <div className="font-medium text-gray-900 dark:text-white">{project.activeSessions.length}</div>
              </div>

              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Auto Recovery</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {project.recoverySettings.autoRecovery ? 'Enabled' : 'Disabled'}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Last Activity</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {formatTimeAgo(project.lastActivity)}
                </div>
              </div>
            </div>
          </div>

          {/* Recovery Controls */}
          <RecoveryControls
            project={project}
            onAction={handleRecoveryAction}
            disabled={!isConnected || connectionStatus === 'connecting' || !!currentExecution}
          />
        </div>

        {/* Recovery History */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recovery History
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Recent recovery actions and their results with enhanced safety tracking
            </p>
          </div>
          
          <div className="p-6">
            {recoveryHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No recovery actions executed yet
              </div>
            ) : (
              <div className="space-y-4">
                {recoveryHistory.slice(0, 10).map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-gray-900 dark:text-white capitalize">
                            {item.action.type.replace('_', ' ')}
                          </span>
                          <span className={`text-sm font-medium ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                          {item.status === 'executing' && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {item.action.reason}
                        </div>
                        
                        {item.action.command && (
                          <div className="mt-2">
                            <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {item.action.command}
                            </code>
                          </div>
                        )}
                        
                        {item.result && (
                          <div className={`mt-2 text-sm ${item.result.success ? 'text-green-600' : 'text-red-600'}`}>
                            {item.result.message}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-500 dark:text-gray-500 ml-4">
                        {formatTimeAgo(item.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Enhanced Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        action={pendingAction}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
        isExecuting={!!currentExecution}
      />
    </div>
  );
}