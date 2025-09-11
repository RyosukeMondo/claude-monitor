'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { format, isToday, isYesterday, differenceInMinutes } from 'date-fns';
import Link from 'next/link';

// Types for session data from API
interface SessionData {
  id: string;
  sessionId: string;
  projectId: string;
  project: {
    id: string;
    projectPath: string;
    displayName: string;
    encodedPath: string;
    currentState: string;
  };
  jsonlFilePath: string;
  isActive: boolean;
  eventCount: number;
  startTime: string;
  lastActivity: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface SessionsResponse {
  success: boolean;
  data: {
    sessions: SessionData[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

// Session status indicator component
function SessionStatusIndicator({ isActive, lastActivity }: { isActive: boolean; lastActivity: Date }) {
  const minutesSinceActivity = differenceInMinutes(new Date(), lastActivity);
  
  if (isActive && minutesSinceActivity < 5) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm text-green-700 font-medium">Active</span>
      </div>
    );
  } else if (isActive && minutesSinceActivity < 30) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
        <span className="text-sm text-yellow-700 font-medium">Idle</span>
      </div>
    );
  } else if (isActive) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
        <span className="text-sm text-orange-700 font-medium">Stale</span>
      </div>
    );
  } else {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        <span className="text-sm text-gray-600 font-medium">Ended</span>
      </div>
    );
  }
}

