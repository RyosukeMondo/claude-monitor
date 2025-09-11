/**
 * Recovery Action Service for Claude Code integration
 * Executes recovery commands through Claude Code API with validation and error handling
 * 
 * Converted from Python recovery logic in src/recovery/ and src/decision/decision_engine.py
 */

import { z } from 'zod';
import { ClaudeSessionState } from '../types/state';

// Recovery action types based on Python RecoveryActionType enum
export enum RecoveryActionType {
  COMPACT = 'compact',
  RESUME_INPUT = 'resume_input',
  PROVIDE_INPUT = 'provide_input',
  CLEAR_ERROR = 'clear_error',
  RESTART_SESSION = 'restart_session',
  NOTIFY_USER = 'notify_user',
  WAIT_AND_RETRY = 'wait_and_retry',
  FORCE_EXIT = 'force_exit'
}

// Recovery execution results
export enum RecoveryResult {
  SUCCESS = 'success',
  PARTIAL_SUCCESS = 'partial_success',
  FAILURE = 'failure',
  TIMEOUT = 'timeout',
  CANCELLED = 'cancelled',
  USER_INTERVENTION_REQUIRED = 'user_intervention_required'
}

// Recovery action definition
export interface RecoveryAction {
  actionType: RecoveryActionType;
  targetState: ClaudeSessionState;
  priority: number; // 1-10, higher is more urgent
  command?: string;
  data?: Record<string, unknown>;
  timeout: number; // seconds
  maxRetries: number;
  requiresConfirmation: boolean;
  description: string;
}

// Recovery execution tracking
export interface RecoveryExecution {
  action: RecoveryAction;
  execId: string;
  startTime: Date;
  endTime?: Date;
  result?: RecoveryResult;
  attempts: number;
  errorMessage?: string;
  output?: string;
  metadata: Record<string, unknown>;
}

// Recovery context for decision making
export interface RecoveryContext {
  detectionConfidence: number;
  detectionTimestamp: Date;
  detectionEvidence: string[];
  shouldSendIdlePrompt?: boolean;
  shouldSendIdleClear?: boolean;
  idlePromptText?: string;
  contextSpec?: string;
  contextProject?: string;
}

// Validation schemas
export const RecoveryActionSchema = z.object({
  actionType: z.nativeEnum(RecoveryActionType),
  targetState: z.enum(['initializing', 'idle', 'user_input', 'processing', 'tool_execution', 'context_pressure', 'error_recovery', 'session_ended']),
  priority: z.number().int().min(1).max(10),
  command: z.string().optional(),
  data: z.record(z.unknown()).optional(),
  timeout: z.number().min(0),
  maxRetries: z.number().int().min(0),
  requiresConfirmation: z.boolean(),
  description: z.string()
});

export const RecoveryContextSchema = z.object({
  detectionConfidence: z.number().min(0).max(1),
  detectionTimestamp: z.date(),
  detectionEvidence: z.array(z.string()),
  shouldSendIdlePrompt: z.boolean().optional(),
  shouldSendIdleClear: z.boolean().optional(),
  idlePromptText: z.string().optional(),
  contextSpec: z.string().optional(),
  contextProject: z.string().optional()
});

/**
 * Recovery strategy for specific states and contexts
 * Converted from Python RecoveryStrategy class
 */
export class RecoveryStrategy {
  constructor(
    public readonly name: string,
    public readonly targetStates: ClaudeSessionState[],
    public readonly actions: RecoveryAction[],
    public readonly conditions: Record<string, unknown> = {}
  ) {
    // Sort actions by priority (highest first)
    this.actions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Check if this strategy applies to the given state and context
   */
  matchesContext(state: ClaudeSessionState, context: RecoveryContext): boolean {
    if (!this.targetStates.includes(state)) {
      return false;
    }

    // Check additional conditions
    for (const [key, expectedValue] of Object.entries(this.conditions)) {
      const contextValue = (context as Record<string, unknown>)[key];
      
      if (contextValue === undefined) {
        return false;
      }

      if (Array.isArray(expectedValue)) {
        if (!expectedValue.includes(contextValue)) {
          return false;
        }
      } else if (contextValue !== expectedValue) {
        return false;
      }
    }

    return true;
  }
}

/**
 * Claude Code API client interface
 * This would integrate with the actual Claude Code TypeScript SDK
 */
export interface ClaudeCodeClient {
  sendCommand(command: string, _timeout?: number): Promise<{
    success: boolean;
    output?: string;
    error?: string;
  }>;
  
