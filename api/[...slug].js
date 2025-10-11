// Vercel serverless function to handle all API routes
const app = require('./server');

module.exports = (req, res) => {
  // Set the base path for API routes
  req.url = req.url.replace(/^\/api/, '');
  if (req.url === '') {
    req.url = '/';
  }
  
  return app(req, res);
};
