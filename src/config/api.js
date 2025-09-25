// API Configuration for different environments
const getApiBaseUrl = () => {
  // Check if we're in development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001/api';
  }
  
  // Production environment - Force correct domain
  const currentDomain = window.location.origin;
  
  // Debug logging
  console.log('🔧 API Config Debug:', {
    NODE_ENV: process.env.NODE_ENV,
    REACT_APP_API_BASE_URL: process.env.REACT_APP_API_BASE_URL,
    currentDomain: currentDomain,
    timestamp: new Date().toISOString()
  });
  
  // Always use current domain in production to avoid domain mismatch
  return `${currentDomain}/api`;
};

export const API_BASE_URL = getApiBaseUrl();

export default {
  API_BASE_URL,
  TIMEOUT: 30000,
  MAX_FILE_SIZE: 40 * 1024 * 1024, // 40MB
};
