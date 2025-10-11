import React from 'react';
import { useAriaLive, useSkipLinks } from '../../hooks/useAccessibility';

// Screen reader only text component
export function ScreenReaderOnly({ children, ...props }) {
  return (
    <span className="sr-only" {...props}>
      {children}
    </span>
  );
}

// Skip to content link
export function SkipToContent({ targetId = "main-content", children = "Skip to main content" }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
      onClick={(e) => {
        e.preventDefault();
        const target = document.getElementById(targetId);
        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }}
    >
      {children}
    </a>
  );
}

// Accessible heading component with proper hierarchy
export function AccessibleHeading({ 
  level = 1, 
  children, 
  className = "",
  visualLevel,
  ...props 
}) {
  const Tag = `h${Math.min(Math.max(level, 1), 6)}`;
  const visualClass = visualLevel ? `text-${visualLevel}xl font-bold` : '';
  
  return (
    <Tag className={`${visualClass} ${className}`} {...props}>
      {children}
    </Tag>
  );
}

// Accessible button with proper ARIA attributes
export function AccessibleButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  ariaLabel,
  ariaDescribedBy,
  variant = 'primary',
  ...props
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-busy={loading}
      className={`
        inline-flex items-center justify-center px-4 py-2 rounded-md font-medium
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variant === 'primary' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
        ${variant === 'secondary' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' : ''}
      `}
      {...props}
    >
      {loading && (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <ScreenReaderOnly>Loading...</ScreenReaderOnly>
        </>
      )}
      {children}
    </button>
  );
}

// Accessible form field with proper labeling
export function AccessibleField({
  id,
  label,
  error,
  help,
  required = false,
  children,
  className = ""
}) {
  const errorId = error ? `${id}-error` : undefined;
  const helpId = help ? `${id}-help` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
        {required && (
          <>
            <span className="text-destructive ml-1" aria-hidden="true">*</span>
            <ScreenReaderOnly>required</ScreenReaderOnly>
          </>
        )}
      </label>
      
      {React.cloneElement(children, {
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? 'true' : 'false',
        'aria-required': required
      })}
      
      {help && (
        <p id={helpId} className="text-sm text-muted-foreground">
          {help}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// Accessible table with proper headers and captions
export function AccessibleTable({ 
  caption, 
  headers, 
  data, 
  className = "",
  ...props 
}) {
  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y divide-border ${className}`} {...props}>
        {caption && (
          <caption className="sr-only">
            {caption}
          </caption>
        )}
        <thead className="bg-muted/50">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-background divide-y divide-border">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-muted/50">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-6 py-4 whitespace-nowrap text-sm text-foreground"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Accessible modal with focus management
export function AccessibleModal({
  isOpen,
  onClose,
  title,
  children,
  className = ""
}) {
  const modalRef = React.useRef(null);
  const previousFocusRef = React.useRef(null);

  React.useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      modalRef.current?.focus();
    } else {
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={`bg-background rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto ${className}`}
        tabIndex={-1}
      >
        <div className="p-6">
          <h2 id="modal-title" className="text-lg font-semibold mb-4">
            {title}
          </h2>
          {children}
        </div>
      </div>
    </div>
  );
}

// Live region for announcements
export function LiveRegion() {
  const { LiveRegion: AriaLiveRegion } = useAriaLive();
  return <AriaLiveRegion />;
}

// Skip links component
export function SkipLinks() {
  const { SkipLinks: SkipLinksComponent } = useSkipLinks();
  
  const defaultLinks = [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#navigation', label: 'Skip to navigation' },
    { href: '#footer', label: 'Skip to footer' }
  ];
  
  return <SkipLinksComponent links={defaultLinks} />;
}

// Accessible progress indicator
export function AccessibleProgress({ 
  value, 
  max = 100, 
  label, 
  className = "" 
}) {
  const percentage = Math.round((value / max) * 100);
  
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex justify-between text-sm">
          <span>{label}</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className="w-full bg-muted rounded-full h-2"
      >
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <ScreenReaderOnly>
        Progress: {percentage}% complete
      </ScreenReaderOnly>
    </div>
  );
}