  sendInput(text: string, _timeout?: number): Promise<{
    success: boolean;
    output?: string;
    error?: string;
  }>;
  
  sendEnter(_timeout?: number): Promise<{
    success: boolean;
    output?: string;
    error?: string;
  }>;
  
  sendKeypress(key: string, _timeout?: number): Promise<{
    success: boolean;
    output?: string;
    error?: string;
  }>;
  
  isConnected(): boolean;
  connect(): Promise<boolean>;
  disconnect(): void;
}

/**
 * Mock Claude Code client for development
 * Replace with actual SDK implementation
 */
class MockClaudeCodeClient implements ClaudeCodeClient {
  private connected = false;

  async sendCommand(command: string, _timeout = 5000): Promise<{
    success: boolean;
    output?: string;
    error?: string;
  }> {
    if (!this.connected) {
      return { success: false, error: 'Not connected' };
    }

    // Simulate command execution
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: true,
      output: `Command '${command}' executed successfully`
    };
  }

  async sendInput(text: string, _timeout = 5000): Promise<{
    success: boolean;
    output?: string;
    error?: string;
  }> {
    if (!this.connected) {
      return { success: false, error: 'Not connected' };
    }

    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: true,
      output: `Input '${text}' sent successfully`
    };
  }

  async sendEnter(_timeout = 5000): Promise<{
    success: boolean;
    output?: string;
    error?: string;
  }> {
    if (!this.connected) {
      return { success: false, error: 'Not connected' };
    }

    await new Promise(resolve => setTimeout(resolve, 50));
    
    return {
      success: true,
      output: 'Enter key sent successfully'
    };
  }

  async sendKeypress(key: string, _timeout = 5000): Promise<{
    success: boolean;
    output?: string;
    error?: string;
  }> {
    if (!this.connected) {
      return { success: false, error: 'Not connected' };
    }

    await new Promise(resolve => setTimeout(resolve, 50));
    
    return {
      success: true,
      output: `Key '${key}' sent successfully`
    };
  }

  isConnected(): boolean {
    return this.connected;
  }

  async connect(): Promise<boolean> {
    // Simulate connection attempt
    await new Promise(resolve => setTimeout(resolve, 100));
    this.connected = true;
    return true;
  }

  disconnect(): void {
    this.connected = false;
  }
}

/**
 * Recovery Action Service
 * Main service for executing recovery actions through Claude Code API
 * Converted from Python RecoveryEngine class
 */
export class RecoveryActionService {
  private strategies: RecoveryStrategy[] = [];
  private executionHistory: RecoveryExecution[] = [];
  private currentExecution: RecoveryExecution | null = null;
  private executing = false;
  private enabled = true;
  private statistics = {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    timeoutExecutions: 0,
    cancelledExecutions: 0,
    totalExecutionTime: 0,
    averageExecutionTime: 0,
    lastExecutionTime: null as Date | null
  };

  constructor(
    private client: ClaudeCodeClient,
    private config: {
      maxConcurrentExecutions: number;
      defaultTimeout: number;
      maxRetries: number;
      retryBackoff: number;
      executionHistoryLimit: number;
      requireConfirmationForDestructiveActions: boolean;
      cooldownPeriod: number; // seconds
    } = {
      maxConcurrentExecutions: 1,
      defaultTimeout: 30,
      maxRetries: 3,
      retryBackoff: 2.0,
      executionHistoryLimit: 100,
      requireConfirmationForDestructiveActions: true,
      cooldownPeriod: 10
    }
  ) {
    this.initializeDefaultStrategies();
  }

