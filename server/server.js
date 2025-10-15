// Development server for local development
const app = require('../api/shared-server');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Development server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📁 Upload directory: ${process.env.VERCEL === '1' ? '/tmp/uploads' : 'uploads/'}`);
  console.log(`🔧 Development mode with hot reload support`);
});