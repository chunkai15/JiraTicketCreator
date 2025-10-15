import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

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
