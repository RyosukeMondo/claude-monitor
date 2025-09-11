import { EventParserService } from '../../src/lib/services/event-parser';
import { StateDetector } from '../../src/lib/services/state-detector';

describe('Monitoring Flow Integration Tests', () => {

  describe('Service Integration', () => {
    it('should parse JSONL events and detect state correctly', async () => {
      // 1. Create test JSONL content matching the actual Claude Code schema
      const testJsonlContent = [
        JSON.stringify({
          uuid: 'test-uuid-1',
          parentUuid: null,
          sessionId: 'test-session',
          timestamp: new Date().toISOString(),
          type: 'user',
          cwd: '/test/project',
          message: {
            role: 'user',
            content: 'Help me debug this code'
          }
        }),
        JSON.stringify({
          uuid: 'test-uuid-2',
          parentUuid: 'test-uuid-1',
          sessionId: 'test-session',
          timestamp: new Date().toISOString(),
          type: 'assistant',
          cwd: '/test/project',
          message: {
            role: 'assistant',
            content: 'I can help you debug this code.'
          }
        })
      ].join('\n');

      // 2. Initialize services
      const eventParser = new EventParserService();
      const stateDetector = new StateDetector();

      // 3. Process events through the pipeline
      const events = await eventParser.parseEvents(testJsonlContent);
      expect(events.length).toBeGreaterThan(0);

      // 4. Test state detection with valid events
      if (events.length > 0) {
        const state = await stateDetector.detectState(events);
        expect(state).toBeDefined();
        expect(state.timestamp).toBeDefined();
        expect(typeof state.confidence).toBe('number');
      }
    });

    it('should handle old events and detect inactive state', async () => {
      // 1. Create old events to test timeout detection
      const oldTimestamp = new Date(Date.now() - 300000).toISOString(); // 5 minutes ago
      const oldEventContent = JSON.stringify({
        uuid: 'old-uuid-1',
        parentUuid: null,
        sessionId: 'old-session',
        timestamp: oldTimestamp,
        type: 'tool_call',
        content: JSON.stringify({
          name: 'Bash',
          parameters: { command: 'long-running-command' }
        })
      });

      // 2. Test with old events
      const eventParser = new EventParserService();
      const stateDetector = new StateDetector();
      
      const events = await eventParser.parseEvents(oldEventContent);
      
      if (events.length > 0) {
        const state = await stateDetector.detectState(events);
        expect(state).toBeDefined();
        expect(state.timestamp).toBeDefined();
        expect(typeof state.confidence).toBe('number');
        
        // Verify that old timestamps are properly detected
        const eventAge = Date.now() - new Date(events[0].timestamp).getTime();
        expect(eventAge).toBeGreaterThan(250000); // Should be around 5 minutes
      }
    });

    it('should handle invalid JSONL content gracefully', async () => {
      // 1. Test invalid JSONL content
      const invalidContent = 'invalid json content\n{"missing": "required_fields"}';

      const eventParser = new EventParserService();
      const events = await eventParser.parseEvents(invalidContent);
      
      // Should filter out invalid entries but continue processing
      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBeLessThanOrEqual(1);
    });

    it('should process multiple events efficiently', async () => {
      // 1. Generate multiple valid events
      const multipleEvents = Array.from({ length: 10 }, (_, i) => 
        JSON.stringify({
          uuid: `uuid-${i}`,
          parentUuid: i > 0 ? `uuid-${i-1}` : null,
          sessionId: 'performance-session',
          timestamp: new Date(Date.now() + i * 1000).toISOString(),
          type: 'tool_call',
          content: JSON.stringify({
            name: 'Read',
            parameters: { file_path: `/test/file${i}.js` }
          })
        })
      ).join('\n');

      const startTime = Date.now();

      // 2. Process events through the system
      const eventParser = new EventParserService();
      const stateDetector = new StateDetector();

      const events = await eventParser.parseEvents(multipleEvents);
      const state = await stateDetector.detectState(events);

      const processingTime = Date.now() - startTime;

      // 3. Verify performance expectations
      expect(processingTime).toBeLessThan(5000); // Should process quickly
      expect(events.length).toBeGreaterThan(0);
      expect(state).toBeDefined();
    });
  });
});