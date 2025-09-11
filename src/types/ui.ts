/**
 * UI types and interfaces for the Claude Monitor dashboard
 * Extends monitoring types for UI integration
 */

import { 
  ProjectInfo, 
  SessionInfo, 
  ClaudeState, 
  StateAnalysis,
  MonitoringMetrics,
  RecoverySettings,
  DaemonStatistics
} from './monitoring';

// Navigation and Layout Types
export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  isActive?: boolean;
  badge?: string | number;
}

export interface LayoutConfig {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  showNotifications: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}

// UI State Management
export interface UIState {
  layout: LayoutConfig;
  selectedProject: string | null;
  selectedSession: string | null;
  activeView: ViewType;
  loading: boolean;
  error: string | null;
  notifications: NotificationItem[];
}

export type ViewType = 
  | 'dashboard' 
  | 'project-detail' 
  | 'session-detail' 
  | 'settings' 
  | 'logs';

export interface NotificationItem {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: NotificationAction;
}

export interface NotificationAction {
  label: string;
  onClick: () => void;
}

// Enhanced Project UI Types
export interface ProjectUIInfo extends ProjectInfo {
  uiState: ProjectUIState;
  metrics: ProjectMetrics;
}

export interface ProjectUIState {
  expanded: boolean;
  selected: boolean;
  showSessions: boolean;
  lastRefresh: Date;
}

export interface ProjectMetrics {
  totalEvents: number;
  avgResponseTime: number;
  errorRate: number;
  uptimePercentage: number;
  trend: 'up' | 'down' | 'stable';
}

// Session UI Types
export interface SessionUIInfo extends SessionInfo {
  uiState: SessionUIState;
  analysis?: StateAnalysis;
}

export interface SessionUIState {
  expanded: boolean;
  selected: boolean;
  showEvents: boolean;
  eventFilter: EventFilter;
}

export interface EventFilter {
  eventType?: 'user' | 'assistant' | 'all';
  timeRange?: TimeRange;
  searchQuery?: string;
}

export interface TimeRange {
  start: Date;
  end: Date;
  preset?: 'last-hour' | 'last-day' | 'last-week' | 'custom';
}

// Dashboard Components
export interface DashboardData {
  overview: OverviewStats;
  projects: ProjectUIInfo[];
  recentActivity: RecentActivityItem[];
  alerts: AlertItem[];
  metrics: MonitoringMetrics;
  daemonStats: DaemonStatistics;
}

export interface OverviewStats {
  totalProjects: number;
  activeProjects: number;
  totalSessions: number;
  activeSessions: number;
  errorCount: number;
  successRate: number;
}

export interface RecentActivityItem {
  id: string;
  type: 'state-change' | 'recovery' | 'error' | 'session-start' | 'session-end';
  projectName: string;
  message: string;
  timestamp: Date;
  state?: ClaudeState;
  severity?: 'low' | 'medium' | 'high';
}

export interface AlertItem {
  id: string;
  type: 'error' | 'warning' | 'recovery';
  projectName: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  action?: AlertAction;
}

export interface AlertAction {
  type: 'recover' | 'restart' | 'dismiss';
  label: string;
  handler: (projectPath: string) => Promise<void>;
}

// Form and Settings Types
export interface SettingsFormData {
  monitoring: MonitoringSettings;
  ui: UISettings;
  recovery: RecoverySettings;
}

export interface MonitoringSettings {
  autoRefreshEnabled: boolean;
  refreshInterval: number;
  maxRetention: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface UISettings {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  showNotifications: boolean;
  compactMode: boolean;
  animationsEnabled: boolean;
}

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  testId?: string;
}

export interface LoadingState {
  isLoading: boolean;
  loadingText?: string;
  progress?: number;
}

export interface ErrorState {
  hasError: boolean;
  error?: Error | string;
  retry?: () => void;
}

// State Management Action Types
export type UIAction = 
  | { type: 'SET_LAYOUT'; payload: Partial<LayoutConfig> }
  | { type: 'SELECT_PROJECT'; payload: string | null }
  | { type: 'SELECT_SESSION'; payload: string | null }
  | { type: 'SET_VIEW'; payload: ViewType }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_NOTIFICATION'; payload: NotificationItem }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' | 'system' };

// API Response Types
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T = unknown> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Chart and Visualization Types
export interface ChartDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
}

export interface TimeSeriesData {
  label: string;
  data: ChartDataPoint[];
  color?: string;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area';
  title?: string;
  xLabel?: string;
  yLabel?: string;
  showLegend?: boolean;
  showGrid?: boolean;
}