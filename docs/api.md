# API Documentation

Comprehensive API reference for the Claude Monitor Next.js application.

## Overview

The Claude Monitor application provides REST APIs and WebSocket endpoints for programmatic monitoring and recovery actions. All APIs use JSON for request/response data and support TypeScript type definitions.

### Base URL
- Development: `http://localhost:3000`
- Production: `https://your-domain.com`

### Authentication
Currently, the application runs in single-user mode without authentication. Authentication will be added in future versions.

## REST API Endpoints

### Projects API

#### GET /api/projects
Get all monitored projects and their current status.

**Response:**
```typescript
interface ProjectInfo {
  projectPath: string;
  encodedPath: string;
  displayName: string;
  activeSessions: SessionInfo[];
  currentState: ClaudeState;
  lastActivity: Date;
  monitoring: boolean;
  recoverySettings: RecoverySettings;
}

// Returns: ProjectInfo[]
```

**Example:**
```bash
curl http://localhost:3000/api/projects
```

#### POST /api/projects
Add a new project for monitoring.

**Request Body:**
```typescript
{
  projectPath: string;
  recoverySettings?: RecoverySettings;
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
  project?: ProjectInfo;
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"projectPath":"/home/user/my-project"}'
```

#### PUT /api/projects/[path]
Update project monitoring settings.

**URL Parameters:**
- `path`: URL-encoded project path

**Request Body:**
```typescript
{
  monitoring?: boolean;
  recoverySettings?: RecoverySettings;
}
```

#### DELETE /api/projects/[path]
Stop monitoring a project and remove it.

**URL Parameters:**
- `path`: URL-encoded project path

### Sessions API

#### GET /api/sessions
Get all active sessions across all projects.

**Query Parameters:**
- `projectPath` (optional): Filter by project path
- `active` (optional): Filter by active status (true/false)
- `limit` (optional): Limit number of results (default: 50)

**Response:**
```typescript
interface SessionInfo {
  sessionId: string;
  jsonlFilePath: string;
  isActive: boolean;
  eventCount: number;
  startTime: Date;
  lastActivity: Date;
  projectPath: string;
}

// Returns: SessionInfo[]
```

#### GET /api/sessions/[id]
Get detailed information about a specific session.

**URL Parameters:**
- `id`: Session ID

**Response:**
```typescript
{
  session: SessionInfo;
  events: ConversationEvent[];
  stateHistory: StateTransition[];
  metrics: SessionMetrics;
}
```

#### GET /api/sessions/[id]/events
Get conversation events for a session.

**Query Parameters:**
- `limit` (optional): Number of events to return (default: 100)
- `offset` (optional): Offset for pagination (default: 0)
- `after` (optional): ISO timestamp to get events after
- `eventType` (optional): Filter by event type ('user' | 'assistant')

**Response:**
```typescript
interface ConversationEvent {
  uuid: string;
  parentUuid: string | null;
  sessionId: string;
  timestamp: Date;
  eventType: 'user' | 'assistant';
  cwd: string;
  messageContent: string;
  commands: CommandInfo[];
  toolCalls: ToolCall[];
  usageStats: UsageStats | null;
  rawData: Record<string, unknown>;
}

// Returns: ConversationEvent[]
```

### Recovery API

#### POST /api/recovery
Execute a recovery action for a project.

**Request Body:**
```typescript
{
  projectPath: string;
  action: 'clear' | 'custom_command' | 'restart_session';
  command?: string;  // Required for custom_command
  reason?: string;   // Optional description
}
```

**Response:**
```typescript
interface RecoveryResult {
  success: boolean;
  message: string;
  timestamp: Date;
  action: RecoveryAction;
}
```

**Examples:**
```bash
# Send /clear command
curl -X POST http://localhost:3000/api/recovery \
  -H "Content-Type: application/json" \
  -d '{
    "projectPath": "/home/user/project",
    "action": "clear",
    "reason": "Context pressure detected"
  }'

# Send custom command
curl -X POST http://localhost:3000/api/recovery \
  -H "Content-Type: application/json" \
  -d '{
    "projectPath": "/home/user/project",
    "action": "custom_command",
    "command": "/sc:implement",
    "reason": "Continue spec implementation"
  }'
```

#### GET /api/recovery/history
Get history of recovery actions.

**Query Parameters:**
- `projectPath` (optional): Filter by project
- `limit` (optional): Number of results (default: 50)
- `action` (optional): Filter by action type

**Response:**
```typescript
// Returns: RecoveryResult[]
```

### State API

#### GET /api/state/[projectPath]
Get current state analysis for a project.

**URL Parameters:**
- `projectPath`: URL-encoded project path

**Response:**
```typescript
interface StateAnalysis {
  currentState: ClaudeState;
  confidence: number;
  stateHistory: StateTransition[];
  activeCommands: CommandInfo[];
  lastActivity: Date;
  contextSummary: string;
}
```

#### GET /api/metrics
Get system-wide monitoring metrics.

**Response:**
```typescript
interface MonitoringMetrics {
  responseTime: number;
  activeProjects: number;
  totalSessions: number;
  errorsPerHour: number;
  recoveriesPerHour: number;
  systemLoad: number;
}
```

### Health Check API

#### GET /api/health
System health check endpoint.

**Response:**
```typescript
{
  status: 'healthy' | 'unhealthy';
  timestamp: Date;
  uptime: number;  // seconds
  version: string;
  database: 'connected' | 'disconnected';
  fileWatcher: 'active' | 'inactive';
  websocket: 'active' | 'inactive';
}
```

## WebSocket API

The application provides real-time updates via WebSocket connections.

