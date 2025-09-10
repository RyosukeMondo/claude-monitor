'use client';

import React, { useState, useEffect } from 'react';
import { ProjectMonitor } from '../../components/dashboard/project-monitor';
import { 
  ProjectInfo, 
  ClaudeState, 
  DaemonStatistics,
  MonitoringMetrics,
  RecoveryAction,
  RecoverySettings,
  SessionInfo
} from '../../types/monitoring';

// Mock data generator for demonstration
const generateMockData = () => {
  const mockSessions: SessionInfo[] = [
    {
      sessionId: '202119d9-3653-4246-a1be-00b6c0546fff',
      jsonlFilePath: '~/.claude/projects/-mnt-d-repos-claude-monitor/202119d9-3653-4246-a1be-00b6c0546fff.jsonl',
      isActive: true,
      eventCount: 147,
      startTime: new Date(Date.now() - 3600000), // 1 hour ago
      lastActivity: new Date(Date.now() - 300000), // 5 minutes ago
    }
  ];

  const defaultRecoverySettings: RecoverySettings = {
    autoRecovery: true,
    clearOnIdle: true,
    promptAfterClear: true,
    idleThresholdSeconds: 300,
  };

  const mockProjects: ProjectInfo[] = [
    {
      projectPath: '/mnt/d/repos/claude-monitor',
      encodedPath: '-mnt-d-repos-claude-monitor',
      displayName: 'Claude Monitor',
      activeSessions: mockSessions,
      currentState: ClaudeState.ACTIVE,
      lastActivity: new Date(Date.now() - 120000), // 2 minutes ago
      monitoring: true,
      recoverySettings: defaultRecoverySettings,
    },
    {
      projectPath: '/mnt/d/repos/my-project',
      encodedPath: '-mnt-d-repos-my-project',
      displayName: 'My Project',
      activeSessions: [],
      currentState: ClaudeState.IDLE,
      lastActivity: new Date(Date.now() - 1800000), // 30 minutes ago
      monitoring: true,
      recoverySettings: { ...defaultRecoverySettings, autoRecovery: false },
    },
    {
      projectPath: '/mnt/d/repos/test-project',
      encodedPath: '-mnt-d-repos-test-project',
      displayName: 'Test Project',
      activeSessions: [],
      currentState: ClaudeState.ERROR,
      lastActivity: new Date(Date.now() - 3600000), // 1 hour ago
      monitoring: false,
      recoverySettings: defaultRecoverySettings,
    },
  ];

  const mockDaemonStats: DaemonStatistics = {
    start_time: new Date(Date.now() - 7200000), // 2 hours ago
    uptime_seconds: 7200,
    restarts: 0,
    config_reloads: 2,
    total_detections: 45,
    total_recoveries: 12,
    errors: 1,
    components: {
      'log_monitor': { status: 'active', processed_lines: 2847 },
      'state_detector': { status: 'active', state_changes: 23 },
      'decision_engine': { status: 'active', decisions_made: 12 },
      'notifier': { status: 'active', notifications_sent: 8 },
    },
  };

  const mockMetrics: MonitoringMetrics = {
    responseTime: 156,
    activeProjects: 2,
    totalSessions: 3,
    errorsPerHour: 0.5,
    recoveriesPerHour: 6,
    systemLoad: 0.32,
  };

  return { mockProjects, mockDaemonStats, mockMetrics };
};

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [daemonStats, setDaemonStats] = useState<DaemonStatistics | null>(null);
  const [metrics, setMetrics] = useState<MonitoringMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRecoveryAction, setLastRecoveryAction] = useState<RecoveryAction | null>(null);

  // Initialize with mock data
  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      const { mockProjects, mockDaemonStats, mockMetrics } = generateMockData();
      setProjects(mockProjects);
      setDaemonStats(mockDaemonStats);
      setMetrics(mockMetrics);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (daemonStats) {
        const updatedStats = {
          ...daemonStats,
          uptime_seconds: Math.floor((Date.now() - daemonStats.start_time.getTime()) / 1000),
        };
        setDaemonStats(updatedStats);
      }

      // Randomly update project states for demonstration
      setProjects(prevProjects => 
        prevProjects.map(project => {
          const shouldUpdate = Math.random() > 0.95; // 5% chance per update
          if (shouldUpdate && project.monitoring) {
            const states = [ClaudeState.ACTIVE, ClaudeState.IDLE, ClaudeState.WAITING_INPUT];
            const randomState = states[Math.floor(Math.random() * states.length)];
            return {
              ...project,
              currentState: randomState,
              lastActivity: new Date(),
            };
          }
          return project;
        })
      );
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [daemonStats]);

  const handleRecoveryAction = async (action: RecoveryAction) => {
    console.log('Recovery action requested:', action);
    setLastRecoveryAction(action);
    
    // Here you would typically make an API call to execute the recovery action
    // For now, we'll just simulate the action
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update project state based on action
      if (action.type === 'clear') {
        setProjects(prevProjects =>
          prevProjects.map(project =>
            project.projectPath === action.projectPath
              ? { ...project, currentState: ClaudeState.WAITING_INPUT, lastActivity: new Date() }
              : project
          )
        );
      }
      
      console.log('Recovery action completed successfully');
    } catch (error) {
      console.error('Recovery action failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!daemonStats || !metrics) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load monitoring data</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ProjectMonitor
        projects={projects}
        daemonStats={daemonStats}
        metrics={metrics}
        onRecoveryAction={handleRecoveryAction}
        realTimeUpdates={true}
      />
      
      {/* Debug Panel (only shown in development) */}
      {process.env.NODE_ENV === 'development' && lastRecoveryAction && (
        <div className="fixed bottom-4 right-4 bg-blue-100 dark:bg-blue-900 p-4 rounded-lg shadow-lg max-w-sm">
          <h4 className="font-semibold mb-2">Last Recovery Action</h4>
          <div className="text-sm space-y-1">
            <div><strong>Type:</strong> {lastRecoveryAction.type}</div>
            <div><strong>Project:</strong> {lastRecoveryAction.projectPath}</div>
            <div><strong>Time:</strong> {lastRecoveryAction.timestamp.toLocaleTimeString()}</div>
            <div><strong>Reason:</strong> {lastRecoveryAction.reason}</div>
          </div>
          <button
            onClick={() => setLastRecoveryAction(null)}
            className="mt-2 text-xs bg-blue-600 text-white px-2 py-1 rounded"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}