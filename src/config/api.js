// API Configuration for different environments
const getApiBaseUrl = () => {
  // Check if we're in development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001/api';
  }
  
  // Production environment
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  
  // Fallback to current domain + /api for production
  const currentDomain = window.location.origin;
  return `${currentDomain}/api`;
};

export const API_BASE_URL = getApiBaseUrl();

// Debug logging
console.log('🔧 API Configuration Debug:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('REACT_APP_API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
console.log('Final API_BASE_URL:', API_BASE_URL);

export default {
  API_BASE_URL,
  TIMEOUT: 30000,
  MAX_FILE_SIZE: 40 * 1024 * 1024, // 40MB
};
