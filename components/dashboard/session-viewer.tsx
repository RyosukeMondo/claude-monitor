'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ConversationEvent, ConversationSession } from '../../../lib/types/conversation';
import { format, isToday, isYesterday } from 'date-fns';
import VirtualizedSessionViewer from './virtualized-session-viewer';

// Use virtualized viewer for large datasets (>500 events for performance)
const VIRTUALIZATION_THRESHOLD = 500;

// Event timeline item component
interface EventItemProps {
  event: ConversationEvent;
  index: number;
  isSearchMatch: boolean;
  onEventClick: (event: ConversationEvent) => void;
}

function EventItem({ event, index, isSearchMatch, onEventClick }: EventItemProps) {
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'user_input': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'assistant_response': return 'bg-green-100 border-green-300 text-green-800';
      case 'tool_call': return 'bg-purple-100 border-purple-300 text-purple-800';
      case 'tool_result': return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'error': return 'bg-red-100 border-red-300 text-red-800';
      case 'warning': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'command_execution': return 'bg-indigo-100 border-indigo-300 text-indigo-800';
      case 'file_operation': return 'bg-gray-100 border-gray-300 text-gray-800';
      case 'clear_command': return 'bg-pink-100 border-pink-300 text-pink-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-600';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'user_input': return '👤';
      case 'assistant_response': return '🤖';
      case 'tool_call': return '🔧';
      case 'tool_result': return '📋';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'command_execution': return '⚡';
      case 'file_operation': return '📁';
      case 'clear_command': return '🧹';
      default: return '📄';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    if (isToday(timestamp)) {
      return format(timestamp, 'HH:mm:ss');
    } else if (isYesterday(timestamp)) {
      return `Yesterday ${format(timestamp, 'HH:mm:ss')}`;
    }
    return format(timestamp, 'MMM dd HH:mm:ss');
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (!content) return '';
    return content.length > maxLength ? content.slice(0, maxLength) + '...' : content;
  };

  return (
    <div
      className={`
        flex items-start gap-4 p-4 rounded-lg border-l-4 cursor-pointer
        transition-all duration-200 hover:shadow-md
        ${getEventTypeColor(event.type)}
        ${isSearchMatch ? 'ring-2 ring-yellow-400 shadow-lg' : ''}
      `}
      onClick={() => onEventClick(event)}
    >
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div className="text-2xl mb-2">{getEventIcon(event.type)}</div>
        {index !== 0 && (
          <div className="w-0.5 h-8 bg-gray-300 -mt-2"></div>
        )}
      </div>

      {/* Event content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm uppercase tracking-wide">
              {event.type.replace('_', ' ')}
            </span>
            {event.role && (
              <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50">
                {event.role}
              </span>
            )}
          </div>
          <time className="text-sm text-gray-600" dateTime={event.timestamp.toISOString()}>
            {formatTimestamp(event.timestamp)}
          </time>
        </div>

        {/* Event content preview */}
        {event.content && (
          <div className="text-sm text-gray-700 mb-2 font-mono">
            {truncateContent(event.content)}
          </div>
        )}

        {/* Tool execution info */}
        {event.toolExecution && (
          <div className="text-xs bg-white bg-opacity-50 p-2 rounded">
            <strong>Tool:</strong> {event.toolExecution.toolName}
            {event.toolExecution.success !== undefined && (
              <span className={`ml-2 px-1 rounded ${
                event.toolExecution.success ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
              }`}>
                {event.toolExecution.success ? '✓' : '✗'}
              </span>
            )}
          </div>
        )}

        {/* File operation info */}
        {event.fileOperation && (
          <div className="text-xs bg-white bg-opacity-50 p-2 rounded">
            <strong>File:</strong> {event.fileOperation.operation} {event.fileOperation.filePath}
          </div>
        )}

        {/* Error info */}
        {event.error && (
          <div className="text-xs bg-red-50 p-2 rounded mt-2">
            <strong>Error:</strong> {event.error.message}
            <span className={`ml-2 px-1 rounded text-xs ${
              event.error.severity === 'critical' ? 'bg-red-200 text-red-800' :
              event.error.severity === 'high' ? 'bg-orange-200 text-orange-800' :
              'bg-yellow-200 text-yellow-800'
            }`}>
              {event.error.severity}
            </span>
          </div>
        )}

        {/* Performance metrics */}
        {event.performance && (
          <div className="text-xs text-gray-600 mt-2 flex gap-4">
            {event.performance.processingTime && (
              <span>⏱️ {event.performance.processingTime}ms</span>
            )}
            {event.performance.tokenCount && (
              <span>🔤 {event.performance.tokenCount} tokens</span>
            )}
            {event.performance.memoryUsage && (
              <span>💾 {Math.round(event.performance.memoryUsage / 1024 / 1024)}MB</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Event filter controls
interface EventFiltersProps {
  eventTypes: string[];
  selectedTypes: string[];
  onTypeToggle: (type: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalEvents: number;
  filteredEvents: number;
}

function EventFilters({
  eventTypes,
  selectedTypes,
  onTypeToggle,
  searchQuery,
  onSearchChange,
  totalEvents,
  filteredEvents,
}: EventFiltersProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
      {/* Search bar */}
      <div>
        <label htmlFor="event-search" className="block text-sm font-medium text-gray-700 mb-2">
          Search Events
        </label>
        <input
          id="event-search"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search event content, file names, tool names..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Event type filters */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Event Types ({filteredEvents}/{totalEvents} events)
        </label>
        <div className="flex flex-wrap gap-2">
          {eventTypes.map((type) => (
            <button
              key={type}
              onClick={() => onTypeToggle(type)}
              className={`
                px-3 py-1 rounded-full text-xs font-medium transition-colors
                ${selectedTypes.includes(type)
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-gray-100 text-gray-600 border-gray-300'
                }
                border hover:shadow-sm
              `}
            >
              {type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2">
        <button
          onClick={() => eventTypes.forEach(type => !selectedTypes.includes(type) && onTypeToggle(type))}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Select All
        </button>
        <button
          onClick={() => selectedTypes.forEach(type => onTypeToggle(type))}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Clear All
        </button>
      </div>
    </div>
  );
}

// Event detail modal
interface EventDetailModalProps {
  event: ConversationEvent | null;
  onClose: () => void;
}

function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  if (!event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Event Details</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
          <div className="space-y-4">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <div className="mt-1 text-sm">{event.type}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                <div className="mt-1 text-sm">{event.timestamp.toISOString()}</div>
              </div>
              {event.role && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <div className="mt-1 text-sm">{event.role}</div>
                </div>
              )}
              {event.sessionId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Session ID</label>
                  <div className="mt-1 text-sm font-mono text-xs">{event.sessionId}</div>
                </div>
              )}
            </div>

            {/* Content */}
            {event.content && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Content</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md">
                  <pre className="text-sm whitespace-pre-wrap font-mono">{event.content}</pre>
                </div>
              </div>
            )}

            {/* Tool execution details */}
            {event.toolExecution && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Tool Execution</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md">
                  <div className="space-y-2">
                    <div><strong>Tool:</strong> {event.toolExecution.toolName}</div>
                    <div><strong>Start Time:</strong> {event.toolExecution.startTime.toISOString()}</div>
                    {event.toolExecution.endTime && (
                      <div><strong>End Time:</strong> {event.toolExecution.endTime.toISOString()}</div>
                    )}
                    {event.toolExecution.success !== undefined && (
                      <div><strong>Success:</strong> {event.toolExecution.success ? 'Yes' : 'No'}</div>
                    )}
                    {event.toolExecution.errorMessage && (
                      <div><strong>Error:</strong> {event.toolExecution.errorMessage}</div>
                    )}
                    <div><strong>Parameters:</strong></div>
                    <pre className="text-xs bg-white p-2 rounded border">
                      {JSON.stringify(event.toolExecution.parameters, null, 2)}
                    </pre>
                    {event.toolExecution.result && (
                      <>
                        <div><strong>Result:</strong></div>
                        <pre className="text-xs bg-white p-2 rounded border">
                          {JSON.stringify(event.toolExecution.result, null, 2)}
                        </pre>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* File operation details */}
            {event.fileOperation && (
              <div>
                <label className="block text-sm font-medium text-gray-700">File Operation</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md">
                  <div className="space-y-2">
                    <div><strong>Operation:</strong> {event.fileOperation.operation}</div>
                    <div><strong>File Path:</strong> {event.fileOperation.filePath}</div>
                    <div><strong>Success:</strong> {event.fileOperation.success ? 'Yes' : 'No'}</div>
                    {event.fileOperation.lineNumbers && (
                      <div><strong>Line Numbers:</strong> {event.fileOperation.lineNumbers.join(', ')}</div>
                    )}
                    {event.fileOperation.bytesProcessed && (
                      <div><strong>Bytes Processed:</strong> {event.fileOperation.bytesProcessed}</div>
                    )}
                    {event.fileOperation.errorMessage && (
                      <div><strong>Error:</strong> {event.fileOperation.errorMessage}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Metadata */}
            {Object.keys(event.metadata).length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Metadata</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md">
                  <pre className="text-xs">{JSON.stringify(event.metadata, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main session viewer component
interface SessionViewerProps {
  session: ConversationSession;
  events: ConversationEvent[];
  realTimeUpdates?: boolean;
  className?: string;
}

function StandardSessionViewer({ 
  session, 
  events, 
  realTimeUpdates = false,
  className = '' 
}: SessionViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ConversationEvent | null>(null);

  // Get unique event types
  const eventTypes = useMemo(() => {
    const types = new Set(events.map(event => event.type));
    return Array.from(types).sort();
  }, [events]);

  // Initialize selected types (all by default)
  useEffect(() => {
    if (eventTypes.length > 0 && selectedEventTypes.length === 0) {
      setSelectedEventTypes(eventTypes);
    }
  }, [eventTypes, selectedEventTypes]);

  // Filter events based on search and type selection
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Type filter
      if (!selectedEventTypes.includes(event.type)) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const searchableText = [
          event.content,
          event.toolExecution?.toolName,
          event.fileOperation?.filePath,
          event.error?.message,
          JSON.stringify(event.metadata),
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchableText.includes(query);
      }

      return true;
    });
  }, [events, selectedEventTypes, searchQuery]);

  // Search matches for highlighting
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return new Set();
    
    const query = searchQuery.toLowerCase();
    const matches = new Set<string>();
    
    filteredEvents.forEach(event => {
      const searchableText = [
        event.content,
        event.toolExecution?.toolName,
        event.fileOperation?.filePath,
        event.error?.message,
      ].filter(Boolean).join(' ').toLowerCase();
      
      if (searchableText.includes(query)) {
        matches.add(event.id);
      }
    });
    
    return matches;
  }, [filteredEvents, searchQuery]);

  const handleEventTypeToggle = useCallback((type: string) => {
    setSelectedEventTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  }, []);

  const handleEventClick = useCallback((event: ConversationEvent) => {
    setSelectedEvent(event);
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Session header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            Session Details
          </h2>
          {realTimeUpdates && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Live</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Session ID</label>
            <div className="mt-1 text-sm font-mono">{session.id}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Started</label>
            <div className="mt-1 text-sm">{format(session.startTime, 'PPpp')}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Duration</label>
            <div className="mt-1 text-sm">
              {session.endTime 
                ? `${Math.round((session.endTime.getTime() - session.startTime.getTime()) / 1000 / 60)} min`
                : 'Active'
              }
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Events</label>
            <div className="mt-1 text-sm">{events.length}</div>
          </div>
        </div>
      </div>

      {/* Event filters */}
      <EventFilters
        eventTypes={eventTypes}
        selectedTypes={selectedEventTypes}
        onTypeToggle={handleEventTypeToggle}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalEvents={events.length}
        filteredEvents={filteredEvents.length}
      />

      {/* Event timeline */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Event Timeline</h3>
        </div>
        
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {events.length === 0 ? 'No events in this session' : 'No events match the current filters'}
          </div>
        ) : (
          <div className="p-4 space-y-4 max-h-[800px] overflow-auto">
            {filteredEvents.map((event, index) => (
              <EventItem
                key={event.id}
                event={event}
                index={index}
                isSearchMatch={searchMatches.has(event.id)}
                onEventClick={handleEventClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Event detail modal */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}

// Wrapper component to decide between virtualized and standard viewers without using hooks
export default function SessionViewer({ 
  session, 
  events, 
  realTimeUpdates = false,
  className = '' 
}: SessionViewerProps) {
  if (events.length > VIRTUALIZATION_THRESHOLD) {
    return (
      <VirtualizedSessionViewer
        session={session}
        events={events}
        realTimeUpdates={realTimeUpdates}
        className={className}
      />
    );
  }
  return (
    <StandardSessionViewer
      session={session}
      events={events}
      realTimeUpdates={realTimeUpdates}
      className={className}
    />
  );
}