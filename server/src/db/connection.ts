import 'dotenv/config';
import mongoose from 'mongoose';

export const MONGODB_URI = process.env.MONGODB_URI || '';

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in environment variables (.env). Please configure it.');
  }

  try {
    console.log('[MongoDB] Connecting to Atlas cluster...');
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      autoIndex: true
    });
    console.log(`[MongoDB] Connected successfully to database: ${conn.connection.db?.databaseName}`);
    return conn;
  } catch (error) {
    console.error('[MongoDB] Connection failed:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[MongoDB] Disconnected.');
  }
}
