import React from 'react';
import { Bell, Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export function Header({ sidebarWidth }) {
  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 h-16",
        "bg-card/80 backdrop-blur-sm border-b border-border",
        "flex items-center justify-between px-6"
      )}
      style={{ left: `${sidebarWidth}px` }}
    >
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search... (Ctrl+K)"
            className="pl-10 bg-background"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-error-500 rounded-full" />
        </Button>
      </div>
    </header>
  );
}

