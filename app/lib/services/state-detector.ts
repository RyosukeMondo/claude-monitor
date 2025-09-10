/**
 * State detection engine for Claude Code execution states.
 * 
 * This module implements intelligent state detection following requirements 5.1 and 5.2:
 * - Pattern-based detection for ACTIVE/INACTIVE states from structured events
 * - Confidence scoring and state transition detection
 * - Fast detection with latency under 1 second
 * - Accurate state transitions with false positive prevention
 * 
 * Converted from Python implementation in src/detection/state_detector.py
 */

import { z } from 'zod';
import { ConversationEvent, ConversationEventSchema } from '../types/conversation';
import { ClaudeSessionState, StateTransition, StateTransitionSchema } from '../types/state';

/**
 * Claude Code execution states - simplified from original Python for JSONL processing
 */
export enum ClaudeState {
  UNKNOWN = 'unknown',
  IDLE = 'idle',
  ACTIVE = 'active',
  INPUT_WAITING = 'input-waiting',
  CONTEXT_PRESSURE = 'context-pressure',
  ERROR = 'error',
  COMPLETED = 'completed'
}

/**
 * State detection result with confidence and evidence
 */
export interface StateDetection {
  state: ClaudeState;
  confidence: number; // 0.0 to 1.0
  evidence: string[]; // Supporting evidence
  timestamp: Date;
  triggeringEvents: ConversationEvent[];
  metadata: Record<string, any>;
}

// Zod schema for StateDetection validation
export const StateDetectionSchema = z.object({
  state: z.nativeEnum(ClaudeState),
  confidence: z.number().min(0).max(1),
  evidence: z.array(z.string()),
  timestamp: z.date(),
  triggeringEvents: z.array(ConversationEventSchema),
  metadata: z.record(z.string(), z.any())
});

/**
 * State transition tracking with timing and confidence
 */
export interface StateTransitionInfo {
  fromState: ClaudeState;
  toState: ClaudeState;
  detection: StateDetection;
  duration?: number; // milliseconds
  timestamp: Date;
}

/**
 * Pattern configuration for state detection
 */
interface StatePatternConfig {
  patterns: RegExp[];
  weight: number;
  negativePatterns?: RegExp[];
  timeoutIndicators?: RegExp[];
  severityIndicators?: RegExp[];
  progressIndicators?: RegExp[];
  confirmationPatterns?: RegExp[];
}

/**
 * State detector configuration
 */
export interface StateDetectorConfig {
  minConfidence: number; // Minimum confidence for state change
  idleTimeout: number; // Seconds of inactivity for idle state
  inputTimeout: number; // Seconds to wait for input responses
  contextPressureThreshold: number; // Threshold for context pressure detection
  stateHistoryLimit: number; // Maximum state transitions to keep
  debounceTime: number; // Minimum time between state changes
  evidenceWeightThreshold: number; // Minimum weighted evidence for detection
}

/**
 * Detection statistics
 */
interface DetectionStatistics {
  detections: number;
  stateChanges: number;
  falsePositives: number;
  totalProcessingTime: number;
  avgProcessingTime: number;
  stateDurations: Record<string, number[]>;
  confidenceScores: number[];
}

/**
 * Intelligent state detection engine for Claude Code execution states.
 * 
 * Analyzes conversation events to detect current Claude Code state with confidence scoring
 * and proper state transition management.
 */
export class StateDetector {
  private config: StateDetectorConfig;
  private currentState: ClaudeState = ClaudeState.UNKNOWN;
  private lastDetection: StateDetection | null = null;
  private lastStateChange: Date = new Date();
  private stateHistory: StateTransitionInfo[] = [];
  private patterns: Record<string, StatePatternConfig>;
  private statistics: DetectionStatistics;

  constructor(config?: Partial<StateDetectorConfig>) {
    this.config = {
      minConfidence: 0.6,
      idleTimeout: 30.0,
      inputTimeout: 5.0,
      contextPressureThreshold: 0.8,
      stateHistoryLimit: 100,
      debounceTime: 2.0,
      evidenceWeightThreshold: 0.5,
      ...config
    };

    this.patterns = this.compilePatterns();
    this.statistics = {
      detections: 0,
      stateChanges: 0,
      falsePositives: 0,
      totalProcessingTime: 0,
      avgProcessingTime: 0,
      stateDurations: {},
      confidenceScores: []
    };

    console.log('State detector initialized');
  }

