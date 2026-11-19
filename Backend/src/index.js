import mongoose from 'mongoose';
import app from './app.js';
import { connectDatabase } from './config/database.js';
import env from './config/env.js';

let server;

const startServer = async () => {
  try {
    await connectDatabase();
    server = app.listen(env.PORT, () => {
      console.log(`[Server] Quantiphi AI Chat Assistant backend listening on port ${env.PORT}`);
    });
  } catch (error) {
    console.error('[Server] Failed to initialize backend server:', error.message);
    process.exit(1);
  }
};

const handleShutdown = async (signal) => {
  console.log(`[Server] Received ${signal}. Initiating graceful shutdown...`);
  if (server) {
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      try {
        await mongoose.connection.close();
        console.log('[Database] MongoDB connection closed.');
      } catch (err) {
        console.error('[Database] Error closing MongoDB connection:', err.message);
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

startServer();

export default app;
