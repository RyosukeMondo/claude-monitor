'use client';

import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer
} from 'recharts';
import { 
  ProjectInfo, 
  ClaudeState, 
  DaemonStatistics,
  MonitoringMetrics,
  RecoveryAction 
} from '../../types/monitoring';

interface ProjectMonitorProps {
  projects: ProjectInfo[];
  daemonStats: DaemonStatistics;
  metrics: MonitoringMetrics;
  onRecoveryAction: (action: RecoveryAction) => void;
  realTimeUpdates?: boolean;
}

const StateIndicator: React.FC<{ state: ClaudeState; lastActivity: Date }> = ({ state, lastActivity }) => {
  const getStateColor = (state: ClaudeState) => {
    switch (state) {
      case ClaudeState.ACTIVE: return 'bg-green-500';
      case ClaudeState.IDLE: return 'bg-yellow-500';
      case ClaudeState.WAITING_INPUT: return 'bg-blue-500';
      case ClaudeState.ERROR: return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStateText = (state: ClaudeState) => {
    switch (state) {
      case ClaudeState.ACTIVE: return 'Active';
      case ClaudeState.IDLE: return 'Idle';
      case ClaudeState.WAITING_INPUT: return 'Waiting';
      case ClaudeState.ERROR: return 'Error';
      default: return 'Unknown';
    }
  };

  const getStateAriaLabel = (state: ClaudeState) => {
    switch (state) {
      case ClaudeState.ACTIVE: return 'Claude is actively processing';
      case ClaudeState.IDLE: return 'Claude is idle and waiting';
      case ClaudeState.WAITING_INPUT: return 'Claude is waiting for user input';
      case ClaudeState.ERROR: return 'Claude encountered an error';
      default: return 'Claude state is unknown';
    }
  };

  const timeSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / 1000);
  const activityText = timeSinceActivity < 60 ? 
    `${timeSinceActivity}s ago` : 
    `${Math.floor(timeSinceActivity / 60)}m ago`;

  return (
    <div className="flex items-center space-x-2" role="status" aria-label={getStateAriaLabel(state)}>
      <div 
        className={`w-3 h-3 rounded-full ${getStateColor(state)} ${state === ClaudeState.ACTIVE ? 'animate-pulse' : ''}`} 
        aria-hidden="true"
      />
      <span className="font-medium">{getStateText(state)}</span>
      <span className="text-sm text-gray-500" aria-label={`Last activity ${activityText}`}>
        ({activityText})
      </span>
    </div>
  );
};

const ProjectCard: React.FC<{ 
  project: ProjectInfo; 
  onRecoveryAction: (action: RecoveryAction) => void;
}> = ({ project, onRecoveryAction }) => {
  const handleClearCommand = () => {
    onRecoveryAction({
      type: 'clear',
      projectPath: project.projectPath,
      timestamp: new Date(),
      reason: 'Manual clear requested from dashboard'
    });
  };

  const handleRestartSession = () => {
    onRecoveryAction({
      type: 'restart_session',
      projectPath: project.projectPath,
      timestamp: new Date(),
      reason: 'Manual restart requested from dashboard'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {project.displayName}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
            {project.projectPath}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            project.monitoring 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
          }`}>
            {project.monitoring ? 'Monitoring' : 'Inactive'}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <StateIndicator state={project.currentState} lastActivity={project.lastActivity} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-600 dark:text-gray-400">Active Sessions:</span>
          <span className="ml-2 font-medium">{project.activeSessions.length}</span>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Auto Recovery:</span>
          <span className="ml-2 font-medium">
            {project.recoverySettings.autoRecovery ? 'On' : 'Off'}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <button
          onClick={handleClearCommand}
          className="px-3 py-2 bg-blue-500 hover:bg-blue-600 focus:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
          disabled={!project.monitoring}
          aria-label={`Send clear command to ${project.displayName}`}
        >
          Send /clear
        </button>
        <button
          onClick={handleRestartSession}
          className="px-3 py-2 bg-orange-500 hover:bg-orange-600 focus:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
          disabled={!project.monitoring}
          aria-label={`Restart session for ${project.displayName}`}
        >
          Restart Session
        </button>
      </div>
    </div>
  );
};

const MetricsChart: React.FC<{ metrics: MonitoringMetrics }> = ({ metrics }) => {
  // Generate mock historical data for demo
  const [historicalData] = useState(() => {
    const now = new Date();
    const data = [];
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60000); // Last 24 minutes
      data.push({
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        responseTime: metrics.responseTime + (Math.random() - 0.5) * 100,
        errors: Math.floor(metrics.errorsPerHour + (Math.random() - 0.5) * 5),
        recoveries: Math.floor(metrics.recoveriesPerHour + (Math.random() - 0.5) * 3),
        systemLoad: metrics.systemLoad + (Math.random() - 0.5) * 0.2,
      });
    }
    return data;
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        System Metrics
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={historicalData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="time" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                border: '1px solid #ccc',
                borderRadius: '4px'
              }} 
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="responseTime" 
              stroke="#3B82F6" 
              strokeWidth={2}
              name="Response Time (ms)"
            />
            <Line 
              type="monotone" 
              dataKey="systemLoad" 
              stroke="#10B981" 
              strokeWidth={2}
              name="System Load"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const DaemonStatusCard: React.FC<{ stats: DaemonStatistics }> = ({ stats }) => {
  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const componentCount = Object.keys(stats.components).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Daemon Status
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <span className="text-gray-600 dark:text-gray-400 block text-sm">Uptime</span>
            <span className="font-medium">{formatUptime(stats.uptime_seconds)}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400 block text-sm">Components</span>
            <span className="font-medium">{componentCount}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400 block text-sm">Restarts</span>
            <span className="font-medium">{stats.restarts}</span>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <span className="text-gray-600 dark:text-gray-400 block text-sm">Detections</span>
            <span className="font-medium">{stats.total_detections}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400 block text-sm">Recoveries</span>
            <span className="font-medium">{stats.total_recoveries}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400 block text-sm">Errors</span>
            <span className={`font-medium ${stats.errors > 0 ? 'text-red-600' : ''}`}>
              {stats.errors}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProjectMonitor: React.FC<ProjectMonitorProps> = ({
  projects,
  daemonStats,
  metrics,
  onRecoveryAction,
  realTimeUpdates = true
}) => {
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    if (realTimeUpdates) {
      const interval = setInterval(() => {
        setLastUpdate(new Date());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [realTimeUpdates]);

  const activeProjects = projects.filter(p => p.monitoring).length;
  const errorProjects = projects.filter(p => p.currentState === ClaudeState.ERROR).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Claude Code Project Monitor
          </h1>
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${realTimeUpdates ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span>{realTimeUpdates ? 'Live' : 'Offline'}</span>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-blue-600">{projects.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Projects</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-green-600">{activeProjects}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Monitoring</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
            <div className={`text-2xl font-bold ${errorProjects > 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {errorProjects}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Errors</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-orange-600">{metrics.responseTime.toFixed(0)}ms</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Avg Response</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Projects Grid */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4" id="projects-heading">
              Projects ({projects.length})
            </h2>
            <div 
              className="grid grid-cols-1 xl:grid-cols-2 gap-4" 
              role="region" 
              aria-labelledby="projects-heading"
            >
              {projects.map((project) => (
                <ProjectCard
                  key={project.projectPath}
                  project={project}
                  onRecoveryAction={onRecoveryAction}
                />
              ))}
            </div>
            {projects.length === 0 && (
              <div 
                className="text-center py-12 text-gray-500 dark:text-gray-400" 
                role="status" 
                aria-live="polite"
              >
                No projects currently being monitored
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6" role="complementary" aria-label="System information">
            <DaemonStatusCard stats={daemonStats} />
            <MetricsChart metrics={metrics} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectMonitor;