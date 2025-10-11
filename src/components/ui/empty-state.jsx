import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './button';
import { Card, CardContent } from './card';
import { cn } from '../../lib/utils';
import { fadeVariants, staggerContainer, staggerItem } from '../../lib/animations';

// Icons for different empty states
const EmptyStateIcons = {
  tickets: (
    <svg className="w-16 h-16 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  releases: (
    <svg className="w-16 h-16 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-9 0a2 2 0 00-2 2v14a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2m-5 3v6m2-3h6" />
    </svg>
  ),
  search: (
    <svg className="w-16 h-16 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  error: (
    <svg className="w-16 h-16 text-destructive/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  settings: (
    <svg className="w-16 h-16 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  generic: (
    <svg className="w-16 h-16 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  )
};

export function EmptyState({
  icon = 'generic',
  title,
  description,
  action,
  actionLabel,
  className,
  variant = 'default'
}) {
  const IconComponent = EmptyStateIcons[icon] || EmptyStateIcons.generic;

  return (
    <motion.div
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      className={cn("flex items-center justify-center min-h-[400px] p-8", className)}
    >
      <Card className={cn(
        "w-full max-w-md",
        variant === 'minimal' && "border-none shadow-none bg-transparent"
      )}>
        <CardContent className="flex flex-col items-center text-center p-8">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="flex flex-col items-center space-y-4"
          >
            <motion.div variants={staggerItem}>
              {IconComponent}
            </motion.div>
            
            {title && (
              <motion.h3 
                variants={staggerItem}
                className="text-xl font-semibold text-foreground"
              >
                {title}
              </motion.h3>
            )}
            
            {description && (
              <motion.p 
                variants={staggerItem}
                className="text-muted-foreground max-w-sm leading-relaxed"
              >
                {description}
              </motion.p>
            )}
            
            {action && actionLabel && (
              <motion.div variants={staggerItem} className="pt-2">
                <Button onClick={action} size="lg">
                  {actionLabel}
                </Button>
              </motion.div>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Specialized empty state components
export function NoTicketsFound({ onCreateTicket }) {
  return (
    <EmptyState
      icon="tickets"
      title="No tickets found"
      description="Get started by creating your first ticket or adjust your search criteria."
      action={onCreateTicket}
      actionLabel="Create Ticket"
    />
  );
}

export function NoReleasesFound({ onCreateRelease }) {
  return (
    <EmptyState
      icon="releases"
      title="No releases available"
      description="There are no releases to display. Create a new release to get started."
      action={onCreateRelease}
      actionLabel="Create Release"
    />
  );
}

export function SearchNotFound({ searchTerm, onClearSearch }) {
  return (
    <EmptyState
      icon="search"
      title="No results found"
      description={`We couldn't find anything matching "${searchTerm}". Try adjusting your search terms.`}
      action={onClearSearch}
      actionLabel="Clear Search"
      variant="minimal"
    />
  );
}

export function ErrorState({ title = "Something went wrong", description, onRetry }) {
  return (
    <EmptyState
      icon="error"
      title={title}
      description={description || "An unexpected error occurred. Please try again."}
      action={onRetry}
      actionLabel="Try Again"
    />
  );
}

export function ConfigurationNeeded({ onOpenSettings }) {
  return (
    <EmptyState
      icon="settings"
      title="Configuration required"
      description="Please configure your Jira connection and settings before using this feature."
      action={onOpenSettings}
      actionLabel="Open Settings"
    />
  );
}
