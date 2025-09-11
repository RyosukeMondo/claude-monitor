'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Terminal, 
  Send, 
  History, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  ChevronRight,
  ArrowUp,
  ArrowDown 
} from 'lucide-react';

// Types
interface TCPCommand {
  type: 'send' | 'enter' | 'up' | 'down' | 'ctrl-c' | 'tab' | 'raw';
  content?: string;
  instanceId: string;
}

interface CommandHistoryItem {
  id: string;
  command: string;
  timestamp: Date;
  status: 'pending' | 'sent' | 'error';
  type: TCPCommand['type'];
  response?: string;
}

interface CommandTerminalProps {
  instanceId: string;
  isActive: boolean;
  onSendCommand: (command: TCPCommand) => Promise<void>;
  onClose?: () => void;
  className?: string;
  autoFocus?: boolean;
  showHistory?: boolean;
  maxHistoryItems?: number;
}

// Command validation
const validateCommand = (command: string, type: TCPCommand['type']): { isValid: boolean; error?: string } => {
  if (type === 'send' && !command.trim()) {
    return { isValid: false, error: 'Command cannot be empty' };
  }
  
  if (command.length > 1000) {
    return { isValid: false, error: 'Command too long (max 1000 characters)' };
  }
  
  // Basic shell injection protection
  const dangerousPatterns = /[;&|`$(){}[\]\\]/;
  if (type === 'send' && dangerousPatterns.test(command)) {
    return { isValid: false, error: 'Command contains potentially unsafe characters' };
  }
  
  return { isValid: true };
};

// Quick action button component
const QuickActionButton: React.FC<{
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'danger';
}> = ({ label, shortcut, onClick, disabled, variant = 'default' }) => {
  const baseClasses = "px-3 py-1.5 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";
  const variantClasses = variant === 'danger' 
    ? "bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-300 dark:border-red-800"
    : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 dark:border-gray-600";
  const disabledClasses = "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100 dark:disabled:hover:bg-gray-700";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${disabledClasses}`}
      title={shortcut ? `${label} (${shortcut})` : label}
    >
      <span>{label}</span>
      {shortcut && (
        <span className="ml-1 opacity-60 text-xs">{shortcut}</span>
      )}
    </button>
  );
};

// Command history component
const CommandHistory: React.FC<{
  history: CommandHistoryItem[];
  onSelectCommand: (command: string) => void;
  maxItems?: number;
}> = ({ history, onSelectCommand, maxItems = 50 }) => {
  const recentHistory = useMemo(() => 
    history.slice(-maxItems).reverse(), 
    [history, maxItems]
  );

  if (recentHistory.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        No command history
      </div>
    );
  }

  return (
    <div className="space-y-1 max-h-40 overflow-y-auto">
      {recentHistory.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer group"
          onClick={() => onSelectCommand(item.command)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {item.timestamp.toLocaleTimeString()}
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                {item.type}
              </span>
              {item.status === 'pending' && <Clock className="w-3 h-3 text-yellow-500 animate-spin" />}
              {item.status === 'sent' && <CheckCircle className="w-3 h-3 text-green-500" />}
              {item.status === 'error' && <AlertCircle className="w-3 h-3 text-red-500" />}
            </div>
            <div className="text-sm font-mono truncate text-gray-900 dark:text-gray-100 mt-1">
              {item.command || `<${item.type}>`}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ))}
    </div>
  );
};