  /**
   * Initialize default recovery strategies based on Python implementation
   */
  private initializeDefaultStrategies(): void {
    // Context pressure recovery strategy
    const contextPressureActions: RecoveryAction[] = [
      {
        actionType: RecoveryActionType.COMPACT,
        targetState: 'idle',
        priority: 8,
        command: '/compact',
        timeout: 15,
        maxRetries: 2,
        requiresConfirmation: false,
        description: 'Execute /compact to reduce context usage'
      },
      {
        actionType: RecoveryActionType.NOTIFY_USER,
        targetState: 'context_pressure',
        priority: 5,
        data: { message: 'Context pressure detected - compacting context' },
        timeout: 5,
        maxRetries: 1,
        requiresConfirmation: false,
        description: 'Notify user about context pressure and compaction'
      }
    ];

    this.strategies.push(new RecoveryStrategy(
      'context_pressure_recovery',
      ['context_pressure'],
      contextPressureActions
    ));

    // Input waiting recovery strategy
    const inputWaitingActions: RecoveryAction[] = [
      {
        actionType: RecoveryActionType.PROVIDE_INPUT,
        targetState: 'idle',
        priority: 7,
        command: 'y',
        timeout: 5,
        maxRetries: 2,
        requiresConfirmation: false,
        description: 'Provide default "yes" response to prompts'
      },
      {
        actionType: RecoveryActionType.RESUME_INPUT,
        targetState: 'idle',
        priority: 6,
        command: '\n',
        timeout: 5,
        maxRetries: 2,
        requiresConfirmation: false,
        description: 'Send Enter key to resume input'
      },
      {
        actionType: RecoveryActionType.NOTIFY_USER,
        targetState: 'user_input',
        priority: 4,
        data: { message: 'Claude is waiting for input - attempting automatic response' },
        timeout: 5,
        maxRetries: 1,
        requiresConfirmation: false,
        description: 'Notify user about input requirement'
      }
    ];

    this.strategies.push(new RecoveryStrategy(
      'input_waiting_recovery',
      ['user_input'],
      inputWaitingActions
    ));

    // Error recovery strategy
    const errorActions: RecoveryAction[] = [
      {
        actionType: RecoveryActionType.CLEAR_ERROR,
        targetState: 'idle',
        priority: 6,
        command: 'exit',
        timeout: 10,
        maxRetries: 2,
        requiresConfirmation: false,
        description: 'Exit error state'
      },
      {
        actionType: RecoveryActionType.RESTART_SESSION,
        targetState: 'idle',
        priority: 4,
        timeout: 20,
        maxRetries: 1,
        requiresConfirmation: true,
        description: 'Restart Claude session'
      },
      {
        actionType: RecoveryActionType.NOTIFY_USER,
        targetState: 'error_recovery',
        priority: 8,
        data: { message: 'Error detected in Claude Code - attempting recovery' },
        timeout: 5,
        maxRetries: 1,
        requiresConfirmation: false,
        description: 'Notify user about error state'
      }
    ];

    this.strategies.push(new RecoveryStrategy(
      'error_recovery',
      ['error_recovery'],
      errorActions
    ));

    // Idle prompt strategy - proactively send work instructions when idle
    const idlePromptActions: RecoveryAction[] = [
      {
        actionType: RecoveryActionType.PROVIDE_INPUT,
        targetState: 'idle',
        priority: 9,
        timeout: 10,
        maxRetries: 2,
        requiresConfirmation: false,
        description: 'Send idle work prompt to Claude Code'
      }
    ];

    this.strategies.push(new RecoveryStrategy(
      'idle_prompt',
      ['idle'],
      idlePromptActions,
      { shouldSendIdlePrompt: true }
    ));

    // Idle clear strategy - proactively run /clear on idle to save tokens
    const idleClearActions: RecoveryAction[] = [
      {
        actionType: RecoveryActionType.CLEAR_ERROR,
        targetState: 'idle',
        priority: 10,
        command: '/clear',
        timeout: 10,
        maxRetries: 2,
        requiresConfirmation: false,
        description: 'Send /clear to reduce token usage'
      }
    ];

    this.strategies.push(new RecoveryStrategy(
      'idle_clear',
      ['idle'],
      idleClearActions,
      { shouldSendIdleClear: true }
    ));
  }

