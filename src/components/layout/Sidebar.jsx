import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  FileText,
  Rocket,
  Settings,
  User,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

const menuItems = [
  {
    title: 'Tool Hub',
    path: '/',
    icon: Home,
    description: 'Main dashboard'
  },
  {
    title: 'Ticket Creator',
    path: '/ticket-creator',
    icon: FileText,
    description: 'Create Jira tickets'
  },
  {
    title: 'Release Creator',
    path: '/release-creator',
    icon: Rocket,
    description: 'Generate release pages'
  },
  {
    title: 'Settings',
    path: '/settings',
    icon: Settings,
    description: 'Configure integrations'
  }
];

export function Sidebar({ isOpen, setIsOpen, isDarkMode, toggleDarkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 240 : 80 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={cn(
        "fixed left-0 top-0 z-40 h-screen",
        "bg-card border-r border-border",
        "flex flex-col"
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <LayoutDashboard className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">Jira Tools</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn("h-8 w-8", !isOpen && "mx-auto")}
        >
          {isOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 relative",
                    isActive && "bg-primary/10 text-primary hover:bg-primary/20",
                    !isOpen && "justify-center px-2"
                  )}
                  onClick={() => navigate(item.path)}
                  onMouseEnter={() => setHoveredItem(item.path)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <Icon className={cn(
                    "h-5 w-5 shrink-0",
                    isActive && "text-primary"
                  )} />
                  
                  <AnimatePresence>
                    {isOpen && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="truncate"
                      >
                        {item.title}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30
                      }}
                    />
                  )}
                </Button>

                {/* Tooltip for collapsed state */}
                <AnimatePresence>
                  {!isOpen && hoveredItem === item.path && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      className="fixed left-20 bg-popover text-popover-foreground px-3 py-2 rounded-md shadow-lg text-sm z-50 pointer-events-none"
                      style={{
                        top: `${document.querySelector(`button[data-path="${item.path}"]`)?.getBoundingClientRect().top}px`
                      }}
                    >
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-2">
        <Separator className="mb-2" />
        
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          className={cn(
            "w-full gap-3",
            isOpen ? "justify-start" : "justify-center"
          )}
        >
          {isDarkMode ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
          <AnimatePresence>
            {isOpen && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                {isDarkMode ? 'Light' : 'Dark'} Mode
              </motion.span>
            )}
          </AnimatePresence>
        </Button>

        {/* User profile */}
        <Button
          variant="ghost"
          className={cn(
            "w-full gap-3 mt-1",
            isOpen ? "justify-start" : "justify-center px-2"
          )}
        >
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-primary" />
          </div>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-start overflow-hidden"
              >
                <span className="text-sm font-medium truncate w-full">User</span>
                <span className="text-xs text-muted-foreground truncate w-full">
                  user@example.com
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </div>
    </motion.aside>
  );
}