// Main command terminal component
export const CommandTerminal: React.FC<CommandTerminalProps> = ({
  instanceId,
  isActive,
  onSendCommand,
  onClose,
  className = "",
  autoFocus = true,
  showHistory = true,
  maxHistoryItems = 100
}) => {
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<CommandHistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when component becomes active
  useEffect(() => {
    if (isActive && autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive, autoFocus]);

  // Load command history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem(`command-history-${instanceId}`);
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setCommandHistory(parsed.map((item: { id: string; command: string; timestamp: string; status: CommandHistoryItem['status']; type: TCPCommand['type']; response?: string }) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      } catch (error) {
        console.warn('Failed to load command history:', error);
      }
    }
  }, [instanceId]);

  // Save command history to localStorage
  useEffect(() => {
    if (commandHistory.length > 0) {
      const toSave = commandHistory.slice(-maxHistoryItems);
      localStorage.setItem(`command-history-${instanceId}`, JSON.stringify(toSave));
    }
  }, [commandHistory, instanceId, maxHistoryItems]);

  // Command validation
  const validateCurrentCommand = useCallback((cmd: string, type: TCPCommand['type']) => {
    const validation = validateCommand(cmd, type);
    setValidationError(validation.isValid ? null : validation.error || 'Invalid command');
    return validation.isValid;
  }, []);

  // Add command to history
  const addToHistory = useCallback((cmd: string, type: TCPCommand['type'], status: CommandHistoryItem['status'] = 'pending') => {
    const historyItem: CommandHistoryItem = {
      id: `${Date.now()}-${Math.random()}`,
      command: cmd,
      timestamp: new Date(),
      status,
      type
    };

    setCommandHistory(prev => [...prev, historyItem]);
    return historyItem.id;
  }, []);

  // Update history item status
  const updateHistoryStatus = useCallback((id: string, status: CommandHistoryItem['status'], response?: string) => {
    setCommandHistory(prev => prev.map(item => 
      item.id === id ? { ...item, status, response } : item
    ));
  }, []);

  // Send command handler
  const handleSendCommand = useCallback(async (type: TCPCommand['type'], content?: string) => {
    if (!isActive) return;

    const commandText = content || command;
    
    if (!validateCurrentCommand(commandText, type)) {
      return;
    }

    setIsLoading(true);
    const historyId = addToHistory(commandText, type, 'pending');

    try {
      await onSendCommand({
        type,
        content: commandText,
        instanceId
      });

      updateHistoryStatus(historyId, 'sent');
      
      if (type === 'send') {
        setCommand('');
        setHistoryIndex(-1);
      }
    } catch (error) {
      console.error('Failed to send command:', error);
      updateHistoryStatus(historyId, 'error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      setValidationError(null);
    }
  }, [isActive, command, validateCurrentCommand, addToHistory, onSendCommand, instanceId, updateHistoryStatus]);

  // Keyboard navigation through history
  const navigateHistory = useCallback((direction: 'up' | 'down') => {
    const historyCommands = commandHistory
      .filter(item => item.type === 'send' && item.command.trim())
      .map(item => item.command);

    if (historyCommands.length === 0) return;

    let newIndex = historyIndex;
    
    if (direction === 'up') {
      newIndex = historyIndex === -1 ? historyCommands.length - 1 : Math.max(0, historyIndex - 1);
    } else {
      newIndex = historyIndex === -1 ? -1 : historyIndex + 1;
      if (newIndex >= historyCommands.length) newIndex = -1;
    }

    setHistoryIndex(newIndex);
    setCommand(newIndex === -1 ? '' : historyCommands[newIndex]);
  }, [commandHistory, historyIndex]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isActive) return;

    switch (e.key) {
      case 'Enter':
        if (e.shiftKey) {
          // Shift+Enter for newline (if multiline support is added)
          return;
        }
        e.preventDefault();
        if (command.trim()) {
          handleSendCommand('send', command);
        }
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        navigateHistory('up');
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        navigateHistory('down');
        break;
        
      case 'Tab':
        e.preventDefault();
        handleSendCommand('tab');
        break;
        
      case 'Escape':
        if (showHistoryPanel) {
          setShowHistoryPanel(false);
        } else if (onClose) {
          onClose();
        }
        break;
        
      case 'c':
        if (e.ctrlKey) {
          e.preventDefault();
          handleSendCommand('ctrl-c');
        }
        break;
    }
  }, [isActive, command, handleSendCommand, navigateHistory, showHistoryPanel, onClose]);

  // Quick actions configuration
  const quickActions = [
    { type: 'enter' as const, label: 'Enter', shortcut: '↵' },
    { type: 'tab' as const, label: 'Tab', shortcut: 'Tab' },
    { type: 'up' as const, label: '↑', shortcut: '↑' },
    { type: 'down' as const, label: '↓', shortcut: '↓' },
    { type: 'ctrl-c' as const, label: 'Ctrl+C', shortcut: '^C', variant: 'danger' as const }
  ];

  const isValid = !validationError && (command.trim() || true);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg ${className}`} ref={terminalRef}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            Command Terminal
          </h3>
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
        </div>
        
        <div className="flex items-center space-x-2">
          {showHistory && (
            <button
              onClick={() => setShowHistoryPanel(!showHistoryPanel)}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Toggle command history"
            >
              <History className="w-4 h-4" />
            </button>
          )}
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Close terminal"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Command history panel */}
      {showHistoryPanel && showHistory && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Command History</h4>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {commandHistory.length} commands
            </span>
          </div>
          <CommandHistory 
            history={commandHistory}
            onSelectCommand={(cmd) => {
              setCommand(cmd);
              setShowHistoryPanel(false);
              inputRef.current?.focus();
            }}
            maxItems={20}
          />
        </div>
      )}

      {/* Input area */}
      <div className="p-4 space-y-3">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => {
                setCommand(e.target.value);
                setValidationError(null);
                setHistoryIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              placeholder={isActive ? "Type command and press Enter..." : "Instance not active"}
              disabled={!isActive || isLoading}
              className={`w-full px-3 py-2 border rounded-lg font-mono text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 
                ${validationError 
                  ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                } 
                ${!isActive ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''} 
                dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
            />
            
            {validationError && (
              <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <div className="flex items-start space-x-1">
                  <AlertCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-red-700 dark:text-red-300">{validationError}</span>
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={() => command.trim() && handleSendCommand('send')}
            disabled={!isActive || !isValid || isLoading || !command.trim()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 focus:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors flex items-center space-x-1"
          >
            <Send className={`w-4 h-4 ${isLoading ? 'animate-pulse' : ''}`} />
            <span>{isLoading ? 'Sending...' : 'Send'}</span>
          </button>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 self-center">Quick actions:</span>
          {quickActions.map((action) => (
            <QuickActionButton
              key={action.type}
              label={action.label}
              shortcut={action.shortcut}
              onClick={() => handleSendCommand(action.type)}
              disabled={!isActive || isLoading}
              variant={action.variant}
            />
          ))}
        </div>

        {/* Keyboard shortcuts help */}
        <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span><ArrowUp className="w-3 h-3 inline mx-1" />/<ArrowDown className="w-3 h-3 inline mx-1" /> Navigate history</span>
            <span><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Tab</kbd> Auto-complete</span>
            <span><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+C</kbd> Interrupt</span>
            <span><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Esc</kbd> Close</span>
          </div>
        </div>
      </div>
    </div>
  );
};

CommandTerminal.displayName = 'CommandTerminal';

export default CommandTerminal;