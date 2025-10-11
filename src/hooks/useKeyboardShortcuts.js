import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Keyboard shortcut configurations
const SHORTCUTS = {
  // Navigation shortcuts
  'ctrl+1': { action: 'navigate', target: '/', description: 'Go to Tool Hub' },
  'ctrl+2': { action: 'navigate', target: '/ticket-creator', description: 'Go to Ticket Creator' },
  'ctrl+3': { action: 'navigate', target: '/release-creator', description: 'Go to Release Creator' },
  'ctrl+4': { action: 'navigate', target: '/settings', description: 'Go to Settings' },
  
  // Global shortcuts
  'ctrl+k': { action: 'command-palette', description: 'Open command palette' },
  'ctrl+/': { action: 'help', description: 'Show keyboard shortcuts' },
  'ctrl+shift+d': { action: 'toggle-dark-mode', description: 'Toggle dark mode' },
  
  // Common actions
  'ctrl+n': { action: 'new', description: 'Create new (context dependent)' },
  'ctrl+s': { action: 'save', description: 'Save current work' },
  'escape': { action: 'escape', description: 'Close modal/cancel action' },
  
  // Ticket Creator specific
  'ctrl+enter': { action: 'submit', description: 'Submit form/create tickets' },
  'ctrl+shift+p': { action: 'preview', description: 'Toggle preview' },
  'ctrl+shift+c': { action: 'clear', description: 'Clear input' },
};

// Hook for keyboard shortcuts
export function useKeyboardShortcuts(customHandlers = {}) {
  const navigate = useNavigate();

  const handleKeyPress = useCallback((event) => {
    // Don't trigger shortcuts when typing in inputs
    if (event.target.tagName === 'INPUT' || 
        event.target.tagName === 'TEXTAREA' || 
        event.target.contentEditable === 'true') {
      // Allow some shortcuts even in inputs
      const allowedInInputs = ['escape', 'ctrl+s', 'ctrl+enter'];
      const shortcut = getShortcutString(event);
      if (!allowedInInputs.includes(shortcut)) {
        return;
      }
    }

    const shortcut = getShortcutString(event);
    const shortcutConfig = SHORTCUTS[shortcut];

    if (shortcutConfig) {
      event.preventDefault();
      
      // Check for custom handler first
      if (customHandlers[shortcut]) {
        customHandlers[shortcut](event);
        return;
      }

      // Handle built-in shortcuts
      switch (shortcutConfig.action) {
        case 'navigate':
          navigate(shortcutConfig.target);
          break;
        case 'toggle-dark-mode':
          // This will be handled by the MainLayout component
          document.dispatchEvent(new CustomEvent('toggle-dark-mode'));
          break;
        case 'help':
          document.dispatchEvent(new CustomEvent('show-shortcuts'));
          break;
        case 'command-palette':
          document.dispatchEvent(new CustomEvent('open-command-palette'));
          break;
        case 'escape':
          document.dispatchEvent(new CustomEvent('global-escape'));
          break;
        default:
          // Let custom handlers deal with other actions
          if (customHandlers[shortcutConfig.action]) {
            customHandlers[shortcutConfig.action](event);
          }
      }
    }
  }, [navigate, customHandlers]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  return { shortcuts: SHORTCUTS };
}

// Helper function to get shortcut string from event
function getShortcutString(event) {
  const parts = [];
  
  if (event.ctrlKey || event.metaKey) parts.push('ctrl');
  if (event.shiftKey) parts.push('shift');
  if (event.altKey) parts.push('alt');
  
  const key = event.key.toLowerCase();
  if (key !== 'control' && key !== 'shift' && key !== 'alt' && key !== 'meta') {
    parts.push(key);
  }
  
  return parts.join('+');
}

// Hook for specific page shortcuts
export function usePageShortcuts(pageShortcuts = {}) {
  return useKeyboardShortcuts(pageShortcuts);
}

// Get all available shortcuts for help display
export function getAllShortcuts() {
  return SHORTCUTS;
}
