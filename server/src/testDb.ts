import 'dotenv/config';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not defined. Please set it in your .env file.');
  process.exit(1);
}

async function testConnection() {
  console.log('Testing MongoDB connection...');
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ Successfully connected to MongoDB Atlas cluster!');
    const collections = await mongoose.connection.db?.listCollections().toArray();
    console.log('Existing collections:', collections?.map(c => c.name));
    await mongoose.disconnect();
    console.log('Disconnected cleanly.');
  } catch (err) {
    console.error('❌ Connection error:', err);
    process.exit(1);
  }
}

testConnection();
