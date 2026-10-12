import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://kartikaysingh0211_db_user:zeIy09qvoUbpwF9l@design-patterns.zxidgwa.mongodb.net/mediflow?appName=design-patterns';

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