  /**
   * Compile regex patterns for efficient state detection
   */
  private compilePatterns(): Record<string, StatePatternConfig> {
    return {
      idle: {
        patterns: [
          /^[>\$#]\s*$/m, // Command prompt
          /claude\s*>?\s*$/i, // Claude prompt
          /ready\s*[>\$#]?\s*$/i, // Ready prompt
          /waiting\s+for\s+(?:command|input)/i,
          // UI hint '(esc to interrupt …)' indicates IDLE state (INACTIVE)
          /^\s*\(esc\s+to\s+interrupt\b.*$/im,
        ],
        weight: 1.0,
        negativePatterns: [
          /error|exception|failed/i,
          /\[.*%.*\]/, // Progress indicators
          /processing|loading|running/i,
        ]
      },

      inputWaiting: {
        patterns: [
          /\[y\/n\]|\[Y\/N\]|\[yes\/no\]/i,
          /press\s+(?:enter|any\s+key|space)/i,
          /continue\s*\?/i,
          /do\s+you\s+want\s+to/i,
          /would\s+you\s+like\s+to/i,
          /choose\s+(?:an?\s+)?option/i,
          /enter\s+(?:your\s+)?(?:choice|selection)/i,
        ],
        weight: 1.2,
        timeoutIndicators: [
          /waiting\s+for\s+(?:input|response)/i,
          /please\s+(?:enter|select|choose)/i,
        ]
      },

      contextPressure: {
        patterns: [
          /(?:context|memory|token)\s+(?:limit|full|exceeded)/i,
          /(?:usage|used):\s*(?:8[5-9]|9[0-9]|100)%/i,
          /approaching\s+(?:limit|maximum)/i,
          /consider\s+(?:compacting|reducing)/i,
          /\/compact\s+(?:recommended|suggested)/i,
          /running\s+(?:low\s+on\s+)?(?:context|memory)/i,
        ],
        weight: 1.5, // Higher weight due to importance
        severityIndicators: [
          /(?:critical|urgent|immediate)/i,
          /(?:9[5-9]|100)%/i,
        ]
      },

      error: {
        patterns: [
          /error\s*:|\berror\b/i,
          /exception\s*:|\bexception\b/i,
          /failed\s+to|failure\s*:/i,
          /(?:connection|network)\s+(?:error|failed)/i,
          /timeout|timed\s+out/i,
          /unable\s+to|cannot\s+|can\'t\s+/i,
          /invalid|incorrect|malformed/i,
        ],
        weight: 1.3,
        severityIndicators: [
          /(?:fatal|critical|severe)/i,
          /traceback|stack\s+trace/i,
        ]
      },

      active: {
        patterns: [
          /(?:processing|executing|running)/i,
          /(?:analyzing|parsing|loading)/i,
          /(?:generating|creating|building)/i,
          /\[(?:\d+%|\*+|\.+)\]/, // Progress indicators
          /please\s+wait|working/i,
        ],
        weight: 0.8,
        progressIndicators: [
          /\d+%|\d+\/\d+/,
          /step\s+\d+|phase\s+\d+/i,
        ]
      },

      completed: {
        patterns: [
          /(?:completed|finished|done)/i,
          /(?:success|successful)/i,
          /task\s+(?:complete|finished)/i,
          /all\s+(?:tasks|work)\s+(?:complete|done)/i,
          /no\s+(?:pending|remaining)\s+tasks/i,
          // Strong task completion indicators
          /^\s*Task\s+\d+(?:\.\d+)?\s*:\s*.+?(?:✅|✓|✔️)[\s\S]*?$/im,
          // Commit confirmation phrases
          /(?:committed\s+to\s+git|pushed\s+commits|saved\s+changes)/i,
          /(?:both|all)\s+tasks\s+have\s+been\s+committed/i,
        ],
        weight: 1.1,
        confirmationPatterns: [
          /✓|✅|✔️|[✓✔]/,
          /\bOK\b|\bOKAY\b/i,
          /committed\s+to\s+git/i,
        ]
      }
    };
  }

  /**
   * Detect current Claude Code state from conversation events
   */
  public async detectState(
    events: ConversationEvent[],
    recentEventsCount: number = 10
  ): Promise<StateDetection> {
    const startTime = performance.now();

    try {
      // Get recent events for analysis
      const recentEvents = events.slice(-recentEventsCount);

      if (recentEvents.length === 0) {
        const detection: StateDetection = {
          state: ClaudeState.UNKNOWN,
          confidence: 0.0,
          evidence: ["No conversation events available"],
          timestamp: new Date(),
          triggeringEvents: [],
          metadata: { reason: 'no_data' }
        };
        this.updateStatistics(detection, performance.now() - startTime);
        return detection;
      }

      const detection = await this.analyzeEvents(recentEvents);

      // Update statistics
      this.updateStatistics(detection, performance.now() - startTime);

      // Check if state should change
      if (this.shouldChangeState(detection)) {
        this.changeState(detection);
      }

      this.lastDetection = detection;
      return detection;

    } catch (error) {
      console.error('Error in state detection:', error);
      return {
        state: ClaudeState.UNKNOWN,
        confidence: 0.0,
        evidence: [`Detection error: ${String(error)}`],
        timestamp: new Date(),
        triggeringEvents: [],
        metadata: { error: String(error) }
      };
    }
  }

  /**
   * Analyze conversation events to determine state
   */
  private async analyzeEvents(events: ConversationEvent[]): Promise<StateDetection> {
    // Combine all event content for analysis
    const combinedText = events.map(event => event.content || '').join('\n');
    const recentText = events.slice(-3).map(event => event.content || '').join('\n');

    // Score each possible state
    const stateScores: Record<string, number> = {};
    const stateEvidence: Record<string, string[]> = {};
    const triggeringEventsMap: Record<string, ConversationEvent[]> = {};

    for (const [stateName, patternConfig] of Object.entries(this.patterns)) {
      const { score, evidence, triggers } = this.scoreState(
        stateName,
        combinedText,
        recentText,
        events,
        patternConfig
      );
      stateScores[stateName] = score;
      stateEvidence[stateName] = evidence;
      triggeringEventsMap[stateName] = triggers;
    }

    // Apply timeout-based scoring
    this.applyTimeoutScoring(stateScores, events);

    // Find best state
    const bestStateName = Object.keys(stateScores).reduce((a, b) => 
      stateScores[a] > stateScores[b] ? a : b
    );
    let bestScore = stateScores[bestStateName];

    // Convert to ClaudeState enum
    const stateMapping: Record<string, ClaudeState> = {
      'idle': ClaudeState.IDLE,
      'inputWaiting': ClaudeState.INPUT_WAITING,
      'contextPressure': ClaudeState.CONTEXT_PRESSURE,
      'error': ClaudeState.ERROR,
      'active': ClaudeState.ACTIVE,
      'completed': ClaudeState.COMPLETED
    };

    let bestState = stateMapping[bestStateName] || ClaudeState.UNKNOWN;

    // Check minimum confidence threshold
    if (bestScore < this.config.minConfidence) {
      if (this.currentState !== ClaudeState.UNKNOWN) {
        // Stay in current state with lower confidence
        bestState = this.currentState;
        bestScore = Math.max(bestScore, 0.3); // Minimum confidence for state retention
      } else {
        bestState = ClaudeState.UNKNOWN;
      }
    }

    return {
      state: bestState,
      confidence: Math.min(bestScore, 1.0),
      evidence: stateEvidence[bestStateName] || [],
      timestamp: new Date(),
      triggeringEvents: triggeringEventsMap[bestStateName] || [],
      metadata: {
        allScores: stateScores,
        analysisMethod: 'pattern_matching',
        eventsAnalyzed: events.length
      }
    };
  }

  /**
   * Score a specific state based on pattern matching
   */
  private scoreState(
    stateName: string,
    combinedText: string,
    recentText: string,
    events: ConversationEvent[],
    patternConfig: StatePatternConfig
  ): { score: number; evidence: string[]; triggers: ConversationEvent[] } {
    let score = 0.0;
    const evidence: string[] = [];
    const triggers: ConversationEvent[] = [];
    const baseWeight = patternConfig.weight;

    // Check main patterns
    for (const pattern of patternConfig.patterns) {
      const matches = recentText.match(pattern);
      if (matches) {
        const matchScore = matches.length * 0.3 * baseWeight;
        score += matchScore;
        evidence.push(`Pattern match: ${pattern.source}`);

        // Find triggering events
        for (const event of events.slice(-5)) {
          if (event.content && pattern.test(event.content)) {
            triggers.push(event);
          }
        }
      }
    }

    // Check for negative patterns (reduce score)
    if (patternConfig.negativePatterns) {
      for (const pattern of patternConfig.negativePatterns) {
        if (pattern.test(recentText)) {
          score -= 0.2 * baseWeight;
          evidence.push(`Negative pattern: ${pattern.source}`);
        }
      }
    }

    // Apply special scoring for specific states
    switch (stateName) {
      case 'contextPressure':
        score += this.scoreContextPressure(combinedText, patternConfig, evidence);
        break;
      case 'inputWaiting':
        score += this.scoreInputWaiting(recentText, patternConfig, evidence);
        break;
      case 'error':
        score += this.scoreErrorState(combinedText, patternConfig, evidence);
        break;
      case 'idle':
        score += this.scoreIdleState(events, evidence);
        break;
      case 'completed':
        score += this.scoreCompletedState(recentText, combinedText, patternConfig, evidence);
        break;
    }

    return { score: Math.max(score, 0.0), evidence, triggers };
  }

  /**
   * Score completed state with checkmarks and commit confirmations
   */
  private scoreCompletedState(
    recentText: string,
    combinedText: string,
    config: StatePatternConfig,
    evidence: string[]
  ): number {
    let bonus = 0.0;

    // Check for multiple checkmarks
    const checkmarks = recentText.match(/(?:✅|✓|✔️|[✓✔])/g);
    if (checkmarks) {
      if (checkmarks.length >= 2) {
        bonus += 0.3;
        evidence.push(`Multiple completion checkmarks: ${checkmarks.length}`);
      } else {
        bonus += 0.15;
        evidence.push("Single completion checkmark");
      }
    }

    // Look for commit confirmations
    if (/(committed\s+to\s+git|pushed\s+commits|both\s+tasks\s+have\s+been\s+committed)/i.test(combinedText)) {
      bonus += 0.25;
      evidence.push("Commit confirmation found");
    }

    // Phase completion indicators
    if (/(remaining\s+tasks.*ready\s+to\s+be\s+worked\s+on|phase\s+.*\s+successfully\s+completed)/i.test(combinedText)) {
      bonus += 0.2;
      evidence.push("Phase completion detected");
    }

    return bonus;
  }

  /**
   * Score context pressure state with percentage analysis
   */
  private scoreContextPressure(
    text: string,
    config: StatePatternConfig,
    evidence: string[]
  ): number {
    let score = 0.0;

    // Look for percentage indicators
    const percentMatches = text.match(/(\d+)%/g);
    if (percentMatches) {
      const percentages = percentMatches.map(m => parseInt(m.replace('%', '')));
      const maxPercent = Math.max(...percentages);

      if (maxPercent >= 90) {
        score += 0.6;
        evidence.push(`High usage: ${maxPercent}%`);
      } else if (maxPercent >= 80) {
        score += 0.4;
        evidence.push(`Medium usage: ${maxPercent}%`);
      }
    }

    // Check severity indicators
    if (config.severityIndicators) {
      for (const pattern of config.severityIndicators) {
        if (pattern.test(text)) {
          score += 0.3;
          evidence.push(`Severity indicator: ${pattern.source}`);
        }
      }
    }

    return score;
  }

  /**
   * Score input waiting state with timeout consideration
   */
  private scoreInputWaiting(
    text: string,
    config: StatePatternConfig,
    evidence: string[]
  ): number {
    let score = 0.0;

    // Check timeout indicators
    if (config.timeoutIndicators) {
      for (const pattern of config.timeoutIndicators) {
        if (pattern.test(text)) {
          score += 0.2;
          evidence.push(`Timeout indicator: ${pattern.source}`);
        }
      }
    }

    // Higher score for recent question marks
    if (/\?[^\w]*$/m.test(text)) {
      score += 0.3;
      evidence.push("Recent question mark");
    }

    return score;
  }

  /**
   * Score error state with severity weighting
   */
  private scoreErrorState(
    text: string,
    config: StatePatternConfig,
    evidence: string[]
  ): number {
    let score = 0.0;

    // Check severity patterns
    if (config.severityIndicators) {
      for (const pattern of config.severityIndicators) {
        if (pattern.test(text)) {
          score += 0.4;
          evidence.push(`Severe error: ${pattern.source}`);
        }
      }
    }

    // Count error keywords
    const errorMatches = text.match(/\b(?:error|exception|failed)\b/gi);
    if (errorMatches && errorMatches.length > 1) {
      score += Math.min(errorMatches.length * 0.1, 0.3);
      evidence.push(`Multiple error indicators: ${errorMatches.length}`);
    }

    return score;
  }

  /**
   * Score idle state based on time since last activity
   */
  private scoreIdleState(events: ConversationEvent[], evidence: string[]): number {
    if (events.length === 0) return 0.0;

    let score = 0.0;

    // Check for UI hint patterns in recent events
    const escHintPattern = /^\s*\(esc\s+to\s+interrupt\b.*$/im;
    for (const event of events.slice(-5)) {
      if (event.content && escHintPattern.test(event.content)) {
        score += 0.5;
        evidence.push("UI hint present: (esc to interrupt)");
        break;
      }
    }

    // Check time since last activity
    const lastEvent = events[events.length - 1];
    const timeSinceLast = (Date.now() - lastEvent.timestamp.getTime()) / 1000;

    if (timeSinceLast >= this.config.idleTimeout) {
      score += Math.min(timeSinceLast / this.config.idleTimeout, 1.0) * 0.5;
      evidence.push(`Idle for ${timeSinceLast.toFixed(1)}s`);
    }

    return score;
  }

  /**
   * Apply timeout-based scoring adjustments
   */
  private applyTimeoutScoring(stateScores: Record<string, number>, events: ConversationEvent[]): void {
    if (events.length === 0) return;

    const lastEvent = events[events.length - 1];
    const timeSinceLast = (Date.now() - lastEvent.timestamp.getTime()) / 1000;

    // Adjust idle score based on inactivity
    if (timeSinceLast > this.config.idleTimeout) {
      stateScores['idle'] += 0.3;
    }

    // Reduce active score for old activity
    if (timeSinceLast > 5.0) {
      stateScores['active'] *= 0.5;
    }

    // Input waiting timeout
    if (this.currentState === ClaudeState.INPUT_WAITING && timeSinceLast > this.config.inputTimeout) {
      stateScores['inputWaiting'] *= 0.7; // Reduce confidence over time
    }
  }

  /**
   * Determine if state should change based on detection and current state
   */
  private shouldChangeState(detection: StateDetection): boolean {
    // Always change if we're in unknown state
    if (this.currentState === ClaudeState.UNKNOWN) {
      return detection.confidence >= this.config.minConfidence;
    }

    // Don't change if confidence is too low
    if (detection.confidence < this.config.minConfidence) {
      return false;
    }

    // Don't change if it's the same state
    if (detection.state === this.currentState) {
      return false;
    }

    // Apply debounce time
    const timeSinceChange = (Date.now() - this.lastStateChange.getTime()) / 1000;
    if (timeSinceChange < this.config.debounceTime) {
      return false;
    }

    // State priority logic: context-pressure > input-waiting > error > idle
    const priorityMap: Record<ClaudeState, number> = {
      [ClaudeState.CONTEXT_PRESSURE]: 4,
      [ClaudeState.INPUT_WAITING]: 3,
      [ClaudeState.ERROR]: 2,
      [ClaudeState.IDLE]: 1,
      [ClaudeState.ACTIVE]: 1,
      [ClaudeState.COMPLETED]: 1,
      [ClaudeState.UNKNOWN]: 0
    };

    const currentPriority = priorityMap[this.currentState] || 0;
    const newPriority = priorityMap[detection.state] || 0;

    // Allow change based on priority and confidence
    if (newPriority > currentPriority) {
      return detection.confidence >= 0.5; // Lower threshold for higher priority
    } else if (newPriority === currentPriority) {
      return detection.confidence >= 0.7; // Higher threshold for same priority
    } else {
      return detection.confidence >= 0.8; // Very high threshold for lower priority
    }
  }

  /**
   * Change the current state and record the transition
   */
  private changeState(detection: StateDetection): void {
    const oldState = this.currentState;
    const newState = detection.state;

    // Calculate duration in previous state
    const duration = Date.now() - this.lastStateChange.getTime();

    // Create transition record
    const transition: StateTransitionInfo = {
      fromState: oldState,
      toState: newState,
      detection,
      duration,
      timestamp: new Date()
    };

    // Update state
    this.currentState = newState;
    this.lastStateChange = new Date();

    // Record transition
    this.stateHistory.push(transition);
    if (this.stateHistory.length > this.config.stateHistoryLimit) {
      this.stateHistory.shift();
    }

    // Update statistics
    this.statistics.stateChanges += 1;
    if (!this.statistics.stateDurations[oldState]) {
      this.statistics.stateDurations[oldState] = [];
    }
    this.statistics.stateDurations[oldState].push(duration);

    console.log(
      `State change: ${oldState} -> ${newState} ` +
      `(confidence: ${detection.confidence.toFixed(2)}, duration: ${(duration/1000).toFixed(1)}s)`
    );
  }

  /**
   * Update detection statistics
   */
  private updateStatistics(detection: StateDetection, processingTime: number): void {
    this.statistics.detections += 1;
    this.statistics.totalProcessingTime += processingTime;
    this.statistics.avgProcessingTime = 
      this.statistics.totalProcessingTime / this.statistics.detections;
    this.statistics.confidenceScores.push(detection.confidence);

    // Keep only recent confidence scores
    if (this.statistics.confidenceScores.length > 100) {
      this.statistics.confidenceScores = this.statistics.confidenceScores.slice(-100);
    }
  }

  /**
   * Get the current detected state
   */
  public getCurrentState(): ClaudeState {
    return this.currentState;
  }

  /**
   * Get the last state detection result
   */
  public getLastDetection(): StateDetection | null {
    return this.lastDetection;
  }

  /**
   * Get state transition history
   */
  public getStateHistory(limit?: number): StateTransitionInfo[] {
    const history = [...this.stateHistory];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Get detection statistics
   */
  public getStatistics(): DetectionStatistics & {
    currentState: string;
    timeInCurrentState: number;
    totalTransitions: number;
    avgConfidence: number;
  } {
    const stats = { ...this.statistics };
    const result = {
      ...stats,
      currentState: this.currentState,
      timeInCurrentState: Date.now() - this.lastStateChange.getTime(),
      totalTransitions: this.stateHistory.length,
      avgConfidence: this.statistics.confidenceScores.length > 0
        ? this.statistics.confidenceScores.reduce((a, b) => a + b) / this.statistics.confidenceScores.length
        : 0.0
    };

    return result;
  }

  /**
   * Reset detection statistics
   */
  public resetStatistics(): void {
    this.statistics = {
      detections: 0,
      stateChanges: 0,
      falsePositives: 0,
      totalProcessingTime: 0,
      avgProcessingTime: 0,
      stateDurations: {},
      confidenceScores: []
    };
  }

  /**
   * Reset to unknown state
   */
  public resetState(): void {
    this.currentState = ClaudeState.UNKNOWN;
    this.lastDetection = null;
    this.lastStateChange = new Date();
  }

  /**
   * Update detector configuration
   */
  public setConfiguration(newConfig: Partial<StateDetectorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('State detector configuration updated');
  }
}