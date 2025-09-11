'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ProjectInfo, 
  ClaudeState, 
  DaemonStatistics,
  MonitoringMetrics,
  RecoveryAction,
  SessionInfo 
} from '../../types/monitoring';
import { 
  ProjectUIInfo,
  ProjectMetrics,
  AlertItem,
  RecentActivityItem 
} from '../../types/ui';

// Mock data for demonstration - in real app this would come from API
const generateMockProjects = (): ProjectUIInfo[] => {
  const baseProjects: ProjectInfo[] = [
    {
      projectPath: '/Users/dev/claude-monitor',
      encodedPath: 'L1VzZXJzL2Rldi9jbGF1ZGUtbW9uaXRvcg==',
      displayName: 'Claude Monitor',
      activeSessions: [],
      currentState: ClaudeState.ACTIVE,
      lastActivity: new Date(Date.now() - 5000),
      monitoring: true,
      recoverySettings: {
        autoRecovery: true,
        clearOnIdle: true,
        promptAfterClear: false,
        idleThresholdSeconds: 300
      }
    },
    {
      projectPath: '/Users/dev/web-app',
      encodedPath: 'L1VzZXJzL2Rldi93ZWItYXBw',
      displayName: 'Web Application',
      activeSessions: [
        {
          sessionId: 'sess_123',
          jsonlFilePath: '/tmp/sess_123.jsonl',
          isActive: true,
          eventCount: 45,
          startTime: new Date(Date.now() - 3600000),
          lastActivity: new Date(Date.now() - 30000)
        }
      ],
      currentState: ClaudeState.IDLE,
      lastActivity: new Date(Date.now() - 30000),
      monitoring: true,
      recoverySettings: {
        autoRecovery: false,
        clearOnIdle: false,
        promptAfterClear: true,
        idleThresholdSeconds: 600
      }
    },
    {
      projectPath: '/Users/dev/api-service',
      encodedPath: 'L1VzZXJzL2Rldi9hcGktc2VydmljZQ==',
      displayName: 'API Service',
      activeSessions: [],
      currentState: ClaudeState.ERROR,
      lastActivity: new Date(Date.now() - 120000),
      monitoring: true,
      recoverySettings: {
        autoRecovery: true,
        clearOnIdle: true,
        promptAfterClear: false,
        idleThresholdSeconds: 300
      }
    },
    {
      projectPath: '/Users/dev/data-pipeline',
      encodedPath: 'L1VzZXJzL2Rldi9kYXRhLXBpcGVsaW5l',
      displayName: 'Data Pipeline',
      activeSessions: [],
      currentState: ClaudeState.WAITING_INPUT,
      lastActivity: new Date(Date.now() - 60000),
      monitoring: false,
      recoverySettings: {
        autoRecovery: false,
        clearOnIdle: false,
        promptAfterClear: true,
        idleThresholdSeconds: 900
      }
    }
  ];

  return baseProjects.map(project => ({
    ...project,
    uiState: {
      expanded: false,
      selected: false,
      showSessions: false,
      lastRefresh: new Date()
    },
    metrics: {
      totalEvents: Math.floor(Math.random() * 1000) + 100,
      avgResponseTime: Math.floor(Math.random() * 200) + 50,
      errorRate: Math.random() * 5,
      uptimePercentage: 95 + Math.random() * 5,
      trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable'
    }
  }));
};

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

  const timeSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / 1000);
  const activityText = timeSinceActivity < 60 ? 
    `${timeSinceActivity}s ago` : 
    `${Math.floor(timeSinceActivity / 60)}m ago`;

  return (
    <div className="flex items-center space-x-2">
      <div 
        className={`w-3 h-3 rounded-full ${getStateColor(state)} ${state === ClaudeState.ACTIVE ? 'animate-pulse' : ''}`}
      />
      <span className="font-medium text-sm">{getStateText(state)}</span>
      <span className="text-xs text-gray-500">({activityText})</span>
    </div>
  );
};

