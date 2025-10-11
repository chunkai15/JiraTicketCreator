import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { KeyboardShortcutsModal, useKeyboardShortcutsModal } from '../ui/keyboard-shortcuts-modal';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { SkipLinks, LiveRegion } from '../ui/accessibility';
import { cn } from '../../lib/utils';

export function MainLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const sidebarWidth = isSidebarOpen ? 240 : 80;
  const shortcutsModal = useKeyboardShortcutsModal();

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newValue = !prev;
      localStorage.setItem('theme', newValue ? 'dark' : 'light');
      
      if (newValue) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      return newValue;
    });
  };

  // Listen for global dark mode toggle event
  useEffect(() => {
    const handleToggleDarkMode = () => toggleDarkMode();
    document.addEventListener('toggle-dark-mode', handleToggleDarkMode);
    return () => document.removeEventListener('toggle-dark-mode', handleToggleDarkMode);
  }, []);

  // Setup keyboard shortcuts
  useKeyboardShortcuts();

  return (
    <div className="relative min-h-screen bg-background">
      {/* Skip Links for Accessibility */}
      <SkipLinks />
      
      {/* Live Region for Screen Reader Announcements */}
      <LiveRegion />

      {/* Sidebar */}
      <Sidebar
        id="navigation"
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      {/* Header */}
      <Header sidebarWidth={sidebarWidth} />

      {/* Main Content */}
      <main
        id="main-content"
        className={cn(
          "pt-16 transition-all duration-300",
          "min-h-screen"
        )}
        style={{
          marginLeft: `${sidebarWidth}px`
        }}
        tabIndex={-1}
      >
        <div className="p-6">
          {children}
        </div>
      </main>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={shortcutsModal.isOpen}
        onClose={shortcutsModal.close}
      />
    </div>
  );
}

