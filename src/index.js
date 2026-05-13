import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

const RESIZE_OBSERVER_MESSAGES = [
  'ResizeObserver loop completed with undelivered notifications.',
  'ResizeObserver loop limit exceeded'
];

const shouldIgnoreResizeObserverError = (message = '') =>
  RESIZE_OBSERVER_MESSAGES.some((resizeMessage) => message.includes(resizeMessage));

window.addEventListener('error', (event) => {
  if (shouldIgnoreResizeObserverError(event.message)) {
    event.stopImmediatePropagation();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reasonMessage =
    typeof event.reason === 'string'
      ? event.reason
      : event.reason?.message || '';

  if (shouldIgnoreResizeObserverError(reasonMessage)) {
    event.preventDefault();
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));

// Conditionally use StrictMode only in development for debugging
// Remove StrictMode to prevent double API calls in development
const isDevelopment = process.env.NODE_ENV === 'development';
const useStrictMode = false; // Set to true only when debugging React issues

root.render(
  useStrictMode && isDevelopment ? (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  ) : (
    <App />
  )
);
