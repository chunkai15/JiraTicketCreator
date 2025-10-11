import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Separator } from './separator';
import { cn } from '../../lib/utils';
import { modalVariants, backdropVariants } from '../../lib/animations';
import { getAllShortcuts } from '../../hooks/useKeyboardShortcuts';

export function KeyboardShortcutsModal({ isOpen, onClose }) {
  const shortcuts = getAllShortcuts();

  // Group shortcuts by category
  const groupedShortcuts = React.useMemo(() => {
    const groups = {
      'Navigation': [],
      'Global Actions': [],
      'Page Actions': []
    };

    Object.entries(shortcuts).forEach(([key, config]) => {
      if (config.action === 'navigate') {
        groups['Navigation'].push({ key, ...config });
      } else if (['toggle-dark-mode', 'help', 'command-palette', 'escape'].includes(config.action)) {
        groups['Global Actions'].push({ key, ...config });
      } else {
        groups['Page Actions'].push({ key, ...config });
      }
    });

    return groups;
  }, [shortcuts]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Keyboard Shortcuts
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="max-h-[60vh] overflow-y-auto">
              <div className="space-y-6">
                {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                      {category}
                    </h3>
                    <div className="space-y-2">
                      {shortcuts.map((shortcut) => (
                        <div
                          key={shortcut.key}
                          className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <span className="text-sm">{shortcut.description}</span>
                          <KeyboardKey shortcut={shortcut.key} />
                        </div>
                      ))}
                    </div>
                    <Separator className="mt-4" />
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium mb-1">Tips:</p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Shortcuts work globally except when typing in text fields</li>
                      <li>• Use <KeyboardKey shortcut="ctrl+/" inline /> to open this help anytime</li>
                      <li>• Some shortcuts are context-dependent based on the current page</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function KeyboardKey({ shortcut, inline = false }) {
  const keys = shortcut.split('+');
  
  return (
    <div className={cn("flex items-center gap-1", inline && "inline-flex")}>
      {keys.map((key, index) => (
        <React.Fragment key={key}>
          <Badge
            variant="secondary"
            className="px-2 py-1 text-xs font-mono bg-background border shadow-sm"
          >
            {formatKey(key)}
          </Badge>
          {index < keys.length - 1 && (
            <span className="text-muted-foreground text-xs">+</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function formatKey(key) {
  const keyMap = {
    'ctrl': '⌘', // On Mac, show Cmd symbol
    'shift': '⇧',
    'alt': '⌥',
    'enter': '↵',
    'escape': 'Esc',
    'arrowup': '↑',
    'arrowdown': '↓',
    'arrowleft': '←',
    'arrowright': '→',
    ' ': 'Space'
  };

  // Use Ctrl on non-Mac systems
  if (key === 'ctrl' && !navigator.platform.includes('Mac')) {
    return 'Ctrl';
  }

  return keyMap[key.toLowerCase()] || key.toUpperCase();
}

// Hook to manage the shortcuts modal
export function useKeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleShowShortcuts = () => setIsOpen(true);
    
    document.addEventListener('show-shortcuts', handleShowShortcuts);
    return () => document.removeEventListener('show-shortcuts', handleShowShortcuts);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false)
  };
}