  /**
   * Execute recovery action for detected state
   * Main entry point from decision engine
   */
  async executeRecovery(
    state: ClaudeSessionState,
    context: RecoveryContext
  ): Promise<RecoveryExecution | null> {
    if (!this.enabled) {
      console.debug('Recovery service disabled, skipping recovery');
      return null;
    }

    if (this.executing) {
      console.debug('Recovery already in progress, skipping');
      return null;
    }

    // Validate context
    try {
      RecoveryContextSchema.parse(context);
    } catch (error) {
      console.error('Invalid recovery context:', error);
      return null;
    }

    // Find matching strategy
    const strategy = this.findBestStrategy(state, context);
    if (!strategy) {
      console.debug(`No recovery strategy found for state: ${state}`);
      return null;
    }

    // Select best action from strategy
    const action = this.selectBestAction(strategy, context);
    if (!action) {
      console.debug(`No suitable action found in strategy: ${strategy.name}`);
      return null;
    }

    // Check cooldown period (with bypass for idle prompts)
    const bypassCooldown = context.shouldSendIdlePrompt || 
      action.actionType === RecoveryActionType.PROVIDE_INPUT;
    
    if (!bypassCooldown && this.isInCooldown(state)) {
      console.debug(`Recovery cooldown active for state: ${state}`);
      return null;
    }

    // Execute action
    return this.executeAction(action, context);
  }

  /**
   * Find best recovery strategy for state and context
   */
  private findBestStrategy(
    state: ClaudeSessionState,
    context: RecoveryContext
  ): RecoveryStrategy | null {
    const matchingStrategies = this.strategies.filter(strategy => 
      strategy.matchesContext(state, context)
    );

    if (matchingStrategies.length === 0) {
      return null;
    }

    // Return first matching strategy (future: add strategy scoring)
    return matchingStrategies[0];
  }

  /**
   * Select best action from strategy based on context
   */
  private selectBestAction(
    strategy: RecoveryStrategy,
    context: RecoveryContext
  ): RecoveryAction | null {
    for (const action of strategy.actions) {
      // Skip actions requiring confirmation if not available
      if (action.requiresConfirmation && 
          this.config.requireConfirmationForDestructiveActions) {
        continue;
      }

      // For PROVIDE_INPUT, validate it's appropriate unless explicitly requested
      if (action.actionType === RecoveryActionType.PROVIDE_INPUT) {
        if (context.shouldSendIdlePrompt) {
          // Bypass validation for idle prompts
          return action;
        }

        // Look for yes/no indicators in evidence
        const evidence = context.detectionEvidence.join(' ').toLowerCase();
        const yesNoIndicators = [
          '[y/n]', '[yes/no]', 'yes/no', 'do you want to', 
          'would you like to', 'continue?'
        ];
        
        if (!yesNoIndicators.some(indicator => evidence.includes(indicator))) {
          // Not a yes/no prompt - skip this action
          continue;
        }
      }

      return action;
    }

    return null;
  }

  /**
   * Check if recovery is in cooldown period for the given state
   */
  private isInCooldown(state: ClaudeSessionState): boolean {
    const now = new Date();
    const cooldownMs = this.config.cooldownPeriod * 1000;

    for (const execution of [...this.executionHistory].reverse()) {
      if (execution.action.targetState === state && execution.endTime) {
        const timeSince = now.getTime() - execution.endTime.getTime();
        if (timeSince < cooldownMs) {
          return true;
        }
        break;
      }
    }

    return false;
  }

