import React from 'react';
import { cn } from '../../lib/utils';

export function Container({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "container mx-auto px-4 sm:px-6 lg:px-8",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function PageContainer({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "min-h-screen bg-background",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Section({ className, children, ...props }) {
  return (
    <section
      className={cn(
        "py-8 sm:py-12 lg:py-16",
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}