### Connection
Connect to: `ws://localhost:3000` (or wss:// for production)

### Events

#### Client → Server Events

**Subscribe to Project Updates:**
```typescript
{
  type: 'subscribe',
  projectPath: string
}
```

**Unsubscribe from Project:**
```typescript
{
  type: 'unsubscribe',
  projectPath: string
}
```

**Subscribe to All Projects:**
```typescript
{
  type: 'subscribe_all'
}
```

#### Server → Client Events

**State Change:**
```typescript
{
  type: 'stateChange',
  projectPath: string,
  oldState: ClaudeState,
  newState: ClaudeState,
  confidence: number,
  timestamp: Date
}
```

**New Session:**
```typescript
{
  type: 'newSession',
  projectPath: string,
  session: SessionInfo
}
```

**New Event:**
```typescript
{
  type: 'newEvent',
  projectPath: string,
  sessionId: string,
  event: ConversationEvent
}
```

**Recovery Action:**
```typescript
{
  type: 'recoveryAction',
  projectPath: string,
  action: RecoveryAction,
  result: RecoveryResult
}
```

**System Error:**
```typescript
{
  type: 'error',
  message: string,
  code?: string,
  details?: Record<string, unknown>
}
```

### WebSocket Client Example

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

// Subscribe to project updates
socket.emit('subscribe', { projectPath: '/home/user/project' });

// Listen for state changes
socket.on('stateChange', (data) => {
  console.log(`State changed: ${data.oldState} → ${data.newState}`);
});

// Listen for new events
socket.on('newEvent', (data) => {
  console.log('New conversation event:', data.event);
});

// Handle errors
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

## TypeScript SDK

For TypeScript applications, use the included client SDK:

```typescript
import { MonitoringClient } from '@/lib/client';

const client = new MonitoringClient('http://localhost:3000');

// Get all projects
const projects = await client.getProjects();

// Add a new project
const result = await client.addProject('/path/to/project');

// Send recovery action
const recovery = await client.sendRecoveryAction({
  projectPath: '/path/to/project',
  action: 'clear',
  reason: 'Context pressure detected'
});

// Subscribe to real-time updates
const unsubscribe = client.subscribeToStateChanges((change) => {
  console.log('State change:', change);
});

// Clean up
unsubscribe();
```

## Error Handling

All API endpoints use consistent error response format:

```typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: Record<string, unknown>
  },
  timestamp: Date
}
```

### Common Error Codes

- `INVALID_REQUEST`: Malformed request body or parameters
- `PROJECT_NOT_FOUND`: Specified project path not found
- `SESSION_NOT_FOUND`: Session ID not found
- `RECOVERY_FAILED`: Recovery action execution failed
- `FILE_ACCESS_ERROR`: Unable to access JSONL files
- `DATABASE_ERROR`: Database operation failed
- `WEBSOCKET_ERROR`: WebSocket connection issue
- `RATE_LIMITED`: Too many requests (future feature)

### Error Response Examples

```typescript
// Project not found
{
  success: false,
  error: {
    code: "PROJECT_NOT_FOUND",
    message: "Project not found: /invalid/path",
    details: { projectPath: "/invalid/path" }
  },
  timestamp: "2024-03-15T10:30:00Z"
}

// Recovery action failed
{
  success: false,
  error: {
    code: "RECOVERY_FAILED",
    message: "Failed to send clear command",
    details: { 
      projectPath: "/home/user/project",
      reason: "No active Claude Code session found" 
    }
  },
  timestamp: "2024-03-15T10:30:00Z"
}
```

## Rate Limiting

Currently, rate limiting is not implemented but will be added in future versions:

- API endpoints: 100 requests per minute per client
- WebSocket connections: 5 connections per client
- Recovery actions: 10 actions per minute per project

## API Versioning

The current API is version 1 and all endpoints are accessed directly. Future versions will use versioned paths:

- v1: `/api/...` (current)
- v2: `/api/v2/...` (future)

## Testing the API

Use the included Postman collection or test with curl:

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Get all projects
curl http://localhost:3000/api/projects

# Add a project
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"projectPath":"/path/to/test/project"}'

# Send recovery action
curl -X POST http://localhost:3000/api/recovery \
  -H "Content-Type: application/json" \
  -d '{
    "projectPath": "/path/to/test/project",
    "action": "clear",
    "reason": "API test"
  }'
```

## Integration Examples

### Bash Script Integration
```bash
#!/bin/bash
# Monitor script that checks Claude state and recovers if needed

API_URL="http://localhost:3000"
PROJECT_PATH="/home/user/my-project"

# Get current state
STATE=$(curl -s "$API_URL/api/state/$(echo $PROJECT_PATH | sed 's/\//%2F/g')" | jq -r '.currentState')

if [ "$STATE" == "ERROR" ]; then
  echo "Error detected, sending clear command..."
  curl -X POST "$API_URL/api/recovery" \
    -H "Content-Type: application/json" \
    -d "{\"projectPath\":\"$PROJECT_PATH\",\"action\":\"clear\"}"
fi
```

### Python Integration
```python
import requests
import json
from typing import Dict, Any

class ClaudeMonitorClient:
    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url
    
    def get_projects(self) -> list:
        response = requests.get(f"{self.base_url}/api/projects")
        return response.json()
    
    def send_recovery_action(self, project_path: str, action: str, **kwargs) -> Dict[str, Any]:
        data = {"projectPath": project_path, "action": action, **kwargs}
        response = requests.post(
            f"{self.base_url}/api/recovery",
            headers={"Content-Type": "application/json"},
            data=json.dumps(data)
        )
        return response.json()

# Usage
client = ClaudeMonitorClient()
projects = client.get_projects()
result = client.send_recovery_action("/path/to/project", "clear")
```

This API documentation provides comprehensive coverage of all endpoints and features available in the Claude Monitor application. For additional examples and integration patterns, refer to the test files in the `__tests__/` directory.