  /**
   * Execute a recovery action
   */
  private async executeAction(
    action: RecoveryAction,
    context: RecoveryContext
  ): Promise<RecoveryExecution> {
    const execution: RecoveryExecution = {
      action,
      execId: Math.random().toString(36).substr(2, 8),
      startTime: new Date(),
      attempts: 0,
      metadata: { ...context }
    };

    this.executing = true;
    this.currentExecution = execution;

    try {
      console.info(`Starting recovery action ${execution.execId}: ${action.actionType} - ${action.description}`);

      // Execute with retry logic
      const result = await this.executeWithRetry(execution);
      execution.result = result;
      execution.endTime = new Date();

      // Update statistics
      this.updateStatistics(execution);

      const duration = execution.endTime.getTime() - execution.startTime.getTime();
      console.info(`Recovery action completed ${execution.execId}: ${result} in ${duration}ms`);

    } catch (error) {
      execution.result = RecoveryResult.FAILURE;
      execution.errorMessage = error instanceof Error ? error.message : String(error);
      execution.endTime = new Date();
      console.error(`Unexpected error during recovery action execution: ${error}`);
    } finally {
      this.executing = false;
      this.currentExecution = null;

      // Add to history
      this.executionHistory.push(execution);

      // Trim history if needed
      if (this.executionHistory.length > this.config.executionHistoryLimit) {
        this.executionHistory = this.executionHistory.slice(-this.config.executionHistoryLimit);
      }
    }

    return execution;
  }