const ProjectStatusBadge: React.FC<{ monitoring: boolean; state: ClaudeState }> = ({ monitoring, state }) => {
  if (!monitoring) {
    return (
      <span className="px-2 py-1 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 text-xs font-medium rounded-full">
        Inactive
      </span>
    );
  }

  const getStatusColor = () => {
    switch (state) {
      case ClaudeState.ACTIVE: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case ClaudeState.IDLE: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case ClaudeState.WAITING_INPUT: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case ClaudeState.ERROR: return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor()}`}>
      Monitoring
    </span>
  );
};

const ProjectMetricsBar: React.FC<{ metrics: ProjectMetrics }> = ({ metrics }) => {
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '→';
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      case 'stable': return 'text-gray-600';
    }
  };

  return (
    <div className="grid grid-cols-4 gap-3 mt-3 text-xs">
      <div className="text-center">
        <div className="text-gray-500 dark:text-gray-400">Events</div>
        <div className="font-medium">{metrics.totalEvents.toLocaleString()}</div>
      </div>
      <div className="text-center">
        <div className="text-gray-500 dark:text-gray-400">Response</div>
        <div className="font-medium">{Math.round(metrics.avgResponseTime)}ms</div>
      </div>
      <div className="text-center">
        <div className="text-gray-500 dark:text-gray-400">Uptime</div>
        <div className="font-medium">{metrics.uptimePercentage.toFixed(1)}%</div>
      </div>
      <div className="text-center">
        <div className="text-gray-500 dark:text-gray-400">Trend</div>
        <div className={`font-medium ${getTrendColor(metrics.trend)}`}>
          {getTrendIcon(metrics.trend)}
        </div>
      </div>
    </div>
  );
};

const ProjectCard: React.FC<{
  project: ProjectUIInfo;
  onToggleMonitoring: (projectPath: string) => void;
  onRecoveryAction: (action: RecoveryAction) => void;
  onViewDetails: (projectPath: string) => void;
}> = ({ project, onToggleMonitoring, onRecoveryAction, onViewDetails }) => {
  const [expanded, setExpanded] = useState(false);

  const handleClearCommand = () => {
    onRecoveryAction({
      type: 'clear',
      projectPath: project.projectPath,
      timestamp: new Date(),
      reason: 'Manual clear requested from projects page'
    });
  };

  const handleRestartSession = () => {
    onRecoveryAction({
      type: 'restart_session',
      projectPath: project.projectPath,
      timestamp: new Date(),
      reason: 'Manual restart requested from projects page'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {project.displayName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-mono truncate mt-1">
              {project.projectPath}
            </p>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <ProjectStatusBadge monitoring={project.monitoring} state={project.currentState} />
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label={expanded ? 'Collapse details' : 'Expand details'}
            >
              <svg 
                className={`w-5 h-5 transform transition-transform ${expanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <StateIndicator state={project.currentState} lastActivity={project.lastActivity} />
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {project.activeSessions.length} active session{project.activeSessions.length !== 1 ? 's' : ''}
          </div>
        </div>

        {expanded && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
            <ProjectMetricsBar metrics={project.metrics} />
            
            <div className="mt-4 space-y-2">
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Auto Recovery:</span>
                <span className="ml-2 font-medium">
                  {project.recoverySettings.autoRecovery ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Idle Threshold:</span>
                <span className="ml-2 font-medium">
                  {Math.floor(project.recoverySettings.idleThresholdSeconds / 60)}m
                </span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => onToggleMonitoring(project.projectPath)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  project.monitoring
                    ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800'
                    : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800'
                }`}
              >
                {project.monitoring ? 'Stop Monitoring' : 'Start Monitoring'}
              </button>
              
              {project.monitoring && (
                <>
                  <button
                    onClick={handleClearCommand}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 rounded-md transition-colors"
                  >
                    Send /clear
                  </button>
                  
                  <button
                    onClick={handleRestartSession}
                    className="px-3 py-1 text-sm bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:hover:bg-orange-800 rounded-md transition-colors"
                  >
                    Restart Session
                  </button>
                </>
              )}
              
              <button
                onClick={() => onViewDetails(project.projectPath)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                View Details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ProjectsOverview: React.FC<{ projects: ProjectUIInfo[] }> = ({ projects }) => {
  const stats = useMemo(() => {
    const total = projects.length;
    const monitoring = projects.filter(p => p.monitoring).length;
    const active = projects.filter(p => p.currentState === ClaudeState.ACTIVE).length;
    const errors = projects.filter(p => p.currentState === ClaudeState.ERROR).length;
    const totalSessions = projects.reduce((sum, p) => sum + p.activeSessions.length, 0);

    return { total, monitoring, active, errors, totalSessions };
  }, [projects]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Total Projects</div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="text-2xl font-bold text-green-600">{stats.monitoring}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Monitoring</div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className={`text-2xl font-bold ${stats.errors > 0 ? 'text-red-600' : 'text-gray-600'}`}>
          {stats.errors}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Errors</div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="text-2xl font-bold text-purple-600">{stats.totalSessions}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Active Sessions</div>
      </div>
    </div>
  );
};

const ProjectFilterBar: React.FC<{
  filterState: string;
  onFilterChange: (filter: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}> = ({ filterState, onFilterChange, searchQuery, onSearchChange }) => {
  const filters = [
    { key: 'all', label: 'All Projects', count: 0 },
    { key: 'monitoring', label: 'Monitoring', count: 0 },
    { key: 'active', label: 'Active', count: 0 },
    { key: 'error', label: 'Errors', count: 0 },
    { key: 'inactive', label: 'Inactive', count: 0 }
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1">
        <input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => onFilterChange(filter.key)}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              filterState === filter.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectUIInfo[]>([]);
  const [filterState, setFilterState] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // Initialize with mock data
    setProjects(generateMockProjects());
    
    // Set up periodic refresh
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      setProjects(prev => prev.map(project => ({
        ...project,
        uiState: {
          ...project.uiState,
          lastRefresh: new Date()
        }
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Apply state filter
    switch (filterState) {
      case 'monitoring':
        filtered = filtered.filter(p => p.monitoring);
        break;
      case 'active':
        filtered = filtered.filter(p => p.currentState === ClaudeState.ACTIVE);
        break;
      case 'error':
        filtered = filtered.filter(p => p.currentState === ClaudeState.ERROR);
        break;
      case 'inactive':
        filtered = filtered.filter(p => !p.monitoring);
        break;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.displayName.toLowerCase().includes(query) ||
        p.projectPath.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [projects, filterState, searchQuery]);

  const handleToggleMonitoring = (projectPath: string) => {
    setProjects(prev => prev.map(project => 
      project.projectPath === projectPath
        ? { ...project, monitoring: !project.monitoring }
        : project
    ));
  };

  const handleRecoveryAction = (action: RecoveryAction) => {
    console.log('Recovery action:', action);
    // In real implementation, this would call the API
  };

  const handleViewDetails = (projectPath: string) => {
    console.log('View details for:', projectPath);
    // In real implementation, this would navigate to project detail page
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Project Management
          </h1>
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Live Updates</span>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <ProjectsOverview projects={projects} />

        {/* Filter Bar */}
        <ProjectFilterBar
          filterState={filterState}
          onFilterChange={setFilterState}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Projects Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Projects ({filteredProjects.length})
            </h2>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Add Project
            </button>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                {searchQuery || filterState !== 'all' ? 'No projects match your criteria' : 'No projects found'}
              </div>
              <div className="text-gray-400 dark:text-gray-500">
                {searchQuery || filterState !== 'all' 
                  ? 'Try adjusting your search or filter settings'
                  : 'Add your first project to get started with monitoring'
                }
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.projectPath}
                  project={project}
                  onToggleMonitoring={handleToggleMonitoring}
                  onRecoveryAction={handleRecoveryAction}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}