// Session card component for timeline view
function SessionCard({ session }: { session: SessionData }) {
  const startTime = new Date(session.startTime);
  const lastActivity = new Date(session.lastActivity);
  
  const formatTimestamp = (timestamp: Date) => {
    if (isToday(timestamp)) {
      return format(timestamp, 'HH:mm:ss');
    } else if (isYesterday(timestamp)) {
      return `Yesterday ${format(timestamp, 'HH:mm')}`;
    }
    return format(timestamp, 'MMM dd HH:mm');
  };

  const getDuration = () => {
    if (session.isActive) {
      const minutes = differenceInMinutes(new Date(), startTime);
      if (minutes < 60) return `${minutes}m`;
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    } else {
      const minutes = differenceInMinutes(lastActivity, startTime);
      if (minutes < 60) return `${minutes}m`;
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
  };

  return (
    <Link href={`/sessions/${session.sessionId}`} className="block">
      <div className="bg-white rounded-lg border hover:shadow-md transition-all duration-200 hover:border-blue-300">
        <div className="p-6">
          {/* Header with status and time */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <SessionStatusIndicator isActive={session.isActive} lastActivity={lastActivity} />
              <div className="text-sm text-gray-600">
                {formatTimestamp(startTime)}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {getDuration()}
            </div>
          </div>

          {/* Session info */}
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-gray-900 truncate">
                {session.project.displayName}
              </h3>
              <p className="text-sm text-gray-600 font-mono truncate">
                {session.project.projectPath}
              </p>
            </div>

            {/* Metrics */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Events:</span>
                  <span className="font-medium">{session.eventCount}</span>
                </div>
                {session.metadata.totalTokens && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">Tokens:</span>
                    <span className="font-medium">{session.metadata.totalTokens}</span>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-400 font-mono">
                {session.sessionId.slice(0, 8)}...
              </div>
            </div>

            {/* Last activity */}
            <div className="text-xs text-gray-500">
              Last activity: {formatTimestamp(lastActivity)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Filters component
interface FiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: 'all' | 'active' | 'ended';
  onActiveFilterChange: (filter: 'all' | 'active' | 'ended') => void;
  projectFilter: string;
  onProjectFilterChange: (project: string) => void;
  availableProjects: string[];
  sortBy: 'lastActivity' | 'startTime' | 'eventCount';
  onSortByChange: (sort: 'lastActivity' | 'startTime' | 'eventCount') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
}

function SessionFilters({
  searchQuery,
  onSearchChange,
  activeFilter,
  onActiveFilterChange,
  projectFilter,
  onProjectFilterChange,
  availableProjects,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
}: FiltersProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
      {/* Search */}
      <div>
        <label htmlFor="session-search" className="block text-sm font-medium text-gray-700 mb-2">
          Search Sessions
        </label>
        <input
          id="session-search"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by project name, path, or session ID..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Filters row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Status filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            value={activeFilter}
            onChange={(e) => onActiveFilterChange(e.target.value as 'all' | 'active' | 'ended')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Sessions</option>
            <option value="active">Active Only</option>
            <option value="ended">Ended Only</option>
          </select>
        </div>

        {/* Project filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
          <select
            value={projectFilter}
            onChange={(e) => onProjectFilterChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Projects</option>
            {availableProjects.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
        </div>

        {/* Sort by */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as 'lastActivity' | 'startTime' | 'eventCount')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="lastActivity">Last Activity</option>
            <option value="startTime">Start Time</option>
            <option value="eventCount">Event Count</option>
          </select>
        </div>

        {/* Sort order */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
          <select
            value={sortOrder}
            onChange={(e) => onSortOrderChange(e.target.value as 'asc' | 'desc')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// Loading skeleton
function SessionsLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-10 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sessions skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg border">
            <div className="animate-pulse space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-12"></div>
              </div>
              <div className="space-y-2">
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main sessions page component
export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'ended'>('all');
  const [projectFilter, setProjectFilter] = useState('');
  const [sortBy, setSortBy] = useState<'lastActivity' | 'startTime' | 'eventCount'>('lastActivity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  });

  // Fetch sessions from API
  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
        sortBy,
        sortOrder,
      });

      if (activeFilter !== 'all') {
        params.append('isActive', (activeFilter === 'active').toString());
      }

      const response = await fetch(`/api/sessions?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SessionsResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch sessions');
      }

      setSessions(data.data.sessions);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sessions on component mount and when filters change
  useEffect(() => {
    fetchSessions();
  }, [activeFilter, sortBy, sortOrder, pagination.offset]);

  // Get available projects for filter
  const availableProjects = useMemo(() => {
    const projects = new Set(sessions.map(session => session.project.displayName));
    return Array.from(projects).sort();
  }, [sessions]);

  // Filter sessions based on client-side filters
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const searchableText = [
          session.project.displayName,
          session.project.projectPath,
          session.sessionId,
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(query)) {
          return false;
        }
      }

      // Project filter
      if (projectFilter && session.project.displayName !== projectFilter) {
        return false;
      }

      return true;
    });
  }, [sessions, searchQuery, projectFilter]);

  // Statistics
  const stats = useMemo(() => {
    const activeSessions = sessions.filter(s => s.isActive).length;
    const totalEvents = sessions.reduce((sum, s) => sum + s.eventCount, 0);
    
    return {
      total: sessions.length,
      active: activeSessions,
      ended: sessions.length - activeSessions,
      totalEvents,
    };
  }, [sessions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <SessionsLoading />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Error Loading Sessions</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchSessions}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              🔄 Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sessions</h1>
              <p className="text-gray-600 mt-1">Monitor and analyze Claude Code conversation sessions</p>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">{stats.ended}</div>
                <div className="text-sm text-gray-600">Ended</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.totalEvents}</div>
                <div className="text-sm text-gray-600">Events</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Filters */}
        <SessionFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onActiveFilterChange={setActiveFilter}
          projectFilter={projectFilter}
          onProjectFilterChange={setProjectFilter}
          availableProjects={availableProjects}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
        />

        {/* Sessions grid */}
        {filteredSessions.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Sessions Found</h2>
            <p className="text-gray-600">
              {sessions.length === 0 
                ? 'No sessions have been recorded yet. Start a Claude Code session to see it here.'
                : 'No sessions match the current filters. Try adjusting your search criteria.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.hasMore && (
          <div className="text-center">
            <button
              onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              {loading ? '⏳ Loading...' : '📄 Load More Sessions'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}