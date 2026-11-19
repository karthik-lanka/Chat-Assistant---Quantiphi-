import mongoose from 'mongoose';
import { MONGODB_URI } from './env.js';

// Setup connection lifecycle events
mongoose.connection.on('connected', () => {
  console.log('[Database] MongoDB connection established successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('[Database] MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[Database] MongoDB disconnected');
});

/**
 * Connect to MongoDB instance
 * @returns {Promise<typeof mongoose>}
 */
export const connectDatabase = async () => {
  try {
    const connection = await mongoose.connect(MONGODB_URI);
    return connection;
  } catch (error) {
    console.error('[Database] Initial MongoDB connection failed:', error.message);
    throw error;
  }
};

/**
 * Returns connection status string ('connected' or 'disconnected')
 * @returns {'connected' | 'disconnected'}
 */
export const getConnectionStatus = () => {
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
};

export default {
  connectDatabase,
  getConnectionStatus,
};
