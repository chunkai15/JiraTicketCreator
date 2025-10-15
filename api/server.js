// Production server for Vercel deployment
const app = require('./shared-server');

// Start server only if not in Vercel environment (for local production testing)
if (process.env.VERCEL !== '1' && require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Production server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'production'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log(`☁️  Vercel-compatible mode`);
  });
}

module.exports = app;