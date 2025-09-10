'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ProjectInfo, RecoveryAction, ClaudeState } from '../../types/monitoring';

// Validation schema based on Python recovery logic
const recoveryActionSchema = z.object({
  actionType: z.enum(['clear', 'custom_command', 'restart_session', 'idle_prompt'], {
    errorMap: () => ({ message: 'Please select a valid recovery action' }),
  }),
  customCommand: z.string().optional(),
  idlePromptText: z.string().optional(),
  specName: z.string().optional(),
  confirmAction: z.boolean().default(false),
});

type RecoveryFormData = z.infer<typeof recoveryActionSchema>;

interface RecoveryControlsProps {
  project: ProjectInfo;
  onAction: (action: RecoveryAction) => void;
  disabled?: boolean;
}

interface RecoveryOption {
  id: string;
  label: string;
  description: string;
  icon: string;
  requiresConfirmation: boolean;
  disabled?: boolean;
}

export const RecoveryControls: React.FC<RecoveryControlsProps> = ({
  project,
  onAction,
  disabled = false
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<RecoveryFormData | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const form = useForm<RecoveryFormData>({
    resolver: zodResolver(recoveryActionSchema),
    defaultValues: {
      actionType: 'clear',
      confirmAction: false,
    },
  });

  const { control, handleSubmit, watch, formState: { errors }, reset } = form;
  const watchedActionType = watch('actionType');
  const watchedCustomCommand = watch('customCommand');
  const watchedIdlePromptText = watch('idlePromptText');

  // Recovery options based on Python decision_engine.py logic
  const recoveryOptions: RecoveryOption[] = [
    {
      id: 'clear',
      label: 'Send /clear Command',
      description: 'Executes /clear to reduce context usage and token consumption (Phase 1 idle recovery)',
      icon: '🧹',
      requiresConfirmation: false,
      disabled: !project.monitoring,
    },
    {
      id: 'idle_prompt',
      label: 'Send Work Prompt',
      description: 'Sends a work instruction to resume task completion (Phase 2 idle recovery)',
      icon: '▶️',
      requiresConfirmation: false,
      disabled: !project.monitoring || project.currentState !== ClaudeState.IDLE,
    },
    {
      id: 'custom_command',
      label: 'Custom Command',
      description: 'Send a custom command or input text to Claude Code',
      icon: '⌨️',
      requiresConfirmation: true,
      disabled: !project.monitoring,
    },
    {
      id: 'restart_session',
      label: 'Restart Session',
      description: 'Force restart Claude session (Ctrl+C followed by Enter)',
      icon: '🔄',
      requiresConfirmation: true,
      disabled: !project.monitoring,
    },
  ];

  const validateCustomCommand = (command: string): string | null => {
    if (!command || command.trim().length === 0) {
      return 'Custom command cannot be empty';
    }
    
    // Basic validation based on Python recovery logic
    const trimmed = command.trim();
    
    // Warn about potentially dangerous commands
    const dangerousPatterns = [
      /^rm\s+/,
      /^sudo\s+/,
      /^rmdir\s+/,
      />\s*\/dev\/null/,
      /&&.*rm\s+/,
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(trimmed)) {
        return 'Command appears potentially dangerous. Please verify before proceeding.';
      }
    }

    return null;
  };

  const validateIdlePrompt = (text: string): string | null => {
    if (!text || text.trim().length === 0) {
      return 'Idle prompt text cannot be empty';
    }
    
    if (text.length > 500) {
      return 'Prompt text should be concise (under 500 characters)';
    }

    return null;
  };

  const getDefaultIdlePrompt = (): string => {
    const specName = project.displayName || 'unknown';
    return `Please work on one remaining task for spec "${specName}", make commit after task completion and stop.`;
  };

  const onSubmit = (data: RecoveryFormData) => {
    // Additional validation based on action type
    if (data.actionType === 'custom_command') {
      const commandError = validateCustomCommand(data.customCommand || '');
      if (commandError) {
        form.setError('customCommand', { message: commandError });
        return;
      }
    }

    if (data.actionType === 'idle_prompt') {
      const promptText = data.idlePromptText || getDefaultIdlePrompt();
      const promptError = validateIdlePrompt(promptText);
      if (promptError) {
        form.setError('idlePromptText', { message: promptError });
        return;
      }
    }

    const selectedOption = recoveryOptions.find(opt => opt.id === data.actionType);
    
    if (selectedOption?.requiresConfirmation && !data.confirmAction) {
      setPendingAction(data);
      setShowConfirmDialog(true);
      return;
    }

    executeAction(data);
  };

  const executeAction = (data: RecoveryFormData) => {
    setIsExecuting(true);
    
    try {
      let recoveryAction: RecoveryAction;

      switch (data.actionType) {
        case 'clear':
          recoveryAction = {
            type: 'clear',
            projectPath: project.projectPath,
            timestamp: new Date(),
            reason: 'Manual /clear command from recovery controls'
          };
          break;

        case 'idle_prompt':
          const promptText = data.idlePromptText || getDefaultIdlePrompt();
          recoveryAction = {
            type: 'custom_command',
            command: promptText,
            projectPath: project.projectPath,
            timestamp: new Date(),
            reason: 'Manual idle work prompt from recovery controls'
          };
          break;

        case 'custom_command':
          recoveryAction = {
            type: 'custom_command',
            command: data.customCommand,
            projectPath: project.projectPath,
            timestamp: new Date(),
            reason: 'Manual custom command from recovery controls'
          };
          break;

        case 'restart_session':
          recoveryAction = {
            type: 'restart_session',
            projectPath: project.projectPath,
            timestamp: new Date(),
            reason: 'Manual session restart from recovery controls'
          };
          break;

        default:
          throw new Error(`Unknown action type: ${data.actionType}`);
      }

      onAction(recoveryAction);
      reset();
      setShowConfirmDialog(false);
      setPendingAction(null);
      
    } catch (error) {
      console.error('Error executing recovery action:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const confirmAction = () => {
    if (pendingAction) {
      executeAction(pendingAction);
    }
  };

  const cancelAction = () => {
    setShowConfirmDialog(false);
    setPendingAction(null);
    form.setValue('confirmAction', false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Recovery Controls
      </h3>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Action Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recovery Action
          </label>
          <Controller
            name="actionType"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                {recoveryOptions.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      option.disabled
                        ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60 dark:bg-gray-900 dark:border-gray-700'
                        : field.value === option.id
                        ? 'bg-blue-50 border-blue-300 dark:bg-blue-900 dark:border-blue-600'
                        : 'bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      value={option.id}
                      checked={field.value === option.id}
                      onChange={(e) => field.onChange(e.target.value)}
                      disabled={option.disabled || disabled}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg" role="img" aria-label={option.label}>
                          {option.icon}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {option.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {option.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          />
          {errors.actionType && (
            <p className="text-red-600 text-sm mt-1" role="alert">
              {errors.actionType.message}
            </p>
          )}
        </div>

        {/* Custom Command Input */}
        {watchedActionType === 'custom_command' && (
          <div>
            <label htmlFor="customCommand" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Custom Command
            </label>
            <Controller
              name="customCommand"
              control={control}
              render={({ field }) => (
                <div>
                  <textarea
                    {...field}
                    id="customCommand"
                    placeholder="Enter command or text to send to Claude Code..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows={3}
                    disabled={disabled}
                  />
                  {watchedCustomCommand && (
                    <div className="mt-2 text-xs text-gray-500">
                      Length: {watchedCustomCommand.length} characters
                    </div>
                  )}
                </div>
              )}
            />
            {errors.customCommand && (
              <p className="text-red-600 text-sm mt-1" role="alert">
                {errors.customCommand.message}
              </p>
            )}
          </div>
        )}

        {/* Idle Prompt Text Input */}
        {watchedActionType === 'idle_prompt' && (
          <div>
            <label htmlFor="idlePromptText" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Work Instruction Prompt
            </label>
            <Controller
              name="idlePromptText"
              control={control}
              render={({ field }) => (
                <div>
                  <textarea
                    {...field}
                    id="idlePromptText"
                    placeholder={getDefaultIdlePrompt()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows={3}
                    disabled={disabled}
                  />
                  <div className="mt-1 text-xs text-gray-500">
                    Leave empty to use default prompt. Length: {(watchedIdlePromptText || '').length} characters
                  </div>
                </div>
              )}
            />
            {errors.idlePromptText && (
              <p className="text-red-600 text-sm mt-1" role="alert">
                {errors.idlePromptText.message}
              </p>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-2">
          <button
            type="submit"
            disabled={disabled || isExecuting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md transition-colors"
          >
            {isExecuting ? (
              <span className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Executing...</span>
              </span>
            ) : (
              'Execute Recovery Action'
            )}
          </button>
        </div>
      </form>

      {/* Confirmation Dialog */}
      {showConfirmDialog && pendingAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-mx-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Confirm Recovery Action
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to execute this recovery action? This action will be sent immediately to Claude Code.
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
              <div className="text-sm">
                <strong>Action:</strong> {recoveryOptions.find(opt => opt.id === pendingAction.actionType)?.label}
              </div>
              <div className="text-sm">
                <strong>Project:</strong> {project.displayName}
              </div>
              {pendingAction.customCommand && (
                <div className="text-sm">
                  <strong>Command:</strong> <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">{pendingAction.customCommand}</code>
                </div>
              )}
              {pendingAction.idlePromptText && (
                <div className="text-sm">
                  <strong>Prompt:</strong> <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">{pendingAction.idlePromptText}</code>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={cancelAction}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 focus:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 focus:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-white rounded-md transition-colors"
              >
                Confirm & Execute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecoveryControls;