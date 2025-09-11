import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import SessionViewer from '../../../components/dashboard/session-viewer';
import { ConversationEvent, ConversationSession } from '@/lib/types/conversation';

// Mock data service - replace with actual API call
async function getSessionById(sessionId: string): Promise<{
  session: ConversationSession;
  events: ConversationEvent[];
} | null> {
  // TODO: Replace with actual API call to fetch session data
  // This would typically call your JSONL processing service
  
  // Mock implementation for development
  try {
    // In a real implementation, this would:
    // 1. Look up session in database/file system
    // 2. Load JSONL events for the session
    // 3. Parse and validate events
    // 4. Return structured data
    
    const mockSession: ConversationSession = {
      id: sessionId,
      startTime: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      endTime: new Date(),
      events: [],
      metadata: {
        totalEvents: 0,
        totalTokens: 1500,
        userAgent: 'Claude Code',
        platform: 'Desktop',
        version: '1.0.0'
      }
    };

    const mockEvents: ConversationEvent[] = [
      {
        id: 'event-1',
        type: 'session_start',
        timestamp: mockSession.startTime,
        sessionId: sessionId,
        content: 'Session started',
        metadata: {
          platform: 'Desktop',
          version: '1.0.0'
        }
      },
      {
        id: 'event-2',
        type: 'user_input',
        timestamp: new Date(mockSession.startTime.getTime() + 1000),
        sessionId: sessionId,
        role: 'user',
        content: 'Help me implement a session viewer component',
        metadata: {}
      },
      {
        id: 'event-3',
        type: 'assistant_response',
        timestamp: new Date(mockSession.startTime.getTime() + 2000),
        sessionId: sessionId,
        role: 'assistant',
        content: 'I&apost;ll help you implement a session viewer component with timeline visualization and event filtering.',
        metadata: {},
        performance: {
          processingTime: 1200,
          tokenCount: 45,
          memoryUsage: 1024 * 1024 * 50 // 50MB
        }
      },
      {
        id: 'event-4',
        type: 'tool_call',
        timestamp: new Date(mockSession.startTime.getTime() + 3000),
        sessionId: sessionId,
        content: 'Calling Read tool to examine existing codebase',
        metadata: {},
        toolExecution: {
          toolName: 'Read',
          parameters: {
            file_path: '/path/to/file.tsx',
            limit: 100
          },
          startTime: new Date(mockSession.startTime.getTime() + 3000),
          endTime: new Date(mockSession.startTime.getTime() + 3500),
          success: true,
          result: {
            content: 'File contents...',
            lineCount: 150
          }
        }
      },
      {
        id: 'event-5',
        type: 'file_operation',
        timestamp: new Date(mockSession.startTime.getTime() + 5000),
        sessionId: sessionId,
        content: 'Creating session viewer component',
        metadata: {},
        fileOperation: {
          operation: 'create',
          filePath: '/app/src/components/dashboard/session-viewer.tsx',
          success: true,
          bytesProcessed: 15420
        }
      },
      {
        id: 'event-6',
        type: 'command_execution',
        timestamp: new Date(mockSession.startTime.getTime() + 10000),
        sessionId: sessionId,
        content: '/clear',
        metadata: {
          command: 'clear',
          acknowledged: true
        }
      }
    ];

    // Update session with events
    mockSession.events = mockEvents;
    mockSession.metadata.totalEvents = mockEvents.length;

    return {
      session: mockSession,
      events: mockEvents
    };

  } catch (error) {
    console.error('Error fetching session:', error);
    return null;
  }
}

// Loading component
function SessionLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse space-y-6">
        {/* Header skeleton */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-300 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Filters skeleton */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="flex gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-6 bg-gray-200 rounded-full w-20"></div>
            ))}
          </div>
        </div>

        {/* Timeline skeleton */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          </div>
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-4 border rounded">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Error component
function SessionError({ sessionId }: { sessionId: string }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Session Not Found</h1>
        <p className="text-gray-600 mb-6">
          The session with ID <code className="bg-gray-100 px-2 py-1 rounded font-mono">{sessionId}</code> could not be found.
        </p>
        <div className="space-y-2 text-sm text-gray-500">
          <p>This could happen if:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>The session ID is incorrect or malformed</li>
            <li>The session has been deleted or expired</li>
            <li>There's a connectivity issue with the monitoring service</li>
            <li>The JSONL files are not accessible</li>
          </ul>
        </div>
        <div className="mt-6">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

// Main page component
export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params;

  // Validate session ID format
  if (!sessionId || sessionId.length < 10) {
    notFound();
  }

  const sessionData = await getSessionById(sessionId);

  if (!sessionData) {
    return <SessionError sessionId={sessionId} />;
  }

  const { session, events } = sessionData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <a
              href="/dashboard"
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Dashboard
            </a>
            <div className="w-px h-6 bg-gray-300"></div>
            <h1 className="text-xl font-semibold">Session Details</h1>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<SessionLoading />}>
          <SessionViewer
            session={session}
            events={events}
            realTimeUpdates={!session.endTime} // Enable real-time if session is still active
          />
        </Suspense>
      </div>
    </div>
  );
}

// Generate static params for build optimization
export async function generateStaticParams() {
  // In a real implementation, you might want to pre-generate
  // paths for recent sessions or popular sessions
  return [
    // { id: 'sample-session-1' },
    // { id: 'sample-session-2' },
  ];
}

// Metadata generation
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params;
  
  return {
    title: `Session ${sessionId.slice(0, 8)}... - Claude Monitor`,
    description: `Detailed view of Claude Code session ${sessionId}`,
  };
}