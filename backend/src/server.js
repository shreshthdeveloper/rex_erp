const app = require('./app');
const logger = require('./config/logger');
require('./config/database');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`=================================`);
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📦 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🌐 API Base: http://localhost:${PORT}/api/v1`);
  logger.info(`=================================`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});

module.exports = server;
