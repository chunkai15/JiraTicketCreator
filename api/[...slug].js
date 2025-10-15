// Vercel serverless function to handle all API routes
const app = require('./shared-server');

module.exports = (req, res) => {
  // Keep the /api prefix for routes to match server.js
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + req.url;
  }
  
  return app(req, res);
};