  /**
   * Execute action with retry logic
   */
  private async executeWithRetry(execution: RecoveryExecution): Promise<RecoveryResult> {
    const { action } = execution;
    let backoff = 1000; // Start with 1 second

    for (let attempt = 0; attempt <= action.maxRetries; attempt++) {
      execution.attempts = attempt + 1;

      try {
        const success = await this.executeSingleAttempt(action, execution);
        if (success) {
          return RecoveryResult.SUCCESS;
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('timeout')) {
          execution.errorMessage = `Timeout after ${action.timeout}s`;
          if (attempt === action.maxRetries) {
            return RecoveryResult.TIMEOUT;
          }
        } else {
          execution.errorMessage = error instanceof Error ? error.message : String(error);
          if (attempt === action.maxRetries) {
            return RecoveryResult.FAILURE;
          }
        }
      }

      // Backoff before retry
      if (attempt < action.maxRetries) {
        const retryDelay = backoff * this.config.retryBackoff;
        console.warn(`Recovery attempt ${attempt + 1} failed, retrying in ${retryDelay}ms`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        backoff *= this.config.retryBackoff;
      }
    }

    return RecoveryResult.FAILURE;
  }

  /**
   * Execute single recovery action attempt
   */
  private async executeSingleAttempt(
    action: RecoveryAction,
    execution: RecoveryExecution
  ): Promise<boolean> {
    if (!this.client.isConnected()) {
      const connected = await this.client.connect();
      if (!connected) {
        throw new Error('Failed to connect to Claude Code API');
      }
    }

    switch (action.actionType) {
      case RecoveryActionType.COMPACT:
        return this.executeCompactAction(action, execution);
        
      case RecoveryActionType.PROVIDE_INPUT:
        return this.executeInputAction(action, execution);
        
      case RecoveryActionType.RESUME_INPUT:
        return this.executeInputAction(action, execution);
        
      case RecoveryActionType.CLEAR_ERROR:
        return this.executeCommandAction(action, execution);
        
      case RecoveryActionType.RESTART_SESSION:
        return this.executeRestartAction(action, execution);
        
      case RecoveryActionType.NOTIFY_USER:
        return this.executeNotificationAction(action, execution);
        
      case RecoveryActionType.WAIT_AND_RETRY:
        return this.executeWaitAction(action, execution);
        
      case RecoveryActionType.FORCE_EXIT:
        return this.executeExitAction(action, execution);
        
      default:
        throw new Error(`Unknown recovery action type: ${action.actionType}`);
    }
  }

  /**
   * Execute /compact command
   */
  private async executeCompactAction(action: RecoveryAction, execution: RecoveryExecution): Promise<boolean> {
    const command = action.command || '/compact';
    const result = await this.client.sendCommand(command, action.timeout * 1000);
    
    if (result.success) {
      execution.output = result.output || 'Compact command sent successfully';
      // Brief pause after compact
      await new Promise(resolve => setTimeout(resolve, 2000));
      return true;
    }
    
    execution.errorMessage = result.error;
    return false;
  }

  /**
   * Execute input providing action
   */
  private async executeInputAction(action: RecoveryAction, execution: RecoveryExecution): Promise<boolean> {
    // Get input text from context or action
    const metadata = execution.metadata as RecoveryContext;
    const inputText = metadata.idlePromptText || action.command || action.data?.input || 'y';

    // Handle newline-only input as Enter key
    if (inputText === '\n') {
      const result = await this.client.sendEnter(action.timeout * 1000);
      if (result.success) {
        execution.output = result.output || 'Enter key sent successfully';
        return true;
      }
      execution.errorMessage = result.error;
      return false;
    }

    // Send text input followed by Enter
    const textResult = await this.client.sendInput(inputText, action.timeout * 1000);
    if (!textResult.success) {
      execution.errorMessage = textResult.error;
      return false;
    }

    // Brief pause before Enter
    await new Promise(resolve => setTimeout(resolve, 100));

    const enterResult = await this.client.sendEnter(2000);
    if (enterResult.success) {
      execution.output = `Input sent and submitted successfully: ${inputText}`;
      return true;
    }
    
    execution.errorMessage = enterResult.error;
    return false;
  }

  /**
   * Execute generic command action
   */
  private async executeCommandAction(action: RecoveryAction, execution: RecoveryExecution): Promise<boolean> {
    const command = action.command || action.data?.command || '';
    if (!command) {
      execution.errorMessage = 'No command specified';
      return false;
    }

    // Handle Enter key specially
    if (command === '\n') {
      const result = await this.client.sendEnter(action.timeout * 1000);
      if (result.success) {
        execution.output = result.output || 'Enter key sent successfully';
        return true;
      }
      execution.errorMessage = result.error;
      return false;
    }

    // Send command
    const result = await this.client.sendCommand(command, action.timeout * 1000);
    if (result.success) {
      execution.output = result.output || `Command '${command}' sent successfully`;
      return true;
    }

    execution.errorMessage = result.error;
    return false;
  }

  /**
   * Execute session restart action
   */
  private async executeRestartAction(action: RecoveryAction, execution: RecoveryExecution): Promise<boolean> {
    // Send Ctrl+C followed by Enter
    const ctrlCResult = await this.client.sendKeypress('ctrl-c', 2000);
    if (!ctrlCResult.success) {
      execution.errorMessage = ctrlCResult.error;
      return false;
    }

    await new Promise(resolve => setTimeout(resolve, 200));

    const enterResult = await this.client.sendEnter(2000);
    if (enterResult.success) {
      execution.output = 'Session restart sequence sent (Ctrl+C, Enter)';
      return true;
    }

    execution.errorMessage = enterResult.error;
    return false;
  }

  /**
   * Execute user notification action
   */
  private async executeNotificationAction(action: RecoveryAction, execution: RecoveryExecution): Promise<boolean> {
    const message = action.data?.message || 'Recovery action executed';
    
    // For now, just log the notification
    // Future: integrate with actual notification system
    console.info(`USER NOTIFICATION: ${message}`);
    execution.output = `Notification sent: ${message}`;
    
    return true;
  }

  /**
   * Execute wait/delay action
   */
  private async executeWaitAction(action: RecoveryAction, execution: RecoveryExecution): Promise<boolean> {
    const waitTime = action.data?.waitTime || 5000; // milliseconds
    console.debug(`Waiting ${waitTime}ms as recovery action`);
    
    await new Promise(resolve => setTimeout(resolve, waitTime));
    execution.output = `Waited ${waitTime}ms`;
    
    return true;
  }

  /**
   * Execute force exit action
   */
  private async executeExitAction(action: RecoveryAction, execution: RecoveryExecution): Promise<boolean> {
    // Send Ctrl+C as non-destructive force-exit signal
    const result = await this.client.sendKeypress('ctrl-c', action.timeout * 1000);
    
    if (result.success) {
      execution.output = result.output || 'Force exit (Ctrl+C) command sent successfully';
      return true;
    }

    execution.errorMessage = result.error;
    return false;
  }

  /**
   * Update execution statistics
   */
  private updateStatistics(execution: RecoveryExecution): void {
    this.statistics.totalExecutions++;
    this.statistics.lastExecutionTime = execution.startTime;

    if (execution.endTime && execution.startTime) {
      const duration = execution.endTime.getTime() - execution.startTime.getTime();
      this.statistics.totalExecutionTime += duration;
      this.statistics.averageExecutionTime = 
        this.statistics.totalExecutionTime / this.statistics.totalExecutions;
    }

    switch (execution.result) {
      case RecoveryResult.SUCCESS:
        this.statistics.successfulExecutions++;
        break;
      case RecoveryResult.FAILURE:
        this.statistics.failedExecutions++;
        break;
      case RecoveryResult.TIMEOUT:
        this.statistics.timeoutExecutions++;
        break;
      case RecoveryResult.CANCELLED:
        this.statistics.cancelledExecutions++;
        break;
    }
  }

  // Public API methods

  /**
   * Send clear command to Claude Code
   */
  async sendClearCommand(timeout = 15000): Promise<RecoveryResult> {
    const action: RecoveryAction = {
      actionType: RecoveryActionType.CLEAR_ERROR,
      targetState: 'idle',
      priority: 10,
      command: '/clear',
      timeout: timeout / 1000,
      maxRetries: 2,
      requiresConfirmation: false,
      description: 'Send /clear command'
    };

    const context: RecoveryContext = {
      detectionConfidence: 1.0,
      detectionTimestamp: new Date(),
      detectionEvidence: ['Manual clear command'],
      shouldSendIdleClear: true
    };

    const execution = await this.executeAction(action, context);
    return execution.result || RecoveryResult.FAILURE;
  }

  /**
   * Send custom command to Claude Code
   */
  async sendCustomCommand(command: string, timeout = 10000): Promise<RecoveryResult> {
    const action: RecoveryAction = {
      actionType: RecoveryActionType.CLEAR_ERROR,
      targetState: 'idle',
      priority: 5,
      command,
      timeout: timeout / 1000,
      maxRetries: 2,
      requiresConfirmation: false,
      description: `Send custom command: ${command}`
    };

    const context: RecoveryContext = {
      detectionConfidence: 1.0,
      detectionTimestamp: new Date(),
      detectionEvidence: ['Manual custom command']
    };

    const execution = await this.executeAction(action, context);
    return execution.result || RecoveryResult.FAILURE;
  }

  /**
   * Validate recovery conditions before execution
   */
  validateRecoveryConditions(context: RecoveryContext): boolean {
    try {
      RecoveryContextSchema.parse(context);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current execution status
   */
  getCurrentExecution(): RecoveryExecution | null {
    return this.currentExecution;
  }

  /**
   * Get execution history
   */
  getExecutionHistory(limit?: number): RecoveryExecution[] {
    const history = [...this.executionHistory];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Get service statistics
   */
  getStatistics(): typeof this.statistics {
    return { ...this.statistics };
  }

  /**
   * Enable/disable the service
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.info(`Recovery action service ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if service is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Check if service is currently executing
   */
  isExecuting(): boolean {
    return this.executing;
  }

  /**
   * Shutdown the service
   */
  async shutdown(): Promise<void> {
    console.info('Shutting down recovery action service');
    
    this.setEnabled(false);
    
    // Wait for current execution to complete (with timeout)
    let waitTime = 0;
    const maxWait = 5000;
    
    while (this.executing && waitTime < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100));
      waitTime += 100;
    }
    
    this.client.disconnect();
    
    console.info('Recovery action service shutdown complete');
  }
}

/**
 * Factory function to create recovery action service with mock client
 * Replace with actual Claude Code SDK client in production
 */
export function createRecoveryActionService(config?: Partial<RecoveryActionService['config']>): RecoveryActionService {
  const client = new MockClaudeCodeClient();
  return new RecoveryActionService(client, config);
}

/**
 * Global service instance for convenience
 */
let globalRecoveryService: RecoveryActionService | null = null;

export function getRecoveryActionService(): RecoveryActionService {
  if (!globalRecoveryService) {
    globalRecoveryService = createRecoveryActionService();
  }
  return globalRecoveryService;
}

export function shutdownRecoveryActionService(): void {
  if (globalRecoveryService) {
    globalRecoveryService.shutdown();
    globalRecoveryService = null;
  }
}